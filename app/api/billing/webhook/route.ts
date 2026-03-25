import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

// Disable body parsing — Stripe needs the raw body for signature verification
export const dynamic = 'force-dynamic';

// Helper to extract billing period from a Stripe subscription
function extractBillingPeriod(sub: Stripe.Subscription) {
    // In Stripe v20, current_period_start/end are on SubscriptionItem directly
    const item = sub.items?.data?.[0];
    const periodStart = item?.current_period_start ?? Math.floor(Date.now() / 1000);
    const periodEnd = item?.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 86400;
    return {
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
    };
}

// POST — Handle Stripe webhook events
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err) {
            console.error('❌ Webhook signature verification failed:', err);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        console.log(`📨 Stripe webhook event: ${event.type}`);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentFailed(invoice);
                break;
            }

            default:
                console.log(`⏭️  Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: unknown) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}

// ─── Checkout completed → create subscription ───────────
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!userId || !planId) {
        console.error('Missing userId or planId in checkout metadata');
        return;
    }

    // Get the subscription from Stripe
    const stripeSubscriptionId = session.subscription as string;
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const { currentPeriodStart, currentPeriodEnd } = extractBillingPeriod(stripeSubscription);

    // Create local subscription record
    await prisma.subscription.upsert({
        where: { userId },
        update: {
            planId,
            stripeSubscriptionId,
            status: stripeSubscription.status,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        },
        create: {
            userId,
            planId,
            stripeSubscriptionId,
            status: stripeSubscription.status,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        },
    });

    // Update user plan
    await prisma.user.update({
        where: { id: userId },
        data: { planId },
    });

    console.log(`✅ Subscription created for user ${userId}`);
}

// ─── Subscription updated (status change, renewal) ──────
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const existingSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
    });

    if (!existingSubscription) {
        console.log('Subscription not found in DB, skipping update');
        return;
    }

    const { currentPeriodStart, currentPeriodEnd } = extractBillingPeriod(subscription);

    await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
            status: subscription.status,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
    });

    console.log(`✅ Subscription updated: ${subscription.id} → ${subscription.status}`);
}

// ─── Subscription deleted → downgrade to free ───────────
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const existingSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
    });

    if (!existingSubscription) return;

    const user = await prisma.user.findUnique({
        where: { id: existingSubscription.userId }
    });

    if (!user) return;

    const fallbackPlanName = user.role === 'recruiter' ? 'free_recruiter' : 'free';

    // Get free plan
    const freePlan = await prisma.plan.findUnique({ where: { name: fallbackPlanName } });

    // Downgrade user to free plan
    await prisma.user.update({
        where: { id: existingSubscription.userId },
        data: { planId: freePlan?.id ?? null },
    });

    // Update subscription status
    await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'canceled' },
    });

    console.log(`✅ Subscription deleted, user ${existingSubscription.userId} downgraded to ${fallbackPlanName}`);
}

// ─── Payment failed → mark as past_due ──────────────────
async function handlePaymentFailed(invoice: Stripe.Invoice) {
    // In Stripe v20, subscription is under parent.subscription_details
    const subDetails = invoice.parent?.subscription_details;
    const subRef = subDetails?.subscription;
    const subscriptionId = typeof subRef === 'string' ? subRef : subRef?.id;
    if (!subscriptionId) return;

    const existingSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
    });

    if (!existingSubscription) return;

    await prisma.subscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'past_due' },
    });

    console.log(`⚠️ Payment failed for subscription ${subscriptionId}`);
}

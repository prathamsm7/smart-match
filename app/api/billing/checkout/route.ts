import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

// POST — Create a Stripe Checkout session for upgrading to Pro
export async function POST(request: NextRequest) {
    try {
        const { user, error } = await authenticateRequest();
        if (error) return error;

        // Check if user already has an active subscription
        const existingSubscription = await prisma.subscription.findUnique({
            where: { userId: user.id },
        });

        if (existingSubscription && existingSubscription.status === 'active') {
            return NextResponse.json(
                { error: 'Already subscribed to Pro plan' },
                { status: 400 }
            );
        }

        // Get Pro plan
        const proPlan = await prisma.plan.findUnique({
            where: { name: 'pro' },
        });

        if (!proPlan) {
            return NextResponse.json(
                { error: 'Pro plan not found. Please run the seed script.' },
                { status: 500 }
            );
        }

        // Get or create Stripe customer
        let stripeCustomerId = user.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name || undefined,
                metadata: { userId: user.id },
            });
            stripeCustomerId = customer.id;

            await prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId },
            });
        }

        // Create checkout session
        // If Pro plan has a stripePriceId, use it; otherwise create a price inline
        const sessionParams: Record<string, unknown> = {
            customer: stripeCustomerId,
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/dashboard?billing=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/dashboard?billing=cancelled`,
            metadata: {
                userId: user.id,
                planId: proPlan.id,
            },
        };

        if (proPlan.stripePriceId) {
            (sessionParams as Record<string, unknown>).line_items = [
                {
                    price: proPlan.stripePriceId,
                    quantity: 1,
                },
            ];
        } else {
            // Create price inline for test mode
            (sessionParams as Record<string, unknown>).line_items = [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Smart Resume Pro',
                            description: 'Unlimited ATS analysis, job matches, cover letters, and more.',
                        },
                        unit_amount: proPlan.price, // in cents
                        recurring: {
                            interval: proPlan.interval as 'month' | 'year',
                        },
                    },
                    quantity: 1,
                },
            ];
        }

        const session = await stripe.checkout.sessions.create(
            sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
        );

        return NextResponse.json({
            success: true,
            url: session.url,
        });
    } catch (error: unknown) {
        console.error('Error creating checkout session:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

// POST — Create a Stripe Customer Portal session
export async function POST(request: NextRequest) {
    try {
        const { user, error } = await authenticateRequest();
        if (error) return error;

        if (!user.stripeCustomerId) {
            return NextResponse.json(
                { error: 'No billing account found. Please subscribe first.' },
                { status: 400 }
            );
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/dashboard`,
        });

        return NextResponse.json({
            success: true,
            url: session.url,
        });
    } catch (error: unknown) {
        console.error('Error creating portal session:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

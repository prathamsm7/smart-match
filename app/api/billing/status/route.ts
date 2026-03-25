import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getUsageSummary } from '@/lib/usageHelper';
import { prisma } from '@/lib/prisma';

// GET — Get current user's billing status + usage summary
export async function GET() {
    try {
        const { user, error } = await authenticateRequest();
        if (error) return error;

        // Get user with plan and subscription
        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                plan: true,
                subscription: true,
            },
        });

        // Get usage summary for current period
        const usage = await getUsageSummary(user.id);

        return NextResponse.json({
            success: true,
            plan: fullUser?.plan ?? {
                name: 'free',
                displayName: 'Free',
                type: 'free',
                price: 0,
            },
            subscription: fullUser?.subscription ? {
                status: fullUser.subscription.status,
                currentPeriodEnd: fullUser.subscription.currentPeriodEnd,
                cancelAtPeriodEnd: fullUser.subscription.cancelAtPeriodEnd,
            } : null,
            usage,
        });
    } catch (error: unknown) {
        console.error('Error fetching billing status:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

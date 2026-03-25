import { prisma } from './prisma';
import { FeatureKey, FREE_LIMITS } from '@/config/billing';



// ─── Get current billing period start ───────────────────
function getPeriodStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

// ─── Get feature limit for user ─────────────────────────
async function getFeatureLimit(userId: string, feature: FeatureKey): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { plan: true },
    });

    if (!user?.plan) {
        // No plan assigned — use free defaults
        return FREE_LIMITS[feature] ?? 0;
    }

    const features = user.plan.features as Record<string, number>;
    return features[feature] ?? 0;
}

// ─── Check Usage Limit ──────────────────────────────────
// Returns whether the user can use this feature
export async function checkUsageLimit(
    userId: string,
    feature: FeatureKey
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
    const limit = await getFeatureLimit(userId, feature);

    // -1 means unlimited
    if (limit === -1) {
        return { allowed: true, used: 0, limit: -1, remaining: -1 };
    }

    const periodStart = getPeriodStart();

    const usage = await prisma.usageRecord.findUnique({
        where: {
            userId_feature_periodStart: {
                userId,
                feature,
                periodStart,
            },
        },
    });

    const used = usage?.count ?? 0;
    const remaining = Math.max(0, limit - used);

    return {
        allowed: used < limit,
        used,
        limit,
        remaining,
    };
}

// ─── Increment Usage ────────────────────────────────────
// Call this AFTER a successful operation
export async function incrementUsage(
    userId: string,
    feature: FeatureKey
): Promise<void> {
    const periodStart = getPeriodStart();

    await prisma.usageRecord.upsert({
        where: {
            userId_feature_periodStart: {
                userId,
                feature,
                periodStart,
            },
        },
        update: {
            count: { increment: 1 },
        },
        create: {
            userId,
            feature,
            periodStart,
            count: 1,
        },
    });
}

// ─── Get Full Usage Summary ─────────────────────────────
// Returns all usage counts for the current period
export async function getUsageSummary(
    userId: string
): Promise<Record<FeatureKey, { used: number; limit: number; remaining: number }>> {
    const periodStart = getPeriodStart();

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { plan: true },
    });

    const features = (user?.plan?.features as Record<string, unknown>) || FREE_LIMITS;

    const usageRecords = await prisma.usageRecord.findMany({
        where: { userId, periodStart },
    });

    const usageMap = new Map(usageRecords.map((r: { feature: string; count: number }) => [r.feature, r.count]));

    const summary: Record<string, { used: number; limit: number; remaining: number }> = {};

    for (const key of Object.keys(FREE_LIMITS) as FeatureKey[]) {
        const limitValue = features[key] ?? FREE_LIMITS[key];
        const limit = typeof limitValue === 'number' ? limitValue : Number(limitValue || 0);
        const used = (usageMap.get(key) as number) ?? 0;
        
        summary[key] = {
            used,
            limit,
            remaining: limit === -1 ? -1 : Math.max(0, limit - used),
        };
    }

    return summary as Record<FeatureKey, { used: number; limit: number; remaining: number }>;
}

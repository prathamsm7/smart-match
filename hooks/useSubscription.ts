"use client";

import { useState, useEffect, useCallback } from 'react';

interface PlanInfo {
    name: string;
    displayName: string;
    type: string;
    price: number;
}

interface SubscriptionInfo {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
}

interface UsageInfo {
    used: number;
    limit: number;   // -1 = unlimited
    remaining: number;
}

interface SubscriptionState {
    role: string;
    plan: PlanInfo;
    subscription: SubscriptionInfo | null;
    usage: Record<string, UsageInfo>;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    upgrade: (planName?: string) => Promise<void>;
    manageSubscription: () => Promise<void>;
    upgrading: boolean;
}

export function useSubscription(): SubscriptionState {
    const [role, setRole] = useState<string>('candidate');
    const [plan, setPlan] = useState<PlanInfo>({
        name: 'free',
        displayName: 'Free',
        type: 'free',
        price: 0,
    });
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [usage, setUsage] = useState<Record<string, UsageInfo>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [upgrading, setUpgrading] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/billing/status');
            if (!res.ok) throw new Error('Failed to fetch billing status');
            const data = await res.json();
            if (data.role) setRole(data.role);
            setPlan(data.plan);
            setSubscription(data.subscription);
            setUsage(data.usage);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const upgrade = useCallback(async (planName?: string) => {
        try {
            setUpgrading(true);
            const res = await fetch('/api/billing/checkout', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planName })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || 'Failed to create checkout session');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start checkout');
        } finally {
            setUpgrading(false);
        }
    }, []);

    const manageSubscription = useCallback(async () => {
        try {
            const res = await fetch('/api/billing/portal', { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || 'Failed to open portal');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to open portal');
        }
    }, []);

    return {
        role,
        plan,
        subscription,
        usage,
        loading,
        error,
        refetch: fetchStatus,
        upgrade,
        manageSubscription,
        upgrading,
    };
}

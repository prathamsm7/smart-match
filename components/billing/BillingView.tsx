"use client";

import React from 'react';
import {
    CreditCard,
    Check,
    Zap,
    Crown,
    ExternalLink,
    BarChart3,
    FileText,
    Briefcase,
    Calendar,
    Upload,
    Rocket,
    Loader2,
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { FREE_FEATURES, PRO_FEATURES } from '@/config/billing';

// ─── Feature display config ─────────────────────────────
const FEATURE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
    resume_upload: { label: 'Resume Uploads', icon: <Upload className="w-4 h-4" /> },
    ats_analysis: { label: 'ATS Analysis', icon: <FileText className="w-4 h-4" /> },
    job_match: { label: 'Job Matches', icon: <Briefcase className="w-4 h-4" /> },
    cover_letter: { label: 'Cover Letters', icon: <FileText className="w-4 h-4" /> },
    interview: { label: 'AI Interviews', icon: <Calendar className="w-4 h-4" /> },
    application: { label: 'Applications', icon: <Rocket className="w-4 h-4" /> },
};

// ─── Usage Progress Bar ─────────────────────────────────
function UsageBar({ feature, used, limit }: { feature: string; used: number; limit: number }) {
    const config = FEATURE_CONFIG[feature];
    if (!config) return null;

    const isUnlimited = limit === -1;
    const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
    const isNearLimit = !isUnlimited && percentage >= 80;
    const isAtLimit = !isUnlimited && used >= limit;

    return (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAtLimit ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                {config.icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-200">{config.label}</span>
                    <span className={`text-xs font-mono ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-gray-400'}`}>
                        {isUnlimited ? `${used} used` : `${used}/${limit}`}
                    </span>
                </div>
                {!isUnlimited && (
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-500'}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                )}
                {isUnlimited && (
                    <div className="text-xs text-emerald-400">✨ Unlimited</div>
                )}
            </div>
        </div>
    );
}

// ─── Main Billing View ──────────────────────────────────
export function BillingView() {
    const {
        plan,
        subscription,
        usage,
        loading,
        upgrade,
        manageSubscription,
        upgrading,
    } = useSubscription();

    if (loading) {
        return (
            <div className="text-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto" />
                <p className="mt-4 text-gray-400 text-sm">Loading billing info...</p>
            </div>
        );
    }

    const isPro = plan.type === 'paid' && subscription?.status === 'active';
    const isCanceling = subscription?.cancelAtPeriodEnd;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <CreditCard className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Billing & Subscription</h2>
                    <p className="text-sm text-gray-400">
                        {isPro ? 'You\'re on the Pro plan' : 'Upgrade to unlock more features'}
                    </p>
                </div>
            </div>

            {/* Subscription status banner */}
            {isPro && isCanceling && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                    ⚠️ Your subscription will cancel at the end of the billing period (
                    {subscription?.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'unknown'}
                    ). You&apos;ll be downgraded to the Free plan after that.
                </div>
            )}

            {/* Usage Dashboard */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Usage This Month
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(usage).map(([feature, info]) => (
                        <UsageBar
                            key={feature}
                            feature={feature}
                            used={info.used}
                            limit={info.limit}
                        />
                    ))}
                </div>
            </div>

            {/* Pricing Plans */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Choose Your Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Free Plan */}
                    <div className={`relative p-6 rounded-2xl border transition-all ${!isPro
                        ? 'border-blue-500/30 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`
                    }>
                        {!isPro && (
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                                Current Plan
                            </div>
                        )}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                                <Zap className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">Free</h4>
                                <p className="text-2xl font-bold text-white">$0<span className="text-sm font-normal text-gray-400">/month</span></p>
                            </div>
                        </div>
                        <ul className="space-y-3">
                            {FREE_FEATURES.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                                    {f.text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pro Plan */}
                    <div className={`relative p-6 rounded-2xl border transition-all ${isPro
                        ? 'border-purple-500/30 bg-purple-500/5 shadow-lg shadow-purple-500/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10'}`
                    }>
                        {isPro && (
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                Current Plan
                            </div>
                        )}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Crown className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">Pro</h4>
                                <p className="text-2xl font-bold text-white">$9<span className="text-sm font-normal text-gray-400">/month</span></p>
                            </div>
                        </div>
                        <ul className="space-y-3 mb-6">
                            {PRO_FEATURES.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                                    {f.text}
                                </li>
                            ))}
                        </ul>

                        {!isPro && (
                            <button
                                onClick={upgrade}
                                disabled={upgrading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {upgrading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Redirecting to Stripe...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        Upgrade to Pro
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Manage subscription */}
            {isPro && (
                <div className="flex justify-center">
                    <button
                        onClick={manageSubscription}
                        className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Manage Subscription (Stripe Portal)
                    </button>
                </div>
            )}
        </div>
    );
}

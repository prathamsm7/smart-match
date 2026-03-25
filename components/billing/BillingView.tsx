"use client";

import React from "react";
import {
  CreditCard,
  ExternalLink,
  BarChart3,
  FileText,
  Briefcase,
  Calendar,
  Upload,
  Rocket,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { RecruiterPlans } from "./RecruiterPlans";
import { CandidatePlans } from "./CandidatePlans";

// ─── Feature display config ─────────────────────────────
const FEATURE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> =
  {
    resume_upload: {
      label: "Resume Uploads",
      icon: <Upload className="w-4 h-4" />,
    },
    ats_analysis: {
      label: "ATS Analysis",
      icon: <FileText className="w-4 h-4" />,
    },
    job_match: {
      label: "Job Matches",
      icon: <Briefcase className="w-4 h-4" />,
    },
    cover_letter: {
      label: "Cover Letters",
      icon: <FileText className="w-4 h-4" />,
    },
    interview: {
      label: "AI Interviews",
      icon: <Calendar className="w-4 h-4" />,
    },
    application: {
      label: "Applications",
      icon: <Rocket className="w-4 h-4" />,
    },
    job_posting: {
      label: "Job Postings",
      icon: <Briefcase className="w-4 h-4" />,
    },
    interview_report_view: {
      label: "Interview Reports",
      icon: <FileText className="w-4 h-4" />,
    },
  };

// ─── Usage Progress Bar ─────────────────────────────────
function UsageBar({
  feature,
  used,
  limit,
}: {
  feature: string;
  used: number;
  limit: number;
}) {
  const config = FEATURE_CONFIG[feature];
  if (!config || limit === 0) return null; // Don't show features with 0 limit

  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && used >= limit;

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAtLimit ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"}`}
      >
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-200">
            {config.label}
          </span>
          <span
            className={`text-xs font-mono ${isAtLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-gray-400"}`}
          >
            {isUnlimited ? `${used} used` : `${used}/${limit}`}
          </span>
        </div>
        {!isUnlimited && (
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-blue-500"}`}
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
    role,
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

  const isPaid = plan.type === "paid" && subscription?.status === "active";
  const isCanceling = subscription?.cancelAtPeriodEnd;
  const isRecruiter = role === "recruiter";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 ${isRecruiter ? "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-blue-500/30" : "bg-gradient-to-br from-violet-500 to-purple-600 shadow-purple-500/30"} rounded-xl flex items-center justify-center shadow-lg`}
        >
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            Billing & Subscription
          </h2>
          <p className="text-sm text-gray-400">
            {isPaid
              ? `You're on the ${plan.displayName} plan`
              : "Upgrade to unlock more features"}
          </p>
        </div>
      </div>

      {/* Subscription status banner */}
      {isPaid && isCanceling && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          ⚠️ Your subscription will cancel at the end of the billing period (
          {subscription?.currentPeriodEnd
            ? new Date(subscription.currentPeriodEnd).toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric", year: "numeric" },
              )
            : "unknown"}
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
          {/* Only render usage bars for features the role has access to (> 0) */}
          {Object.entries(usage)
            .filter(([, info]) => info.limit > 0 || info.limit === -1)
            .map(([feature, info]) => (
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
        <h3 className="text-lg font-semibold text-white mb-4">
          Choose Your Plan
        </h3>
        {isRecruiter ? (
          <RecruiterPlans
            plan={plan as any}
            upgrading={upgrading}
            onUpgrade={upgrade}
          />
        ) : (
          <CandidatePlans
            plan={plan as any}
            isPaid={isPaid}
            upgrading={upgrading}
            onUpgrade={upgrade}
          />
        )}
      </div>

      {/* Manage subscription */}
      {isPaid && (
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

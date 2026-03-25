import React from 'react';
import { Check, Crown, Loader2, TrendingUp } from 'lucide-react';
import { 
    FREE_RECRUITER_FEATURES, 
    GROWTH_RECRUITER_FEATURES, 
    PRO_RECRUITER_FEATURES 
} from '@/config/billing';

interface RecruiterPlansProps {
    plan: { name: string; type: string; displayName: string; price: number };
    upgrading: boolean;
    onUpgrade: (planName: string) => void;
}

export function RecruiterPlans({ plan, upgrading, onUpgrade }: RecruiterPlansProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Starter / Free Recruiter */}
            <div className={`relative p-6 rounded-2xl border transition-all ${plan.name === 'free_recruiter'
                ? 'border-blue-500/30 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                : 'border-white/10 bg-white/2 hover:border-white/20'}`
            }>
                {plan.name === 'free_recruiter' && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                        Current Plan
                    </div>
                )}
                <div className="mb-4">
                    <h4 className="text-lg font-bold text-white">Starter</h4>
                    <p className="text-2xl font-bold text-white mb-2">$0<span className="text-sm font-normal text-gray-400">/month</span></p>
                    <p className="text-xs text-gray-400">Perfect for small hiring needs.</p>
                </div>
                <ul className="space-y-3">
                    {FREE_RECRUITER_FEATURES.map((f, i) => (
                        <li key={i} className={`flex items-start gap-2 text-sm ${f.included ? 'text-gray-300' : 'text-gray-500 line-through'}`}>
                            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${f.included ? 'text-blue-400' : 'text-gray-600'}`} />
                            {f.text}
                        </li>
                    ))}
                </ul>
            </div>

            {/* 2. Growth Recruiter ($49) */}
            <div className={`relative p-6 rounded-2xl border transition-all ${plan.name === 'growth_recruiter'
                ? 'border-indigo-500/50 bg-indigo-500/10 shadow-xl shadow-indigo-500/20 transform scale-105 z-10'
                : 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10'}`
            }>
                <div className="absolute -top-3 right-6 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-full shadow-lg">
                    Most Popular ⭐️
                </div>
                {plan.name === 'growth_recruiter' && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                        Current Plan
                    </div>
                )}
                <div className="mb-4">
                    <h4 className="text-lg font-bold text-white">Growth</h4>
                    <p className="text-2xl font-bold text-white mb-2">$49<span className="text-sm font-normal text-gray-400">/month</span></p>
                    <p className="text-xs text-indigo-200">For startups & growing companies.</p>
                </div>
                <ul className="space-y-3 mb-6">
                    {GROWTH_RECRUITER_FEATURES.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            {f.text}
                        </li>
                    ))}
                </ul>
                {plan.name !== 'growth_recruiter' && (
                    <button
                        onClick={() => onUpgrade('growth_recruiter')}
                        disabled={upgrading}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                        {upgrading ? 'Loading...' : 'Upgrade to Growth'}
                    </button>
                )}
            </div>

            {/* 3. Pro Recruiter ($99) */}
            <div className={`relative p-6 rounded-2xl border transition-all ${plan.name === 'pro_recruiter'
                ? 'border-purple-500/30 bg-purple-500/5 shadow-lg shadow-purple-500/10'
                : 'border-white/10 bg-white/2 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10'}`
            }>
                {plan.name === 'pro_recruiter' && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Current Plan
                    </div>
                )}
                <div className="mb-4">
                    <h4 className="text-lg font-bold text-white">Pro</h4>
                    <p className="text-2xl font-bold text-white mb-2">$99<span className="text-sm font-normal text-gray-400">/month</span></p>
                    <p className="text-xs text-purple-200">For serious hiring teams.</p>
                </div>
                <ul className="space-y-3 mb-6">
                    {PRO_RECRUITER_FEATURES.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            {f.text}
                        </li>
                    ))}
                </ul>
                {plan.name !== 'pro_recruiter' && (
                    <button
                        onClick={() => onUpgrade('pro_recruiter')}
                        disabled={upgrading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                        {upgrading ? 'Loading...' : 'Go Pro'}
                    </button>
                )}
            </div>
        </div>
    );
}

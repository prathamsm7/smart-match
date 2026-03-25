import React from 'react';
import { Check, Zap, Crown, Loader2 } from 'lucide-react';
import { 
    FREE_CANDIDATE_FEATURES, 
    PRO_CANDIDATE_FEATURES 
} from '@/config/billing';

interface CandidatePlansProps {
    plan: { name: string; type: string; displayName: string; price: number };
    isPaid: boolean;
    upgrading: boolean;
    onUpgrade: (planName: string) => void;
}

export function CandidatePlans({ plan, isPaid, upgrading, onUpgrade }: CandidatePlansProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`relative p-6 rounded-2xl border transition-all ${!isPaid
                ? 'border-blue-500/30 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                : 'border-white/10 bg-white/2 hover:border-white/20'}`
            }>
                {!isPaid && (
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
                    {FREE_CANDIDATE_FEATURES.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-blue-400 shrink-0" />
                            {f.text}
                        </li>
                    ))}
                </ul>
            </div>

            <div className={`relative p-6 rounded-2xl border transition-all ${isPaid
                ? 'border-purple-500/30 bg-purple-500/5 shadow-lg shadow-purple-500/10'
                : 'border-white/10 bg-white/2 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10'}`
            }>
                {isPaid && (
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
                    {PRO_CANDIDATE_FEATURES.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-purple-400 shrink-0" />
                            {f.text}
                        </li>
                    ))}
                </ul>

                {!isPaid && (
                    <button
                        onClick={() => onUpgrade('pro')}
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
    );
}

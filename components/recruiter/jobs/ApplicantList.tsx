import { Users } from "lucide-react";
import { Application } from "@/types";

interface ApplicantListProps {
    applications: Application[];
    loading: boolean;
    selectedIndex: number | null;
    onSelect: (index: number) => void;
}

export function ApplicantList({ applications, loading, selectedIndex, onSelect }: ApplicantListProps) {
    return (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-400" />
                Applicants ({applications.length})
            </h3>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : applications.length === 0 ? (
                <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No applications yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {applications.map((application, idx) => {
                        const initials = application.candidate.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);

                        return (
                            <div
                                key={application.id}
                                onClick={() => onSelect(idx)}
                                className={`p-4 rounded-xl border cursor-pointer transition ${selectedIndex === idx
                                        ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50"
                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-sm">
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold truncate">{application.candidate.name}</h4>
                                        <p className="text-sm text-gray-400 truncate">{application.candidate.email}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="text-lg font-bold text-yellow-400">
                                                {application.matchScore}%
                                            </div>
                                            <span className="text-xs text-gray-400">Match</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

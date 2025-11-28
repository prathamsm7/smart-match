import { Building2, MapPin, DollarSign, Edit, Trash2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Job } from "@/types";

interface JobCardProps {
    job: Job;
    onSelect: () => void;
    onEdit: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    isDeleting: boolean;
}

export function JobCard({ job, onSelect, onEdit, onDelete, isDeleting }: JobCardProps) {
    return (
        <div
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm hover:border-blue-500/30 transition cursor-pointer"
            onClick={onSelect}
        >
            <div className="flex items-start gap-6">
                {/* Company Logo */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-2">{job.title}</h3>
                            <p className="text-gray-400 flex items-center mb-3">
                                <Building2 className="w-4 h-4 mr-2" />
                                {job.employerName || "Your Company"}
                            </p>
                            {job.description && (
                                <p className="text-gray-300 line-clamp-2">{job.description}</p>
                            )}
                        </div>
                        <div className="flex gap-2 ml-4">
                            <button
                                onClick={onEdit}
                                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onDelete}
                                disabled={isDeleting}
                                className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl mb-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-400">{job._count.applications}</p>
                            <p className="text-xs text-gray-400">Applications</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">-</p>
                            <p className="text-xs text-gray-400">Views</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-purple-400">
                                {format(new Date(job.createdAt), "MMM d")}
                            </p>
                            <p className="text-xs text-gray-400">Posted</p>
                        </div>
                        <div className="text-center">
                            <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-semibold">
                                Active
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-sm text-gray-400">
                            {job.location && (
                                <span className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {job.location}
                                </span>
                            )}
                            {job.salary && (
                                <span className="flex items-center text-green-400">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    {job.salary}
                                </span>
                            )}
                            {job.employmentType && (
                                <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">
                                    {job.employmentType}
                                </span>
                            )}
                        </div>
                        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold flex items-center">
                            View Details
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import {
    Briefcase,
    Calendar,
    Building2,
    MapPin,
    Clock,
    ExternalLink,
    Search,
    Filter,
    MoreVertical
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Application {
    id: string;
    jobId: string;
    createdAt: string;
    snapshot: {
        jobTitle?: string;
        employerName?: string;
        jobDescription?: string;
        applicantCity?: string;
        [key: string]: any;
    };
    job: {
        id: string;
        title: string;
        employerName: string | null;
    };
}

export function ApplicationsView({ userId }: { userId: string }) {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchApplications();
    }, []);

    async function fetchApplications() {
        try {
            const response = await fetch('/api/applications', {
                next: { revalidate: 900 },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch applications');
            }
            setApplications(data.applications);
        } catch (error) {
            console.error('Error fetching applications:', error);
            setError(error as string);
        } finally {
            setLoading(false);
        }
    }

    const filteredApplications = applications.filter(app => {
        const title = app.snapshot.jobTitle || app.job.title || "";
        const company = app.snapshot.employerName || app.job.employerName || "";
        const search = searchTerm.toLowerCase();
        return title.toLowerCase().includes(search) || company.toLowerCase().includes(search);
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4">
                    <Briefcase className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Failed to load applications</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <button
                    onClick={fetchApplications}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">My Applications</h2>
                    <p className="text-gray-400 mt-1">Track and manage your job applications</p>
                </div>

                {/* Search and Filter */}
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search applications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full sm:w-64"
                        />
                    </div>
                    <button className="p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Applications Grid */}
            {filteredApplications.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                        <Briefcase className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No applications found</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        {searchTerm ? "No applications match your search." : "You haven't applied to any jobs yet. Start searching for jobs to apply!"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredApplications.map((app) => {
                        const title = app.snapshot.jobTitle || app.job.title || "Unknown Role";
                        const company = app.snapshot.employerName || app.job.employerName || "Unknown Company";
                        const location = app.snapshot.applicantCity || "Remote"; // Fallback

                        return (
                            <div
                                key={app.id}
                                className="group relative bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        {/* Company Logo Placeholder */}
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-slate-700 flex items-center justify-center shrink-0">
                                            <Building2 className="w-6 h-6 text-blue-400" />
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                {title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Building2 className="w-4 h-4" />
                                                    {company}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4" />
                                                    {location}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 sm:self-center">
                                        <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            Applied
                                        </div>
                                        <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
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
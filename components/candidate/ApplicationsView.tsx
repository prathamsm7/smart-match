"use client";

import { useState, useEffect } from "react";
import { Briefcase } from "lucide-react";
import { ApplicationsHeader } from "./applications/ApplicationsHeader";
import { ApplicationsEmptyState } from "./applications/ApplicationsEmptyState";
import { ApplicationsList } from "./applications/ApplicationsList";
import type { ApplicationItem } from "./applications/types";
import { applicationsService } from "@/lib/services";

export function ApplicationsView({ userId }: { userId: string }) {
    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchApplications();
    }, []);

    async function fetchApplications() {
        try {
            const data = await applicationsService.fetchApplications({ revalidate: 900 });
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
            <ApplicationsHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />

            {filteredApplications.length === 0 ? (
                <ApplicationsEmptyState hasSearch={Boolean(searchTerm)} />
            ) : (
                <ApplicationsList applications={filteredApplications} />
            )}
        </div>
    );
}
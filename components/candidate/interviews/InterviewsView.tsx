"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { InterviewsHeader } from "./InterviewsHeader";
import { InterviewsEmptyState } from "./InterviewsEmptyState";
import { InterviewsList } from "./InterviewsList";
import type { InterviewItem } from "./types";

export function InterviewsView({ userId }: { userId: string }) {
    const [interviews, setInterviews] = useState<InterviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchInterviews();
    }, []);

    async function fetchInterviews() {
        try {
            const response = await fetch("/api/interview");
            if (!response.ok) {
                throw new Error("Failed to fetch interviews");
            }
            const data = await response.json();
            setInterviews(data.interviews || []);
        } catch (error) {
            console.error('Error fetching interviews:', error);
            setError(error instanceof Error ? error.message : "Failed to load interviews");
        } finally {
            setLoading(false);
        }
    }

    const filteredInterviews = interviews.filter(interview => {
        const title = interview.application?.job?.title || "";
        const company = interview.application?.job?.employerName || "";
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
                    <Calendar className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Failed to load interviews</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <button
                    onClick={fetchInterviews}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <InterviewsHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />

            {filteredInterviews.length === 0 ? (
                <InterviewsEmptyState hasSearch={Boolean(searchTerm)} />
            ) : (
                <InterviewsList 
                    interviews={filteredInterviews} 
                    onInterviewUpdate={fetchInterviews}
                />
            )}
        </div>
    );
}



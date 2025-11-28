"use client";

import { useState, useEffect } from "react";
import { Send, FileText, Calendar, Award } from "lucide-react";
import { WelcomeBanner } from "./dashboard/WelcomeBanner";
import { StatsOverview } from "./dashboard/StatsOverview";
import { RecentApplications, type RecentApplication } from "./dashboard/RecentApplications";
import { QuickActions } from "./dashboard/QuickActions";
import { ProfileStrength } from "./dashboard/ProfileStrength";
import { dashboardService } from "@/lib/services";

interface DashboardStats {
  totalApplications: number;
  resumeCount: number;
  profileStrength: number;
  interviewsScheduled: number;
}

interface CandidateDashboardProps {
  userId: string;
  onNavigate: (view: string) => void;
}

export function CandidateDashboard({ userId, onNavigate }: CandidateDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const data = await dashboardService.fetchDashboardStats();

      setStats(data.stats);
      setRecentApplications(data.recentApplications || []);
    } catch (err: any) {
      console.error("Error fetching dashboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  const candidateStats = [
    {
      label: "Applications",
      value: stats?.totalApplications || 0,
      icon: <Send className="w-5 h-5" />,
      color: "from-blue-500 to-cyan-500",
      onClick: () => onNavigate("applications"),
    },
    {
      label: "My Resumes",
      value: stats?.resumeCount || 0,
      icon: <FileText className="w-5 h-5" />,
      color: "from-green-500 to-emerald-500",
      onClick: () => onNavigate("resumes"),
    },
    {
      label: "Interviews",
      value: stats?.interviewsScheduled || 0,
      icon: <Calendar className="w-5 h-5" />,
      color: "from-purple-500 to-pink-500",
      onClick: () => onNavigate("interviews"),
    },
    {
      label: "Profile Strength",
      value: `${stats?.profileStrength || 0}%`,
      icon: <Award className="w-5 h-5" />,
      color: "from-orange-500 to-red-500",
      onClick: () => onNavigate("profile"),
    },
  ];

  return (
    <div className="space-y-6">
      <WelcomeBanner />
      <StatsOverview stats={candidateStats} />
      <div className="grid lg:grid-cols-2 gap-6">
        <RecentApplications applications={recentApplications} onNavigate={onNavigate} />
        <QuickActions onNavigate={onNavigate} />
      </div>
      {typeof stats?.profileStrength === "number" && (
        <ProfileStrength value={stats.profileStrength} onImprove={() => onNavigate("resumes")} />
      )}
    </div>
  );
}


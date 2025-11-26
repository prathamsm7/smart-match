"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Target,
  Calendar,
  Award,
  FileText,
  Briefcase,
  Clock,
  TrendingUp,
  Building2,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  totalApplications: number;
  resumeCount: number;
  profileStrength: number;
  interviewsScheduled: number;
}

interface RecentApplication {
  id: string;
  jobTitle: string;
  company: string;
  appliedAt: string;
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
      const response = await fetch("/api/dashboard/stats");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch dashboard data");
      }

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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl p-6 border border-blue-500/20">
        <h1 className="text-2xl font-bold mb-2">Welcome back! 👋</h1>
        <p className="text-gray-400">
          Here&apos;s what&apos;s happening with your job search today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {candidateStats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.onClick}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm hover:border-blue-500/30 transition cursor-pointer group"
          >
            <div
              className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg mb-4`}
            >
              {stat.icon}
            </div>
            <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
            <p className="text-gray-400 text-sm group-hover:text-white transition">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              Recent Applications
            </h2>
            <button
              onClick={() => onNavigate("applications")}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <Send className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">No applications yet</p>
              <button
                onClick={() => onNavigate("job-matches")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm"
              >
                Find Jobs
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{app.jobTitle}</h4>
                      <p className="text-sm text-gray-400">{app.company}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
            Quick Actions
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate("job-matches")}
              className="w-full p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition flex items-center justify-between"
            >
              <div className="flex items-center">
                <Target className="w-5 h-5 mr-3 text-blue-400" />
                <span>Browse Job Matches</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => onNavigate("resumes")}
              className="w-full p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl border border-green-500/20 hover:border-green-500/50 transition flex items-center justify-between"
            >
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-3 text-green-400" />
                <span>Manage Resumes</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => onNavigate("applications")}
              className="w-full p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/20 hover:border-purple-500/50 transition flex items-center justify-between"
            >
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 mr-3 text-purple-400" />
                <span>Track Applications</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Strength Indicator */}
      {stats?.profileStrength !== undefined && stats.profileStrength < 100 && (
        <div className="bg-gradient-to-r from-orange-600/20 to-amber-600/20 rounded-2xl p-6 border border-orange-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Complete Your Profile</h3>
              <p className="text-gray-400 text-sm">
                A complete profile helps you get better job matches
              </p>
            </div>
            <div className="text-3xl font-bold text-orange-400">
              {stats.profileStrength}%
            </div>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.profileStrength}%` }}
            />
          </div>
          <button
            onClick={() => onNavigate("resumes")}
            className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm"
          >
            Improve Profile
          </button>
        </div>
      )}
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  Users,
  TrendingUp,
  CheckCircle,
  Plus,
  ArrowRight,
  Building2,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { dashboardService } from "@/lib/services";

interface RecruiterStats {
  totalJobs: number;
  totalApplications: number;
  jobsWithApplications: number;
  activeJobs: number;
}

interface RecentApplication {
  id: string;
  jobTitle: string;
  company: string | null;
  candidateName: string;
  appliedAt: string;
}

interface RecruiterDashboardProps {
  userId: string;
  onNavigate: (view: string) => void;
}

export function RecruiterDashboard({ userId, onNavigate }: RecruiterDashboardProps) {
  const [stats, setStats] = useState<RecruiterStats | null>(null);
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

  const recruiterStats = [
    {
      label: "Total Jobs",
      value: stats?.totalJobs || 0,
      icon: <Briefcase className="w-5 h-5" />,
      color: "from-blue-500 to-cyan-500",
      onClick: () => onNavigate("jobs"),
    },
    {
      label: "Total Applications",
      value: stats?.totalApplications || 0,
      icon: <Users className="w-5 h-5" />,
      color: "from-green-500 to-emerald-500",
      onClick: () => onNavigate("jobs"),
    },
    {
      label: "Jobs with Applications",
      value: stats?.jobsWithApplications || 0,
      icon: <CheckCircle className="w-5 h-5" />,
      color: "from-purple-500 to-pink-500",
      onClick: () => onNavigate("jobs"),
    },
    {
      label: "Active Jobs",
      value: stats?.activeJobs || 0,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "from-orange-500 to-red-500",
      onClick: () => onNavigate("jobs"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl p-6 border border-blue-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Recruiter Dashboard 👋</h1>
            <p className="text-gray-400">
              Manage your job postings and review applicants.
            </p>
          </div>
          <button
            onClick={() => onNavigate("jobs")}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {recruiterStats.map((stat, index) => (
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

      {/* Recent Applications & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              Recent Applications
            </h2>
            <button
              onClick={() => onNavigate("jobs")}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">No applications yet</p>
              <p className="text-gray-500 text-sm">
                Post jobs to start receiving applications
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => {
                const initials = app.candidateName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={app.id}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition cursor-pointer"
                    onClick={() => onNavigate("jobs")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{app.candidateName}</h4>
                        <p className="text-sm text-gray-400">Applied for {app.jobTitle}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
              onClick={() => onNavigate("jobs")}
              className="w-full p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition flex items-center justify-between"
            >
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 mr-3 text-blue-400" />
                <span>Manage Job Postings</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => onNavigate("jobs")}
              className="w-full p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl border border-green-500/20 hover:border-green-500/50 transition flex items-center justify-between"
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3 text-green-400" />
                <span>Review Applicants</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => onNavigate("profile")}
              className="w-full p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/20 hover:border-purple-500/50 transition flex items-center justify-between"
            >
              <div className="flex items-center">
                <Building2 className="w-5 h-5 mr-3 text-purple-400" />
                <span>Company Profile</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Tip Card */}
      {stats?.totalJobs === 0 && (
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl p-6 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Get Started</h3>
              <p className="text-gray-400 text-sm">
                Post your first job to start receiving applications from qualified candidates.
              </p>
            </div>
            <button
              onClick={() => onNavigate("jobs")}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold"
            >
              Post a Job
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


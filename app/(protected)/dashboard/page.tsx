"use client";

import React, { useState, useMemo } from 'react';
import { 
  Send, Target, Calendar, Award,
  Eye, Star
} from 'lucide-react';
import { createBrowserSupabase } from "@/lib/superbase/client";
import { useSupabaseAuthSync } from "@/hooks/useSupabaseAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { DashboardSidebar, type DashboardView } from './components/DashboardSidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { StatsGrid, type StatItem } from './components/StatsGrid';
import { TopMatches, type JobMatch } from './components/TopMatches';
import { ApplicationPipeline, type PipelineStage } from './components/ApplicationPipeline';
import { UpcomingEvents, type Event } from './components/UpcomingEvents';
import { RecentActivity, type ActivityItem } from './components/RecentActivity';
import { ResumesView } from './components/ResumesView';
import { JobMatchesView } from './components/JobMatchesView';

export default function DashboardPage() {
  const supabase = createBrowserSupabase();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('overview');

  // Use the hook for cross-tab auth synchronization (handles SIGNED_OUT)
  useSupabaseAuthSync();
  
  // Get user data for display (auth check is handled by layout, but we need user data)
  const { user, loading: authLoading } = useRequireAuth();

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        alert("Failed to sign out. Please try again.");
        setSigningOut(false);
        return;
      }

      // The useSupabaseAuthSync hook will handle the redirect on SIGNED_OUT event
      // The hook uses window.location.href for immediate redirect
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
      setSigningOut(false);
    }
  }

  // Static data — replace with real API responses later
  const stats = useMemo<StatItem[]>(
    () => [
      { 
        label: "Active Applications", 
        value: "12", 
        change: "+3",
        trend: "up",
        icon: <Send className="w-5 h-5" />,
        bgColor: "from-blue-500/20 to-blue-600/20",
        iconColor: "text-blue-400",
        borderColor: "border-blue-500/30"
      },
      { 
        label: "Job Matches", 
        value: "48", 
        change: "+8",
        trend: "up",
        icon: <Target className="w-5 h-5" />,
        bgColor: "from-green-500/20 to-green-600/20",
        iconColor: "text-green-400",
        borderColor: "border-green-500/30"
      },
      { 
        label: "Interview Scheduled", 
        value: "5", 
        change: "+2",
        trend: "up",
        icon: <Calendar className="w-5 h-5" />,
        bgColor: "from-purple-500/20 to-purple-600/20",
        iconColor: "text-purple-400",
        borderColor: "border-purple-500/30"
      },
      { 
        label: "Profile Strength", 
        value: "87%", 
        change: "+5%",
        trend: "up",
        icon: <Award className="w-5 h-5" />,
        bgColor: "from-orange-500/20 to-orange-600/20",
        iconColor: "text-orange-400",
        borderColor: "border-orange-500/30"
      }
    ],
    []
  );

  const topMatches = useMemo<JobMatch[]>(
    () => [
      {
        id: 1,
        title: "Senior Full Stack Developer",
        company: "Google",
        logo: "G",
        match: 96,
        salary: "$140k - $180k",
        location: "Remote",
        type: "Full-time",
        skills: ["React", "Node.js", "AWS"],
        posted: "1 day ago",
        applicants: 45
      },
      {
        id: 2,
        title: "Frontend Tech Lead",
        company: "Meta",
        logo: "M",
        match: 94,
        salary: "$150k - $200k",
        location: "Hybrid",
        type: "Full-time",
        skills: ["React", "TypeScript", "Next.js"],
        posted: "2 days ago",
        applicants: 67
      },
      {
        id: 3,
        title: "React Developer",
        company: "Amazon",
        logo: "A",
        match: 91,
        salary: "$120k - $160k",
        location: "On-site",
        type: "Full-time",
        skills: ["React", "JavaScript", "Redux"],
        posted: "3 days ago",
        applicants: 89
      }
    ],
    []
  );

  const applicationStatus = useMemo<PipelineStage[]>(
    () => [
      { stage: "Applied", count: 12, color: "bg-blue-500" },
      { stage: "Screening", count: 5, color: "bg-yellow-500" },
      { stage: "Interview", count: 3, color: "bg-purple-500" },
      { stage: "Offer", count: 1, color: "bg-green-500" }
    ],
    []
  );

  const upcomingEvents = useMemo<Event[]>(
    () => [
      {
        type: "Technical Interview",
        company: "Google",
        position: "Senior Full Stack Developer",
        date: "Today",
        time: "2:00 PM",
        duration: "1 hour",
        status: "upcoming"
      },
      {
        type: "HR Round",
        company: "Meta",
        position: "Frontend Tech Lead",
        date: "Tomorrow",
        time: "10:00 AM",
        duration: "45 mins",
        status: "upcoming"
      },
      {
        type: "Final Interview",
        company: "Amazon",
        position: "React Developer",
        date: "Dec 22",
        time: "3:00 PM",
        duration: "1.5 hours",
        status: "scheduled"
      }
    ],
    []
  );

  const recentActivity = useMemo<ActivityItem[]>(
    () => [
      {
        icon: <Send className="w-4 h-4 text-blue-400" />,
        title: "Application sent to Google",
        subtitle: "Senior Full Stack Developer",
        time: "2 hours ago",
        bgColor: "bg-blue-500/10"
      },
      {
        icon: <Eye className="w-4 h-4 text-green-400" />,
        title: "Profile viewed by Meta recruiter",
        subtitle: "Sarah Johnson",
        time: "5 hours ago",
        bgColor: "bg-green-500/10"
      },
      {
        icon: <Star className="w-4 h-4 text-yellow-400" />,
        title: "New job match found",
        subtitle: "Frontend Tech Lead at Meta",
        time: "1 day ago",
        bgColor: "bg-yellow-500/10"
      },
      {
        icon: <Calendar className="w-4 h-4 text-purple-400" />,
        title: "Interview scheduled",
        subtitle: "Technical Round with Amazon",
        time: "2 days ago",
        bgColor: "bg-purple-500/10"
      }
    ],
    []
  );

  // Show loading state while fetching user data
  // Note: Auth check is handled by layout, but we need to wait for user data
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Render the appropriate view component
  const renderView = () => {
    switch (currentView) {
      case 'resumes':
        return <ResumesView userId={user?.id || ""} />;
      case 'overview':
        return (
          <>
            <StatsGrid stats={stats} />
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                <TopMatches matches={topMatches} />
                <ApplicationPipeline stages={applicationStatus} />
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                <UpcomingEvents events={upcomingEvents} />
                <RecentActivity activities={recentActivity} />
              </div>
            </div>
          </>
        );
      case 'job-matches':
        return <JobMatchesView userId={user?.id || ""} />;
      case 'applications':
        return (
          <div className="text-center py-12">
            <p className="text-gray-400">Applications view coming soon...</p>
          </div>
        );
      case 'interviews':
        return (
          <div className="text-center py-12">
            <p className="text-gray-400">Interviews view coming soon...</p>
          </div>
        );
      case 'network':
        return (
          <div className="text-center py-12">
            <p className="text-gray-400">Network view coming soon...</p>
          </div>
        );
      case 'profile':
        return (
          <div className="text-center py-12">
            <p className="text-gray-400">Profile view coming soon...</p>
          </div>
        );
      case 'notifications':
        return (
          <div className="text-center py-12">
            <p className="text-gray-400">Notifications view coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <p className="text-gray-400">Settings view coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <DashboardSidebar
        user={user}
        sidebarOpen={sidebarOpen}
        signingOut={signingOut}
        onSignOut={handleSignOut}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        {/* <DashboardHeader
          user={user}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentView={currentView}
        /> */}

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {renderView()}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      )}
    </div>
  );
}

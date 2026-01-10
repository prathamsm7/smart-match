"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserSupabase } from "@/lib/superbase/client";
import { useSupabaseAuthSync } from "@/hooks/useSupabaseAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { DashboardSidebar, type DashboardView } from '@/components/dashboard/DashboardSidebar';
import { ResumesView } from '@/components/candidate/ResumesView';
import { JobMatchesView } from '@/components/candidate/JobMatchesView';
import { ApplicationsView } from '@/components/candidate/ApplicationsView';
import { JobsDashboard } from '@/components/recruiter/JobsDashboard';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { InterviewsView } from '@/components/candidate/interviews/InterviewsView';

export default function DashboardPage() {
  const supabase = createBrowserSupabase();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [userRole, setUserRole] = useState<string>('candidate');
  const [loadingRole, setLoadingRole] = useState(true);

  // Use the hook for cross-tab auth synchronization (handles SIGNED_OUT)
  useSupabaseAuthSync();

  // Get user data for display (auth check is handled by layout, but we need user data)
  const { user, loading: authLoading } = useRequireAuth();

  // Fetch user role
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await fetch('/api/user');
        const data = await response.json();
        if (data.success && data.user) {
          setUserRole(data.user.role || 'candidate');
          // Set default view based on role
          if (data.user.role === 'recruiter') {
            setCurrentView('jobs');
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoadingRole(false);
      }
    }

    if (user) {
      fetchUserRole();
    }
  }, [user]);

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

  // Show loading state while fetching user data
  // Note: Auth check is handled by layout, but we need to wait for user data
  if (authLoading || !user || loadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
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
          <DashboardOverview
            userId={user?.id || ""}
            userRole={userRole}
            onNavigate={(view) => setCurrentView(view as DashboardView)}
          />
        );
      case 'job-matches':
        return <JobMatchesView userId={user?.id || ""} />;
      case 'applications':
        return (
          <ApplicationsView userId={user?.id || ""} />
        );
      case 'jobs':
        if (!user?.id) return null;
        return (
          <JobsDashboard userId={user.id} />
        );
      case 'interviews':
        return (
          <InterviewsView userId={user?.id || ""} />
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
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <DashboardSidebar
        user={user}
        userRole={userRole}
        sidebarOpen={sidebarOpen}
        signingOut={signingOut}
        onSignOut={handleSignOut}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">

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

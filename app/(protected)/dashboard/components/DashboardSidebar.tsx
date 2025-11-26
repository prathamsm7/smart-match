"use client";

import React from 'react';
import {
  Briefcase,
  FileText,
  Calendar,
  Users,
  User,
  Bell,
  Settings,
  LogOut,
  Rocket,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { getUserInitials, getUserDisplayName, getUserTitle } from './utils/userHelpers';

export type DashboardView = 'overview' | 'job-matches' | 'resumes' | 'applications' | 'interviews' | 'network' | 'profile' | 'notifications' | 'settings' | 'jobs' | 'test';

interface DashboardSidebarProps {
  user: any;
  userRole?: string;
  sidebarOpen: boolean;
  signingOut: boolean;
  onSignOut: () => void;
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

export function DashboardSidebar({
  user,
  userRole = 'candidate',
  sidebarOpen,
  signingOut,
  onSignOut,
  currentView,
  onViewChange,
}: DashboardSidebarProps) {
  const userInitials = getUserInitials(user);
  const userDisplayName = getUserDisplayName(user);
  const userTitle = userRole === 'recruiter' ? 'Recruiter' : getUserTitle();

  // Candidate navigation items (badges removed - use real data from API)
  const candidateItems = [
    { icon: <BarChart3 className="w-5 h-5" />, label: "Dashboard", view: 'overview' as DashboardView, badge: null },
    { icon: <Briefcase className="w-5 h-5" />, label: "Job Matches", view: 'job-matches' as DashboardView, badge: null },
    { icon: <FileText className="w-5 h-5" />, label: "My Resumes", view: 'resumes' as DashboardView, badge: null },
    { icon: <Briefcase className="w-5 h-5" />, label: "Applications", view: 'applications' as DashboardView, badge: null },
    { icon: <Calendar className="w-5 h-5" />, label: "Interviews", view: 'interviews' as DashboardView, badge: null },
    { icon: <Users className="w-5 h-5" />, label: "Network", view: 'network' as DashboardView, badge: null },
    { icon: <User className="w-5 h-5" />, label: "Profile", view: 'profile' as DashboardView, badge: null },
    { icon: <Bell className="w-5 h-5" />, label: "Notifications", view: 'notifications' as DashboardView, badge: null },
    { icon: <Settings className="w-5 h-5" />, label: "Settings", view: 'settings' as DashboardView, badge: null },
  ];

  // Recruiter navigation items
  const recruiterItems = [
    { icon: <BarChart3 className="w-5 h-5" />, label: "Dashboard", view: 'overview' as DashboardView, badge: null },
    { icon: <ClipboardList className="w-5 h-5" />, label: "My Jobs", view: 'jobs' as DashboardView, badge: null },
    { icon: <Users className="w-5 h-5" />, label: "Candidates", view: 'network' as DashboardView, badge: null },
    { icon: <User className="w-5 h-5" />, label: "Profile", view: 'profile' as DashboardView, badge: null },
    { icon: <Bell className="w-5 h-5" />, label: "Notifications", view: 'notifications' as DashboardView, badge: null },
    { icon: <Settings className="w-5 h-5" />, label: "Settings", view: 'settings' as DashboardView, badge: null },
  ];

  const navigationItems = userRole === 'recruiter' ? recruiterItems : candidateItems;

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                SmartMatch
              </span>
              <p className="text-xs text-gray-400">Career Hub</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item, index) => (
            <button
              key={index}
              onClick={() => onViewChange(item.view)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition group ${
                currentView === item.view
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                  currentView === item.view ? 'bg-white/20' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Profile Card in Sidebar */}
        <div className="p-4 border-t border-white/10">
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-lg">
                {userInitials}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{userDisplayName}</p>
                <p className="text-xs text-gray-400">{userTitle}</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              disabled={signingOut}
              className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              <span>{signingOut ? "Logging out..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}


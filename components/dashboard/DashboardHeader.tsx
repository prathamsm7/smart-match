"use client";

import React from 'react';
import { Search, Bell, Filter, Plus, Menu, X, Sparkles } from 'lucide-react';
import { getUserDisplayName } from './utils/userHelpers';

interface DashboardHeaderProps {
  user: any;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  currentView?: string;
}

export function DashboardHeader({
  user,
  sidebarOpen,
  onToggleSidebar,
  currentView,
}: DashboardHeaderProps) {
  const userDisplayName = getUserDisplayName(user);

  // Get header title based on current view
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'resumes':
        return 'My Resumes';
      case 'job-matches':
        return 'Job Matches';
      case 'applications':
        return 'Applications';
      case 'interviews':
        return 'Interviews';
      case 'network':
        return 'Network';
      case 'profile':
        return 'Profile';
      case 'notifications':
        return 'Notifications';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const getHeaderSubtitle = () => {
    switch (currentView) {
      case 'resumes':
        return 'Manage your resumes';
      case 'job-matches':
        return 'Find your perfect job match';
      case 'applications':
        return 'Track your job applications';
      case 'interviews':
        return 'Upcoming and past interviews';
      default:
        return "Here's what's happening with your job search today";
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                {currentView === 'overview' ? (
                  <>
                    Good Morning, {userDisplayName}! 
                    <Sparkles className="w-5 h-5 ml-2 text-yellow-400" />
                  </>
                ) : (
                  getHeaderTitle()
                )}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">{getHeaderSubtitle()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs, companies..."
                className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition w-80 text-sm"
              />
            </div>
            
            <button className="p-2.5 hover:bg-white/5 rounded-xl transition">
              <Filter className="w-5 h-5" />
            </button>

            <button className="relative p-2.5 hover:bg-white/5 rounded-xl transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>

            <button className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Application</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


"use client";

import React from 'react';
import { Activity } from 'lucide-react';

export interface ActivityItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  time: string;
  bgColor: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
      <h2 className="text-xl font-bold mb-5 flex items-center">
        <Activity className="w-5 h-5 mr-2 text-green-400" />
        Recent Activity
      </h2>

      <div className="space-y-3">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex items-start space-x-3">
            <div className={`w-8 h-8 ${activity.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200">{activity.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{activity.subtitle}</p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


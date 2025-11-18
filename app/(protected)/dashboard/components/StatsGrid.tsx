"use client";

import React from 'react';
import { Send, Target, Calendar, Award, ArrowUp, ArrowDown } from 'lucide-react';

export interface StatItem {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  borderColor: string;
}

interface StatsGridProps {
  stats: StatItem[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`relative bg-gradient-to-br ${stat.bgColor} rounded-2xl p-6 border ${stat.borderColor} backdrop-blur-sm overflow-hidden group hover:scale-[1.02] transition-transform`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center ${stat.iconColor}`}>
                {stat.icon}
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                stat.trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {stat.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                <span>{stat.change}</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
            <p className="text-gray-400 text-sm">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}


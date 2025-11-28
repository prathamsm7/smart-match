"use client";

import React from 'react';
import { Zap, ChevronRight, MapPin, DollarSign, Clock, Building2 } from 'lucide-react';

export interface JobMatch {
  id: number;
  title: string;
  company: string;
  logo: string;
  match: number;
  salary: string;
  location: string;
  type: string;
  skills: string[];
  posted: string;
  applicants: number;
}

interface TopMatchesProps {
  matches: JobMatch[];
}

export function TopMatches({ matches }: TopMatchesProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Zap className="w-6 h-6 mr-2 text-yellow-400" />
            Top Matches for You
          </h2>
          <p className="text-gray-400 text-sm mt-1">Based on your skills and preferences</p>
        </div>
        <button className="text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1 text-sm">
          <span>View All</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {matches.map((job) => (
          <div
            key={job.id}
            className="p-5 bg-gradient-to-br from-white/5 to-transparent hover:from-white/10 rounded-xl border border-white/10 hover:border-blue-500/50 transition cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg shadow-blue-500/30">
                {job.logo}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-blue-400 transition">{job.title}</h3>
                    <p className="text-gray-400 flex items-center mt-1">
                      <Building2 className="w-4 h-4 mr-1" />
                      {job.company}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      job.match >= 95 ? 'text-green-400' : 
                      job.match >= 90 ? 'text-yellow-400' : 
                      'text-orange-400'
                    }`}>
                      {job.match}%
                    </div>
                    <span className="text-xs text-gray-400">Match</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {job.skills.map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {job.location}
                    </span>
                    <span className="flex items-center text-green-400">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {job.salary}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {job.posted}
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition opacity-0 group-hover:opacity-100">
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


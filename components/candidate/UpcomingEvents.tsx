"use client";

import React from 'react';
import { Calendar, Clock } from 'lucide-react';

export interface Event {
  type: string;
  company: string;
  position: string;
  date: string;
  time: string;
  duration: string;
  status: "upcoming" | "scheduled";
}

interface UpcomingEventsProps {
  events: Event[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
      <h2 className="text-xl font-bold mb-5 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-cyan-400" />
        Upcoming Events
      </h2>

      <div className="space-y-3">
        {events.map((event, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${
              event.status === 'upcoming'
                ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-semibold mb-2 ${
                  event.status === 'upcoming' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {event.type}
                </span>
                <h3 className="font-semibold text-sm">{event.position}</h3>
                <p className="text-xs text-gray-400">{event.company}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-white/10">
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {event.date}
              </span>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {event.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition">
        View Full Calendar
      </button>
    </div>
  );
}


"use client";

import React from 'react';
import { PieChart } from 'lucide-react';

export interface PipelineStage {
  stage: string;
  count: number;
  color: string;
}

interface ApplicationPipelineProps {
  stages: PipelineStage[];
}

export function ApplicationPipeline({ stages }: ApplicationPipelineProps) {
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <PieChart className="w-5 h-5 mr-2 text-purple-400" />
        Application Pipeline
      </h2>

      <div className="grid grid-cols-4 gap-4">
        {stages.map((stage, idx) => (
          <div key={idx} className="text-center">
            <div className="relative mb-3">
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                  style={{ width: `${(stage.count / maxCount) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stage.count}</div>
            <div className="text-xs text-gray-400">{stage.stage}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


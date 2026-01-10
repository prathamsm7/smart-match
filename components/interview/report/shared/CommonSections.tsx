"use client";

import {
  Award,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Code,
  Target,
  Lightbulb,
  User,
  Briefcase,
} from "lucide-react";
import { InterviewReport } from "@/components/candidate/interviews/types";
import { ScoreRing } from "../ScoreRing";

interface CommonSectionsProps {
  report: InterviewReport;
  variant?: "candidate" | "recruiter";
}

export function CandidateOverviewSection({ 
  report, 
  variant = "candidate" 
}: CommonSectionsProps & { variant?: "candidate" | "recruiter" }) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
          <User className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-2 flex-1">
          <p className="text-sm text-gray-400 uppercase tracking-wide">
            {variant === "candidate" ? "Your Interview" : "Candidate"}
          </p>
          <h2 className="text-2xl font-bold">
            {report.candidateOverview?.name || (variant === "candidate" ? "Candidate" : "Unknown candidate")}
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4 text-blue-400" />
              {report.candidateOverview?.roleInterviewedFor || "Role N/A"}
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4 text-cyan-400" />
              {report.candidateOverview?.experienceLevel || "Experience N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScoresSection({ 
  report, 
  variant = "candidate" 
}: CommonSectionsProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        <h3 className="text-xl font-bold">
          {variant === "candidate" ? "Your Performance Scores" : "Performance Scores"}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
        <ScoreRing value={report.scores?.overall} label="Overall Score" />
        <ScoreRing value={report.scores?.technical} label="Technical Score" />
        <ScoreRing value={report.scores?.communication} label="Communication Score" />
      </div>
    </div>
  );
}

export function StrengthsAndImprovementsSection({ 
  report, 
  variant = "candidate" 
}: CommonSectionsProps) {
  const strengths = report?.strengths || [];
  const improvements = report?.areasForImprovement || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-green-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-lg font-bold">
            {variant === "candidate" ? "Your Strengths" : "Strengths"}
          </h3>
        </div>
        {strengths.length ? (
          <ul className="space-y-3">
            {strengths.map((item, idx) => (
              <li key={`strength-${idx}`} className="bg-green-500/5 border border-green-500/10 rounded-lg p-4">
                <p className="font-semibold text-green-200 mb-1">{item.description}</p>
                {item.evidence && (
                  <p className="text-sm text-gray-300 leading-relaxed">{item.evidence}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No strengths recorded.</p>
        )}
      </div>

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-amber-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold">Areas for Improvement</h3>
        </div>
        {improvements.length ? (
          <ul className="space-y-3">
            {improvements.map((item, idx) => (
              <li key={`improve-${idx}`} className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-4">
                <p className="font-semibold text-amber-200 mb-1">{item.description}</p>
                {item.evidence && (
                  <p className="text-sm text-gray-300 leading-relaxed">{item.evidence}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No areas for improvement documented.</p>
        )}
      </div>
    </div>
  );
}

export function TechnicalSkillsSection({ report }: CommonSectionsProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <Code className="w-5 h-5 text-blue-400" />
        <h3 className="text-xl font-bold">Technical Skills Assessment</h3>
      </div>
      {report.technicalSkillsAssessment?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.technicalSkillsAssessment.map((skill, idx) => (
            <div
              key={`${skill.skill}-${idx}`}
              className="bg-slate-800/50 border border-white/10 rounded-xl p-5 hover:border-blue-500/30 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-lg">{skill.skill}</span>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-xs font-medium uppercase tracking-wide text-blue-200">
                  {skill.proficiency}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{skill.evidence}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No technical skills captured.</p>
      )}
    </div>
  );
}

export function ProblemSolvingSection({ report }: CommonSectionsProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-purple-400" />
        <h4 className="font-semibold">Problem Solving</h4>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-400 mb-1">Logical Reasoning</p>
          <p className="text-gray-200 font-medium">
            {report.problemSolving?.logicalReasoning ?? "N/A"}
          </p>
        </div>
        <div>
          <p className="text-gray-400 mb-1">Approach to Unknown Problems</p>
          <p className="text-gray-200">
            {report.problemSolving?.approachToUnknownProblems || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-gray-400 mb-1">Use of Examples</p>
          <p className="text-gray-200 font-medium">
            {report.problemSolving?.useOfExamples ?? "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CommunicationSkillsSection({ report }: CommonSectionsProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <h4 className="font-semibold">Communication Skills</h4>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-400 mb-1">Clarity</p>
          <p className="text-gray-200 font-medium">
            {report.communicationSkills?.clarity ?? "N/A"}
          </p>
        </div>
        <div>
          <p className="text-gray-400 mb-1">Structure</p>
          <p className="text-gray-200 font-medium">
            {report.communicationSkills?.structure ?? "N/A"}
          </p>
        </div>
        <div>
          <p className="text-gray-400 mb-1">Confidence</p>
          <p className="text-gray-200 font-medium">
            {report.communicationSkills?.confidence ?? "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}



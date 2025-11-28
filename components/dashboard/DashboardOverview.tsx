"use client";

import { CandidateDashboard } from "@/components/candidate/CandidateDashboard";
import { RecruiterDashboard } from "@/components/recruiter/RecruiterDashboard";

interface DashboardOverviewProps {
  userId: string;
  userRole: string;
  onNavigate: (view: string) => void;
}

export function DashboardOverview({ userId, userRole, onNavigate }: DashboardOverviewProps) {
  if (userRole === "recruiter") {
    return <RecruiterDashboard userId={userId} onNavigate={onNavigate} />;
  }

  return <CandidateDashboard userId={userId} onNavigate={onNavigate} />;
}

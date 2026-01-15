export interface InterviewItem {
  id: string;
  applicationId: string;
  userId: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
  transcript?: any;
  report?: any;
  reportId?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  application?: {
    id: string;
    jobId: string;
    status: string;
    job?: {
      id: string;
      title: string;
      employerName?: string | null;
      location?: string | null;
    };
  };
}

export type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  text: string;
  via: "audio" | "text";
  timestamp?: number;
}

export interface LiveConfig {
  apiKey: string;
  model?: string;
}

export type HiringDecision = "strong_hire" | "hire" | "borderline" | "no_hire";

export interface InterviewReport {
  candidateOverview?: {
    name?: string | null;
    roleInterviewedFor?: string;
    experienceLevel?: "junior" | "mid" | "senior" | null;
  };
  technicalSkillsAssessment?: Array<{
    skill: string;
    proficiency: "poor" | "basic" | "intermediate" | "advanced";
    evidence: string;
  }>;
  problemSolving?: {
    logicalReasoning?: "poor" | "basic" | "intermediate" | "advanced" | null;
    approachToUnknownProblems?: string | null;
    useOfExamples?: "none" | "limited" | "adequate" | "strong" | null;
  };
  communicationSkills?: {
    clarity?: "poor" | "basic" | "intermediate" | "advanced";
    structure?: "poor" | "basic" | "intermediate" | "advanced";
    confidence?: "low" | "medium" | "high";
  };
  strengths?: Array<{
    description: string;
    evidence: string;
  }>;
  areasForImprovement?: Array<{
    description: string;
    evidence: string;
  }>;
  scores?: {
    technical?: number;
    communication?: number;
    overall?: number;
  };
  hiringRecommendation?: {
    decision?: HiringDecision;
    justification?: string;
  };
  recruiterSummary?: string;
}

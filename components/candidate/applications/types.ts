export interface ApplicationSnapshot {
  jobTitle?: string;
  employerName?: string;
  jobDescription?: string;
  applicantCity?: string;
  [key: string]: any;
}

export interface ApplicationItem {
  id: string;
  jobId: string;
  createdAt: string;
  status: 'SUBMITTED' | 'VIEWED' | 'SHORTLISTED' | 'INTERVIEW' | 'REJECTED' | 'HIRED' | 'WITHDRAWN';
  snapshot: ApplicationSnapshot;
  job: {
    id: string;
    title: string;
    employerName: string | null;
  };
  interview?: {
    id: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    startedAt: string | null;
    completedAt: string | null;
  } | null;
}

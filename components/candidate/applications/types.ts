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
  snapshot: ApplicationSnapshot;
  job: {
    id: string;
    title: string;
    employerName: string | null;
  };
}

export interface MatchDimensions {
  skillsFit: number;
  experienceFit: number;
  seniorityFit: number;
  domainFit: number;
  intentFit: number;
}

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  logo?: string;
  location: string;
  salary: string;
  type: string;
  experience: string;
  matchScore: number;
  vectorScore?: number;
  matchReason?: string;
  dimensions?: MatchDimensions;
  description: string;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  posted: string;
  applicants: number;
  skills: string[];
  requirements?: any;
  jobApplyLink?: string;
}

export interface JobMatchAnalysis {
  jobId: string;
  vectorScore: number;
  skillScore: number;
  expRelevanceScore: number;
  finalScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchReason: string;
  overallMatchScore: number;
  strongExperienceAlignment: string[];
  improvementSuggestions: string[];
}

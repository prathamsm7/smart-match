export interface Candidate {
  id: string;
  name: string;
  title: string;
  location: string;
  matchScore: number;
  summary: string;
  skills: string[];
  isTopMatch?: boolean;
  strengths?: string[];
  weaknesses?: string[];
}

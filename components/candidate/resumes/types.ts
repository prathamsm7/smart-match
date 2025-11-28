import type { ReactNode } from "react";

export interface ResumeData {
  id: string;
  userId: string;
  json: any;
  vectorId: string | null;
  isPrimary: boolean;
  createdAt: Date | string;
  name?: string;
  fileName?: string;
  lastModified?: string;
  fileSize?: string;
  views?: number;
  downloads?: number;
  applications?: number;
  tags?: string[];
  matchScore?: number;
}

export interface ResumeStat {
  label: string;
  value: number | string;
  max?: number;
  icon: ReactNode;
  color: string;
}

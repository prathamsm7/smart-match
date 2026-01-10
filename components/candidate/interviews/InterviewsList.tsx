"use client";

import { InterviewCard } from "./InterviewCard";
import type { InterviewItem } from "./types";

interface InterviewsListProps {
  interviews: InterviewItem[];
  onInterviewUpdate?: () => void;
}

export function InterviewsList({ interviews, onInterviewUpdate }: InterviewsListProps) {
  return (
    <div className="grid gap-4">
      {interviews.map((interview) => (
        <InterviewCard 
          key={interview.id} 
          interview={interview} 
          onUpdate={onInterviewUpdate}
        />
      ))}
    </div>
  );
}



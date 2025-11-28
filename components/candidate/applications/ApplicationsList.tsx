"use client";

import { ApplicationCard } from "./ApplicationCard";
import type { ApplicationItem } from "./types";

interface ApplicationsListProps {
  applications: ApplicationItem[];
}

export function ApplicationsList({ applications }: ApplicationsListProps) {
  return (
    <div className="grid gap-4">
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} />
      ))}
    </div>
  );
}

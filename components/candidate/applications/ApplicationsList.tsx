"use client";

import { useState } from "react";
import { ApplicationCard } from "./ApplicationCard";
import type { ApplicationItem } from "./types";

interface ApplicationsListProps {
  applications: ApplicationItem[];
  onApplicationUpdate?: () => void;
}

export function ApplicationsList({ applications, onApplicationUpdate }: ApplicationsListProps) {
  function handleWithdraw(applicationId: string) {
    // Remove the withdrawn application from the list or refresh
    if (onApplicationUpdate) {
      onApplicationUpdate();
    }
  }

  return (
    <div className="grid gap-4">
      {applications.map((application) => (
        <ApplicationCard 
          key={application.id} 
          application={application} 
          onWithdraw={handleWithdraw}
        />
      ))}
    </div>
  );
}

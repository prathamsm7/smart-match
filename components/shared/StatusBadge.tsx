"use client";

export type ApplicationStatus = 
  | 'SUBMITTED' 
  | 'VIEWED' 
  | 'SHORTLISTED' 
  | 'INTERVIEW' 
  | 'REJECTED' 
  | 'HIRED' 
  | 'WITHDRAWN';

export interface StatusConfig {
  label: string;
  className: string;
}

export function getStatusConfig(status: string): StatusConfig {
  const statusConfig: Record<string, StatusConfig> = {
    SUBMITTED: {
      label: 'Submitted',
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    VIEWED: {
      label: 'Viewed',
      className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    SHORTLISTED: {
      label: 'Shortlisted',
      className: 'bg-green-500/10 text-green-400 border-green-500/20',
    },
    INTERVIEW: {
      label: 'Interview',
      className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    REJECTED: {
      label: 'Rejected',
      className: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
    HIRED: {
      label: 'Hired',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    WITHDRAWN: {
      label: 'Withdrawn',
      className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    },
  };

  return statusConfig[status] || statusConfig.SUBMITTED;
}

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <div className={`inline-flex items-center rounded-full font-medium border ${config.className} ${sizeClasses[size]}`}>
      {config.label}
    </div>
  );
}


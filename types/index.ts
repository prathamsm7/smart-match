export interface Job {
    id: string;
    title: string;
    employerName: string | null;
    description: string | null;
    location: string | null;
    salary: string | null;
    employmentType: string | null;
    applyLink: string | null;
    requirements: any;
    responsibilities: any;
    createdAt: string;
    _count: {
        applications: number;
    };
}

export interface Candidate {
    name: string;
    email: string;
    phone: string | null;
    city: string | null;
    experience: number;
    skills: string[];
    summary: string;
    languages: string[];
    education: any[];
    experience_details: any[];
    socialLinks: any[];
    softSkills: string[];
    categorizedSkills: any;
}

export interface Application {
    id: string;
    appliedDate: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    candidate: Candidate;
    matchScore?: number;
    status: 'SUBMITTED' | 'VIEWED' | 'SHORTLISTED' | 'INTERVIEW' | 'REJECTED' | 'HIRED' | 'WITHDRAWN';
    statusUpdatedAt?: string;
    coverLetter?: {
        id: string;
        text: string;
        isEdited: boolean;
    } | null;
}

export interface JobWithApplications extends Job {
    applications?: Application[];
}

export interface Resume {
    name: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    skills: string[];
    social: string[];
    categorizedSkills?: {
        languages: string[];
        frameworks: string[];
        ai: string[];
        databases: string[];
        tools: string[];
        other: string[];
    };
    experience: Array<{
        title: string;
        company: string;
        startDate: string;
        endDate: string;
        location: string;
        description: string;
    }>;
    projects: Array<{
        name: string;
        description: string;
    }>;
    languages: string[];
    softSkills?: string[];
    totalExperienceYears: number;
}
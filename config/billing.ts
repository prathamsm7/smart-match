export type FeatureKey =
    | 'ats_analysis'
    | 'job_match'
    | 'interview'
    | 'application'
    | 'resume_upload'
    | 'cover_letter'
    | 'job_posting'
    | 'interview_report_view';

// ─── CANDIDATE CONFIG ──────────────────────────────────
export const FREE_CANDIDATE_LIMITS: Record<FeatureKey, number> = {
    resume_upload: 1,
    ats_analysis: 10,
    job_match: 15,
    interview: 1,
    application: 5,
    cover_letter: 5,
    job_posting: 0,
    interview_report_view: 0,
};

export const FREE_CANDIDATE_FEATURES = [
    { text: '1 resume upload', included: true },
    { text: '10 ATS analyses/month', included: true },
    { text: '15 job matches/month', included: true },
    { text: 'Unlimited cover letters', included: true },
    { text: '1 AI interview/month', included: true },
    { text: '5 applications/month', included: true },
];

export const PRO_CANDIDATE_FEATURES = [
    { text: 'Unlimited resume uploads', included: true },
    { text: 'Unlimited ATS analyses', included: true },
    { text: 'Unlimited job matches', included: true },
    { text: 'Unlimited cover letters', included: true },
    { text: '10 AI interviews/month', included: true },
    { text: 'Unlimited applications', included: true },
    { text: 'Priority support', included: true },
];

// ─── RECRUITER CONFIG ──────────────────────────────────
export const FREE_RECRUITER_LIMITS: Record<FeatureKey, number> = {
    resume_upload: 0,
    ats_analysis: 0,
    job_match: 0,
    interview: 0,
    application: 0,
    cover_letter: 0,
    job_posting: 1,
    interview_report_view: 0,
};

export const GROWTH_RECRUITER_LIMITS: Record<FeatureKey, number> = {
    resume_upload: 0,
    ats_analysis: 0,
    job_match: 0,
    interview: 0,
    application: 0,
    cover_letter: 0,
    job_posting: 10,
    interview_report_view: 10,
};

export const PRO_RECRUITER_LIMITS: Record<FeatureKey, number> = {
    resume_upload: 0,
    ats_analysis: 0,
    job_match: 0,
    interview: 0,
    application: 0,
    cover_letter: 0,
    job_posting: -1, // Unlimited
    interview_report_view: -1,
};

export const FREE_RECRUITER_FEATURES = [
    { text: '1 active job posting', included: true },
    { text: 'Limited candidates per job (20-30)', included: true },
    { text: 'Basic candidate tracking', included: true },
    { text: 'Basic resume view (no AI score)', included: true },
    { text: 'No AI interview reports', included: false },
    { text: 'No advanced filters', included: false },
];

export const GROWTH_RECRUITER_FEATURES = [
    { text: 'Up to 10 active job postings', included: true },
    { text: 'AI candidate match score', included: true },
    { text: 'Resume ATS score', included: true },
    { text: 'Basic shortlist system & kanban pipeline', included: true },
    { text: 'Interview scheduling', included: true },
    { text: 'Limited AI interview reports (10/month)', included: true },
    { text: 'Email notifications', included: true },
];

export const PRO_RECRUITER_FEATURES = [
    { text: 'Unlimited job postings', included: true },
    { text: 'Unlimited candidates', included: true },
    { text: 'Advanced AI match scoring', included: true },
    { text: 'AI interview (live + report)', included: true },
    { text: 'Bulk candidate filtering', included: true },
    { text: 'Resume ranking automation', included: true },
    { text: 'Collaboration (multiple recruiters)', included: true },
    { text: 'Analytics dashboard & Priority support', included: true },
];

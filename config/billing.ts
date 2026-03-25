export type FeatureKey =
    | 'ats_analysis'
    | 'job_match'
    | 'interview'
    | 'application'
    | 'resume_upload'
    | 'cover_letter';

// ─── Default free tier limits (fallback if no Plan record) ──
export const FREE_LIMITS: Record<FeatureKey, number> = {
    resume_upload: 1,
    ats_analysis: 10,
    job_match: 15,
    interview: 1,
    application: 5,
    cover_letter: 5,
};

export const FREE_FEATURES = [
    { text: '1 resume upload', included: true },
    { text: '10 ATS analyses/month', included: true },
    { text: '15 job matches/month', included: true },
    { text: 'Unlimited cover letters', included: true },
    { text: '1 AI interview/month', included: true },
    { text: '5 applications/month', included: true },
];

export const PRO_FEATURES = [
    { text: 'Unlimited resume uploads', included: true },
    { text: 'Unlimited ATS analyses', included: true },
    { text: 'Unlimited job matches', included: true },
    { text: 'Unlimited cover letters', included: true },
    { text: '10 AI interviews/month', included: true },
    { text: 'Unlimited applications', included: true },
    { text: 'Priority support', included: true },
];

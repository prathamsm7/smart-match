import redisClient from '@/lib/redisClient';
import { explainMatchAndSkillGap } from '@/lib/agents';

export type SkillGapData = {
    matchedSkills: string[];
    missingSkills: string[];
    matchReason: string;
};

type JobForMatching = {
    title?: string | null;
    description?: string | null;
    requirements?: string | null;
    responsibilities?: string | null;
    employerName?: string | null;
};

function fromSnapshot(snapshot: Record<string, unknown>): SkillGapData | null {
    const matched = snapshot.matchedSkills;
    const missing = snapshot.missingSkills;
    if (!Array.isArray(matched) && !Array.isArray(missing)) return null;

    return {
        matchedSkills: Array.isArray(matched) ? matched : [],
        missingSkills: Array.isArray(missing) ? missing : [],
        matchReason: typeof snapshot.matchReason === 'string' ? snapshot.matchReason : '',
    };
}

async function fromMatchCache(vectorId: string, jobId: string): Promise<SkillGapData | null> {
    const cached = await redisClient.get(`match:${vectorId}:${jobId}`);
    if (!cached) return null;

    const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
    return {
        matchedSkills: parsed.matchedSkills ?? [],
        missingSkills: parsed.missingSkills ?? [],
        matchReason: parsed.matchReason ?? '',
    };
}

function buildJobPayload(job: JobForMatching) {
    return {
        jobTitle: job.title ?? '',
        jobDescription: job.description ?? '',
        jobRequirements: job.requirements ?? '',
        jobResponsibilities: job.responsibilities ?? '',
        employerName: job.employerName ?? '',
    };
}

/** Resolve skill gap from snapshot, Redis match cache, or LLM analysis. */
export async function resolveApplicationSkillGap(
    snapshot: Record<string, unknown>,
    resumeData: Record<string, unknown>,
    job: JobForMatching,
    vectorId?: string | null,
    jobId?: string,
    options?: { allowLlm?: boolean }
): Promise<SkillGapData> {
    const fromSnap = fromSnapshot(snapshot);
    if (fromSnap && (fromSnap.matchedSkills.length > 0 || fromSnap.missingSkills.length > 0 || fromSnap.matchReason)) {
        return fromSnap;
    }

    if (vectorId && jobId) {
        const cached = await fromMatchCache(vectorId, jobId);
        if (cached) return cached;
    }

    if (options?.allowLlm === false) {
        return { matchedSkills: [], missingSkills: [], matchReason: '' };
    }

    const reasoning = await explainMatchAndSkillGap(resumeData, buildJobPayload(job));
    return {
        matchedSkills: reasoning.matchedSkills ?? [],
        missingSkills: reasoning.missingSkills ?? [],
        matchReason: reasoning.matchReason ?? '',
    };
}

export function skillGapToSnapshotFields(data: SkillGapData): Record<string, unknown> {
    return {
        matchedSkills: data.matchedSkills,
        missingSkills: data.missingSkills,
        matchReason: data.matchReason,
    };
}

import redisClient from './redisClient';
import { prisma } from './prisma.js';
import { qdrantClient } from './clients';
import {
    blendVectors,
    embedProfile,
    embedQuery,
    generateCandidateProfile,
    rephraseSearchQuery,
    rerankJobsWithAI,
    type CandidateProfile,
    type RerankDimensions,
} from './candidateProfile';
import type { JobSearchMode, JobSearchParams } from './jobSearch.types';

const RETRIEVAL_LIMIT = 30;
const RESULT_LIMIT = 20;

type JobRow = {
    id: string;
    title: string;
    employerName: string | null;
    location: string | null;
    description: string | null;
    applyLink: string | null;
    employmentType: string | null;
    salary: string | null;
    requirements: string | null;
    responsibilities: string | null;
};

async function getOrCreateProfile(resumeId: string, resumeData: Record<string, unknown>): Promise<CandidateProfile> {
    if (resumeData.candidateProfile) {
        return resumeData.candidateProfile as CandidateProfile;
    }
    const profile = await generateCandidateProfile(resumeData);
    resumeData.candidateProfile = profile;
    await qdrantClient.setPayload('resumes', {
        points: [resumeId],
        payload: { candidateProfile: profile },
    });
    return profile;
}

async function loadResumeContext(resumeId: string) {
    const cacheKey = `resumeData:${resumeId}`;
    const cached = await redisClient.get(cacheKey);

    let resumeData: Record<string, unknown>;
    if (cached) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        resumeData = parsed.resumeData || parsed;
    } else {
        const result = await qdrantClient.retrieve('resumes', {
            ids: [resumeId],
            with_payload: true,
            with_vector: true,
        });
        if (!result?.length) throw new Error(`Resume not found: ${resumeId}`);
        resumeData = { ...(result[0].payload as Record<string, unknown>) };
    }

    const profile = await getOrCreateProfile(resumeId, resumeData);
    let profileVector: number[] | undefined;

    if (cached) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        profileVector = parsed.profileVector;
    }

    if (!profileVector) {
        profileVector = await embedProfile(profile);
    }

    await redisClient.set(
        cacheKey,
        JSON.stringify({ resumeData, profileVector, candidateProfile: profile }),
        { ex: 60 * 60 }
    );

    return { profile, profileVector };
}

function formatResult(
    job: JobRow,
    vectorScore: number,
    matchScore: number,
    matchReason: string,
    dimensions?: RerankDimensions
) {
    return {
        id: job.id,
        jobId: job.id,
        jobTitle: job.title,
        employerName: job.employerName,
        jobLocation: job.location,
        jobDescription: job.description,
        jobApplyLink: job.applyLink,
        jobEmploymentType: job.employmentType,
        jobSalary: job.salary,
        jobRequirements: job.requirements,
        jobResponsibilities: job.responsibilities,
        vectorScore: Math.round(vectorScore * 100),
        matchScore,
        matchReason,
        dimensions,
    };
}

export async function searchJobsForResume(resumeId: string, params: JobSearchParams = {}) {
    const mode: JobSearchMode = params.mode || 'profile';
    const query = params.query?.trim();

    if ((mode === 'query' || mode === 'hybrid') && !query) {
        throw new Error('A search query is required for query and hybrid modes');
    }

    const { profile, profileVector } = await loadResumeContext(resumeId);

    let searchVector = profileVector;
    let rephrasedQuery: string | undefined;

    if (query && mode !== 'profile') {
        rephrasedQuery = await rephraseSearchQuery(query);
        const queryVector = await embedQuery(rephrasedQuery);
        searchVector = mode === 'query' ? queryVector : blendVectors(profileVector, queryVector, 0.5);
    }

    const matches = await qdrantClient.search('jobs', {
        vector: searchVector,
        limit: RETRIEVAL_LIMIT,
        with_payload: true,
        with_vector: false,
        score_threshold: 0.45,
    });

    if (!matches?.length) return [];

    const vectorScores: Record<string, number> = {};
    const jobIds: string[] = [];
    matches.forEach((m: any) => {
        const id = m.payload?.id;
        if (id) {
            jobIds.push(id);
            vectorScores[id] = m.score;
        }
    });

    const jobs = await prisma.job.findMany({ where: { id: { in: jobIds } } }) as JobRow[];

    const rankings = await rerankJobsWithAI(profile, jobs, {
        mode,
        originalQuery: query,
        rephrasedQuery,
        vectorScores,
    });

    const jobMap = new Map(jobs.map((j) => [j.id, j]));

    // Preserve reranker order (includes deterministic tie-breaks).
    return rankings
        .slice(0, RESULT_LIMIT)
        .map((rank) => {
            const job = jobMap.get(rank.jobId);
            if (!job) return null;
            const vs = vectorScores[job.id] || 0;
            return formatResult(job, vs, rank.matchScore, rank.matchReason, rank.dimensions);
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
}

export async function buildProfileForResume(resumeData: Record<string, unknown>) {
    const profile = await generateCandidateProfile(resumeData);
    const profileVector = await embedProfile(profile);
    return { profile, profileVector };
}

export type JobSearchMode = 'profile' | 'query' | 'hybrid';

export interface JobSearchParams {
    mode?: JobSearchMode;
    query?: string;
}

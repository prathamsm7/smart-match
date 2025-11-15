
// ✅ Helper: Normalize years of experience to 0–1 score
export function normalizeExperienceScore(totalYears) {
    if (totalYears < 1) return 0.3;
    if (totalYears < 2) return 0.5;
    if (totalYears < 4) return 0.7;
    if (totalYears < 6) return 0.9;
    return 1.0;
}


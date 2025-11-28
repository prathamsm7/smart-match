

// ✅ Helper: Normalize years of experience to 0–1 score
export function normalizeExperienceScore(totalYears: number) {
  if (totalYears < 1) return 0.3;
  if (totalYears < 2) return 0.5;
  if (totalYears < 4) return 0.7;
  if (totalYears < 6) return 0.9;
  return 1.0;
}

// Function to parse description into bullet points
export function parseDescription(description: string): string[] {
  // Check if already formatted as bullets
  if (description.includes('•') || description.includes('-')) {
    return description.split(/\n|•|-/).filter(line => line.trim().length > 0).map(line => line.trim().replace(/^[•\-]\s*/, ''));
  }
  // Split by sentences and format
  return description.split(/[.!?]+/).filter(s => s.trim().length > 0).map(s => s.trim() + '.');
}
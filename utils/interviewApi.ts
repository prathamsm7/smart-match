/**
 * Interview API utility functions
 * Handles fetching interview data for the live interview UI
 */

export async function fetchInterviewData(interviewId?: string) {
  if (!interviewId) {
    throw new Error('Interview ID is required');
  }

  try {
    const response = await fetch(`/api/interview/${interviewId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch interview data');
    }

    if (!data.success || !data.interview) {
      throw new Error('Invalid interview data received');
    }

    const interview = data.interview;
    
    // Extract user data from the application snapshot
    const snapshot = interview.application?.snapshot || {};
    const userData = {
      id: interview.userId,
      name: snapshot.name || 'Unknown',
      email: snapshot.email || 'Unknown',
      phone: snapshot.phone || null,
      location: snapshot.location || null,
      experience: snapshot.experience || [],
      education: snapshot.education || [],
      skills: snapshot.skills || [],
      summary: snapshot.summary || null,
    };

    // Extract job data
    const job = interview.application?.job || {};
    const jobData = {
      id: job.id || null,
      title: job.title || 'Unknown Position',
      employerName: job.employerName || 'Unknown Company',
      description: job.description || null,
      requirements: job.requirements || null,
      location: job.location || null,
      salary: job.salary || null,
      employmentType: job.employmentType || null,
      responsibilities: job.responsibilities || null,
    };

    return {
      userData,
      jobData,
      interview: {
        id: interview.id,
        status: interview.status,
        startedAt: interview.startedAt,
        completedAt: interview.completedAt,
        createdAt: interview.createdAt,
      },
    };
  } catch (error: any) {
    console.error('Error fetching interview data:', error);
    throw error;
  }
}

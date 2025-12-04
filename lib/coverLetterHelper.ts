import { openaiClient } from '@/lib/clients';

interface GenerateCoverLetterParams {
  resumeData: {
    name: string;
    email: string;
    skills: string[];
    experience: any[];
    summary: string;
    totalExperienceYears?: number;
  };
  jobData: {
    title: string;
    company: string;
    description: string;
    requirements?: any;
  };
}

export async function generateCoverLetter(
  params: GenerateCoverLetterParams
): Promise<string> {
  const { resumeData, jobData } = params;

  // Build experience summary
  const experienceSummary = resumeData.experience
    ?.map((exp: any) => `${exp.title || exp.role} at ${exp.company || 'N/A'}: ${exp.description || ''}`)
    .join('\n') || 'No experience listed';

  // Format requirements if available
  let requirementsText = '';
  if (jobData.requirements) {
    if (Array.isArray(jobData.requirements)) {
      requirementsText = jobData.requirements
        .map((r: any) => (typeof r === 'string' ? r : r.requirement || ''))
        .filter(Boolean)
        .join(', ');
    } else if (typeof jobData.requirements === 'object') {
      requirementsText = JSON.stringify(jobData.requirements);
    } else {
      requirementsText = String(jobData.requirements);
    }
  }

  // Build the prompt
  const prompt = `You are a professional career coach helping a candidate write a compelling cover letter.

Candidate Information:
- Name: ${resumeData.name || 'Candidate'}
- Skills: ${resumeData.skills?.join(', ') || ''}
- Experience: ${experienceSummary}
- Summary: ${resumeData.summary || ''}
- Total Experience: ${resumeData.totalExperienceYears || 0} years

Job Information:
- Position: ${jobData.title || ''}
- Company: ${jobData.company || ''}
- Description: ${jobData.description || ''}
${requirementsText ? `- Requirements: ${requirementsText}` : ''}

Instructions:
1. Write a concise, professional cover letter (2-3 paragraphs, maximum 200 words)
2. CRITICAL FORMAT: Start with exactly this structure:
   Line 1: "Dear Hiring Manager,"
   Line 2: (blank line)
   Line 3: "${resumeData.name || 'Candidate'}"
   Line 4: (blank line)
   Line 5: Start body paragraphs
3. First paragraph: Express interest in the ${jobData.title || 'position'} at ${jobData.company || 'company'} and briefly mention why you're a good fit (2-3 sentences)
4. Second paragraph: Highlight 1-2 most relevant skills/experiences that match the job requirements (2-3 sentences)
5. Optional third paragraph: Brief closing expressing enthusiasm (1-2 sentences)
6. Keep tone professional and engaging
7. Use specific examples from the candidate's experience
8. STRICTLY FORBIDDEN - DO NOT INCLUDE:
   - Sender's address, email, phone number, contact information
   - Recipient's address or company address
   - Date
   - Any placeholders like [Company Name], [Your Name], [Your Address]
   - Signature lines or "Sincerely," closings
   - Any formatting that looks like a traditional business letter
9. Output ONLY: "Dear Hiring Manager," + blank line + candidate name + blank line + body paragraphs
10. Keep it concise - maximum 200 words total (very short and focused)

Format as plain text (no markdown, no HTML).`;

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: "system",
          content: "You are an expert career coach. Always follow instructions with exact formatting."
        },
        {
          role: "user",
          content: prompt.trim()
        }
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const coverLetter = response.choices[0]?.message?.content?.trim() || '';

    if (!coverLetter) {
      throw new Error('Failed to generate cover letter');
    }

    return coverLetter;
  } catch (error: any) {
    console.error('Error generating cover letter:', error);
    throw new Error(`Failed to generate cover letter: ${error.message}`);
  }
}


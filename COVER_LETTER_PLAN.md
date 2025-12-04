# AI Cover Letter Generation - Implementation Plan (SIMPLIFIED)

## Overview
Add AI-powered cover letter generation when users apply for jobs. The cover letter will be personalized based on the candidate's resume and the job description.

## Simplified Approach
- Generate before application submission
- Preview and edit option
- Regenerate with rate limiting (3-5 per job)
- Use prompt variations for regeneration (2-3 different prompts)

## Current Flow Analysis

### Current Application Process:
1. User views job matches in `JobMatchesView`
2. User clicks "Apply Now" in `JobDetailsPanel`
3. `handleApplyNow()` calls `applicationsService.createApplication()`
4. API endpoint `/api/applications` (POST) creates the application
5. Application is stored with resume snapshot

### Available Data:
- **Resume Data**: name, email, skills, experience, summary, languages, education
- **Job Data**: title, company, description, requirements, responsibilities
- **Match Score**: Pre-computed similarity score

## Implementation Plan

### Phase 1: Database Schema Updates (SIMPLIFIED)

**File**: `prisma/schema.prisma`

**Create Separate CoverLetter Model** (simplified for now):
```prisma
model CoverLetter {
  id                    String   @id @default(uuid())
  applicationId         String?  // Link to application (nullable for drafts)
  userId                String   // User who owns this cover letter
  jobId                 String   // Job this cover letter is for (for rate limiting)
  
  // Content
  generatedText         String   // AI-generated original text
  finalText             String?  // User-edited final version (null if not edited)
  isEdited              Boolean  @default(false)
  
  // Generation Metadata
  promptVersion         String   @default("v1") // Which prompt variation was used
  regenerationCount     Int      @default(0) // How many times regenerated for this job
  
  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  user                  User     @relation(fields: [userId], references: [id])
  application           JobApplication? @relation(fields: [applicationId], references: [id])
  
  @@index([userId])
  @@index([jobId])
  @@index([applicationId])
}

model JobApplication {
  // ... existing fields
  coverLetterId         String?  @unique // Reference to submitted cover letter
  coverLetter           CoverLetter? @relation(fields: [coverLetterId], references: [id])
}

model User {
  // ... existing fields
  coverLetters          CoverLetter[]
}
```

**Key Features**:
- Store generated and edited text
- Track regeneration count per job (for rate limiting)
- Track prompt version used
- Link to application when submitted

**Migration**: Create migration for new model and relation

---

### Phase 2: AI Cover Letter Generation Service (SIMPLIFIED)

**New File**: `lib/services/coverLetter.service.ts`

**Functions**:

1. **`generateCoverLetter(resumeData, jobData, userId, jobId)`**
   - Generate new cover letter
   - Store in database
   - Return cover letter ID and text
   - Use prompt v1 (first variation)

2. **`regenerateCoverLetter(coverLetterId, userId, jobId)`**
   - Check rate limit (max 3-5 per job)
   - Generate new version with different prompt variation
   - Increment regeneration count
   - Return new cover letter text

3. **`getCoverLetter(coverLetterId)`**
   - Fetch cover letter with metadata

4. **`updateCoverLetter(coverLetterId, finalText)`**
   - Save user edits
   - Mark as edited

5. **`checkRateLimit(userId, jobId)`**
   - Check if user can regenerate (max 3-5 per job)
   - Return boolean

**Inputs**:
- Resume: name, email, skills, experience, summary
- Job: title, company, description, requirements

**AI Prompt Strategy**:
1. Use GPT-4o-mini (same as other AI features)
2. **3 Prompt Variations**:
   - `v1`: Professional, formal tone, highlights skills
   - `v2`: Enthusiastic tone, emphasizes achievements
   - `v3`: Results-focused, metrics-heavy, quantifiable outcomes
3. **Rotation**: Use v1 for first generation, v2 for first regeneration, v3 for second, then cycle

**Prompt Selection Logic**:
```javascript
// First generation: v1
// First regeneration: v2  
// Second regeneration: v3
// Third regeneration: v1 (cycle back)
promptVersion = (regenerationCount % 3) + 1
```

**Output**: 
- Cover letter text (string)
- Cover letter ID (for tracking)

**Error Handling**: 
- Fallback to generic template if AI fails
- Log errors for debugging

---

### Phase 3: API Endpoints (SIMPLIFIED)

**New File**: `app/api/cover-letters/route.ts`
- `POST /api/cover-letters` - Generate new cover letter (before application)
  - Body: `{ resumeId, jobId, jobTitle, company, description, requirements }`
  - Returns: `{ id, generatedText }`

**New File**: `app/api/cover-letters/[id]/route.ts`
- `GET /api/cover-letters/[id]` - Get cover letter
- `PATCH /api/cover-letters/[id]` - Update cover letter (user edits)
  - Body: `{ finalText }`
- `POST /api/cover-letters/[id]/regenerate` - Regenerate cover letter
  - Checks rate limit
  - Returns: `{ id, generatedText, regenerationCount, canRegenerate }`

---

### Phase 4: UI Components (SIMPLIFIED)

**Flow**: Generate → Preview → Edit → Submit

**Components to Create/Update**:

1. **`components/candidate/job-matches/CoverLetterSection.tsx`** (New)
   - Checkbox: "Include AI-generated cover letter"
   - When checked: Generate cover letter
   - Show preview with edit option
   - "Regenerate" button (with rate limit indicator)
   - Textarea for editing
   - Loading states

2. **`components/candidate/job-matches/JobDetailsPanel.tsx`** (Update)
   - Add CoverLetterSection before "Apply Now" button
   - Pass cover letter data to application creation

3. **Update**: `components/candidate/JobMatchesView.tsx`
   - Add state for cover letter
   - Handle cover letter generation
   - Pass coverLetterId to application creation

---

### Phase 5: Integration Points

**Update**: `app/api/applications/route.ts` (POST)
- Add optional `coverLetterId` in request body
- Link submitted cover letter to application
- Update CoverLetter.applicationId when application is created

**Update**: `lib/services/applications.service.ts`
- Add `coverLetterId` parameter to `createApplication()`
- Pass coverLetterId in request body

**New**: `lib/services/coverLetter.service.ts`
- `generateCoverLetter()` - Create new cover letter
- `getCoverLetter(id)` - Fetch cover letter
- `updateCoverLetter(id, text)` - Save user edits
- `regenerateCoverLetter(id)` - Generate new version (with rate limit check)
- `checkRateLimit(userId, jobId)` - Check if can regenerate

**Update**: `components/candidate/JobMatchesView.tsx`
- Add state for cover letter
- Handle cover letter generation
- Pass coverLetterId to application creation

---

## Technical Details

### AI Prompt Templates (3 Variations)

**Prompt v1 - Professional & Formal**:
```
You are a professional career coach helping a candidate write a compelling cover letter.

Candidate Information:
- Name: {name}
- Skills: {skills}
- Experience: {experience_summary}
- Summary: {resume_summary}

Job Information:
- Position: {job_title}
- Company: {company}
- Description: {job_description}
- Requirements: {job_requirements}

Instructions:
1. Write a professional, engaging cover letter (3-4 paragraphs)
2. Start with a strong opening that shows enthusiasm
3. Highlight 2-3 most relevant skills/experiences from the candidate's background
4. Connect candidate's experience to specific job requirements
5. End with a call to action expressing interest
6. Keep tone professional and formal
7. Use specific examples from the candidate's experience
8. Do NOT include placeholders like [Company Name] or [Your Name]
9. Keep it under 400 words

Format as plain text (no markdown, no HTML).
```

**Prompt v2 - Enthusiastic & Achievement-Focused**:
```
[Same structure as v1, but with these changes:]
- Tone: More enthusiastic and energetic
- Emphasis: Focus on achievements and accomplishments
- Opening: More dynamic and engaging
- Examples: Highlight specific wins and successes
```

**Prompt v3 - Results-Focused & Metrics-Heavy**:
```
[Same structure as v1, but with these changes:]
- Tone: Results-oriented and data-driven
- Emphasis: Quantifiable achievements and metrics
- Examples: Include numbers, percentages, impact measurements
- Style: More concise, bullet-point friendly format
```

### Error Handling Strategy

1. **AI Generation Fails**:
   - Show error message to user
   - Offer to retry
   - Option to write manually

2. **Timeout**:
   - Set 30-second timeout for AI generation
   - Show loading indicator
   - Allow cancellation

3. **Rate Limiting**:
   - Cache generated cover letters
   - Limit regeneration attempts

---

## User Experience Flow

### Scenario 1: Generate During Application
1. User clicks "Apply Now"
2. Modal appears: "Would you like to include an AI-generated cover letter?"
3. User selects "Yes, generate cover letter"
4. Loading: "Generating personalized cover letter..."
5. Preview shown with edit option
6. User can edit or proceed
7. Application submitted with cover letter

### Scenario 2: Generate After Application
1. User views their applications
2. Sees "Generate Cover Letter" button
3. Clicks button
4. Cover letter generated and stored
5. Can view/edit in application details

---

## Database Considerations (UPDATED)

### Storage Strategy: Separate CoverLetter Model ✅

**Why Separate Model?**:

1. **Learning & Improvement**:
   - Store ALL generated cover letters (even unused ones)
   - Track which versions/prompts perform best
   - Analyze user edits to improve prompts
   - Link outcomes (interviews, hires) to cover letter quality

2. **Analytics & Insights**:
   - Track regeneration patterns (users regenerate = prompt needs improvement)
   - User ratings and feedback
   - A/B testing different prompt versions
   - Industry-specific optimizations

3. **Data Structure**:
   - Store original generated text
   - Store final edited text (if user edits)
   - Track edit history (what users change)
   - Store generation parameters (prompt version, model, etc.)

4. **Performance**:
   - Cover letters can be long (text field)
   - Separate table = better query performance
   - Can archive old versions without affecting applications

5. **Future ML Training**:
   - Export cover letters + outcomes for fine-tuning
   - Build custom model based on successful patterns
   - Industry-specific models

**Relationship**:
- `JobApplication.coverLetterId` → `CoverLetter.id`
- One application can have one submitted cover letter
- But users can generate multiple drafts before submitting

---

## Performance Considerations

1. **Generation Time**: 
   - AI call takes 3-5 seconds
   - Show loading state
   - Consider async generation (generate after submission)

2. **Caching**:
   - Cache generated cover letters
   - Don't regenerate if already exists (unless user requests)

3. **Cost**:
   - GPT-4o-mini is cost-effective
   - ~500 tokens per generation
   - Estimate: $0.001 per cover letter

---

## Continuous Improvement System 🚀

### Overview
The system will continuously learn and improve by:
1. **Collecting Data**: All generations, edits, outcomes
2. **Analyzing Patterns**: What works, what doesn't
3. **Optimizing Prompts**: Update based on learnings
4. **A/B Testing**: Compare different approaches
5. **Measuring Success**: Track outcomes over time

### 1. Data Collection for Learning

**What We Track**:
- All generated cover letters (even unused)
- User edits (what they change = what's wrong)
- User ratings (1-5 stars)
- User feedback (text comments)
- Application outcomes (VIEWED → SHORTLISTED → INTERVIEW → HIRED)
- Regeneration patterns (if user regenerates, prompt needs work)

### 2. Analysis & Optimization

**Metrics to Analyze**:
- **Success Rate**: % of cover letters that lead to interviews
- **Edit Rate**: % of users who edit (high = needs improvement)
- **Regeneration Rate**: % of users who regenerate (high = prompt issues)
- **Outcome Correlation**: Which prompt versions lead to best outcomes
- **Industry Patterns**: What works for tech vs finance vs healthcare

**Improvement Loop**:
1. Generate cover letters with current prompt (v1)
2. Track outcomes and user behavior
3. Analyze: What works? What doesn't?
4. Update prompt based on learnings (v2)
5. A/B test new version
6. Repeat

### 3. A/B Testing Framework

**Implementation**:
- Generate 2-3 versions with different prompts
- Show user all versions
- Track which one they choose
- Track which one leads to better outcomes
- Optimize based on data

**Example**:
- Version A: Professional, formal tone
- Version B: Enthusiastic, energetic tone
- Version C: Results-focused, metrics-heavy
- Track which performs best per industry/role

### 4. User Feedback Loop

**Collect**:
- Rating after generation (1-5 stars)
- Optional feedback text
- Edit tracking (what they change)
- Outcome updates (when application status changes)

**Use**:
- Identify common issues
- Improve prompts
- Personalize based on user preferences

### 5. ML Training Data Export

**Future Enhancement**:
- Export successful cover letters + outcomes
- Fine-tune custom model
- Industry-specific models
- Role-specific models (entry-level vs senior)

---

## Future Enhancements

1. **Multiple Versions**: Generate 2-3 versions, let user pick (A/B testing)
2. **Tone Selection**: Professional, Casual, Enthusiastic (track which works best)
3. **Length Options**: Short (2 paragraphs), Medium (3-4), Long (5+)
4. **Industry Templates**: Pre-built templates per industry (learn from outcomes)
5. **Personalization**: Learn user preferences over time
6. **Success Prediction**: ML model predicts cover letter success before submission
7. **Auto-Optimization**: System automatically improves prompts based on outcomes

---

## Implementation Order

1. ✅ Database schema update
2. ✅ AI service function
3. ✅ API endpoint
4. ✅ UI component for generation
5. ✅ Integration with application flow
6. ✅ Testing and refinement

---

## Questions to Consider (UPDATED)

1. **When to generate?**
   - ✅ During application (recommended) - better UX
   - ✅ User choice (checkbox) - not automatic
   - ✅ Generate as draft first, submit when applying

2. **Editing capability?**
   - ✅ Full editing - track edits for learning
   - ✅ Version history - store all versions
   - ✅ Edit diff tracking - what users change

3. **Storage strategy?**
   - ✅ Always store - for learning and improvement
   - ✅ Separate model - better for analytics
   - ✅ Privacy: Users can delete their data

4. **Regeneration limits?**
   - ✅ Unlimited (for now) - collect more data
   - ✅ Track regeneration count - identify issues
   - ✅ Rate limiting: Consider if abuse occurs

5. **Outcome tracking?**
   - ✅ Automatic: Link to application status changes
   - ✅ Manual: User can update if status changes externally
   - ✅ Analytics: Use for improvement

---

## Implementation Order (UPDATED)

1. ✅ **Database Schema** - Create CoverLetter model with all tracking fields
2. ✅ **AI Service** - Generate with versioning and metadata storage
3. ✅ **API Endpoints** - CRUD + feedback + outcome tracking
4. ✅ **UI Components** - Generation, editing, preview
5. ✅ **Integration** - Link to application flow
6. ✅ **Analytics Dashboard** (Future) - View improvement metrics
7. ✅ **Auto-Optimization** (Future) - System improves prompts automatically

## Next Steps

1. ✅ Review and approve improved plan
2. ✅ Implement Phase 1 (Database with CoverLetter model)
3. ✅ Implement Phase 2 (AI Service with learning capabilities)
4. ✅ Implement Phase 3 (API with tracking endpoints)
5. ✅ Implement Phase 4 (UI components)
6. ✅ Implement Phase 5 (Outcome tracking integration)
7. ✅ Build analytics queries for improvement insights
8. ✅ Iterate based on collected data


# Smart Resume - AI-Powered Job Matching

A Next.js application for creating smart resumes and finding AI-powered job matches.

## Features

- 📄 **Resume Upload**: Upload PDF or paste resume text
- 🤖 **AI-Powered Parsing**: Automatically extract and structure resume data
- 🎯 **Smart Job Matching**: Find the best job matches based on skills and experience
- 📊 **Match Analysis**: Get detailed insights on why jobs match and how to improve

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the `smart_resume` directory:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key

# Upstash Redis (recommended - uses REST API, no connection management)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# OR use the traditional Redis URL (will be parsed automatically)
# REDIS_URL=rediss://default:token@host:6379
```

3. All required files are now self-contained in the `smart_resume` folder:
   - `lib/agents.ts` - Contains all agent logic and resume processing
   - `lib/redisClient.js` - Upstash Redis client (REST-based, perfect for serverless)
   - `lib/schema.js` - Resume schema definition
   - `lib/helpers.js` - Helper functions

**Note**: This app uses [Upstash Redis](https://upstash.com/docs/redis/quickstarts/nextjs-app-router) which is REST-based and doesn't require connection management, making it perfect for Next.js serverless environments.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
smart_resume/
├── app/
│   ├── api/
│   │   └── resume/
│   │       ├── upload/route.ts          # Upload resume endpoint
│   │       └── [id]/
│   │           ├── route.ts             # Get resume by ID
│   │           └── matches/route.ts     # Get job matches
│   ├── resume/
│   │   └── [id]/page.tsx                 # Resume view page
│   ├── layout.tsx                        # Root layout
│   └── page.tsx                          # Home page
├── lib/
│   ├── backend.ts                        # Backend utilities
│   ├── qdrant.ts                         # Qdrant client
│   └── redis.ts                           # Redis client
└── package.json
```

## Usage

1. **Upload Resume**: Go to the home page and either:
   - Paste your resume text in the textarea
   - Upload a PDF file
   - Click "Create Smart Resume"

2. **View Resume**: After uploading, you'll be redirected to the resume view page where you can:
   - See all extracted resume information
   - View skills, experience, projects, etc.

3. **Find Job Matches**: Click "Find Job Matches" to:
   - Get AI-powered job recommendations
   - See match scores and reasons
   - View matched and missing skills
   - Get improvement suggestions

## API Endpoints

- `POST /api/resume/upload` - Upload a resume (file or text)
- `GET /api/resume/[id]` - Get resume by ID
- `GET /api/resume/[id]/matches` - Get job matches for a resume


<!-- Job details extractor from given link -->
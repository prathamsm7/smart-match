import { PrismaClient } from '@prisma/client';
import { embedText } from '../lib/agents'; // To generate embeddings
import redisClient from '../lib/redisClient';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { qdrantClient } from '@/lib/clients';

dotenv.config({ path: '.env.local' });
dotenv.config();

const prisma = new PrismaClient();

function buildSearchableText(resume: any) {
  return [
    `Role: ${resume.preferredJob || ''}`,
    resume.summary,
    `Experience: ${resume.totalExperienceYears} years`,
    `Skills: ${resume.skills?.join(", ")}`,
    `Soft Skills: ${resume.softSkills?.join(", ")}`,
    resume.experience?.map((e: any) => `${e.title} at ${e.company}: ${e.description}`).join('\n'),
    resume.projects?.map((p: any) => `${p.name}: ${p.description} ${p.technologies?.join(", ")}`).join('\n')
  ].filter(Boolean).join('\n\n');
}

async function seed() {
  console.log("🌱 Starting Candidate Seeder...");

  const dataPath = path.join(process.cwd(), 'candidates.json');
  
  if (!fs.existsSync(dataPath)) {
      console.error(`❌ Error: candidates.json not found at ${dataPath}`);
      console.error("Please create candidates.json in the project root with an array of resume objects.");
      process.exit(1);
  }

  let candidatesData: any[];
  try {
      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      candidatesData = JSON.parse(fileContent);
  } catch (error) {
      console.error("❌ Error parsing candidates.json:", error);
      process.exit(1);
  }

  if (!Array.isArray(candidatesData)) {
      console.error("❌ Error: candidates.json must contain an array of resume objects.");
      process.exit(1);
  }

  console.log(`Found ${candidatesData.length} candidates to insert.\n`);

  for (const resumeData of candidatesData) {
    try {
      const name = resumeData.name || "Unknown Candidate";
      console.log(`Processing candidate: ${name}...`);
        
      // 1. Create User in PostgreSQL
      const randomId = crypto.randomUUID();
      const mockEmail = resumeData.email || `candidate_${randomId.substring(0, 8)}@example.com`;
      
      const user = await prisma.user.create({
        data: {
          id: randomId,
          email: mockEmail,
          name: name,
          role: "candidate",
        }
      });
      console.log(`✅ Created User: ${user.name} (${user.email})`);

      // 2. Embed Resume Text
      const textToEmbed = buildSearchableText(resumeData);
      const vector = await embedText(textToEmbed);

      const resumeId = crypto.randomUUID();

      // [NEW] Mirror manual upload process: Cache in Redis
      await redisClient.set(`resumeData:${resumeId}`, JSON.stringify({ resumeData, vector }), { ex: 7 * 24 * 60 * 60 });
      console.log(`✅ Cached Resume Data in Redis: ${resumeId}`);

      // 3. Save to Qdrant
      await qdrantClient.upsert("resumes", {
        points: [
          {
            id: resumeId,
            vector: vector,
            payload: {
                ...resumeData,
                userId: user.id,
                isPrimary: true
            },
          },
        ],
      });
      console.log(`✅ Uploaded Vector to Qdrant for Resume: ${resumeId}`);

      // 4. Save Resume to PostgreSQL
      await prisma.resume.create({
        data: {
          id: resumeId,
          userId: user.id,
          vectorId: resumeId,
          json: resumeData,
          isPrimary: true,
        }
      });
      console.log(`✅ Saved Resume to PostgreSQL (ID: ${resumeId})\n`);

    } catch (err) {
      console.error(`❌ Error seeding candidate ${resumeData.name}:`, err);
    }
  }

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed();

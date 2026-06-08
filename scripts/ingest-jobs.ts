import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { storeJob, JobData } from '../lib/agents';
import { prisma } from '../lib/prisma';

dotenv.config({ path: '.env.local' });
dotenv.config();

interface IngestOptions {
  filePath: string;
  postedBy?: string;
  dryRun: boolean;
}

function parseArgs(): IngestOptions {
  const args = process.argv.slice(2);
  let filePath = path.join(process.cwd(), 'jobs.json');
  let postedBy: string | undefined;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--posted-by') {
      postedBy = args[++i];
      if (!postedBy) {
        console.error('❌ --posted-by requires a user ID');
        process.exit(1);
      }
    } else if (arg === '--file') {
      filePath = args[++i];
      if (!filePath) {
        console.error('❌ --file requires a path');
        process.exit(1);
      }
    } else if (!arg.startsWith('-')) {
      filePath = arg;
    } else {
      console.error(`❌ Unknown argument: ${arg}`);
      process.exit(1);
    }
  }

  return { filePath: path.resolve(filePath), postedBy, dryRun };
}

function normalizeJob(raw: Record<string, unknown>): JobData {
  const { id: _id, ...rest } = raw;

  const normalizeField = (value: unknown): string | undefined => {
    if (value == null) return undefined;
    if (Array.isArray(value)) return value.join('\n');
    if (typeof value === 'string') return value;
    return String(value);
  };

  const title = rest.title;
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error('Each job must have a non-empty "title"');
  }

  return {
    title: title.trim(),
    employerName: typeof rest.employerName === 'string' ? rest.employerName : undefined,
    description: typeof rest.description === 'string' ? rest.description : undefined,
    requirements: normalizeField(rest.requirements),
    location: typeof rest.location === 'string' ? rest.location : undefined,
    salary: typeof rest.salary === 'string' ? rest.salary : undefined,
    employmentType: typeof rest.employmentType === 'string' ? rest.employmentType : undefined,
    applyLink: typeof rest.applyLink === 'string' ? rest.applyLink : undefined,
    responsibilities: normalizeField(rest.responsibilities),
    postedBy: typeof rest.postedBy === 'string' ? rest.postedBy : undefined,
  };
}

async function ingest() {
  const { filePath, postedBy, dryRun } = parseArgs();

  console.log('📥 Starting job ingestion...');
  console.log(`   File: ${filePath}`);
  if (postedBy) console.log(`   Posted by: ${postedBy}`);
  if (dryRun) console.log('   Mode: dry-run (validation only)\n');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Jobs file not found: ${filePath}`);
    console.error('Create jobs.json in the project root, or pass a path:');
    console.error('  npx tsx scripts/ingest-jobs.ts jobs.sample.json');
    process.exit(1);
  }

  let rawJobs: unknown;
  try {
    rawJobs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error('❌ Failed to parse jobs file:', error);
    process.exit(1);
  }

  if (!Array.isArray(rawJobs)) {
    console.error('❌ Jobs file must contain a JSON array of job objects');
    process.exit(1);
  }

  if (rawJobs.length === 0) {
    console.log('⚠️  No jobs found in file. Nothing to ingest.');
    process.exit(0);
  }

  if (postedBy) {
    const poster = await prisma.user.findUnique({ where: { id: postedBy } });
    if (!poster) {
      console.error(`❌ No user found with id "${postedBy}"`);
      process.exit(1);
    }
    console.log(`   Recruiter: ${poster.name ?? poster.email}\n`);
  }

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < rawJobs.length; i++) {
    const label = `[${i + 1}/${rawJobs.length}]`;
    try {
      const job = normalizeJob(rawJobs[i] as Record<string, unknown>);
      if (postedBy) job.postedBy = postedBy;

      console.log(`${label} ${job.title}${job.employerName ? ` @ ${job.employerName}` : ''}`);

      if (dryRun) {
        console.log('   ✓ Valid\n');
        successCount++;
        continue;
      }

      const jobId = await storeJob(job);
      console.log(`   ✅ Ingested (id: ${jobId})\n`);
      successCount++;
    } catch (error) {
      failedCount++;
      console.error(`${label} ❌ Failed:`, error instanceof Error ? error.message : error, '\n');
    }
  }

  console.log('─'.repeat(40));
  console.log(`Done: ${successCount} succeeded, ${failedCount} failed`);
  if (dryRun) console.log('(Dry run — no jobs were written)');
}

ingest()
  .catch((error) => {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

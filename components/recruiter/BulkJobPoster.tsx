"use client";

import { useState } from "react";
import { Upload, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface BulkJobPosterProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface JobData {
  id?: string;
  title: string;
  employerName?: string;
  description?: string;
  requirements?: string;
  location?: string;
  salary?: string;
  employmentType?: string;
  applyLink?: string | null;
  responsibilities?: string;
}

export function BulkJobPoster({ onSuccess, onCancel }: BulkJobPosterProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const defaultJobs = `[
  {
    "id": "uuid-job-1",
    "title": "Full-Stack Frontend Engineer (React.js, Next.js)",
    "employerName": "NovaStack Labs",
    "description": "NovaStack Labs is hiring a Full-Stack Frontend Engineer skilled in React.js, Next.js, TypeScript, and modern UI frameworks to build scalable customer-facing web applications. The ideal candidate will contribute to frontend architecture, REST API integration, and backend services using Node.js and Express.js. The role requires strong knowledge of rendering optimization, modular UI components, and secure design patterns. Exposure to vector databases, LLM APIs, and AI-powered workflows is preferred as we integrate intelligent automation features across our platform.",
    "requirements": "Proficiency in React.js, Next.js, JavaScript, and TypeScript. Experience building RESTful services with Node.js and Express.js. Familiarity with Tailwind CSS, Shadcn/UI, Git, GitHub, and Vercel deployments. Knowledge of MongoDB, MySQL, and vector databases. Understanding of GenAI, prompt engineering, and OpenAI APIs. Basic knowledge of Python backend utilities. Good foundation in Distributed Systems, System Design, and cloud concepts. Ability to write clean, secure, and well-structured code.",
    "location": "Hyderabad, India",
    "salary": "₹6,00,000 – ₹14,00,000 / year",
    "employmentType": "Full-time",
    "applyLink": null,
    "responsibilities": "Develop responsive UIs using React.js and Next.js. Build modular components and reusable design structures. Integrate backend APIs built with Node.js and Express.js. Optimize performance, rendering, and state management. Use Tailwind CSS and Shadcn/UI for design consistency. Work with MongoDB, MySQL, and vector DBs for structured and unstructured data flows. Support AI-enabled features using LLM APIs. Participate in Agile sprints, code reviews, and architecture discussions."
  },
  {
    "id": "uuid-job-2",
    "title": "Frontend Software Engineer (Next.js & TypeScript)",
    "employerName": "PixelCraft Systems",
    "description": "PixelCraft Systems is looking for a Frontend Software Engineer with strong expertise in Next.js, React.js, TypeScript, and scalable UI systems. The role includes building dynamic admin dashboards, optimizing UI latency, designing modular components, and integrating AI-based features. The engineer will collaborate closely with backend teams to develop secure, high-performance applications using Node.js, Express, and Python-based services.",
    "requirements": "Strong proficiency in React.js, Next.js, TypeScript, JavaScript, and modern frontend tools. Experience with REST APIs, Node.js, Express.js, and Python utilities. Familiarity with Tailwind CSS, Shadcn/UI, Git workflows, and CI/CD. Practical knowledge of MongoDB, MySQL, and vector database concepts. Understanding of GenAI, LLMs, and prompt engineering. Foundational skills in System Design, Cloud Computing, and Distributed Systems.",
    "location": "Bangalore, India",
    "salary": "₹7,00,000 – ₹16,00,000 / year",
    "employmentType": "Full-time",
    "applyLink": null,
    "responsibilities": "Build responsive, accessible UIs with Next.js and TypeScript. Implement performance optimizations and caching strategies. Work with backend services built in Node.js and Python. Use Tailwind CSS and Shadcn/UI to maintain visual consistency. Manage databases including MongoDB, MySQL, and vector DBs. Integrate LLM-based automation where required. Collaborate in Agile sprints and follow secure coding practices."
  }
]`;

  const handleLoadDefault = () => {
    setJsonInput(defaultJobs);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!jsonInput.trim()) {
      setError("Please provide JSON data");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setResults(null);

    try {
      // Parse JSON
      let jobs: JobData[];
      try {
        jobs = JSON.parse(jsonInput);
      } catch (parseError: any) {
        throw new Error(`Invalid JSON: ${parseError.message}`);
      }

      if (!Array.isArray(jobs)) {
        throw new Error("JSON must be an array of job objects");
      }

      if (jobs.length === 0) {
        throw new Error("Array cannot be empty");
      }

      // Post each job
      const errors: string[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        
        // Remove id field if present (we'll generate new ones)
        const { id, ...jobData } = job;

        // Ensure requirements and responsibilities are strings
        const normalizedJob = {
          ...jobData,
          requirements: typeof job.requirements === 'string' 
            ? job.requirements 
            : job.requirements ? JSON.stringify(job.requirements) : undefined,
          responsibilities: typeof job.responsibilities === 'string'
            ? job.responsibilities
            : job.responsibilities ? JSON.stringify(job.responsibilities) : undefined,
        };

        try {
          const response = await fetch('/api/jobs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(normalizedJob),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Failed to post job ${i + 1}`);
          }

          successCount++;
        } catch (jobError: any) {
          failedCount++;
          errors.push(`Job ${i + 1} (${job.title || 'Untitled'}): ${jobError.message}`);
        }
      }

      setResults({
        success: successCount,
        failed: failedCount,
        errors,
      });

      if (successCount > 0) {
        setSuccess(true);
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        setError(`All ${jobs.length} jobs failed to post. Check errors below.`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while posting jobs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Bulk Post Jobs (Testing)</h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {error && !results && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-400 font-semibold mb-1">Jobs posted successfully!</p>
              {results && (
                <p className="text-green-300 text-sm">
                  {results.success} job(s) posted, {results.failed} failed
                </p>
              )}
            </div>
          </div>
        )}

        {results && results.errors.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400 font-semibold mb-2">Errors:</p>
            <ul className="list-disc list-inside space-y-1 text-yellow-300 text-sm">
              {results.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                JSON Array of Jobs
              </label>
              <button
                onClick={handleLoadDefault}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Load Example Jobs
              </button>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setError(null);
                setSuccess(false);
                setResults(null);
              }}
              rows={15}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-mono text-sm"
              placeholder='[{"title": "Job Title", "employerName": "Company", ...}, ...]'
            />
            <p className="mt-2 text-xs text-gray-400">
              Paste a JSON array of job objects. Each job should have at least a "title" field.
            </p>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || !jsonInput.trim()}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Posting Jobs...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Post All Jobs</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


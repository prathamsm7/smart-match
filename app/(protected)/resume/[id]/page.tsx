'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, Share2, Mail, Phone, MapPin, Building2, Code, Lock, Star, ExternalLink, Briefcase } from 'lucide-react';
import { useSupabaseAuthSync } from '@/hooks/useSupabaseAuth';

interface Resume {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  social: string[];
  categorizedSkills?: {
    languages: string[];
    frameworks: string[];
    ai: string[];
    databases: string[];
    tools: string[];
    other: string[];
  };
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    location: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
  }>;
  languages: string[];
  softSkills?: string[];
  totalExperienceYears: number;
}

// Function to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Function to parse description into bullet points
function parseDescription(description: string): string[] {
  // Check if already formatted as bullets
  if (description.includes('•') || description.includes('-')) {
    return description.split(/\n|•|-/).filter(line => line.trim().length > 0).map(line => line.trim().replace(/^[•\-]\s*/, ''));
  }
  // Split by sentences and format
  return description.split(/[.!?]+/).filter(s => s.trim().length > 0).map(s => s.trim() + '.');
}

export default function ResumePage() {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.id as string;
  
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the hook for cross-tab auth synchronization (handles SIGNED_OUT)
  // Note: Authentication is handled by the (protected) layout, so we don't need useRequireAuth here
  useSupabaseAuthSync();

  useEffect(() => {
    if (resumeId) {
      fetchResume();
    }
  }, [resumeId]);

  async function fetchResume() {
    try {
      const res = await fetch(`/api/resume/${resumeId}`,{
        next: { revalidate: 900 }, // 10 minutes cache
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch resume');
      }
      
      setResume(data.resume);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFindMatches() {
    router.push(`/resume/${resumeId}/matches`);
  }

  // Show loading state while fetching resume
  // Note: Auth loading is handled by the (protected) layout
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Resume not found'}</p>
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 transition"
          >
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  // Use categorized skills from LLM, with fallback to empty object
  const skillCategories = resume.categorizedSkills || {
    languages: [],
    frameworks: [],
    ai: [],
    databases: [],
    tools: [],
    other: []
  };
  const initials = getInitials(resume.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 transition flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back to Home</span>
            </Link>
            <button
              onClick={handleFindMatches}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
            >
              Find Job Matches
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Sidebar */}
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg shadow-md p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-4">
                    <span className="text-4xl font-bold text-white">{initials}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white text-center mb-1">
                  {resume.name}
                </h1>
                  <p className="text-gray-400 text-sm mb-4">Full-Stack Developer</p>
                  
                  {/* Contact Info */}
                  <div className="w-full space-y-2 mb-4">
                    {resume.email && (
                      <div className="flex items-center space-x-2 text-gray-300 text-sm">
                        <Mail className="w-4 h-4 text-blue-400" />
                        <span className="truncate">{resume.email}</span>
                      </div>
                    )}
                    {resume.phone && (
                      <div className="flex items-center space-x-2 text-gray-300 text-sm">
                        <Phone className="w-4 h-4 text-blue-400" />
                        <span>{resume.phone}</span>
                      </div>
                    )}
                    {resume.location && (
                      <div className="flex items-center space-x-2 text-gray-300 text-sm">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span>{resume.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full flex gap-2">
                    <button className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Technical Skills */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                  <Code className="w-5 h-5 text-blue-400" />
                  <span>Technical Skills</span>
                </h2>
                <div className="space-y-4">
                  {skillCategories.languages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {skillCategories.languages.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-200 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {skillCategories.frameworks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Frameworks & Libraries</h3>
                      <div className="flex flex-wrap gap-2">
                        {skillCategories.frameworks.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-200 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {skillCategories.ai.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">AI & Machine Learning</h3>
                      <div className="flex flex-wrap gap-2">
                        {skillCategories.ai.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-200 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {skillCategories.databases.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Databases & Systems</h3>
                      <div className="flex flex-wrap gap-2">
                        {skillCategories.databases.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-200 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {skillCategories.tools.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Tools & Technologies</h3>
                      <div className="flex flex-wrap gap-2">
                        {skillCategories.tools.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 text-orange-200 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {skillCategories.other.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">Other Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {skillCategories.other.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-500/20 border border-gray-500/30 text-gray-300 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Soft Skills */}
              {resume.softSkills && resume.softSkills.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-blue-400" />
                    <span>Soft Skills</span>
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {resume.softSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-500/20 border border-gray-500/30 text-gray-300 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {resume.languages && resume.languages.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Star className="w-5 h-5 text-blue-400" />
                    <span>Languages</span>
                  </h2>
                  <div className="space-y-3">
                    {resume.languages.map((lang, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-gray-300">{lang}</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((dot) => (
                            <div
                              key={dot}
                              className={`w-2 h-2 rounded-full ${
                                dot <= 5 ? 'bg-blue-400' : 'bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Content - Right Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Professional Summary */}
              {resume.summary && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-white mb-3">
                    Professional Summary
                  </h2>
                  <p className="text-gray-300 leading-relaxed">
                    {resume.summary}
                  </p>
                </div>
              )}

              {/* Experience */}
              {resume.experience && resume.experience.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <span>Experience ({resume.totalExperienceYears?.toFixed(1)} years)</span>
                  </h2>
                  <div className="space-y-6">
                    {resume.experience.map((exp, idx) => {
                      const bullets = parseDescription(exp.description);
                      return (
                        <div key={idx} className="border-l-4 border-blue-500 pl-4">
                          <h3 className="text-lg font-semibold text-white">
                          {exp.title}
                        </h3>
                          <p className="text-blue-400 font-medium">
                          {exp.company}
                        </p>
                          <p className="text-sm text-gray-400 mb-2">
                          {exp.startDate} - {exp.endDate}
                          {exp.location && ` • ${exp.location}`}
                        </p>
                          <ul className="space-y-1 mt-2">
                            {bullets.map((bullet, bulletIdx) => (
                              <li key={bulletIdx} className="text-gray-300 text-sm flex items-start">
                                <span className="mr-2">•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Featured Projects */}
              {resume.projects && resume.projects.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-blue-400" />
                    <span>Featured Projects</span>
                  </h2>
                  <div className="space-y-4">
                    {resume.projects.map((project, idx) => {
                      // Extract technologies from description (simple extraction)
                      const techKeywords = ['React', 'Node.js', 'MongoDB', 'Next.js', 'Express', 'TypeScript', 'JavaScript', 'Python', 'OAuth', 'Clerk', 'Cloudinary'];
                      const technologies = techKeywords.filter(tech => 
                        project.description.toLowerCase().includes(tech.toLowerCase())
                      );
                      
                      return (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 relative group hover:border-blue-500/50 transition">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-white text-lg">{project.name}</h3>
                            <button className="opacity-0 group-hover:opacity-100 transition">
                              <ExternalLink className="w-4 h-4 text-blue-400" />
                            </button>
                          </div>
                          <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                          {project.description}
                        </p>
                          {technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                              {technologies.map((tech, techIdx) => (
                      <span
                                  key={techIdx}
                                  className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-200 rounded text-xs"
                      >
                                  {tech}
                      </span>
                    ))}
                  </div>
                          )}
                </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  FileText,
  Link as LinkIcon,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface JobPostingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any; // For editing existing jobs
}

export function JobPostingForm({ onSuccess, onCancel, initialData }: JobPostingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    employerName: initialData?.employerName || "",
    description: initialData?.description || "",
    location: initialData?.location || "",
    salary: initialData?.salary || "",
    employmentType: initialData?.employmentType || "",
    applyLink: initialData?.applyLink || "",
    requirements: initialData?.requirements 
      ? (Array.isArray(initialData.requirements) 
          ? initialData.requirements.join("\n") 
          : typeof initialData.requirements === 'object'
            ? JSON.stringify(initialData.requirements, null, 2)
            : String(initialData.requirements))
      : "",
    responsibilities: initialData?.responsibilities
      ? (Array.isArray(initialData.responsibilities)
          ? initialData.responsibilities.join("\n")
          : typeof initialData.responsibilities === 'object'
            ? JSON.stringify(initialData.responsibilities, null, 2)
            : String(initialData.responsibilities))
      : "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  };

  const parseRequirements = (text: string): string | null => {
    if (!text.trim()) return null;
    
    // Return as string - Prisma expects String or Null
    // If it's already a string, return it; otherwise convert to string
    return text.trim();
  };

  const parseResponsibilities = (text: string): string | null => {
    if (!text.trim()) return null;
    
    // Return as string - Prisma expects String or Null
    // If it's already a string, return it; otherwise convert to string
    return text.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const jobData = {
        title: formData.title,
        employerName: formData.employerName || undefined,
        description: formData.description || undefined,
        location: formData.location || undefined,
        salary: formData.salary || undefined,
        employmentType: formData.employmentType || undefined,
        applyLink: formData.applyLink || undefined,
        requirements: parseRequirements(formData.requirements),
        responsibilities: parseResponsibilities(formData.responsibilities),
      };

      const url = initialData 
        ? `/api/jobs/${initialData.id}`
        : '/api/jobs';
      
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save job');
      }

      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {initialData ? "Edit Job Posting" : "Post a New Job"}
          </h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400">
              {initialData ? "Job updated successfully!" : "Job posted successfully!"}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Briefcase className="w-4 h-4 inline mr-2" />
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Building2 className="w-4 h-4 inline mr-2" />
              Company Name
            </label>
            <input
              type="text"
              name="employerName"
              value={formData.employerName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g., Tech Corp Inc."
            />
          </div>

          {/* Location and Salary Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="e.g., San Francisco, CA or Remote"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Salary
              </label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="e.g., $120k - $160k"
              />
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Employment Type
            </label>
            <select
              name="employmentType"
              value={formData.employmentType}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Select type</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Job Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              placeholder="Describe the role, company culture, and what you're looking for..."
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Requirements (one per line or JSON)
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-mono text-sm"
              placeholder="e.g., 5+ years of experience&#10;Proficiency in React and TypeScript&#10;Strong problem-solving skills"
            />
            <p className="mt-1 text-xs text-gray-400">
              Enter one requirement per line, or use JSON format
            </p>
          </div>

          {/* Responsibilities */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Responsibilities (one per line or JSON)
            </label>
            <textarea
              name="responsibilities"
              value={formData.responsibilities}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-mono text-sm"
              placeholder="e.g., Design and develop new features&#10;Collaborate with cross-functional teams&#10;Mentor junior developers"
            />
            <p className="mt-1 text-xs text-gray-400">
              Enter one responsibility per line, or use JSON format
            </p>
          </div>

          {/* Apply Link */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <LinkIcon className="w-4 h-4 inline mr-2" />
              Application Link
            </label>
            <input
              type="url"
              name="applyLink"
              value={formData.applyLink}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="https://company.com/careers/apply"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : initialData ? "Update Job" : "Post Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


"use client";
import { Mail, Phone, MapPin, Award, Download, FileText, Code, Languages, Briefcase, ClipboardCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Candidate, Application } from "@/types";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { applicationsService } from "@/lib/services/applications.service";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatusUpdateDropdown } from "./StatusUpdateDropdown";
import { CoverLetterDisplay } from "./CoverLetterDisplay";

interface CandidateDetailProps {
    candidate: Candidate;
    application: Application;
    onStatusUpdate?: (applicationId: string, newStatus: string) => Promise<void>;  // ADD THIS
}

export function CandidateDetail({ candidate, application, onStatusUpdate }: CandidateDetailProps) {
    const router = useRouter();
    
    useEffect(() => {
        if (application.status === 'SUBMITTED') {
            applicationsService.markAsViewed(application.id).catch((error) => {
                console.error("🚀 ~ useEffect ~ error:markAsViewed", error)
            });
        }
    }, [application.id, application.status])

    async function handleStatusUpdate(applicationId: string, newStatus: string) {
        if (onStatusUpdate) {
            await onStatusUpdate(applicationId, newStatus);
        }
    }

    function handleViewInterviewReport() {
        if (application.interview?.id) {
            router.push(`/interview/report?interviewId=${application.interview.id}`);
        }
    }

    return (
        <div className="lg:col-span-2 space-y-6">
            {/* Candidate Header */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10">
                <div className="flex items-start gap-6 mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-3xl">
                        {candidate.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold mb-2">{candidate.name}</h2>
                        <div className="space-y-2 text-gray-300">
                            <p className="flex items-center">
                                <Mail className="w-4 h-4 mr-2 text-blue-400" />
                                {candidate.email}
                            </p>
                            {candidate.phone && (
                                <p className="flex items-center">
                                    <Phone className="w-4 h-4 mr-2 text-green-400" />
                                    {candidate.phone}
                                </p>
                            )}
                            {candidate.city && (
                                <p className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                                    {candidate.city}
                                </p>
                            )}
                            <p className="flex items-center">
                                <Award className="w-4 h-4 mr-2 text-orange-400" />
                                {candidate.experience} years experience
                            </p>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-5xl font-bold text-yellow-400 mb-2">
                            {application.matchScore}%
                        </div>
                        <p className="text-sm text-gray-400">Match Score</p>
                    </div>
                </div>

                {/* Current Status Badge */}
                <div className="mb-4">
                    <StatusBadge status={application.status || 'SUBMITTED'} size="md" />
                </div>

                {/* Status Update Dropdown */}
                <div className="flex items-center gap-3 flex-wrap">
                    <StatusUpdateDropdown
                        currentStatus={application.status || 'SUBMITTED'}
                        applicationId={application.id}
                        onStatusUpdate={handleStatusUpdate}
                    />
                    {application.interview && (application.interview.status === 'COMPLETED' || application.interview.hasReport) && (
                        <button 
                            onClick={handleViewInterviewReport}
                            className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg transition flex items-center gap-2 text-white font-medium"
                            title="View Interview Report"
                        >
                            <ClipboardCheck className="w-5 h-5" />
                            View Interview Report
                        </button>
                    )}
                    <button 
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition flex items-center justify-center"
                        title="Download Resume"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>

                {/* Final Status Messages */}
                {(application.status === 'HIRED' || application.status === 'REJECTED' || application.status === 'WITHDRAWN') && (
                    <div className={`p-4 rounded-lg ${
                        application.status === 'HIRED' 
                            ? 'bg-emerald-500/10 border border-emerald-500/20' 
                            : 'bg-gray-500/10 border border-gray-500/20'
                    }`}>
                        <p className={`text-sm font-medium ${
                            application.status === 'HIRED' ? 'text-emerald-400' : 'text-gray-400'
                        }`}>
                            {application.status === 'HIRED' 
                                ? '🎉 This candidate has been hired!' 
                                : application.status === 'REJECTED'
                                ? 'This application has been rejected.'
                                : 'This application has been withdrawn.'}
                        </p>
                    </div>
                )}
                
            </div>

            {/* Cover Letter */}
            {application.coverLetter && (
                <CoverLetterDisplay coverLetter={application.coverLetter} />
            )}

            {/* Summary */}
            {candidate.summary && (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-blue-400" />
                        Summary
                    </h3>
                    <p className="text-gray-300 leading-relaxed">{candidate.summary}</p>
                </div>
            )}

            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20">
                    <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center">
                        <Code className="w-5 h-5 mr-2" />
                        Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill, idx) => (
                            <span
                                key={idx}
                                className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg font-medium"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Categorized Skills */}
            {candidate.categorizedSkills && Object.keys(candidate.categorizedSkills).length > 0 && (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                        <Code className="w-5 h-5 mr-2 text-cyan-400" />
                        Skills by Category
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(candidate.categorizedSkills as Record<string, string[]>).map(([category, skills]) => (
                            skills && skills.length > 0 && (
                                <div key={category}>
                                    <h4 className="text-sm font-semibold text-gray-400 mb-2 capitalize">
                                        {category}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-sm"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            )}

            {/* Languages */}
            {candidate.languages && candidate.languages.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                        <Languages className="w-5 h-5 mr-2 text-purple-400" />
                        Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {candidate.languages.map((lang, idx) => (
                            <div
                                key={idx}
                                className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg"
                            >
                                {typeof lang === 'string' ? lang : (lang as any).language || lang}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Soft Skills */}
            {candidate.softSkills && candidate.softSkills.length > 0 && (
                <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-2xl p-6 border border-orange-500/20">
                    <h3 className="text-lg font-bold mb-4 text-orange-400 flex items-center">
                        <Award className="w-5 h-5 mr-2" />
                        Soft Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {candidate.softSkills.map((skill, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-sm"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Experience Details */}
            {candidate.experience_details && candidate.experience_details.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                        <Briefcase className="w-5 h-5 mr-2 text-blue-400" />
                        Experience
                    </h3>
                    <div className="space-y-4">
                        {candidate.experience_details.map((exp: any, idx: number) => (
                            <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <h4 className="font-bold text-lg">{exp.title || exp.role}</h4>
                                <p className="text-blue-400">{exp.company}</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {exp.startDate} - {exp.endDate || "Present"}
                                </p>
                                {exp.description && (
                                    <p className="text-gray-300 mt-2 text-sm">{exp.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Applied Date & Status Update Info */}
            <div className="text-center space-y-1">
                <p className="text-sm text-gray-400">
                    Applied {formatDistanceToNow(new Date(application.appliedDate), { addSuffix: true })}
                </p>
                {application.statusUpdatedAt && (
                    <p className="text-xs text-gray-500">
                        Status updated {formatDistanceToNow(new Date(application.statusUpdatedAt), { addSuffix: true })}
                    </p>
                )}
            </div>
        </div>
    );
}

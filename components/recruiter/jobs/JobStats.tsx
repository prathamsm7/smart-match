import { Briefcase, Users, CheckCircle, TrendingUp } from "lucide-react";
import { Job } from "@/types";

interface JobStatsProps {
    jobs: Job[];
}

export function JobStats({ jobs }: JobStatsProps) {
    const stats = [
        {
            label: "Total Jobs",
            value: jobs.length,
            icon: <Briefcase className="w-5 h-5" />,
            color: "from-blue-500 to-cyan-500"
        },
        {
            label: "Total Applications",
            value: jobs.reduce((sum, job) => sum + job._count.applications, 0),
            icon: <Users className="w-5 h-5" />,
            color: "from-green-500 to-emerald-500"
        },
        {
            label: "Jobs with Applications",
            value: jobs.filter((job) => job._count.applications > 0).length,
            icon: <CheckCircle className="w-5 h-5" />,
            color: "from-purple-500 to-pink-500"
        },
        {
            label: "Active Jobs",
            value: jobs.length,
            icon: <TrendingUp className="w-5 h-5" />,
            color: "from-orange-500 to-red-500"
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
                >
                    <div
                        className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg mb-4`}
                    >
                        {stat.icon}
                    </div>
                    <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                </div>
            ))}
        </div>
    );
}

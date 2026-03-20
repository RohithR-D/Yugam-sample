import { Sparkles, UserCircle } from "lucide-react";

interface Candidate {
  name: string;
  role: string;
  appliedAgo: string;
  matchScore: number;
}

interface Column {
  title: string;
  count: number;
  colorClasses: string;
  dotColor: string;
  candidates: Candidate[];
}

const columns: Column[] = [
  {
    title: "Applied",
    count: 12,
    colorClasses: "bg-gray-100 text-gray-600",
    dotColor: "bg-gray-400",
    candidates: [
      { name: "Ananya Verma", role: "Sr. UI Designer", appliedAgo: "2 days ago", matchScore: 92 },
      { name: "Karthik Rajan", role: "Frontend Engineer", appliedAgo: "3 days ago", matchScore: 87 },
      { name: "Meera Joshi", role: "Product Manager", appliedAgo: "5 days ago", matchScore: 74 },
    ],
  },
  {
    title: "Screening",
    count: 6,
    colorClasses: "bg-blue-50 text-blue-600",
    dotColor: "bg-blue-400",
    candidates: [
      { name: "Vikram Sinha", role: "Backend Developer", appliedAgo: "1 week ago", matchScore: 95 },
      { name: "Neha Kapoor", role: "Sr. UI Designer", appliedAgo: "4 days ago", matchScore: 88 },
    ],
  },
  {
    title: "Interview",
    count: 4,
    colorClasses: "bg-orange-50 text-orange-600",
    dotColor: "bg-orange-400",
    candidates: [
      { name: "Arjun Nair", role: "DevOps Engineer", appliedAgo: "2 weeks ago", matchScore: 91 },
      { name: "Divya Patel", role: "Frontend Engineer", appliedAgo: "1 week ago", matchScore: 83 },
    ],
  },
  {
    title: "Offered",
    count: 2,
    colorClasses: "bg-green-50 text-green-600",
    dotColor: "bg-green-400",
    candidates: [
      { name: "Rahul Menon", role: "Product Manager", appliedAgo: "3 weeks ago", matchScore: 96 },
    ],
  },
];

function scoreColor(score: number) {
  if (score >= 90) return "bg-green-100 text-green-700";
  if (score >= 80) return "bg-yellow-50 text-yellow-700";
  return "bg-orange-50 text-orange-600";
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-red-200 transition-all cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-800">{candidate.name}</span>
        <UserCircle className="w-7 h-7 text-gray-300" />
      </div>
      <p className="text-xs text-gray-500 mb-3">{candidate.role}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{candidate.appliedAgo}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${scoreColor(candidate.matchScore)}`}>
          {candidate.matchScore}% Match
        </span>
      </div>
    </div>
  );
}

export default function HirePipeline() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Recruitment Pipeline</h1>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
            3 Open Roles
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Sparkles className="w-4 h-4 text-purple-500" />
            AI Resume Scanner
          </button>
          <button className="bg-[#E31E24] hover:bg-[#c9191f] text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all">
            + New Job Post
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5 mt-6 flex-1 min-h-0">
        {columns.map((col) => (
          <div key={col.title} className="bg-gray-50/50 rounded-xl p-4 flex flex-col min-h-[70vh]">
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
              <span className="text-sm font-semibold text-gray-700">{col.title}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.colorClasses}`}>
                {col.count}
              </span>
            </div>
            <div className="space-y-3 flex-1">
              {col.candidates.map((c) => (
                <CandidateCard key={c.name} candidate={c} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Search,
  Download,
  Upload,
  Mail,
  Phone,
  Folder,
  UserCircle,
  Handshake,
  Trophy,
  XCircle,
} from "lucide-react";

const metrics = [
  { label: "Lead", value: 24, icon: UserCircle, iconColor: "text-blue-500", ringColor: "border-blue-200", bgColor: "bg-blue-50" },
  { label: "Negotiation", value: 12, icon: Handshake, iconColor: "text-orange-500", ringColor: "border-orange-200", bgColor: "bg-orange-50" },
  { label: "Won", value: 18, icon: Trophy, iconColor: "text-green-500", ringColor: "border-green-200", bgColor: "bg-green-50" },
  { label: "Lost", value: 6, icon: XCircle, iconColor: "text-red-500", ringColor: "border-red-200", bgColor: "bg-red-50" },
];

type Stage = "Lead" | "Negotiation" | "Won" | "Lost";

interface Client {
  company: string;
  initials: string;
  gradient: string;
  lead: string;
  status: Stage;
  industry: string;
  dealValue: string;
  source: string;
}

const clients: Client[] = [
  { company: "TechNova Solutions", initials: "TN", gradient: "from-violet-500 to-purple-600", lead: "Nisha Agarwal", status: "Won", industry: "IT Services", dealValue: "₹ 4.5L", source: "Referral" },
  { company: "GreenLeaf Industries", initials: "GL", gradient: "from-emerald-500 to-green-600", lead: "Sameer Kulkarni", status: "Negotiation", industry: "Manufacturing", dealValue: "₹ 8.2L", source: "Cold Call" },
  { company: "CloudSync AI", initials: "CS", gradient: "from-sky-500 to-blue-600", lead: "Ritika Bose", status: "Lead", industry: "SaaS", dealValue: "₹ 12.0L", source: "Website" },
  { company: "Apex Dynamics", initials: "AD", gradient: "from-amber-500 to-orange-600", lead: "Amit Dhawan", status: "Won", industry: "Engineering", dealValue: "₹ 2.8L", source: "Partner" },
  { company: "BrightPath Edu", initials: "BP", gradient: "from-pink-500 to-rose-600", lead: "Meera Joshi", status: "Negotiation", industry: "EdTech", dealValue: "₹ 6.1L", source: "LinkedIn" },
  { company: "UrbanNest Realty", initials: "UN", gradient: "from-teal-500 to-cyan-600", lead: "Vikram Rao", status: "Lost", industry: "Real Estate", dealValue: "₹ 3.4L", source: "Event" },
];

const stages: Stage[] = ["Lead", "Negotiation", "Won"];

function stageIndex(status: Stage): number {
  if (status === "Lost") return -1;
  return stages.indexOf(status);
}

function StatusPill({ status }: { status: Stage }) {
  const styles: Record<Stage, string> = {
    Lead: "border-blue-200 text-blue-600 bg-blue-50",
    Negotiation: "border-orange-200 text-orange-600 bg-orange-50",
    Won: "border-green-200 text-green-600 bg-green-50",
    Lost: "border-red-200 text-red-600 bg-red-50",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status]}`}>
      {status}
    </span>
  );
}

function PipelineTracker({ status }: { status: Stage }) {
  const activeIdx = stageIndex(status);

  return (
    <div className="flex items-center w-full mt-4 mb-3">
      {stages.map((stage, i) => {
        const completed = activeIdx >= i;
        const isLost = status === "Lost";
        const nodeColor = isLost ? "bg-gray-200 border-gray-300" : completed ? "bg-green-500 border-green-500" : "bg-white border-gray-300";
        const textColor = isLost ? "text-gray-400" : completed ? "text-green-600" : "text-gray-400";
        const checkColor = completed && !isLost;

        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full border-2 ${nodeColor} flex items-center justify-center`}>
                {checkColor && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-[10px] font-medium mt-1 ${textColor}`}>{stage}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-12px] ${activeIdx > i && !isLost ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrbitDashboard() {
  const [search, setSearch] = useState("");

  const filtered = clients.filter(
    (c) =>
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.lead.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orbit CRM</h1>
          <p className="text-sm text-gray-400 mt-0.5">Sales pipeline & client directory</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
            + Add Client
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full border-2 ${m.ringColor} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${m.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-0.5">{m.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {filtered.map((client) => (
          <div key={client.company} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${client.gradient} flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0`}>
                  {client.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{client.company}</p>
                  <p className="text-xs text-gray-400">{client.lead}</p>
                </div>
              </div>
              <StatusPill status={client.status} />
            </div>

            <PipelineTracker status={client.status} />

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Industry</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">{client.industry}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Deal Value</p>
                <p className="text-xs font-bold text-gray-800 mt-0.5">{client.dealValue}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Source</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">{client.source}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Folder className="w-3.5 h-3.5" />
                </button>
              </div>
              <button className="text-xs font-medium text-[#E31E24] hover:text-[#c9191f] transition-colors">
                Profile →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

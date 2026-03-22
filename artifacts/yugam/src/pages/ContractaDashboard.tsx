import { useState } from "react";
import {
  Search,
  FileText,
  Eye,
  Download,
  PenTool,
  Scale,
  CalendarClock,
  Clock,
  ShieldCheck,
} from "lucide-react";

const metrics = [
  { label: "Active Contracts", value: "48", icon: Scale, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  { label: "Expiring Soon", value: "6", icon: CalendarClock, iconColor: "text-orange-500", ringColor: "border-orange-200" },
  { label: "Pending Signature", value: "9", icon: Clock, iconColor: "text-yellow-500", ringColor: "border-yellow-200" },
  { label: "Compliance Score", value: "98%", icon: ShieldCheck, iconColor: "text-green-500", ringColor: "border-green-200" },
];

type Status = "Active" | "Draft" | "Renewal Needed" | "Pending";

interface Contract {
  name: string;
  client: string;
  validUntil: string;
  status: Status;
  signed: number;
  total: number;
  signers: { initials: string; gradient: string }[];
}

const contracts: Contract[] = [
  {
    name: "Master Service Agreement",
    client: "TechNova Solutions",
    validUntil: "Dec 2027",
    status: "Active",
    signed: 3,
    total: 3,
    signers: [
      { initials: "NA", gradient: "from-violet-500 to-purple-600" },
      { initials: "SK", gradient: "from-emerald-500 to-green-600" },
      { initials: "RB", gradient: "from-sky-500 to-blue-600" },
    ],
  },
  {
    name: "Non-Disclosure Agreement",
    client: "CloudSync AI",
    validUntil: "Mar 2028",
    status: "Pending",
    signed: 1,
    total: 2,
    signers: [
      { initials: "AM", gradient: "from-blue-500 to-indigo-600" },
      { initials: "?", gradient: "from-gray-300 to-gray-400" },
    ],
  },
  {
    name: "Office Lease Agreement",
    client: "Bangalore Realty Corp",
    validUntil: "Jun 2026",
    status: "Renewal Needed",
    signed: 2,
    total: 4,
    signers: [
      { initials: "PS", gradient: "from-pink-500 to-rose-600" },
      { initials: "AD", gradient: "from-amber-500 to-orange-600" },
      { initials: "?", gradient: "from-gray-300 to-gray-400" },
      { initials: "?", gradient: "from-gray-300 to-gray-400" },
    ],
  },
  {
    name: "Employment Agreement - Sr. Engineer",
    client: "Internal HR",
    validUntil: "Ongoing",
    status: "Draft",
    signed: 0,
    total: 2,
    signers: [
      { initials: "?", gradient: "from-gray-300 to-gray-400" },
      { initials: "?", gradient: "from-gray-300 to-gray-400" },
    ],
  },
];

function StatusPill({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    Active: "bg-green-50 text-green-600",
    Draft: "bg-gray-100 text-gray-500",
    "Renewal Needed": "bg-orange-50 text-orange-600",
    Pending: "bg-yellow-50 text-yellow-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function SignatureProgress({ signed, total, signers }: { signed: number; total: number; signers: Contract["signers"] }) {
  const pct = total > 0 ? (signed / total) * 100 : 0;
  const barColor = pct === 100 ? "bg-green-500" : pct > 0 ? "bg-yellow-400" : "bg-gray-200";

  return (
    <div className="w-44">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex -space-x-1.5">
          {signers.map((s, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-[7px] font-bold ring-2 ring-white`}
            >
              {s.initials}
            </div>
          ))}
        </div>
        <span className="text-[11px] font-semibold text-gray-500">{signed}/{total}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ContractaDashboard() {
  const [search, setSearch] = useState("");

  const filtered = contracts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracta Legal</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage corporate agreements, NDAs, and compliance</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
          <Scale className="w-4 h-4" />
          New Contract
        </button>
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
          placeholder="Search documents by name, client, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((c) => (
          <div
            key={c.name}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-[240px]">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.client}</p>
              </div>
            </div>

            <div className="min-w-[120px] text-center">
              <p className="text-xs text-gray-400 mb-1">{c.validUntil}</p>
              <StatusPill status={c.status} />
            </div>

            <SignatureProgress signed={c.signed} total={c.total} signers={c.signers} />

            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors" title="View PDF">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Download">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Email for Signature">
                <PenTool className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

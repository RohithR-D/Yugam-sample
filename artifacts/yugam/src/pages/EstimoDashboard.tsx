import { useState } from "react";
import {
  Search,
  Eye,
  Download,
  Mail,
  FileText,
  FileClock,
  Send,
  FileCheck2,
  FileX2,
  Plus,
} from "lucide-react";

const metrics = [
  { label: "Drafts", value: 8, icon: FileClock, iconColor: "text-gray-500", ringColor: "border-gray-200" },
  { label: "Sent", value: 14, icon: Send, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  { label: "Accepted", value: 22, icon: FileCheck2, iconColor: "text-green-500", ringColor: "border-green-200" },
  { label: "Expired", value: 3, icon: FileX2, iconColor: "text-red-500", ringColor: "border-red-200" },
];

type Status = "Draft" | "Sent" | "Accepted" | "Expired";

interface Quote {
  id: string;
  client: string;
  value: string;
  validUntil: string;
  status: Status;
}

const quotes: Quote[] = [
  { id: "#EST-2026-041", client: "TechNova Solutions", value: "₹ 2.5L", validUntil: "Mar 28, 2026", status: "Sent" },
  { id: "#EST-2026-039", client: "GreenLeaf Industries", value: "₹ 8.1L", validUntil: "Apr 05, 2026", status: "Accepted" },
  { id: "#EST-2026-037", client: "CloudSync AI", value: "₹ 14.2L", validUntil: "Mar 15, 2026", status: "Expired" },
  { id: "#EST-2026-042", client: "Apex Dynamics", value: "₹ 4.8L", validUntil: "Apr 12, 2026", status: "Draft" },
];

function StatusPill({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    Draft: "bg-gray-100 text-gray-600",
    Sent: "bg-blue-50 text-blue-600",
    Accepted: "bg-green-50 text-green-600",
    Expired: "bg-red-50 text-red-600",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function EstimoDashboard() {
  const [search, setSearch] = useState("");

  const filtered = quotes.filter(
    (q) =>
      q.client.toLowerCase().includes(search.toLowerCase()) ||
      q.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estimo Quotes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create & manage client proposals</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
          <Plus className="w-4 h-4" />
          Create Quote
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
          placeholder="Search quotes or clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((q) => (
          <div
            key={q.id}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-colors group"
          >
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono">{q.id}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{q.client}</p>
              </div>
            </div>

            <div className="text-center min-w-[100px]">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Value</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{q.value}</p>
            </div>

            <div className="text-center min-w-[110px]">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Valid Until</p>
              <p className="text-sm font-medium text-gray-600 mt-0.5">{q.validUntil}</p>
            </div>

            <div className="min-w-[90px] flex justify-center">
              <StatusPill status={q.status} />
            </div>

            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

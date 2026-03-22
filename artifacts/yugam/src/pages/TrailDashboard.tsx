import { useState } from "react";
import {
  Search,
  FileText,
  Paperclip,
  CheckCircle2,
  XCircle,
  CircleDollarSign,
  Gauge,
  AlertOctagon,
  Clock,
} from "lucide-react";

const metrics = [
  { label: "Pending Reimbursements", value: "₹ 2.4L", icon: Clock, iconColor: "text-orange-500", ringColor: "border-orange-200" },
  { label: "Total Spend (MTD)", value: "₹ 18.6L", icon: CircleDollarSign, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  { label: "Budget Utilization", value: "72%", icon: Gauge, iconColor: "text-green-500", ringColor: "border-green-200" },
  { label: "Flagged Claims", value: "4", icon: AlertOctagon, iconColor: "text-red-500", ringColor: "border-red-200" },
];

const stages = ["Submitted", "Manager", "Finance", "Paid"] as const;

interface ExpenseClaim {
  id: string;
  employee: string;
  category: string;
  amount: string;
  activeStage: number;
}

const claims: ExpenseClaim[] = [
  { id: "#EXP-4402", employee: "Aarav Mehta", category: "Travel & Lodging", amount: "₹ 12,500", activeStage: 2 },
  { id: "#EXP-4398", employee: "Priya Sharma", category: "Software Subscription", amount: "₹ 45,000", activeStage: 3 },
  { id: "#EXP-4405", employee: "Rohan Desai", category: "Office Supplies", amount: "₹ 3,200", activeStage: 4 },
  { id: "#EXP-4407", employee: "Kavya Iyer", category: "Client Dinner", amount: "₹ 8,750", activeStage: 1 },
];

function ApprovalTracker({ activeStage }: { activeStage: number }) {
  return (
    <div className="flex items-center w-60">
      {stages.map((stage, i) => {
        const idx = i + 1;
        const completed = idx < activeStage;
        const active = idx === activeStage;

        const nodeColor = completed
          ? "bg-green-500 border-green-500"
          : active
          ? "bg-yellow-400 border-yellow-400 animate-pulse"
          : "bg-white border-gray-300";
        const textColor = completed ? "text-green-600" : active ? "text-yellow-600 font-semibold" : "text-gray-400";

        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full border-2 ${nodeColor} flex items-center justify-center`}>
                {completed && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className={`text-[9px] mt-1 whitespace-nowrap ${textColor}`}>{stage}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-0.5 mt-[-12px] ${completed ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TrailDashboard() {
  const [search, setSearch] = useState("");

  const filtered = claims.filter(
    (c) =>
      c.employee.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trail Expenses</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track reimbursements and corporate spending</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
          <FileText className="w-4 h-4" />
          Log Expense
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
          placeholder="Search by employee, category, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((claim) => (
          <div
            key={claim.id}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-[190px]">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono">{claim.id}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{claim.employee}</p>
              </div>
            </div>

            <div className="min-w-[130px]">
              <p className="text-[11px] text-gray-400">{claim.category}</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{claim.amount}</p>
            </div>

            <ApprovalTracker activeStage={claim.activeStage} />

            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View Receipt">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Approve">
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Decline">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

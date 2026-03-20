import { useState } from "react";
import {
  Search,
  Bell,
  Download,
  Link,
  Receipt,
  Plus,
  CircleDollarSign,
  AlertTriangle,
  CheckCircle2,
  FileClock,
} from "lucide-react";

const metrics = [
  { label: "Outstanding", value: "₹ 8.5L", icon: CircleDollarSign, iconColor: "text-orange-500", ringColor: "border-orange-200" },
  { label: "Overdue", value: "₹ 3.2L", icon: AlertTriangle, iconColor: "text-red-500", ringColor: "border-red-200" },
  { label: "Paid This Month", value: "₹ 12.4L", icon: CheckCircle2, iconColor: "text-green-500", ringColor: "border-green-200" },
  { label: "Drafts", value: "5", icon: FileClock, iconColor: "text-gray-500", ringColor: "border-gray-200" },
];

type Status = "Paid" | "Partial" | "Overdue" | "Sent";

interface Invoice {
  id: string;
  client: string;
  amount: string;
  due: string;
  status: Status;
  progress: number;
}

const invoices: Invoice[] = [
  { id: "#INV-2026-089", client: "TechNova Solutions", amount: "₹ 1.2L", due: "Apr 15, 2026", status: "Paid", progress: 100 },
  { id: "#INV-2026-091", client: "GreenLeaf Industries", amount: "₹ 4.8L", due: "Apr 02, 2026", status: "Partial", progress: 50 },
  { id: "#INV-2026-085", client: "CloudSync AI", amount: "₹ 6.5L", due: "Mar 10, 2026", status: "Overdue", progress: 0 },
  { id: "#INV-2026-093", client: "Apex Dynamics", amount: "₹ 2.1L", due: "Apr 20, 2026", status: "Sent", progress: 0 },
];

function StatusPill({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    Paid: "bg-green-50 text-green-600",
    Partial: "bg-yellow-50 text-yellow-600",
    Overdue: "bg-red-50 text-red-600",
    Sent: "bg-blue-50 text-blue-600",
  };
  return (
    <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function PaymentBar({ status, progress }: { status: Status; progress: number }) {
  const fillColor: Record<Status, string> = {
    Paid: "bg-green-500",
    Partial: "bg-yellow-400",
    Overdue: "bg-red-400",
    Sent: "bg-blue-300",
  };
  return (
    <div className="w-full mt-2">
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${fillColor[status]}`}
          style={{ width: `${status === "Overdue" ? 8 : status === "Sent" ? 8 : progress}%` }}
        />
      </div>
    </div>
  );
}

export default function BillrDashboard() {
  const [search, setSearch] = useState("");

  const filtered = invoices.filter(
    (inv) =>
      inv.client.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billr Invoicing</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage invoices & track payments</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
          <Plus className="w-4 h-4" />
          Create Invoice
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
          placeholder="Search invoices or clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((inv) => (
          <div
            key={inv.id}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <Receipt className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono">{inv.id}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{inv.client}</p>
              </div>
            </div>

            <div className="min-w-[120px]">
              <p className="text-sm font-bold text-gray-800">{inv.amount}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Due: {inv.due}</p>
            </div>

            <div className="w-48">
              <StatusPill status={inv.status} />
              <PaymentBar status={inv.status} progress={inv.progress} />
            </div>

            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                <Bell className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                <Link className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

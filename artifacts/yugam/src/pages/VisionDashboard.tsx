import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import { useModule } from "@/context/ModuleContext";
import {
  LayoutDashboard, TrendingUp, TrendingDown, DollarSign, FolderKanban,
  AlertCircle, BarChart3, FileText, Download, Calendar, Clock,
  Factory, Package, Activity, Gauge, X,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";

function formatCurrency(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const BAR_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function ExecutiveDashboardView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/vision/executive-summary");
        if (res.ok) setData(await res.json());
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading executive dashboard...</div>;

  const d = data || { grossRevenue: 0, netProfit: 0, activeProjects: 0, openTickets: 0, cashFlow: [] };

  const metrics = [
    { label: "Gross Revenue", value: formatCurrency(d.grossRevenue), icon: DollarSign, color: "text-green-500", ring: "border-green-200", bg: "bg-green-50" },
    { label: "Net Profit", value: formatCurrency(d.netProfit), icon: d.netProfit >= 0 ? TrendingUp : TrendingDown, color: d.netProfit >= 0 ? "text-blue-500" : "text-red-500", ring: d.netProfit >= 0 ? "border-blue-200" : "border-red-200", bg: d.netProfit >= 0 ? "bg-blue-50" : "bg-red-50" },
    { label: "Active Projects", value: d.activeProjects.toString(), icon: FolderKanban, color: "text-purple-500", ring: "border-purple-200", bg: "bg-purple-50" },
    { label: "Open Tickets", value: d.openTickets.toString(), icon: AlertCircle, color: "text-amber-500", ring: "border-amber-200", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">CEO-level business intelligence overview</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full border-2 ${m.ring} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
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

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <TrendingUp className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">Cash Inflow vs. Cash Outflow</h3>
            <p className="text-xs text-gray-400">Monthly dual-axis cash movement analysis</p>
          </div>
        </div>
        <div className="h-[340px]">
          {d.cashFlow.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">No transaction data yet. Add transactions to see cash flow trends.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.cashFlow} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} width={70} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} width={70} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px" }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name === "inflow" ? "Cash Inflow" : "Cash Outflow"]}
                />
                <Legend iconType="circle" formatter={(value) => <span className="text-xs text-gray-600">{value === "inflow" ? "Cash Inflow" : "Cash Outflow"}</span>} />
                <Line yAxisId="left" type="monotone" dataKey="inflow" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function FinancialHealthView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/vision/financial-health");
        if (res.ok) setData(await res.json());
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading financial health...</div>;

  const d = data || { aging: [], topInvoices: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Health</h1>
        <p className="text-sm text-gray-400 mt-0.5">Accounts receivable/payable aging and outstanding invoices</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <BarChart3 className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">AR / AP Aging</h3>
            <p className="text-xs text-gray-400">Outstanding receivables vs payables by age bucket</p>
          </div>
        </div>
        <div className="h-[300px]">
          {d.aging.length === 0 || d.aging.every((a: any) => a.ar === 0 && a.ap === 0) ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">No AR/AP aging data. Add receivables or payables in Ledger to populate.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.aging} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} width={70} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px" }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name === "ar" ? "Receivables" : "Payables"]}
                />
                <Legend formatter={(value) => <span className="text-xs text-gray-600">{value === "ar" ? "Accounts Receivable" : "Accounts Payable"}</span>} />
                <Bar dataKey="ar" name="ar" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={30} />
                <Bar dataKey="ap" name="ap" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">Top 5 Outstanding Invoices</h3>
            <p className="text-xs text-gray-400">Highest pending amounts requiring attention</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {d.topInvoices.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No outstanding invoices</td></tr>
            ) : (
              d.topInvoices.map((inv: any) => (
                <tr key={inv.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3.5 text-gray-600">{inv.clientName}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{formatCurrency(parseFloat(inv.totalAmount || "0"))}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">{inv.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GaugeChart({ percent }: { percent: number }) {
  const angle = (percent / 100) * 180;
  const color = percent > 80 ? "#ef4444" : percent > 60 ? "#f59e0b" : "#22c55e";
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" width="220" height="120">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 251.2} 251.2`}
        />
        <text x="100" y="90" textAnchor="middle" className="text-3xl font-bold" fill={color} fontSize="28">{percent}%</text>
        <text x="100" y="108" textAnchor="middle" fill="#9ca3af" fontSize="11">Utilization</text>
      </svg>
    </div>
  );
}

function OpsProductionView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/vision/ops-production");
        if (res.ok) setData(await res.json());
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading ops & production...</div>;

  const d = data || { factoryCapacity: 0, topMaterials: [], activeProjects: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ops & Production</h1>
        <p className="text-sm text-gray-400 mt-0.5">Factory utilization, material consumption, and project timelines</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Gauge className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">Factory Capacity</h3>
              <p className="text-xs text-gray-400">Current production utilization</p>
            </div>
          </div>
          <GaugeChart percent={d.factoryCapacity} />
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
              <Package className="w-4.5 h-4.5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">Top Consumed Materials</h3>
              <p className="text-xs text-gray-400">Highest BOM material usage by quantity</p>
            </div>
          </div>
          <div className="h-[200px]">
            {d.topMaterials.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No material data. Create BOMs in Forge to populate.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.topMaterials} layout="vertical" margin={{ top: 0, right: 20, left: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "13px" }} formatter={(value: number) => [value, "Qty"]} />
                  <Bar dataKey="quantity" radius={[0, 6, 6, 0]} barSize={18}>
                    {d.topMaterials.map((_: any, i: number) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Activity className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">Active Projects Timeline</h3>
            <p className="text-xs text-gray-400">Current project portfolio gantt view</p>
          </div>
        </div>
        {d.activeProjects.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No active projects. Create projects in Flow to populate.</div>
        ) : (
          <div className="space-y-2">
            {d.activeProjects.map((p: any, idx: number) => {
              const start = p.startDate ? new Date(p.startDate) : new Date();
              const now = new Date();
              const elapsed = Math.max(0, now.getTime() - start.getTime());
              const totalDuration = 90 * 24 * 60 * 60 * 1000;
              const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
              return (
                <div key={p.id} className="flex items-center gap-4 py-2">
                  <div className="w-40 truncate text-sm font-medium text-gray-700">{p.name}</div>
                  <div className="flex-1 h-7 bg-gray-100 rounded-full relative overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gray-600">
                      {progress}% — {p.startDate ? formatDate(p.startDate) : "N/A"}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-600 border border-green-200 whitespace-nowrap">{p.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const REPORT_TYPES = [
  { name: "Attendance Report", category: "HR", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { name: "Payroll Report", category: "HR", color: "bg-teal-50 border-teal-200 text-teal-700" },
  { name: "Expense Report", category: "Finance", color: "bg-amber-50 border-amber-200 text-amber-700" },
  { name: "Project Report", category: "Operations", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { name: "Purchase Report", category: "Procurement", color: "bg-rose-50 border-rose-200 text-rose-700" },
  { name: "Sale Report", category: "Sales", color: "bg-green-50 border-green-200 text-green-700" },
];

interface GeneratedReport {
  id: number;
  reportName: string;
  reportType: string;
  dateFrom: string;
  dateTo: string;
  format: string;
  generatedBy: string;
  createdAt: string | null;
}

function ReportCenterView() {
  const [history, setHistory] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [dateRanges, setDateRanges] = useState<Record<string, { from: string; to: string }>>({});

  const today = new Date().toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const fetchHistory = useCallback(async () => {
    try {
      const res = await authFetch("/api/vision/generated-reports");
      if (res.ok) setHistory(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const getRange = (name: string) => dateRanges[name] || { from: monthAgo, to: today };

  const handleGenerate = async (reportType: string, format: string) => {
    const range = getRange(reportType);
    setGenerating(`${reportType}-${format}`);
    try {
      const res = await authFetch("/api/vision/generated-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportName: `${reportType} (${range.from} to ${range.to})`,
          reportType,
          dateFrom: range.from,
          dateTo: range.to,
          format,
          generatedBy: "Admin",
        }),
      });
      if (res.ok) await fetchHistory();
    } catch {} finally { setGenerating(null); }
  };

  const updateRange = (name: string, field: "from" | "to", value: string) => {
    setDateRanges((prev) => ({
      ...prev,
      [name]: { ...getRange(name), [field]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Center</h1>
        <p className="text-sm text-gray-400 mt-0.5">Generate and download business reports by date range</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {REPORT_TYPES.map((rt) => {
          const range = getRange(rt.name);
          return (
            <div key={rt.name} className={`rounded-xl border p-5 shadow-sm ${rt.color}`}>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4" />
                <h3 className="text-sm font-semibold">{rt.name}</h3>
                <span className="ml-auto text-[10px] font-medium opacity-70">{rt.category}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-[10px] font-medium opacity-70 mb-1">Start Date</label>
                  <input type="date" value={range.from} onChange={(e) => updateRange(rt.name, "from", e.target.value)} className="w-full px-2 py-1.5 text-xs border border-current/20 rounded-lg outline-none bg-white/80" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium opacity-70 mb-1">End Date</label>
                  <input type="date" value={range.to} onChange={(e) => updateRange(rt.name, "to", e.target.value)} className="w-full px-2 py-1.5 text-xs border border-current/20 rounded-lg outline-none bg-white/80" />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerate(rt.name, "PDF")}
                  disabled={generating === `${rt.name}-PDF`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium bg-white/90 rounded-lg border border-current/20 hover:bg-white transition-colors disabled:opacity-50"
                >
                  <Download className="w-3 h-3" />
                  {generating === `${rt.name}-PDF` ? "Generating..." : "PDF"}
                </button>
                <button
                  onClick={() => handleGenerate(rt.name, "XLS")}
                  disabled={generating === `${rt.name}-XLS`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium bg-white/90 rounded-lg border border-current/20 hover:bg-white transition-colors disabled:opacity-50"
                >
                  <Download className="w-3 h-3" />
                  {generating === `${rt.name}-XLS` ? "Generating..." : "XLS"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
            <Clock className="w-4.5 h-4.5 text-gray-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">Recently Generated Reports</h3>
            <p className="text-xs text-gray-400">Download history of previously generated reports</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Generated By</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Format</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Download</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No reports generated yet. Use the cards above to generate your first report.</td></tr>
            ) : (
              history.map((r) => (
                <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 text-xs text-gray-500">{r.createdAt ? formatDate(r.createdAt) : "—"}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-800">{r.reportName}</td>
                  <td className="px-5 py-3.5 text-gray-600">{r.generatedBy}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${r.format === "PDF" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>{r.format}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#E31E24] hover:border-red-200 transition-colors">
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function VisionDashboard() {
  const { activeModule } = useModule();
  const sub = activeModule.startsWith("Vision:") ? activeModule.replace("Vision:", "") : "Executive Dashboard";

  switch (sub) {
    case "Executive Dashboard":
      return <ExecutiveDashboardView />;
    case "Financial Health":
      return <FinancialHealthView />;
    case "Ops & Production":
      return <OpsProductionView />;
    case "Report Center":
      return <ReportCenterView />;
    default:
      return <ExecutiveDashboardView />;
  }
}

import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowRight,
  Download,
  CalendarClock,
  BarChart3,
  Activity,
  PieChart as PieChartIcon,
  Target,
  FileText,
  Plus,
  Search,
  X,
  Layers,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ReportRecord {
  id: number;
  reportName: string;
  moduleSource: string;
  chartType: string;
  lastRun: string;
  createdAt: string | null;
}

interface FinancialTrend {
  month: string;
  label: string;
  revenue: number;
  expenses: number;
  netPL: number;
}

interface OperationalStats {
  tasksByStatus: { status: string; count: number }[];
  projectsByStatus: { status: string; count: number }[];
  employeesByDept: { department: string; count: number }[];
  invoicesByStatus: { status: string; count: number }[];
  expensesByCategory: { category: string; total: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  "To Do": "#6366f1",
  "In Progress": "#f59e0b",
  Done: "#22c55e",
  Completed: "#22c55e",
  Active: "#3b82f6",
  "On Hold": "#f97316",
  Cancelled: "#ef4444",
  Planning: "#8b5cf6",
  Paid: "#22c55e",
  Pending: "#f59e0b",
  Overdue: "#ef4444",
  Draft: "#94a3b8",
  Sent: "#3b82f6",
};

const PIE_COLORS = ["#E31E24", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#f97316", "#06b6d4", "#ec4899"];

function formatCurrency(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
}

function ModulePill({ source }: { source: string }) {
  const styles: Record<string, string> = {
    Finance: "bg-blue-50 text-blue-600",
    HR: "bg-purple-50 text-purple-600",
    Sales: "bg-green-50 text-green-600",
    Production: "bg-orange-50 text-orange-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[source] || "bg-gray-100 text-gray-600"}`}>
      {source}
    </span>
  );
}

function ChartIcon({ type }: { type: string }) {
  const icons: Record<string, string> = { Bar: "📊", Line: "📈", Pie: "🥧", Table: "📋" };
  return <span className="text-sm">{icons[type] || "📊"}</span>;
}

function formatDateTime(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) + ", " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function FinancialTrendChart({ data }: { data: FinancialTrend[] }) {
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);
  const netPL = totalRevenue - totalExpenses;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <TrendingUp className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">Revenue vs Expenses</h3>
            <p className="text-xs text-gray-400">Monthly financial trend</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
            Revenue: {formatCurrency(totalRevenue)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E31E24]" />
            Expenses: {formatCurrency(totalExpenses)}
          </span>
          <span className={`flex items-center gap-1 font-semibold ${netPL >= 0 ? "text-green-600" : "text-red-600"}`}>
            {netPL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            Net: {formatCurrency(Math.abs(netPL))}
          </span>
        </div>
      </div>
      <div className="h-[280px] mt-4">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">No transaction data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E31E24" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#E31E24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} width={70} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px" }}
                formatter={(value: number, name: string) => [formatCurrency(value), name === "revenue" ? "Revenue" : "Expenses"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 3.5, fill: "#22c55e", strokeWidth: 0 }} activeDot={{ r: 5.5, strokeWidth: 2, stroke: "#fff" }} />
              <Area type="monotone" dataKey="expenses" stroke="#E31E24" strokeWidth={2.5} fill="url(#expenseGrad)" dot={{ r: 3.5, fill: "#E31E24", strokeWidth: 0 }} activeDot={{ r: 5.5, strokeWidth: 2, stroke: "#fff" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function TaskProjectChart({ stats }: { stats: OperationalStats }) {
  const taskData = stats.tasksByStatus.map((t) => ({
    name: t.status,
    value: t.count,
    fill: STATUS_COLORS[t.status] || "#94a3b8",
  }));

  const projectData = stats.projectsByStatus.map((p) => ({
    name: p.status,
    value: p.count,
    fill: STATUS_COLORS[p.status] || "#94a3b8",
  }));

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
          <Activity className="w-4.5 h-4.5 text-purple-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">Task & Project Distribution</h3>
          <p className="text-xs text-gray-400">Status breakdown across operations</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 mt-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tasks by Status</p>
          <div className="h-[220px]">
            {taskData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No tasks</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px" }}
                    formatter={(value: number) => [value, "Tasks"]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                    {taskData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Projects by Status</p>
          <div className="h-[220px]">
            {projectData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No projects</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={projectData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {projectData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px" }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseBreakdownChart({ data }: { data: { category: string; total: number }[] }) {
  const sorted = [...data].sort((a, b) => b.total - a.total);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
          <Target className="w-4.5 h-4.5 text-orange-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">Expense Breakdown</h3>
          <p className="text-xs text-gray-400">Spending distribution by category</p>
        </div>
      </div>
      <div className="h-[280px] mt-4">
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">No expense data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip
                contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px" }}
                formatter={(value: number) => [formatCurrency(value), "Amount"]}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={22}>
                {sorted.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function InvoicePieChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
          <FileText className="w-4.5 h-4.5 text-green-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">Invoice Status</h3>
          <p className="text-xs text-gray-400">Distribution of invoice states</p>
        </div>
      </div>
      <div className="h-[280px] mt-4">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">No invoices</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.map((d) => ({ name: d.status, value: d.count }))} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {data.map((d, i) => (
                  <Cell key={i} fill={STATUS_COLORS[d.status] || PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px" }}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const sections = [
  { title: "Financial Health", icon: BarChart3, iconColor: "text-blue-500", bars: [65, 80, 55, 90, 72, 85], reports: ["P&L Statement", "Tax Summary", "Cash Flow"] },
  { title: "Operational Flow", icon: Activity, iconColor: "text-green-500", bars: [40, 55, 70, 60, 85, 75], reports: ["Production Throughput", "Procurement Cycle", "Logistics KPIs"] },
  { title: "Human Capital", icon: PieChartIcon, iconColor: "text-orange-500", bars: [90, 75, 82, 68, 94, 88], reports: ["Headcount Analysis", "Attrition Report", "Payroll Summary"] },
  { title: "Sales Pipeline", icon: Target, iconColor: "text-purple-500", bars: [50, 72, 88, 64, 78, 92], reports: ["Deal Win/Loss", "Lead Source ROI", "Revenue Forecast"] },
];

function MiniBarChart({ bars }: { bars: number[] }) {
  return (
    <div className="flex items-end gap-1.5 h-16 mt-4 mb-2">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 bg-gradient-to-t from-[#E31E24]/20 to-[#E31E24]/5 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export default function VisionDashboard() {
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ reportName: "", moduleSource: "Finance", chartType: "Bar", lastRun: new Date().toISOString().split("T")[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [financialTrend, setFinancialTrend] = useState<FinancialTrend[]>([]);
  const [operationalStats, setOperationalStats] = useState<OperationalStats | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const res = await authFetch("/api/reports");
      if (res.ok) setReports(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [trendRes, statsRes] = await Promise.all([
        authFetch("/api/analytics/financial-trend"),
        authFetch("/api/analytics/operational-stats"),
      ]);
      if (trendRes.ok) setFinancialTrend(await trendRes.json());
      if (statsRes.ok) setOperationalStats(await statsRes.json());
    } catch {} finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchAnalytics();
  }, [fetchReports, fetchAnalytics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await authFetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create report");
        return;
      }
      setShowModal(false);
      setFormData({ reportName: "", moduleSource: "Finance", chartType: "Bar", lastRun: new Date().toISOString().split("T")[0] });
      await fetchReports();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = reports.filter(
    (r) =>
      r.reportName.toLowerCase().includes(search.toLowerCase()) ||
      r.moduleSource.toLowerCase().includes(search.toLowerCase()) ||
      r.chartType.toLowerCase().includes(search.toLowerCase())
  );

  const totalReports = reports.length;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const thisWeek = reports.filter((r) => new Date(r.lastRun) >= weekAgo).length;
  const moduleCount = new Set(reports.map((r) => r.moduleSource)).size;
  const chartTypes = new Set(reports.map((r) => r.chartType)).size;

  const metrics = [
    { label: "Total Saved Reports", value: totalReports.toString(), icon: FileText, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Generated This Week", value: thisWeek.toString(), icon: Clock, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Module Sources", value: moduleCount.toString(), icon: Layers, iconColor: "text-orange-500", ringColor: "border-orange-200" },
    { label: "Chart Types Used", value: chartTypes.toString(), icon: BarChart3, iconColor: "text-purple-500", ringColor: "border-purple-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vision Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Unified business intelligence and performance reporting</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <CalendarClock className="w-4 h-4" />
            Schedule Export
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Generate Report
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

      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-[#E31E24] rounded-full" />
          <h2 className="text-lg font-bold text-gray-800">Interactive Dashboards</h2>
          {analyticsLoading && <span className="text-xs text-gray-400 ml-2">Loading analytics...</span>}
        </div>

        <div className="space-y-6">
          <FinancialTrendChart data={financialTrend} />

          <div className="grid grid-cols-2 gap-6">
            {operationalStats && <TaskProjectChart stats={operationalStats} />}
            {operationalStats && <ExpenseBreakdownChart data={operationalStats.expensesByCategory} />}
          </div>

          {operationalStats && (
            <div className="grid grid-cols-2 gap-6">
              <InvoicePieChart data={operationalStats.invoicesByStatus} />
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Layers className="w-4.5 h-4.5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">Team Distribution</h3>
                    <p className="text-xs text-gray-400">Active employees by department</p>
                  </div>
                </div>
                <div className="h-[280px] mt-4">
                  {operationalStats.employeesByDept.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">No employees</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={operationalStats.employeesByDept} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="department" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "13px" }}
                          formatter={(value: number) => [value, "Employees"]}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                          {operationalStats.employeesByDept.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${s.iconColor}`} />
                <h3 className="text-base font-semibold text-gray-800">{s.title}</h3>
              </div>
              <MiniBarChart bars={s.bars} />
              <div className="space-y-2 mt-3">
                {s.reports.map((r) => (
                  <button key={r} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-[#E31E24] transition-colors group">
                    <span>{r}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#E31E24] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search saved reports by name, module, or chart type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading reports...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Saved Reports</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Module</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chart Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Run</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No reports found</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                          <FileText className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-800">{r.reportName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><ModulePill source={r.moduleSource} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <ChartIcon type={r.chartType} />
                        <span className="text-sm text-gray-600">{r.chartType}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{formatDateTime(r.lastRun)}</td>
                    <td className="px-5 py-4 text-right">
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#E31E24] hover:border-red-200 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Generate Report</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Report Name</label>
                <input type="text" required value={formData.reportName} onChange={(e) => setFormData({ ...formData, reportName: e.target.value })} placeholder="e.g., Monthly P&L — April 2026" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Module Source</label>
                  <select value={formData.moduleSource} onChange={(e) => setFormData({ ...formData, moduleSource: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Sales">Sales</option>
                    <option value="Production">Production</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Chart Type</label>
                  <select value={formData.chartType} onChange={(e) => setFormData({ ...formData, chartType: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Bar">Bar</option>
                    <option value="Line">Line</option>
                    <option value="Pie">Pie</option>
                    <option value="Table">Table</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Last Run Date</label>
                <input type="date" required value={formData.lastRun} onChange={(e) => setFormData({ ...formData, lastRun: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Generating..." : "Save Report"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

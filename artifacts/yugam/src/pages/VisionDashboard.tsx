import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowRight,
  Download,
  CalendarClock,
  BarChart3,
  Activity,
  PieChart,
  Target,
  FileText,
  Plus,
  Search,
  X,
  Layers,
  Clock,
} from "lucide-react";

interface ReportRecord {
  id: number;
  reportName: string;
  moduleSource: string;
  chartType: string;
  lastRun: string;
  createdAt: string | null;
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

const sections = [
  { title: "Financial Health", icon: BarChart3, iconColor: "text-blue-500", bars: [65, 80, 55, 90, 72, 85], reports: ["P&L Statement", "Tax Summary", "Cash Flow"] },
  { title: "Operational Flow", icon: Activity, iconColor: "text-green-500", bars: [40, 55, 70, 60, 85, 75], reports: ["Production Throughput", "Procurement Cycle", "Logistics KPIs"] },
  { title: "Human Capital", icon: PieChart, iconColor: "text-orange-500", bars: [90, 75, 82, 68, 94, 88], reports: ["Headcount Analysis", "Attrition Report", "Payroll Summary"] },
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

  const fetchReports = useCallback(async () => {
    try {
      const res = await authFetch("/api/reports");
      if (res.ok) setReports(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

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

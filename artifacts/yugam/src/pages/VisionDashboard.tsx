import {
  ArrowRight,
  Download,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Gauge,
  Users,
  Star,
  BarChart3,
  Activity,
  PieChart,
  Target,
  FileText,
  Plus,
} from "lucide-react";

const kpis = [
  { label: "Overall Revenue", value: "₹ 2.8 Cr", trend: "+5.2%", up: true, icon: DollarSign, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  { label: "Operating Margin", value: "24%", trend: "+1.8%", up: true, icon: Gauge, iconColor: "text-green-500", ringColor: "border-green-200" },
  { label: "Team Efficiency", value: "92%", trend: "-0.4%", up: false, icon: Users, iconColor: "text-orange-500", ringColor: "border-orange-200" },
  { label: "Customer Satisfaction", value: "4.8/5", trend: "+0.3", up: true, icon: Star, iconColor: "text-purple-500", ringColor: "border-purple-200" },
];

const sections = [
  {
    title: "Financial Health",
    icon: BarChart3,
    iconColor: "text-blue-500",
    bars: [65, 80, 55, 90, 72, 85],
    reports: ["P&L Statement", "Tax Summary", "Cash Flow"],
  },
  {
    title: "Operational Flow",
    icon: Activity,
    iconColor: "text-green-500",
    bars: [40, 55, 70, 60, 85, 75],
    reports: ["Production Throughput", "Procurement Cycle", "Logistics KPIs"],
  },
  {
    title: "Human Capital",
    icon: PieChart,
    iconColor: "text-orange-500",
    bars: [90, 75, 82, 68, 94, 88],
    reports: ["Headcount Analysis", "Attrition Report", "Payroll Summary"],
  },
  {
    title: "Sales Pipeline",
    icon: Target,
    iconColor: "text-purple-500",
    bars: [50, 72, 88, 64, 78, 92],
    reports: ["Deal Win/Loss", "Lead Source ROI", "Revenue Forecast"],
  },
];

const recentReports = [
  { name: "Monthly P&L — March 2026", generated: "22 Mar 2026, 10:14 AM", size: "2.4 MB" },
  { name: "Q4 Tax Summary", generated: "20 Mar 2026, 04:30 PM", size: "1.8 MB" },
  { name: "Headcount Analysis — FY26", generated: "18 Mar 2026, 09:00 AM", size: "3.1 MB" },
];

function MiniBarChart({ bars }: { bars: number[] }) {
  return (
    <div className="flex items-end gap-1.5 h-16 mt-4 mb-2">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-gradient-to-t from-[#E31E24]/20 to-[#E31E24]/5 rounded-t"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export default function VisionDashboard() {
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
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
            <Plus className="w-4 h-4" />
            Custom Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full border-2 ${k.ringColor} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${k.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{k.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-2xl font-bold text-gray-800">{k.value}</p>
                    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${k.up ? "text-green-500" : "text-red-400"}`}>
                      {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {k.trend}
                    </span>
                  </div>
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
                  <button
                    key={r}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-[#E31E24] transition-colors group"
                  >
                    <span>{r}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#E31E24] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Recently Generated</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {recentReports.map((r) => (
            <div key={r.name} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{r.generated} · {r.size}</p>
                </div>
              </div>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#E31E24] hover:border-red-200 transition-colors">
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

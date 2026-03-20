import {
  Users,
  Clock,
  TrendingUp,
  Phone,
  Mail,
  Search,
} from "lucide-react";

const deals = [
  {
    lead: "Nisha Agarwal",
    company: "TechNova Solutions",
    initials: "TN",
    gradient: "from-violet-500 to-purple-600",
    heat: 3,
    value: "₹ 4.8L",
  },
  {
    lead: "Sameer Kulkarni",
    company: "GreenLeaf Industries",
    initials: "GL",
    gradient: "from-emerald-500 to-green-600",
    heat: 3,
    value: "₹ 2.5L",
  },
  {
    lead: "Ritika Bose",
    company: "CloudSync AI",
    initials: "CS",
    gradient: "from-sky-500 to-blue-600",
    heat: 2,
    value: "₹ 8.1L",
  },
  {
    lead: "Amit Dhawan",
    company: "Apex Dynamics",
    initials: "AD",
    gradient: "from-amber-500 to-orange-600",
    heat: 1,
    value: "₹ 1.2L",
  },
];

function HeatBar({ level }: { level: number }) {
  const colors = [
    level >= 1 ? (level === 1 ? "bg-blue-400" : level === 2 ? "bg-orange-400" : "bg-red-500") : "bg-gray-200",
    level >= 2 ? (level === 2 ? "bg-orange-400" : "bg-red-500") : "bg-gray-200",
    level >= 3 ? "bg-red-500" : "bg-gray-200",
  ];
  const label = level === 3 ? "Hot" : level === 2 ? "Warm" : "Cold";
  const labelColor = level === 3 ? "text-red-500" : level === 2 ? "text-orange-500" : "text-blue-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {colors.map((c, i) => (
          <div key={i} className={`w-5 h-1.5 rounded-full ${c} transition-colors`} />
        ))}
      </div>
      <span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
    </div>
  );
}

export default function OrbitDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Orbit Command Center</h1>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            System Syncing
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white shadow-sm border border-gray-100 rounded-full px-5 py-2.5 w-56">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search deals..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
            />
          </div>
          <button className="bg-gradient-to-r from-[#E31E24] to-red-600 text-white text-sm font-medium rounded-full px-6 py-2.5 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5 transition-all">
            + New Deal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="p-2.5 bg-blue-50 rounded-xl w-fit mb-3 relative">
            <div className="absolute inset-0 bg-blue-400/20 rounded-xl blur-md" />
            <Users className="w-5 h-5 text-blue-600 relative" />
          </div>
          <p className="text-sm text-gray-500">Active Leads</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">84</p>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 group">
          <div className="p-2.5 bg-white rounded-xl w-fit mb-3">
            <Clock className="w-5 h-5 text-[#E31E24] group-hover:animate-bounce transition-all" />
          </div>
          <p className="text-sm text-red-400">Urgent Follow-ups</p>
          <p className="text-2xl font-bold text-[#E31E24] mt-1">12</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="p-2.5 bg-green-50 rounded-xl w-fit mb-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-gray-500">Win Rate</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">24.5%</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-1/4 bg-green-500 rounded-full" />
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E31E24]/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="relative">
            <p className="text-sm text-slate-400">Pipeline Value</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-bold">₹ 45.2L</p>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +12%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Priority Deals</h2>
          <button className="text-sm text-[#E31E24] hover:text-[#c9191f] font-medium transition-colors">
            View All →
          </button>
        </div>
        <div>
          {deals.map((deal) => (
            <div
              key={deal.lead}
              className="flex items-center justify-between p-5 border-b border-gray-50 hover:bg-gray-50/80 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${deal.gradient} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                  {deal.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{deal.lead}</p>
                  <p className="text-xs text-gray-400">{deal.company}</p>
                </div>
              </div>

              <HeatBar level={deal.heat} />

              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-800">{deal.value}</span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-full bg-red-50 text-[#E31E24] hover:bg-red-100 transition-colors">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { AlertTriangle, CalendarClock, Clock, Shield } from "lucide-react";
import { useComplianceDashboard } from "../hooks/useContracta";
import { formatDate, daysUntil } from "../utils/contractaUtils";
import CategoryBadge from "./CategoryBadge";
import StatusBadge from "./StatusBadge";

const metricsMeta = [
  { label: "Total Active Contracts", color: "text-green-500", ring: "border-green-200", bg: "bg-green-50", icon: Shield },
  { label: "Expiring in 30 Days", color: "text-amber-500", ring: "border-amber-200", bg: "bg-amber-50", icon: AlertTriangle },
  { label: "Total Expired", color: "text-red-500", ring: "border-red-200", bg: "bg-red-50", icon: Clock },
];

export default function ComplianceDashboardView() {
  const { summary, loading } = useComplianceDashboard();

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading dashboard...</div>;
  }

  const s = summary || { active: 0, expiringSoon: 0, expired: 0, total: 0, upcomingRenewals: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">High-alert overview of all contracts and compliances</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metricsMeta.map((m) => {
          const Icon = m.icon;
          const value = m.label === "Total Active Contracts" ? s.active : m.label === "Expiring in 30 Days" ? s.expiringSoon : s.expired;
          return (
            <div key={m.label} className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm ${value > 0 && m.label.includes("Expiring") ? "ring-2 ring-amber-300" : value > 0 && m.label.includes("Expired") ? "ring-2 ring-red-300" : ""}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full border-2 ${m.ring} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${value > 0 && m.label.includes("Expiring") ? "text-amber-600" : value > 0 && m.label.includes("Expired") ? "text-red-600" : "text-gray-800"}`}>{value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-500" />
            Upcoming Renewals
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Left</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {s.upcomingRenewals.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  No upcoming renewals
                </td>
              </tr>
            ) : (
              s.upcomingRenewals.map((renewal) => {
                const days = daysUntil(renewal.expiryDate);
                return (
                  <tr key={renewal.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{renewal.title}</td>
                    <td className="px-5 py-3.5"><CategoryBadge category={renewal.category} /></td>
                    <td className="px-5 py-3.5 text-gray-600">{renewal.entityName}</td>
                    <td className="px-5 py-3.5 text-gray-600">{formatDate(renewal.expiryDate)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${days <= 7 ? "text-red-600" : days <= 30 ? "text-amber-600" : "text-green-600"}`}>
                        {days <= 0 ? "Overdue" : `${days}d`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={renewal.status} /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

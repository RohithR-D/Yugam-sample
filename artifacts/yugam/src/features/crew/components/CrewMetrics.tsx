import { CalendarOff, UserCheck, UserX, Users } from "lucide-react";

interface CrewMetricsProps {
  totalCount: number;
  activeCount: number;
  onLeaveCount: number;
  offboardedCount: number;
}

const metricMeta = [
  { key: "totalCount", label: "Total Headcount", icon: Users, iconColor: "text-gray-500", ringColor: "border-gray-200" },
  { key: "activeCount", label: "Active", icon: UserCheck, iconColor: "text-green-600", ringColor: "border-green-200" },
  { key: "onLeaveCount", label: "On Leave", icon: CalendarOff, iconColor: "text-orange-500", ringColor: "border-orange-200" },
  { key: "offboardedCount", label: "Offboarded", icon: UserX, iconColor: "text-red-500", ringColor: "border-red-200" },
] as const;

export default function CrewMetrics({ totalCount, activeCount, onLeaveCount, offboardedCount }: CrewMetricsProps) {
  const values = { totalCount, activeCount, onLeaveCount, offboardedCount };

  return (
    <div className="grid grid-cols-4 gap-4">
      {metricMeta.map((m) => {
        const Icon = m.icon;
        const value = values[m.key];

        return (
          <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full border-2 ${m.ringColor} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${m.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

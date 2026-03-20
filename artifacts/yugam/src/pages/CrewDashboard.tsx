import {
  Users,
  UserCheck,
  CalendarOff,
  AlertCircle,
  Eye,
} from "lucide-react";

const stats = [
  { label: "Total Staff", value: 142, icon: Users, color: "text-gray-800" },
  { label: "Present Today", value: 128, icon: UserCheck, color: "text-green-600" },
  { label: "On Leave", value: 5, icon: CalendarOff, color: "text-orange-500" },
  { label: "Pending Approvals", value: 9, icon: AlertCircle, color: "text-[#E31E24]" },
];

const logs = [
  {
    name: "Aarav Mehta",
    role: "Software Engineer",
    punchIn: "09:02 AM",
    punchOut: "06:15 PM",
    status: "Present",
  },
  {
    name: "Priya Sharma",
    role: "HR Manager",
    punchIn: "09:47 AM",
    punchOut: "06:30 PM",
    status: "Late",
  },
  {
    name: "Rohan Desai",
    role: "Product Designer",
    punchIn: "08:55 AM",
    punchOut: "05:50 PM",
    status: "Present",
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Present"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      {status}
    </span>
  );
}

export default function CrewDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Crew Management</h1>
        <button className="bg-[#E31E24] hover:bg-[#c9191f] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          + Mark Attendance
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4"
            >
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Recent Attendance Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Punch In</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Punch Out</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{log.name}</td>
                  <td className="px-6 py-4 text-gray-600">{log.role}</td>
                  <td className="px-6 py-4 text-gray-600">{log.punchIn}</td>
                  <td className="px-6 py-4 text-gray-600">{log.punchOut}</td>
                  <td className="px-6 py-4"><StatusBadge status={log.status} /></td>
                  <td className="px-6 py-4">
                    <button className="inline-flex items-center gap-1 text-[#E31E24] hover:text-[#c9191f] text-sm font-medium transition-colors">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

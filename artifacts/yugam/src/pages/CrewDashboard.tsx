import { useState, useEffect, useRef } from "react";
import {
  Users,
  UserCheck,
  CalendarOff,
  AlertCircle,
  Eye,
  X,
  Sparkles,
  ChevronDown,
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

const employees = [
  "Aarav Mehta",
  "Priya Sharma",
  "Rohan Desai",
  "Kavya Iyer",
  "Arjun Nair",
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

function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 focus:bg-white transition-all cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function InputField({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 focus:bg-white transition-all"
      />
    </div>
  );
}

function AttendanceModal({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [employee, setEmployee] = useState(employees[0]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [punchIn, setPunchIn] = useState("09:00");
  const [punchOut, setPunchOut] = useState("18:00");
  const [status, setStatus] = useState("Present");
  const [note, setNote] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) {
      e.stopPropagation();
      handleClose();
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-lg overflow-hidden transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="bg-gradient-to-b from-gray-50/80 to-white p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Log Attendance</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-red-50 to-purple-50 text-[#E31E24] border border-red-100/60">
              <Sparkles className="w-3 h-3" />
              AI Auto-detect
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 hover:rotate-90 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <SelectField
            label="Employee"
            options={employees}
            value={employee}
            onChange={setEmployee}
          />

          <div className="grid grid-cols-3 gap-3">
            <InputField label="Date" type="date" value={date} onChange={setDate} />
            <InputField label="Punch In" type="time" value={punchIn} onChange={setPunchIn} />
            <InputField label="Punch Out" type="time" value={punchOut} onChange={setPunchOut} />
          </div>

          <SelectField
            label="Status"
            options={["Present", "Late", "Half-Day"]}
            value={status}
            onChange={setStatus}
          />

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add manager notes or reason for override..."
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleClose}
            className="bg-[#E31E24] hover:bg-red-700 text-white px-6 py-2 rounded-xl font-medium shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all active:scale-95 text-sm"
          >
            Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CrewDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Crew Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#E31E24] hover:bg-[#c9191f] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
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

      {isModalOpen && <AttendanceModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import {
  Users,
  UserCheck,
  CalendarOff,
  Clock,
  Eye,
  Pencil,
  X,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const stats = [
  { label: "Total Staff", value: 142, icon: Users, iconColor: "text-gray-500", ringColor: "border-gray-200" },
  { label: "Present Today", value: 128, icon: UserCheck, iconColor: "text-green-600", ringColor: "border-green-200" },
  { label: "On Leave", value: 5, icon: CalendarOff, iconColor: "text-orange-500", ringColor: "border-orange-200" },
  { label: "Pending Approvals", value: 9, icon: Clock, iconColor: "text-[#E31E24]", ringColor: "border-[#E31E24]" },
];

const logs = [
  {
    name: "Aarav Mehta",
    initials: "AM",
    role: "Software Engineer",
    punchIn: "09:02 AM",
    punchOut: "06:15 PM",
    status: "Present",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    name: "Priya Sharma",
    initials: "PS",
    role: "HR Manager",
    punchIn: "09:47 AM",
    punchOut: "06:30 PM",
    status: "Late",
    gradient: "from-purple-500 to-pink-600",
  },
  {
    name: "Rohan Desai",
    initials: "RD",
    role: "Product Designer",
    punchIn: "08:55 AM",
    punchOut: "05:50 PM",
    status: "Present",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    name: "Kavya Iyer",
    initials: "KI",
    role: "QA Lead",
    punchIn: "",
    punchOut: "",
    status: "Absent",
    gradient: "from-amber-500 to-orange-600",
  },
];

const employees = [
  "Aarav Mehta",
  "Priya Sharma",
  "Rohan Desai",
  "Kavya Iyer",
  "Arjun Nair",
];

function AttendanceTimeline({ punchIn, punchOut, status }: { punchIn: string; punchOut: string; status: string }) {
  if (status === "Absent") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-gray-100 rounded-full relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] text-gray-400 bg-white px-2">No activity</span>
          </div>
        </div>
      </div>
    );
  }

  const barColor = status === "Late" ? "bg-orange-400" : "bg-green-400";
  const dotColor = status === "Late" ? "bg-orange-500" : "bg-green-500";

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-[11px] font-medium text-gray-500 w-16 shrink-0">{punchIn}</span>
      <div className="flex-1 relative h-1.5 bg-gray-100 rounded-full">
        <div className={`absolute inset-y-0 left-0 w-[85%] ${barColor} rounded-full`} />
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 ${dotColor} rounded-full ring-2 ring-white`} />
        <div className={`absolute right-[15%] top-1/2 -translate-y-1/2 w-2.5 h-2.5 ${dotColor} rounded-full ring-2 ring-white`} />
      </div>
      <span className="text-[11px] font-medium text-gray-500 w-16 shrink-0 text-right">{punchOut}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Present: "bg-green-50 text-green-700",
    Late: "bg-orange-50 text-orange-600",
    Absent: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function SelectField({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
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

function InputField({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
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
      className={`fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className={`bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-lg overflow-hidden transition-all duration-200 ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
        <div className="bg-gradient-to-b from-gray-50/80 to-white p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Log Attendance</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-red-50 to-purple-50 text-[#E31E24] border border-red-100/60">
              <Sparkles className="w-3 h-3" />
              AI Auto-detect
            </span>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 hover:rotate-90 transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <SelectField label="Employee" options={employees} value={employee} onChange={setEmployee} />
          <div className="grid grid-cols-3 gap-3">
            <InputField label="Date" type="date" value={date} onChange={setDate} />
            <InputField label="Punch In" type="time" value={punchIn} onChange={setPunchIn} />
            <InputField label="Punch Out" type="time" value={punchOut} onChange={setPunchOut} />
          </div>
          <SelectField label="Status" options={["Present", "Late", "Half-Day"]} value={status} onChange={setStatus} />
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
          <button onClick={handleClose} className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors text-sm font-medium">Cancel</button>
          <button onClick={handleClose} className="bg-[#E31E24] hover:bg-red-700 text-white px-6 py-2 rounded-xl font-medium shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all active:scale-95 text-sm">Save Attendance</button>
        </div>
      </div>
    </div>
  );
}

export default function CrewDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Crew Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Daily Pulse — Attendance & Team Overview</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#E31E24] hover:bg-[#c9191f] text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-lg shadow-red-500/15 hover:shadow-red-500/30 hover:-translate-y-0.5 transition-all"
        >
          + Mark Attendance
        </button>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full border-2 ${stat.ringColor} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-0.5">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Recent Attendance Logs</h2>
          <span className="text-xs text-gray-400">Today, March 20</span>
        </div>
        <div className="divide-y divide-gray-50">
          {logs.map((log) => (
            <div key={log.name} className="px-6 py-4 hover:bg-gray-50/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${log.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                  {log.initials}
                </div>
                <div className="min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{log.name}</p>
                    <StatusPill status={log.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{log.role}</p>
                </div>
                <div className="flex-1 px-4">
                  <AttendanceTimeline punchIn={log.punchIn} punchOut={log.punchOut} status={log.status} />
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && <AttendanceModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

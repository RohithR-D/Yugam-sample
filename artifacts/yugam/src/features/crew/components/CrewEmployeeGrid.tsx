import { Briefcase } from "lucide-react";
import { EmployeeRecord } from "../types";
import { AVATAR_GRADIENTS, formatDate, getInitials } from "../utils/crewUtils";
import StatusPill from "./StatusPill";

interface CrewEmployeeGridProps {
  employees: EmployeeRecord[];
}

export default function CrewEmployeeGrid({ employees }: CrewEmployeeGridProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {employees.map((emp, idx) => (
        <div key={emp.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-red-100 transition-all group">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
              {getInitials(emp.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-800 truncate">{emp.name}</p>
                <StatusPill status={emp.status} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{emp.designation}</p>
              <div className="flex items-center gap-3 mt-2.5">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-gray-400" />
                  <span className="text-[11px] text-gray-400">{emp.department}</span>
                </div>
                <span className="text-[11px] text-gray-300">|</span>
                <span className="text-[11px] text-gray-400">Joined {formatDate(emp.joinDate)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useState } from "react";
import {
  TrendingUp,
  Search,
  IndianRupee,
  Receipt,
  Wallet,
  ChevronDown,
} from "lucide-react";

const salaryData = [
  {
    name: "Aarav Mehta",
    role: "Software Engineer",
    basic: "₹ 65,000",
    allowances: "₹ 18,000",
    deductions: "₹ 12,500",
    net: "₹ 70,500",
    status: "Paid",
  },
  {
    name: "Priya Sharma",
    role: "HR Manager",
    basic: "₹ 55,000",
    allowances: "₹ 15,000",
    deductions: "₹ 10,200",
    net: "₹ 59,800",
    status: "Approved",
  },
  {
    name: "Rohan Desai",
    role: "Product Designer",
    basic: "₹ 60,000",
    allowances: "₹ 16,500",
    deductions: "₹ 11,800",
    net: "₹ 64,700",
    status: "Draft",
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Paid: "bg-green-50 text-green-700 border-green-200",
    Approved: "bg-blue-50 text-blue-600 border-blue-200",
    Draft: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function CrewPayDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800">Payroll & Settlements</h1>
          <button className="ml-4 inline-flex items-center gap-1.5 text-sm text-gray-500 bg-gray-100 rounded-md px-3 py-1 hover:bg-gray-200 transition-colors">
            March 2026
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <button className="bg-[#E31E24] hover:bg-[#c9191f] text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all">
          Run Payroll
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gray-900 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <IndianRupee className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400">
              <TrendingUp className="w-3.5 h-3.5" />
              +4.2%
            </span>
          </div>
          <p className="text-sm text-gray-400">Total Payout</p>
          <p className="text-2xl font-bold mt-1">₹ 14,25,000</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="p-2 bg-orange-50 rounded-lg w-fit mb-3">
            <Receipt className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-sm text-gray-500">Deductions / Taxes</p>
          <p className="text-2xl font-bold mt-1 text-orange-500">₹ 1,85,000</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="p-2 bg-red-50 rounded-lg w-fit mb-3">
            <Wallet className="w-5 h-5 text-[#E31E24]" />
          </div>
          <p className="text-sm text-gray-500">Net Payable</p>
          <p className="text-2xl font-bold mt-1 text-[#E31E24]">₹ 12,40,000</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Employee Salary Details</h2>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 w-64">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Basic Pay</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Allowances</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Salary</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {salaryData
                .filter((row) =>
                  row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  row.role.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((row) => (
                  <tr key={row.name} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{row.name}</p>
                        <p className="text-xs text-gray-400">{row.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{row.basic}</td>
                    <td className="px-6 py-4 text-gray-600">{row.allowances}</td>
                    <td className="px-6 py-4 text-gray-600">{row.deductions}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{row.net}</td>
                    <td className="px-6 py-4"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

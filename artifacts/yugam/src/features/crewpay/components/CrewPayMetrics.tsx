import { IndianRupee, Receipt, UserCheck, Wallet } from "lucide-react";
import { formatCurrencyShort } from "../utils/crewPayUtils";

interface CrewPayMetricsProps {
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  paidCount: number;
}

export default function CrewPayMetrics({ totalGross, totalDeductions, totalNet, paidCount }: CrewPayMetricsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-gray-900 text-white rounded-xl p-5 shadow-lg">
        <div className="p-2 bg-white/10 rounded-lg w-fit mb-3">
          <IndianRupee className="w-5 h-5" />
        </div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Gross</p>
        <p className="text-2xl font-bold mt-0.5">{formatCurrencyShort(totalGross)}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="p-2 bg-orange-50 rounded-lg w-fit mb-3">
          <Receipt className="w-5 h-5 text-orange-500" />
        </div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Deductions</p>
        <p className="text-2xl font-bold text-orange-500 mt-0.5">{formatCurrencyShort(totalDeductions)}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="p-2 bg-red-50 rounded-lg w-fit mb-3">
          <Wallet className="w-5 h-5 text-[#E31E24]" />
        </div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Net Payable</p>
        <p className="text-2xl font-bold text-[#E31E24] mt-0.5">{formatCurrencyShort(totalNet)}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="p-2 bg-green-50 rounded-lg w-fit mb-3">
          <UserCheck className="w-5 h-5 text-green-600" />
        </div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Employees Paid</p>
        <p className="text-2xl font-bold text-green-600 mt-0.5">{paidCount}</p>
      </div>
    </div>
  );
}

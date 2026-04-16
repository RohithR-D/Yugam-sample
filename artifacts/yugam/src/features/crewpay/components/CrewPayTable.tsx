import { PayrollRecord } from "../types";
import { formatCurrency } from "../utils/crewPayUtils";
import StatusBadge from "./StatusBadge";

interface CrewPayTableProps {
  loading: boolean;
  records: PayrollRecord[];
}

export default function CrewPayTable({ loading, records }: CrewPayTableProps) {
  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading payroll...</div>;
  }

  if (records.length === 0) {
    return <div className="text-center py-12 text-gray-400">No payroll records found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pay Period</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Pay</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Pay</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <p className="font-medium text-gray-800">{r.employeeName}</p>
              </td>
              <td className="px-6 py-4 text-gray-500">{r.payPeriod}</td>
              <td className="px-6 py-4 text-gray-600">{formatCurrency(r.grossPay)}</td>
              <td className="px-6 py-4 text-gray-600">{formatCurrency(r.deductions)}</td>
              <td className="px-6 py-4 font-bold text-gray-800">{formatCurrency(r.netPay)}</td>
              <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

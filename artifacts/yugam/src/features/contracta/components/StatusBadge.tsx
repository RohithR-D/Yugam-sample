import { FC } from "react";

const styles: Record<string, string> = {
  Active: "bg-green-50 text-green-600 border-green-200",
  "Expiring Soon": "bg-amber-50 text-amber-600 border-amber-200",
  Expired: "bg-red-50 text-red-600 border-red-200",
};

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: FC<StatusBadgeProps> = ({ status }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
    {status}
  </span>
);

export default StatusBadge;

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    Paid: "bg-green-50 text-green-700 border-green-200",
    Processing: "bg-orange-50 text-orange-600 border-orange-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
      {status}
    </span>
  );
}

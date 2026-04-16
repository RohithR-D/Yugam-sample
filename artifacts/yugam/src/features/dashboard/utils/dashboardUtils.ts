export function formatCurrency(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    Done: "bg-emerald-100 text-emerald-700",
    "In Progress": "bg-blue-100 text-blue-700",
    "To Do": "bg-gray-100 text-gray-600",
    "In Review": "bg-amber-100 text-amber-700",
    Blocked: "bg-red-100 text-red-700",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

export function getPriorityDot(priority: string): string {
  const map: Record<string, string> = {
    Critical: "bg-red-500",
    High: "bg-orange-500",
    Medium: "bg-amber-400",
    Low: "bg-green-500",
  };
  return map[priority] || "bg-gray-400";
}

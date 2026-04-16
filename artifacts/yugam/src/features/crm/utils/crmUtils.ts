export const PIPELINE_STAGES = ["Lead", "Contacted", "Proposal", "Won", "Lost"] as const;

export const STAGE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Lead: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  Contacted: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  Proposal: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  Won: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", dot: "bg-green-500" },
  Lost: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
};

const avatarGradients = [
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-green-600",
  "from-sky-500 to-blue-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-teal-500 to-cyan-600",
  "from-red-500 to-rose-600",
  "from-indigo-500 to-violet-600",
];

export function getInitials(name: string) {
  return name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
}

export function getGradient(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index++) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

export function formatCurrency(value: string) {
  const num = parseFloat(value);
  if (isNaN(num)) return "Rs 0";
  if (num >= 10000000) return `Rs ${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `Rs ${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `Rs ${(num / 1000).toFixed(1)}K`;
  return `Rs ${num.toFixed(0)}`;
}

export function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null) {
  if (!value) return "";
  const dt = new Date(value);
  return (
    dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
    ", " +
    dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  );
}

import { Bell, Building2, CreditCard, Puzzle, SlidersHorizontal, UsersRound } from "lucide-react";

export const menuItems = [
  { label: "Company Profile", icon: Building2 },
  { label: "User Management", icon: UsersRound },
  { label: "Preferences", icon: SlidersHorizontal },
  { label: "Billing & Plans", icon: CreditCard },
  { label: "Integrations", icon: Puzzle },
  { label: "Notifications", icon: Bell },
];

export const roleStyles: Record<string, string> = {
  Admin: "bg-red-50 text-red-600",
  Manager: "bg-blue-50 text-blue-600",
  Employee: "bg-gray-100 text-gray-600",
  Viewer: "bg-purple-50 text-purple-600",
};

const avatarGradients = [
  "from-red-500 to-rose-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-green-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-violet-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-teal-600",
  "from-yellow-500 to-amber-600",
];

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

export function timeAgo(dateStr: string | null) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

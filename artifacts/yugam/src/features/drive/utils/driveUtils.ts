import { FileCode, FileSpreadsheet, FileText, FileVideo, Image } from "lucide-react";

export function getFileType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["pdf", "docx", "doc", "txt"].includes(ext)) return "document";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) return "image";
  if (["xlsx", "xls", "csv"].includes(ext)) return "spreadsheet";
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return "video";
  if (["json", "js", "ts", "html", "css", "xml"].includes(ext)) return "code";
  return "document";
}

export const fileIconMap: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  document: { icon: FileText, color: "text-red-500", bg: "bg-red-50" },
  image: { icon: Image, color: "text-blue-500", bg: "bg-blue-50" },
  spreadsheet: { icon: FileSpreadsheet, color: "text-green-500", bg: "bg-green-50" },
  video: { icon: FileVideo, color: "text-purple-500", bg: "bg-purple-50" },
  code: { icon: FileCode, color: "text-amber-500", bg: "bg-amber-50" },
};

const gradients = [
  "from-red-500 to-rose-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-green-600",
  "from-purple-500 to-violet-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-sky-500 to-blue-600",
  "from-teal-500 to-cyan-600",
];

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

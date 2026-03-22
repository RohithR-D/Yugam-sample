import { useState } from "react";
import {
  Search,
  CloudUpload,
  FolderPlus,
  HardDrive,
  FileStack,
  Share2,
  Trash2,
  Folder,
  Eye,
  Link,
  Download,
  FileText,
  Image,
  FileSpreadsheet,
  FileVideo,
  FileCode,
} from "lucide-react";

const metrics = [
  { label: "Storage Used", value: "485 GB / 1 TB", icon: HardDrive, iconColor: "text-blue-500", ringColor: "border-blue-200", progress: 48.5 },
  { label: "Total Files", value: "12,480", icon: FileStack, iconColor: "text-orange-500", ringColor: "border-orange-200" },
  { label: "Shared Externally", value: "234", icon: Share2, iconColor: "text-purple-500", ringColor: "border-purple-200" },
  { label: "Trash", value: "18", icon: Trash2, iconColor: "text-red-500", ringColor: "border-red-200" },
];

const folders = [
  { name: "Brand Assets", count: 128, color: "text-blue-500" },
  { name: "HR Policies", count: 45, color: "text-yellow-500" },
  { name: "Invoices 2026", count: 312, color: "text-blue-500" },
  { name: "Legal Templates", count: 67, color: "text-yellow-500" },
];

interface FileEntry {
  name: string;
  size: string;
  type: "pdf" | "image" | "spreadsheet" | "video" | "code";
  uploadedBy: { name: string; initials: string; gradient: string };
  modified: string;
}

const files: FileEntry[] = [
  { name: "Q1_Revenue_Report.pdf", size: "2.4 MB", type: "pdf", uploadedBy: { name: "Arjun Nair", initials: "AN", gradient: "from-red-500 to-rose-600" }, modified: "22 Mar 2026" },
  { name: "brand_logo_final.png", size: "8.1 MB", type: "image", uploadedBy: { name: "Meera Joshi", initials: "MJ", gradient: "from-blue-500 to-indigo-600" }, modified: "21 Mar 2026" },
  { name: "Employee_Payroll_Mar.xlsx", size: "1.7 MB", type: "spreadsheet", uploadedBy: { name: "Suresh Patel", initials: "SP", gradient: "from-emerald-500 to-green-600" }, modified: "20 Mar 2026" },
  { name: "product_demo_v2.mp4", size: "145 MB", type: "video", uploadedBy: { name: "Kavya Iyer", initials: "KI", gradient: "from-purple-500 to-violet-600" }, modified: "19 Mar 2026" },
  { name: "api_schema_v3.json", size: "42 KB", type: "code", uploadedBy: { name: "Rohan Desai", initials: "RD", gradient: "from-amber-500 to-orange-600" }, modified: "18 Mar 2026" },
];

const fileIcons: Record<FileEntry["type"], { icon: typeof FileText; color: string; bg: string }> = {
  pdf: { icon: FileText, color: "text-red-500", bg: "bg-red-50" },
  image: { icon: Image, color: "text-blue-500", bg: "bg-blue-50" },
  spreadsheet: { icon: FileSpreadsheet, color: "text-green-500", bg: "bg-green-50" },
  video: { icon: FileVideo, color: "text-purple-500", bg: "bg-purple-50" },
  code: { icon: FileCode, color: "text-amber-500", bg: "bg-amber-50" },
};

export default function DriveDashboard() {
  const [search, setSearch] = useState("");

  const filtered = files.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.uploadedBy.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drive Storage</h1>
          <p className="text-sm text-gray-400 mt-0.5">Centralized company documents and media assets</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
            <CloudUpload className="w-4 h-4" />
            Upload File
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full border-2 ${m.ringColor} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${m.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-0.5">{m.value}</p>
                </div>
              </div>
              {m.progress !== undefined && (
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.progress}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Quick Folders</p>
        <div className="grid grid-cols-4 gap-4 mt-3">
          {folders.map((f) => (
            <div
              key={f.name}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-3 hover:border-red-100 cursor-pointer transition-all"
            >
              <Folder className={`w-8 h-8 ${f.color} shrink-0`} />
              <div>
                <p className="text-sm font-semibold text-gray-800">{f.name}</p>
                <p className="text-xs text-gray-400">{f.count} files</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search files, folders, or owners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((f) => {
          const ft = fileIcons[f.type];
          const FIcon = ft.icon;
          return (
            <div
              key={f.name}
              className="bg-white border border-gray-50 rounded-lg p-4 shadow-sm flex items-center justify-between hover:border-red-100 transition-all"
            >
              <div className="flex items-center gap-3 min-w-[220px]">
                <div className={`p-2 rounded-lg ${ft.bg}`}>
                  <FIcon className={`w-5 h-5 ${ft.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.name}</p>
                  <p className="text-xs text-gray-400">{f.size}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 min-w-[160px]">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${f.uploadedBy.gradient} flex items-center justify-center text-white text-[8px] font-bold shrink-0`}>
                  {f.uploadedBy.initials}
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">{f.uploadedBy.name}</p>
                  <p className="text-[11px] text-gray-400">{f.modified}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button className="p-2 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors" title="Preview">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Share">
                  <Link className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Download">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

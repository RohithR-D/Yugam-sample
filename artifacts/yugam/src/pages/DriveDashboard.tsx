import { useState, useEffect, useCallback } from "react";
import {
  Search,
  CloudUpload,
  FolderPlus,
  HardDrive,
  FileStack,
  Folder,
  Eye,
  Link,
  Download,
  FileText,
  Image,
  FileSpreadsheet,
  FileVideo,
  FileCode,
  X,
  Plus,
  FolderOpen,
} from "lucide-react";

interface FileRecord {
  id: number;
  fileName: string;
  folder: string;
  size: string;
  uploadedBy: string;
  uploadDate: string;
  createdAt: string | null;
}

function getFileType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["pdf", "docx", "doc", "txt"].includes(ext)) return "document";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) return "image";
  if (["xlsx", "xls", "csv"].includes(ext)) return "spreadsheet";
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return "video";
  if (["json", "js", "ts", "html", "css", "xml"].includes(ext)) return "code";
  return "document";
}

const fileIconMap: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  document: { icon: FileText, color: "text-red-500", bg: "bg-red-50" },
  image: { icon: Image, color: "text-blue-500", bg: "bg-blue-50" },
  spreadsheet: { icon: FileSpreadsheet, color: "text-green-500", bg: "bg-green-50" },
  video: { icon: FileVideo, color: "text-purple-500", bg: "bg-purple-50" },
  code: { icon: FileCode, color: "text-amber-500", bg: "bg-amber-50" },
};

function FolderPill({ folder }: { folder: string }) {
  const styles: Record<string, string> = {
    Corporate: "bg-blue-50 text-blue-600",
    HR: "bg-purple-50 text-purple-600",
    Finance: "bg-green-50 text-green-600",
    Legal: "bg-orange-50 text-orange-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[folder] || "bg-gray-100 text-gray-600"}`}>
      {folder}
    </span>
  );
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function getGradient(name: string) {
  const gradients = ["from-red-500 to-rose-600", "from-blue-500 to-indigo-600", "from-emerald-500 to-green-600", "from-purple-500 to-violet-600", "from-amber-500 to-orange-600", "from-pink-500 to-rose-600", "from-sky-500 to-blue-600", "from-teal-500 to-cyan-600"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DriveDashboard() {
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ fileName: "", folder: "Corporate", size: "", uploadedBy: "", uploadDate: new Date().toISOString().split("T")[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      if (res.ok) setFiles(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to upload file");
        return;
      }
      setShowModal(false);
      setFormData({ fileName: "", folder: "Corporate", size: "", uploadedBy: "", uploadDate: new Date().toISOString().split("T")[0] });
      await fetchFiles();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = files.filter(
    (f) =>
      f.fileName.toLowerCase().includes(search.toLowerCase()) ||
      f.folder.toLowerCase().includes(search.toLowerCase()) ||
      f.uploadedBy.toLowerCase().includes(search.toLowerCase())
  );

  const totalFiles = files.length;
  const folderSet = new Set(files.map((f) => f.folder));
  const folderCount = folderSet.size;
  const folderCounts = Array.from(folderSet).map((folder) => ({
    name: folder,
    count: files.filter((f) => f.folder === folder).length,
  })).sort((a, b) => b.count - a.count);

  const folderColors: Record<string, string> = { Corporate: "text-blue-500", HR: "text-purple-500", Finance: "text-green-500", Legal: "text-orange-500" };

  const metrics = [
    { label: "Total Files", value: totalFiles.toString(), icon: FileStack, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Folders", value: folderCount.toString(), icon: FolderOpen, iconColor: "text-orange-500", ringColor: "border-orange-200" },
    { label: "Uploaders", value: new Set(files.map((f) => f.uploadedBy)).size.toString(), icon: HardDrive, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Recent (7 Days)", value: files.filter((f) => new Date(f.uploadDate) >= new Date(Date.now() - 7 * 86400000)).length.toString(), icon: CloudUpload, iconColor: "text-purple-500", ringColor: "border-purple-200" },
  ];

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
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
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
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-0.5">{m.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {folderCounts.length > 0 && (
        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Folders</p>
          <div className="grid grid-cols-4 gap-4 mt-3">
            {folderCounts.map((f) => (
              <div key={f.name} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-3 hover:border-red-100 cursor-pointer transition-all">
                <Folder className={`w-8 h-8 ${folderColors[f.name] || "text-gray-400"} shrink-0`} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.name}</p>
                  <p className="text-xs text-gray-400">{f.count} files</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search files, folders, or uploaders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading files...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">File</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Folder</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded By</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No files found</td></tr>
              ) : (
                filtered.map((f) => {
                  const ft = fileIconMap[getFileType(f.fileName)] || fileIconMap.document;
                  const FIcon = ft.icon;
                  return (
                    <tr key={f.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${ft.bg} shrink-0`}>
                            <FIcon className={`w-4 h-4 ${ft.color}`} />
                          </div>
                          <span className="font-medium text-gray-800">{f.fileName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4"><FolderPill folder={f.folder} /></td>
                      <td className="px-5 py-4 text-xs text-gray-500">{f.size}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getGradient(f.uploadedBy)} flex items-center justify-center text-white text-[8px] font-bold shrink-0`}>
                            {getInitials(f.uploadedBy)}
                          </div>
                          <span className="text-xs text-gray-600 font-medium">{f.uploadedBy}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{formatDate(f.uploadDate)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Upload File</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">File Name</label>
                <input type="text" required value={formData.fileName} onChange={(e) => setFormData({ ...formData, fileName: e.target.value })} placeholder="e.g., Annual_Report_2026.pdf" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Uploaded By</label>
                <input type="text" required value={formData.uploadedBy} onChange={(e) => setFormData({ ...formData, uploadedBy: e.target.value })} placeholder="e.g., Arjun Nair" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Folder</label>
                  <select value={formData.folder} onChange={(e) => setFormData({ ...formData, folder: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors bg-white">
                    <option value="Corporate">Corporate</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Size</label>
                  <input type="text" required value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} placeholder="e.g., 2.4 MB" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Upload Date</label>
                <input type="date" required value={formData.uploadDate} onChange={(e) => setFormData({ ...formData, uploadDate: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Uploading..." : "Upload File"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

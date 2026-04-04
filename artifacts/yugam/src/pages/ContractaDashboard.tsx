import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useModule } from "@/context/ModuleContext";
import {
  Search, FileText, FileCheck, Shield, FileSignature, Plus, X,
  LayoutDashboard, AlertTriangle, CalendarClock, Clock, Printer,
  ChevronDown, Trash2, Save, Eye,
} from "lucide-react";

interface Compliance {
  id: number;
  title: string;
  category: string;
  entityName: string;
  validFrom: string;
  expiryDate: string;
  status: string;
  attachmentUrl: string | null;
  notes: string | null;
  createdAt: string | null;
}

interface Template {
  id: number;
  templateName: string;
  category: string;
  contentHtml: string;
  createdAt: string | null;
  updatedAt: string | null;
}

interface DashboardSummary {
  active: number;
  expiringSoon: number;
  expired: number;
  total: number;
  upcomingRenewals: Compliance[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-green-50 text-green-600 border-green-200",
    "Expiring Soon": "bg-amber-50 text-amber-600 border-amber-200",
    Expired: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    Client: "bg-blue-50 text-blue-600",
    Vendor: "bg-purple-50 text-purple-600",
    Statutory: "bg-rose-50 text-rose-600",
    HR: "bg-teal-50 text-teal-600",
    Legal: "bg-indigo-50 text-indigo-600",
    General: "bg-gray-50 text-gray-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[category] || "bg-gray-100 text-gray-600"}`}>
      {category}
    </span>
  );
}

function ComplianceDashboardView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/contracta/dashboard-summary");
        if (res.ok) setSummary(await res.json());
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading dashboard...</div>;

  const s = summary || { active: 0, expiringSoon: 0, expired: 0, total: 0, upcomingRenewals: [] };

  const metrics = [
    { label: "Total Active Contracts", value: s.active, icon: Shield, color: "text-green-500", ring: "border-green-200", bg: "bg-green-50" },
    { label: "Expiring in 30 Days", value: s.expiringSoon, icon: AlertTriangle, color: "text-amber-500", ring: "border-amber-200", bg: "bg-amber-50" },
    { label: "Total Expired", value: s.expired, icon: Clock, color: "text-red-500", ring: "border-red-200", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">High-alert overview of all contracts and compliances</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm ${m.value > 0 && m.label.includes("Expiring") ? "ring-2 ring-amber-300" : ""} ${m.value > 0 && m.label.includes("Expired") ? "ring-2 ring-red-300" : ""}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full border-2 ${m.ring} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${m.value > 0 && m.label.includes("Expiring") ? "text-amber-600" : m.value > 0 && m.label.includes("Expired") ? "text-red-600" : "text-gray-800"}`}>{m.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-500" />
            Upcoming Renewals
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Left</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {s.upcomingRenewals.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No upcoming renewals</td></tr>
            ) : (
              s.upcomingRenewals.map((r) => {
                const days = daysUntil(r.expiryDate);
                return (
                  <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{r.title}</td>
                    <td className="px-5 py-3.5"><CategoryBadge category={r.category} /></td>
                    <td className="px-5 py-3.5 text-gray-600">{r.entityName}</td>
                    <td className="px-5 py-3.5 text-gray-600">{formatDate(r.expiryDate)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${days <= 7 ? "text-red-600" : days <= 30 ? "text-amber-600" : "text-green-600"}`}>
                        {days <= 0 ? "Overdue" : `${days}d`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplianceTableView({ category, title, subtitle }: { category: string; title: string; subtitle: string }) {
  const [records, setRecords] = useState<Compliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "", entityName: "", validFrom: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch(`/api/contracta/compliances?category=${category}`);
      if (res.ok) setRecords(await res.json());
    } catch {} finally { setLoading(false); }
  }, [category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await authFetch("/api/contracta/compliances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, category }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create");
        return;
      }
      setShowModal(false);
      setFormData({ title: "", entityName: "", validFrom: new Date().toISOString().split("T")[0], expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0], notes: "" });
      await fetchData();
    } catch { setError("Network error"); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this record?")) return;
    await authFetch(`/api/contracta/compliances/${id}`, { method: "DELETE" });
    await fetchData();
  };

  const filtered = records.filter(
    (r) => r.title.toLowerCase().includes(search.toLowerCase()) || r.entityName.toLowerCase().includes(search.toLowerCase())
  );

  const isStatutory = category === "Statutory";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all">
          <Plus className="w-4 h-4" />
          Upload Contract
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input type="search" placeholder="Search by title or entity..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valid From</th>
                <th className={`text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${isStatutory ? "text-red-500" : "text-gray-500"}`}>Expiry Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No records found</td></tr>
              ) : (
                filtered.map((r) => {
                  const days = daysUntil(r.expiryDate);
                  return (
                    <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-medium text-gray-800">{r.title}</td>
                      <td className="px-5 py-3.5 text-gray-600">{r.entityName}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(r.validFrom)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${isStatutory && days <= 30 ? "text-red-600 font-bold" : "text-gray-500"}`}>
                            {formatDate(r.expiryDate)}
                          </span>
                          {days <= 30 && days > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">{days}d left</span>
                          )}
                          {days <= 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">OVERDUE</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
              <h2 className="text-lg font-bold text-gray-900">Upload Contract</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Annual Maintenance Contract" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Entity Name</label>
                <input type="text" required value={formData.entityName} onChange={(e) => setFormData({ ...formData, entityName: e.target.value })} placeholder={category === "Client" ? "Client company name" : category === "Vendor" ? "Vendor company name" : "Issuing authority"} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Valid From</label>
                  <input type="date" required value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Expiry Date</label>
                  <input type="date" required value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes (optional)</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 resize-none" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50">{submitting ? "Saving..." : "Save Contract"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const PLACEHOLDER_VARIABLES = [
  "{{Employee_Name}}", "{{Date}}", "{{Salary}}", "{{Designation}}",
  "{{Department}}", "{{Join_Date}}", "{{Company_Name}}", "{{Manager_Name}}",
  "{{Address}}", "{{Employee_ID}}", "{{Notice_Period}}", "{{Effective_Date}}",
];

function LetterDocBuilderView() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string>("HR");
  const [saving, setSaving] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("HR");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showVarDropdown, setShowVarDropdown] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await authFetch("/api/contracta/templates");
      if (res.ok) setTemplates(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const selectTemplate = (t: Template) => {
    setSelectedTemplate(t);
    setEditorContent(t.contentHtml);
    setTemplateName(t.templateName);
    setTemplateCategory(t.category);
    if (editorRef.current) {
      editorRef.current.innerHTML = t.contentHtml;
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setEditorContent(editorRef.current.innerHTML);
    }
  };

  const insertVariable = (variable: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.className = "inline-block bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5";
      span.contentEditable = "false";
      span.textContent = variable;
      range.deleteContents();
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current.innerHTML += `<span class="inline-block bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5" contenteditable="false">${variable}</span>&nbsp;`;
    }
    setEditorContent(editorRef.current.innerHTML);
    setShowVarDropdown(false);
  };

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      await authFetch(`/api/contracta/templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateName, category: templateCategory, contentHtml: editorContent }),
      });
      await fetchTemplates();
    } catch {} finally { setSaving(false); }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await authFetch("/api/contracta/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateName: newName, category: newCategory, contentHtml: "" }),
      });
      if (res.ok) {
        const created = await res.json();
        await fetchTemplates();
        selectTemplate(created);
        setShowNewModal(false);
        setNewName("");
      }
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this template?")) return;
    await authFetch(`/api/contracta/templates/${id}`, { method: "DELETE" });
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
      setEditorContent("");
      setTemplateName("");
      if (editorRef.current) editorRef.current.innerHTML = "";
    }
    await fetchTemplates();
  };

  const printContent = useMemo(() => {
    let html = editorContent;
    PLACEHOLDER_VARIABLES.forEach((v) => {
      const regex = new RegExp(v.replace(/[{}]/g, "\\$&"), "g");
      html = html.replace(regex, `<span style="color:#E31E24;text-decoration:underline">${v}</span>`);
    });
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    tempDiv.querySelectorAll("span[contenteditable]").forEach((el) => {
      const text = el.textContent || "";
      const replacement = document.createElement("span");
      replacement.style.color = "#E31E24";
      replacement.style.textDecoration = "underline";
      replacement.textContent = text;
      el.replaceWith(replacement);
    });
    return tempDiv.innerHTML;
  }, [editorContent]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>${templateName || "Document"}</title>
      <style>
        @page { margin: 2.5cm 2cm; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; color: #222; padding: 0; margin: 0; }
        h1, h2, h3 { font-family: Arial, sans-serif; }
        p { margin: 0 0 8pt; }
        span[style*="underline"] { border-bottom: 1px solid #E31E24; padding-bottom: 1px; }
      </style></head>
      <body>${printContent}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const categoryIcons: Record<string, string> = { HR: "bg-teal-50 text-teal-600", Legal: "bg-indigo-50 text-indigo-600", General: "bg-gray-50 text-gray-600" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Letter & Doc Builder</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create templates with dynamic placeholders for HR & Legal documents</p>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Templates</span>
            <button onClick={() => setShowNewModal(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors" title="New Template">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="text-center py-6 text-xs text-gray-400">Loading...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">No templates yet</div>
            ) : (
              templates.map((t) => (
                <div key={t.id} className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${selectedTemplate?.id === t.id ? "bg-[#E31E24]/10 text-[#E31E24]" : "text-gray-600 hover:bg-gray-50"}`} onClick={() => selectTemplate(t)}>
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{t.templateName}</p>
                    <p className={`text-[10px] ${selectedTemplate?.id === t.id ? "text-[#E31E24]/60" : "text-gray-400"}`}>{t.category}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          {!selectedTemplate ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileSignature className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">Select a template or create a new one</p>
                <p className="text-xs text-gray-400 mt-1">Use the panel on the left to get started</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-gray-100 flex items-center gap-3">
                <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="text-sm font-semibold text-gray-800 border-none outline-none bg-transparent flex-1" placeholder="Template Name" />
                <select value={templateCategory} onChange={(e) => setTemplateCategory(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white">
                  <option value="HR">HR</option>
                  <option value="Legal">Legal</option>
                  <option value="General">General</option>
                </select>
                <div className="flex items-center gap-1.5">
                  <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] disabled:opacity-50 transition-all">
                    <Save className="w-3 h-3" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setShowPrintPreview(true)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                  <button onClick={handlePrint} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                    <Printer className="w-3 h-3" />
                    Print
                  </button>
                </div>
              </div>

              <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1 flex-wrap">
                <button onClick={() => execCmd("bold")} className="p-1.5 rounded text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors" title="Bold">B</button>
                <button onClick={() => execCmd("italic")} className="p-1.5 rounded text-xs italic text-gray-600 hover:bg-gray-100 transition-colors" title="Italic">I</button>
                <button onClick={() => execCmd("underline")} className="p-1.5 rounded text-xs underline text-gray-600 hover:bg-gray-100 transition-colors" title="Underline">U</button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={() => execCmd("formatBlock", "h1")} className="p-1.5 rounded text-xs font-bold text-gray-600 hover:bg-gray-100">H1</button>
                <button onClick={() => execCmd("formatBlock", "h2")} className="p-1.5 rounded text-xs font-bold text-gray-600 hover:bg-gray-100">H2</button>
                <button onClick={() => execCmd("formatBlock", "h3")} className="p-1.5 rounded text-xs font-bold text-gray-600 hover:bg-gray-100">H3</button>
                <button onClick={() => execCmd("formatBlock", "p")} className="p-1.5 rounded text-xs text-gray-600 hover:bg-gray-100">P</button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={() => execCmd("insertUnorderedList")} className="p-1.5 rounded text-xs text-gray-600 hover:bg-gray-100" title="Bullet List">&#8226; List</button>
                <button onClick={() => execCmd("insertOrderedList")} className="p-1.5 rounded text-xs text-gray-600 hover:bg-gray-100" title="Numbered List">1. List</button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={() => execCmd("justifyLeft")} className="p-1.5 rounded text-xs text-gray-600 hover:bg-gray-100">Left</button>
                <button onClick={() => execCmd("justifyCenter")} className="p-1.5 rounded text-xs text-gray-600 hover:bg-gray-100">Center</button>
                <button onClick={() => execCmd("justifyRight")} className="p-1.5 rounded text-xs text-gray-600 hover:bg-gray-100">Right</button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <div className="relative">
                  <button onClick={() => setShowVarDropdown(!showVarDropdown)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    Insert Variable
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showVarDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto py-1">
                      {PLACEHOLDER_VARIABLES.map((v) => (
                        <button key={v} onClick={() => insertVariable(v)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-mono">
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onBlur={handleEditorInput}
                className="flex-1 overflow-y-auto p-6 outline-none text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none"
                style={{ minHeight: 200, fontFamily: "'Times New Roman', serif" }}
                dangerouslySetInnerHTML={{ __html: editorContent }}
              />
            </>
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNewModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Template</h2>
              <button onClick={() => setShowNewModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Template Name</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Onboarding Letter" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 bg-white">
                  <option value="HR">HR</option>
                  <option value="Legal">Legal</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleCreate} disabled={!newName.trim() || saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50">{saving ? "Creating..." : "Create Template"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrintPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPrintPreview(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Print Preview</h2>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] transition-all">
                  <Printer className="w-4 h-4" />
                  Generate & Print
                </button>
                <button onClick={() => setShowPrintPreview(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8" style={{ fontFamily: "'Times New Roman', serif" }}>
              <div className="max-w-xl mx-auto prose prose-sm" dangerouslySetInnerHTML={{ __html: printContent }} />
            </div>
            <div className="px-6 py-3 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">This preview is optimized for printing on pre-printed company letterheads. No headers/footers will appear.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContractaDashboard() {
  const { activeModule } = useModule();
  const sub = activeModule.startsWith("Contracta:") ? activeModule.replace("Contracta:", "") : "Compliance Dashboard";

  switch (sub) {
    case "Compliance Dashboard":
      return <ComplianceDashboardView />;
    case "Client Agreements":
      return <ComplianceTableView category="Client" title="Client Agreements" subtitle="Manage client contracts, service agreements, and NDAs" />;
    case "Vendor Contracts":
      return <ComplianceTableView category="Vendor" title="Vendor Contracts" subtitle="Track vendor agreements, supply contracts, and purchase terms" />;
    case "Statutory Compliances":
      return <ComplianceTableView category="Statutory" title="Statutory Compliances" subtitle="Government licenses, factory permits, and regulatory compliances" />;
    case "Letter & Doc Builder":
      return <LetterDocBuilderView />;
    default:
      return <ComplianceDashboardView />;
  }
}

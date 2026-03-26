import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  Download,
  FileText,
  FileClock,
  Send,
  FileCheck2,
  FileX2,
  Plus,
  X,
  BookOpen,
  BarChart3,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Trash2,
  ArrowLeft,
  Tag,
  Clock,
  IndianRupee,
  Layers,
  Save,
  PlusCircle,
} from "lucide-react";

type TabType = "proposals" | "catalog" | "analytics";

interface ProposalRecord {
  id: number;
  clientId: number | null;
  title: string;
  status: string;
  totalEstimatedHours: string;
  grandTotal: string;
  proposalData?: any;
  createdAt: string | null;
  updatedAt: string | null;
  clientName: string | null;
}

interface CatalogItem {
  id: number;
  templateName: string;
  description: string;
  tags: string;
  baseHours: string;
  baseRate: string;
  createdAt: string | null;
}

interface Feature {
  id: string;
  description: string;
  hours: number;
  rate: number;
}

interface Category {
  id: string;
  name: string;
  features: Feature[];
}

function genId() {
  return Math.random().toString(36).substring(2, 10);
}

function formatCurrency(val: string | number) {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "₹ 0";
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹ ${(num / 1000).toFixed(1)}K`;
  return `₹ ${num.toLocaleString("en-IN")}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-600 border-gray-200",
    Sent: "bg-blue-50 text-blue-600 border-blue-200",
    Accepted: "bg-green-50 text-green-600 border-green-200",
    Rejected: "bg-red-50 text-red-600 border-red-200",
    Revised: "bg-orange-50 text-orange-600 border-orange-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

function ServiceCatalogView() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ templateName: "", description: "", tags: "", baseHours: "", baseRate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const res = await authFetch("/api/service-catalog");
      if (res.ok) setItems(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await authFetch("/api/service-catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setShowModal(false);
      setFormData({ templateName: "", description: "", tags: "", baseHours: "", baseRate: "" });
      await fetchItems();
    } catch { setError("Network error"); } finally { setSubmitting(false); }
  };

  const tagColors = ["bg-blue-50 text-blue-600", "bg-purple-50 text-purple-600", "bg-green-50 text-green-600", "bg-orange-50 text-orange-600", "bg-pink-50 text-pink-600", "bg-teal-50 text-teal-600"];

  if (loading) return <div className="text-center py-12 text-gray-400">Loading catalog...</div>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{items.length} service templates</p>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all">
          <Plus className="w-4 h-4" /> Add Template
        </button>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {items.map((item) => {
          const tags = item.tags.split(",").map((t) => t.trim()).filter(Boolean);
          return (
            <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-red-100 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-gradient-to-br from-[#E31E24]/10 to-[#E31E24]/5 rounded-lg">
                  <BookOpen className="w-5 h-5 text-[#E31E24]" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1.5">{item.templateName}</h3>
              <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map((tag, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${tagColors[i % tagColors.length]}`}>{tag}</span>
                ))}
              </div>
              <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="w-3 h-3" /> {item.baseHours}h
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <IndianRupee className="w-3 h-3" /> {formatCurrency(parseFloat(item.baseRate) * parseFloat(item.baseHours))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Service Template</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Template Name</label>
                <input type="text" required value={formData.templateName} onChange={(e) => setFormData({ ...formData, templateName: e.target.value })} placeholder="e.g., Full Stack Development" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the service..." className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Tags (comma-separated)</label>
                <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="e.g., React, Node.js, PostgreSQL" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Base Hours</label>
                  <input type="number" value={formData.baseHours} onChange={(e) => setFormData({ ...formData, baseHours: e.target.value })} placeholder="200" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Hourly Rate (₹)</label>
                  <input type="number" value={formData.baseRate} onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })} placeholder="2500" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">{submitting ? "Saving..." : "Save Template"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ProposalBuilder({ proposal, onBack, onSave }: {
  proposal?: ProposalRecord;
  onBack: () => void;
  onSave: () => void;
}) {
  const [title, setTitle] = useState(proposal?.title || "");
  const [clientId, setClientId] = useState<string>(proposal?.clientId?.toString() || "");
  const [categories, setCategories] = useState<Category[]>(() => {
    if (proposal?.proposalData && Array.isArray(proposal.proposalData)) {
      return proposal.proposalData as Category[];
    }
    return [];
  });
  const [clients, setClients] = useState<{ id: number; companyName: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState("scope");

  useEffect(() => {
    authFetch("/api/clients?limit=100").then(async (r) => {
      if (r.ok) { const d = await r.json(); setClients(d.data || []); }
    }).catch(() => {});
    setExpandedCats(new Set(categories.map((c) => c.id)));
  }, []);

  const addCategory = () => {
    const newCat: Category = { id: genId(), name: "New Category", features: [] };
    setCategories([...categories, newCat]);
    setExpandedCats((prev) => new Set(prev).add(newCat.id));
  };

  const removeCategory = (catId: string) => {
    setCategories(categories.filter((c) => c.id !== catId));
  };

  const updateCategoryName = (catId: string, name: string) => {
    setCategories(categories.map((c) => c.id === catId ? { ...c, name } : c));
  };

  const addFeature = (catId: string) => {
    setCategories(categories.map((c) => c.id === catId ? { ...c, features: [...c.features, { id: genId(), description: "", hours: 0, rate: 2500 }] } : c));
  };

  const updateFeature = (catId: string, featureId: string, updates: Partial<Feature>) => {
    setCategories(categories.map((c) => c.id === catId ? { ...c, features: c.features.map((f) => f.id === featureId ? { ...f, ...updates } : f) } : c));
  };

  const removeFeature = (catId: string, featureId: string) => {
    setCategories(categories.map((c) => c.id === catId ? { ...c, features: c.features.filter((f) => f.id !== featureId) } : c));
  };

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  };

  const getCategoryTotal = (cat: Category) => cat.features.reduce((s, f) => s + f.hours * f.rate, 0);
  const getCategoryHours = (cat: Category) => cat.features.reduce((s, f) => s + f.hours, 0);
  const grandTotal = categories.reduce((s, c) => s + getCategoryTotal(c), 0);
  const totalHours = categories.reduce((s, c) => s + getCategoryHours(c), 0);

  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const body = {
        title,
        clientId: clientId ? parseInt(clientId) : null,
        proposalData: categories,
        totalEstimatedHours: totalHours,
        grandTotal,
        status: proposal?.status || "Draft",
      };

      const res = proposal?.id
        ? await authFetch(`/api/proposals/${proposal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await authFetch("/api/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setSaveError(errData.error || "Failed to save proposal");
        return;
      }
      onSave();
      onBack();
    } catch {
      setSaveError("Network error — please try again");
    } finally { setSaving(false); }
  };

  const sections = [
    { key: "cover", label: "Cover Page", icon: FileText },
    { key: "intro", label: "Introduction", icon: BookOpen },
    { key: "scope", label: "Scope of Work", icon: Layers },
    { key: "investment", label: "Investment", icon: IndianRupee },
    { key: "timeline", label: "Timeline", icon: Clock },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#E31E24] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Proposals
        </button>
        <div className="flex items-center gap-3">
          {saveError && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-1.5">{saveError}</p>}
          <button onClick={handleSave} disabled={saving || !title.trim()} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : proposal?.id ? "Update Proposal" : "Save Proposal"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-3 space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Proposal Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Cloud Migration Project" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] transition-colors" />
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Client (Company)</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] transition-colors bg-white">
              <option value="">— Select Client —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sections</h3>
            </div>
            <div className="p-1.5">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(s.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${activeSection === s.key ? "bg-[#E31E24] text-white font-medium shadow-md" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Categories</span>
                <span className="text-sm font-bold text-gray-800">{categories.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Line Items</span>
                <span className="text-sm font-bold text-gray-800">{categories.reduce((s, c) => s + c.features.length, 0)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Total Hours</span>
                  <span className="text-sm font-bold text-blue-600">{totalHours.toLocaleString("en-IN")}h</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Grand Total</span>
                <span className="text-base font-bold text-[#E31E24]">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-9">
          {(activeSection === "scope" || activeSection === "investment") ? (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-800">{activeSection === "scope" ? "Scope of Work" : "Investment Breakdown"}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Build your hierarchical cost structure: Categories → Features</p>
                </div>
                <button onClick={addCategory} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#E31E24] border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  <PlusCircle className="w-3.5 h-3.5" /> Add Category
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-16">
                  <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-3">No categories yet. Start building your proposal structure.</p>
                  <button onClick={addCategory} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#E31E24] border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                    <PlusCircle className="w-4 h-4" /> Add First Category
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {categories.map((cat) => {
                    const catTotal = getCategoryTotal(cat);
                    const catHours = getCategoryHours(cat);
                    const isExpanded = expandedCats.has(cat.id);

                    return (
                      <div key={cat.id}>
                        <div
                          className="flex items-center gap-3 px-5 py-3.5 bg-gray-50/70 cursor-pointer hover:bg-gray-100/50 transition-colors"
                          onClick={() => toggleExpand(cat.id)}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 text-sm font-bold text-gray-800 bg-transparent border-none outline-none focus:bg-white focus:px-2 focus:py-1 focus:rounded focus:border focus:border-gray-200 transition-all"
                          />
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-gray-400">{catHours}h</span>
                            <span className="font-bold text-gray-700 min-w-[80px] text-right">{formatCurrency(catTotal)}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeCategory(cat.id); }}
                              className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-5 py-2 bg-white">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                                  <th className="text-left py-2 pl-8 font-medium">Description</th>
                                  <th className="text-center py-2 font-medium w-[100px]">Hours</th>
                                  <th className="text-center py-2 font-medium w-[120px]">Rate (₹/hr)</th>
                                  <th className="text-right py-2 font-medium w-[110px]">Total</th>
                                  <th className="w-[40px]"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {cat.features.map((f) => (
                                  <tr key={f.id} className="border-t border-gray-50 group">
                                    <td className="py-2.5 pl-8">
                                      <input
                                        type="text"
                                        value={f.description}
                                        onChange={(e) => updateFeature(cat.id, f.id, { description: e.target.value })}
                                        placeholder="Feature description..."
                                        className="w-full text-sm text-gray-700 bg-transparent outline-none border-b border-transparent focus:border-gray-300 transition-colors"
                                      />
                                    </td>
                                    <td className="py-2.5 text-center">
                                      <input
                                        type="number"
                                        value={f.hours || ""}
                                        onChange={(e) => updateFeature(cat.id, f.id, { hours: parseFloat(e.target.value) || 0 })}
                                        className="w-16 text-center text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md py-1 outline-none focus:border-[#E31E24] transition-colors"
                                      />
                                    </td>
                                    <td className="py-2.5 text-center">
                                      <input
                                        type="number"
                                        value={f.rate || ""}
                                        onChange={(e) => updateFeature(cat.id, f.id, { rate: parseFloat(e.target.value) || 0 })}
                                        className="w-20 text-center text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md py-1 outline-none focus:border-[#E31E24] transition-colors"
                                      />
                                    </td>
                                    <td className="py-2.5 text-right text-sm font-semibold text-gray-800">
                                      {formatCurrency(f.hours * f.rate)}
                                    </td>
                                    <td className="py-2.5 text-center">
                                      <button
                                        onClick={() => removeFeature(cat.id, f.id)}
                                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <button
                              onClick={() => addFeature(cat.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 mb-2 ml-6 text-xs text-gray-400 hover:text-[#E31E24] hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Add Feature
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {categories.length > 0 && (
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">Proposal Grand Total</span>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase">Total Hours</p>
                        <p className="text-sm font-bold text-blue-600">{totalHours.toLocaleString("en-IN")}h</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase">Grand Total</p>
                        <p className="text-lg font-black text-[#E31E24]">{formatCurrency(grandTotal)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                {activeSection === "cover" && <FileText className="w-7 h-7 text-gray-300" />}
                {activeSection === "intro" && <BookOpen className="w-7 h-7 text-gray-300" />}
                {activeSection === "timeline" && <Clock className="w-7 h-7 text-gray-300" />}
              </div>
              <h3 className="text-base font-bold text-gray-700 mb-1.5">
                {sections.find((s) => s.key === activeSection)?.label}
              </h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                This section will contain the {sections.find((s) => s.key === activeSection)?.label.toLowerCase()} content. Use the Scope of Work or Investment sections to build the cost breakdown.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({ proposals }: { proposals: ProposalRecord[] }) {
  const total = proposals.reduce((s, p) => s + parseFloat(p.grandTotal || "0"), 0);
  const totalHours = proposals.reduce((s, p) => s + parseFloat(p.totalEstimatedHours || "0"), 0);
  const avgRate = totalHours > 0 ? total / totalHours : 0;
  const byStatus: Record<string, { count: number; value: number }> = {};
  proposals.forEach((p) => {
    if (!byStatus[p.status]) byStatus[p.status] = { count: 0, value: 0 };
    byStatus[p.status].count++;
    byStatus[p.status].value += parseFloat(p.grandTotal || "0");
  });

  const statusColors: Record<string, string> = { Draft: "bg-gray-200", Sent: "bg-blue-400", Accepted: "bg-green-400", Rejected: "bg-red-400", Revised: "bg-orange-400" };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Pipeline Value", value: formatCurrency(total), icon: IndianRupee, color: "text-green-500", ring: "border-green-200" },
          { label: "Total Proposals", value: proposals.length.toString(), icon: FileText, color: "text-blue-500", ring: "border-blue-200" },
          { label: "Total Hours Quoted", value: totalHours.toLocaleString("en-IN") + "h", icon: Clock, color: "text-purple-500", ring: "border-purple-200" },
          { label: "Avg Blended Rate", value: `₹ ${avgRate.toFixed(0)}/hr`, icon: BarChart3, color: "text-orange-500", ring: "border-orange-200" },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full border-2 ${m.ring} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
                  <p className="text-xl font-bold text-gray-800 mt-0.5">{m.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Pipeline by Status</h3>
        <div className="space-y-3">
          {Object.entries(byStatus).map(([status, data]) => {
            const pct = total > 0 ? (data.value / total) * 100 : 0;
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <StatusPill status={status} />
                    <span className="text-xs text-gray-400">{data.count} proposals</span>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{formatCurrency(data.value)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${statusColors[status] || "bg-gray-300"} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function EstimoDashboard() {
  const [tab, setTab] = useState<TabType>("proposals");
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderMode, setBuilderMode] = useState<"list" | "create" | "edit">("list");
  const [editingProposal, setEditingProposal] = useState<ProposalRecord | undefined>(undefined);
  const [search, setSearch] = useState("");

  const fetchProposals = useCallback(async () => {
    try {
      const res = await authFetch("/api/proposals");
      if (res.ok) setProposals(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const handleEditProposal = async (id: number) => {
    const res = await authFetch(`/api/proposals/${id}`);
    if (res.ok) {
      const data = await res.json();
      setEditingProposal(data);
      setBuilderMode("edit");
    }
  };

  if (builderMode === "create" || builderMode === "edit") {
    return (
      <ProposalBuilder
        proposal={editingProposal}
        onBack={() => { setBuilderMode("list"); setEditingProposal(undefined); }}
        onSave={() => fetchProposals()}
      />
    );
  }

  const draftCount = proposals.filter((p) => p.status === "Draft").length;
  const sentCount = proposals.filter((p) => p.status === "Sent").length;
  const acceptedCount = proposals.filter((p) => p.status === "Accepted").length;
  const totalValue = proposals.reduce((s, p) => s + parseFloat(p.grandTotal || "0"), 0);

  const metrics = [
    { label: "Drafts", value: draftCount, icon: FileClock, iconColor: "text-gray-500", ringColor: "border-gray-200" },
    { label: "Sent", value: sentCount, icon: Send, iconColor: "text-blue-500", ringColor: "border-blue-200" },
    { label: "Accepted", value: acceptedCount, icon: FileCheck2, iconColor: "text-green-500", ringColor: "border-green-200" },
    { label: "Pipeline Value", value: formatCurrency(totalValue), icon: IndianRupee, iconColor: "text-[#E31E24]", ringColor: "border-red-200", isText: true },
  ];

  const filtered = proposals.filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase()) || (p.clientName || "").toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: TabType; label: string; icon: typeof FileText }[] = [
    { key: "proposals", label: "Proposals", icon: FileText },
    { key: "catalog", label: "Service Catalog", icon: BookOpen },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estimo CPQ</h1>
          <p className="text-sm text-gray-400 mt-0.5">Configure, Price, Quote &mdash; Proposal Engine</p>
        </div>
        <button
          onClick={() => { setEditingProposal(undefined); setBuilderMode("create"); }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all"
        >
          <Plus className="w-4 h-4" /> New Proposal
        </button>
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
                  <p className="text-2xl font-bold text-gray-800 mt-0.5">{(m as any).isText ? m.value : m.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                tab === t.key ? "bg-[#E31E24] text-white shadow-md" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "proposals" && (
        <>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="search" placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" />
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading proposals...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No proposals yet. Click "New Proposal" to start building.</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proposal</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-50 rounded-lg shrink-0">
                            <FolderOpen className="w-4 h-4 text-[#E31E24]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{p.title}</p>
                            <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{p.clientName || "—"}</td>
                      <td className="px-5 py-4"><StatusPill status={p.status} /></td>
                      <td className="px-5 py-4 text-right text-gray-600">{parseFloat(p.totalEstimatedHours || "0").toLocaleString("en-IN")}h</td>
                      <td className="px-5 py-4 text-right font-bold text-gray-800">{formatCurrency(p.grandTotal)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEditProposal(p.id)} className="p-2 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "catalog" && <ServiceCatalogView />}
      {tab === "analytics" && <AnalyticsView proposals={proposals} />}
    </div>
  );
}

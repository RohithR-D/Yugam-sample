import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useEstimo } from "../hooks/useEstimo";
import { getProposalById } from "../services/estimoService";
import type { BOQItem, BuilderView, CatalogItem, ProposalRecord, TabType } from "../types";
import {
  calcAggregates,
  calcRowTotal,
  formatCurrency,
  formatDate,
  formatFullCurrency,
  genId,
  toDateInput,
} from "../utils/estimoUtils";
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
  Trash2,
  ArrowLeft,
  Clock,
  IndianRupee,
  Layers,
  Save,
  PlusCircle,
  MapPin,
  User,
  Phone,
  ClipboardList,
  Library,
  Calculator,
  Check,
  ShoppingCart,
  Package,
  Wrench,
  Monitor,
  HardHat,
  Code,
} from "lucide-react";


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
  const [formData, setFormData] = useState({ category: "General", itemCode: "", templateName: "", description: "", uom: "Nos", tags: "", baseHours: "", baseRate: "" });
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
      setFormData({ category: "General", itemCode: "", templateName: "", description: "", uom: "Nos", tags: "", baseHours: "", baseRate: "" });
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
                <div className="flex items-center gap-2">
                  {item.itemCode && <span className="text-[9px] font-mono text-gray-400">{item.itemCode}</span>}
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-500">{item.category || "General"}</span>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors cursor-pointer">
                    {["General", "Labor", "Materials", "Equipment", "Software"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Item Code</label>
                  <input type="text" value={formData.itemCode} onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })} placeholder="e.g., LAB-006" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Template Name</label>
                <input type="text" required value={formData.templateName} onChange={(e) => setFormData({ ...formData, templateName: e.target.value })} placeholder="e.g., Full Stack Development" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the service..." className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">UOM</label>
                  <select value={formData.uom} onChange={(e) => setFormData({ ...formData, uom: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors cursor-pointer">
                    {["Nos", "Hrs", "Sqm", "Sqft", "Rmt", "Kg", "MT", "Ltr", "Set", "Lot", "LS", "Cum", "Days"].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Tags (comma-separated)</label>
                  <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="e.g., React, Node.js" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Base Hours</label>
                  <input type="number" value={formData.baseHours} onChange={(e) => setFormData({ ...formData, baseHours: e.target.value })} placeholder="200" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Base Rate (₹)</label>
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

function CoverDetailsView({ form, setForm, clients }: {
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  clients: { id: number; companyName: string }[];
}) {
  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors";

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-800">Cover Details</h2>
        <p className="text-xs text-gray-400 mt-0.5">Quote identification, client, and point-of-contact information</p>
      </div>
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Client</label>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={`${inputCls} bg-white`}>
              <option value="">— Select Client —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Quote Number</label>
            <input type="text" value={form.quoteNumber} onChange={(e) => setForm({ ...form, quoteNumber: e.target.value })} placeholder="e.g., EST-2026-001" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Revision</label>
            <input type="text" value={form.revision} onChange={(e) => setForm({ ...form, revision: e.target.value })} placeholder="R0" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Valid From</label>
            <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Valid To</label>
            <input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><MapPin className="w-3 h-3" /> Project Location</label>
          <input type="text" value={form.projectLocation} onChange={(e) => setForm({ ...form, projectLocation: e.target.value })} placeholder="e.g., Mumbai, Maharashtra" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><User className="w-3 h-3" /> POC Name</label>
            <input type="text" value={form.pocName} onChange={(e) => setForm({ ...form, pocName: e.target.value })} placeholder="Point of Contact name" className={inputCls} />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><Phone className="w-3 h-3" /> POC Contact</label>
            <input type="text" value={form.pocContact} onChange={(e) => setForm({ ...form, pocContact: e.target.value })} placeholder="Email or Phone" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Proposal Title</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Cloud Migration & ERP Integration" className={inputCls} />
        </div>
      </div>
    </div>
  );
}

function ScopeTermsView({ form, setForm }: {
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
}) {
  const textareaCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors resize-none";

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-800">Scope & Terms</h2>
        <p className="text-xs text-gray-400 mt-0.5">Define deliverables, inclusions, and exclusions</p>
      </div>
      <div className="p-6 space-y-5">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><ClipboardList className="w-3 h-3" /> Scope of Work</label>
          <textarea rows={6} value={form.scopeOfWork} onChange={(e) => setForm({ ...form, scopeOfWork: e.target.value })} placeholder="Describe the full scope of work, deliverables, and milestones..." className={textareaCls} />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 text-green-600">Inclusions</label>
            <textarea rows={5} value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} placeholder="What is included in this proposal..." className={textareaCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 text-red-500">Exclusions</label>
            <textarea rows={5} value={form.exclusions} onChange={(e) => setForm({ ...form, exclusions: e.target.value })} placeholder="What is excluded from this proposal..." className={textareaCls} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MasterLibraryDrawer({ catalogItems, onAddToQuote, onClose }: {
  catalogItems: CatalogItem[];
  onAddToQuote: (items: CatalogItem[]) => void;
  onClose: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const categories = useMemo(() => {
    const cats = new Set<string>();
    catalogItems.forEach((item) => cats.add(item.category || "General"));
    return ["All Items", ...Array.from(cats).sort()];
  }, [catalogItems]);

  const categoryIcons: Record<string, typeof Package> = {
    "All Items": Library,
    "Labor": HardHat,
    "Materials": Package,
    "Equipment": Wrench,
    "Software": Monitor,
    "General": Code,
  };

  const filtered = useMemo(() => {
    let items = catalogItems;
    if (activeCategory !== "All Items") {
      items = items.filter((i) => (i.category || "General") === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) =>
        i.templateName.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.itemCode || "").toLowerCase().includes(q) ||
        i.tags.toLowerCase().includes(q)
      );
    }
    return items;
  }, [catalogItems, activeCategory, searchQuery]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddToQuote = () => {
    const selected = catalogItems.filter((i) => selectedIds.has(i.id));
    onAddToQuote(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-4xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right" style={{ animation: "slideInRight 0.25s ease-out" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Library className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Master Library</h2>
              <p className="text-xs text-gray-400">Select items to add to your Bill of Quantities</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-[200px] border-r border-gray-100 bg-gray-50/50 flex flex-col">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-colors bg-white"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              <p className="px-2 py-1.5 text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Categories</p>
              {categories.map((cat) => {
                const Icon = categoryIcons[cat] || Package;
                const count = cat === "All Items"
                  ? catalogItems.length
                  : catalogItems.filter((i) => (i.category || "General") === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${
                      activeCategory === cat
                        ? "bg-purple-600 text-white font-medium shadow-md"
                        : "text-gray-600 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{cat}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeCategory === cat ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                    }`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No items found in this category</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-200">
                      <th className="w-[44px] px-4 py-3"></th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Item Code</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-3 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider w-[60px]">UOM</th>
                      <th className="px-3 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider w-[100px]">Base Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <tr
                          key={item.id}
                          onClick={() => toggleSelect(item.id)}
                          className={`border-b border-gray-50 cursor-pointer transition-colors ${
                            isSelected ? "bg-purple-50/60" : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-purple-600 border-purple-600"
                                : "border-gray-300 hover:border-purple-400"
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-gray-500">{item.itemCode || `CAT-${item.id.toString().padStart(3, "0")}`}</td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-gray-800 text-sm">{item.templateName}</p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-500">{item.category || "General"}</span>
                          </td>
                          <td className="px-3 py-3 text-center text-xs text-gray-500">{item.uom || "Nos"}</td>
                          <td className="px-3 py-3 text-right font-bold text-gray-800 text-sm">₹{parseFloat(item.baseRate).toLocaleString("en-IN")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {selectedIds.size > 0 && (
              <div className="border-t border-gray-200 bg-white px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50">
                    <ShoppingCart className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-bold text-purple-700">{selectedIds.size}</span>
                  </div>
                  <span className="text-sm text-gray-500">item{selectedIds.size !== 1 ? "s" : ""} selected</span>
                  <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-red-500 underline transition-colors ml-1">Clear all</button>
                </div>
                <button
                  onClick={handleAddToQuote}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/20 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add to Quote
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function BOQTable({ boqItems, setBoqItems, catalogItems }: {
  boqItems: BOQItem[];
  setBoqItems: (items: BOQItem[]) => void;
  catalogItems: CatalogItem[];
}) {
  const [showLibrary, setShowLibrary] = useState(false);

  const addRow = () => {
    setBoqItems([...boqItems, {
      id: genId(),
      itemCode: "",
      description: "",
      uom: "Nos",
      qty: 1,
      baseRate: 0,
      labor: 0,
      machine: 0,
      overhead: 0,
      marginPct: 10,
      discPct: 0,
      taxPct: 18,
      wastagePct: 0,
      freight: 0,
      leadTime: "",
    }]);
  };

  const updateItem = (id: string, updates: Partial<BOQItem>) => {
    setBoqItems(boqItems.map((item) => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    setBoqItems(boqItems.filter((item) => item.id !== id));
  };

  const handleAddFromLibrary = (selectedCatalogItems: CatalogItem[]) => {
    const newItems: BOQItem[] = selectedCatalogItems.map((cat) => ({
      id: genId(),
      itemCode: cat.itemCode || `CAT-${cat.id.toString().padStart(3, "0")}`,
      description: cat.templateName,
      uom: cat.uom || "Nos",
      qty: 1,
      baseRate: parseFloat(cat.baseRate) || 0,
      labor: 0,
      machine: 0,
      overhead: 0,
      marginPct: 10,
      discPct: 0,
      taxPct: 18,
      wastagePct: 0,
      freight: 0,
      leadTime: "",
    }));
    setBoqItems([...boqItems, ...newItems]);
  };

  const agg = useMemo(() => calcAggregates(boqItems), [boqItems]);

  const numInputCls = "w-full text-center text-xs bg-transparent border-b border-transparent focus:border-gray-300 outline-none py-1.5 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-800">Bill of Quantities</h2>
              <p className="text-xs text-gray-400 mt-0.5">{boqItems.length} line items</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowLibrary(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                <Library className="w-3.5 h-3.5" /> Select from Master Library
              </button>
              <button onClick={addRow} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#E31E24] border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                <PlusCircle className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider">
                  <th className="px-2 py-2.5 text-left font-semibold w-[80px] sticky left-0 bg-gray-50 z-10">Item Code</th>
                  <th className="px-2 py-2.5 text-left font-semibold min-w-[180px]">Description</th>
                  <th className="px-1.5 py-2.5 text-center font-semibold w-[55px]">UOM</th>
                  <th className="px-1.5 py-2.5 text-center font-semibold w-[55px]">Qty</th>
                  <th className="px-1.5 py-2.5 text-center font-semibold w-[75px]">Base Rate</th>
                  <th className="px-1.5 py-2.5 text-center font-semibold w-[65px]">Labor</th>
                  <th className="px-1.5 py-2.5 text-center font-semibold w-[65px]">Machine</th>
                  <th className="px-1.5 py-2.5 text-center font-semibold w-[55px]">OH</th>
                  <th className="px-1.5 py-2.5 text-center font-semibold w-[52px]">Margin%</th>
                  <th className="px-1.5 py-2.5 text-center font-semibold w-[48px]">Disc%</th>
                  <th className="px-1.5 py-2.5 text-center font-semibold w-[48px]">Tax%</th>
                  <th className="px-1.5 py-2.5 text-center font-semibold w-[55px]">Wstg%</th>
                  <th className="px-1.5 py-2.5 text-center font-semibold w-[65px]">Freight</th>
                  <th className="px-1.5 py-2.5 text-center font-semibold w-[65px]">Lead Time</th>
                  <th className="px-2 py-2.5 text-right font-semibold w-[90px]">Total</th>
                  <th className="w-[32px]"></th>
                </tr>
              </thead>
              <tbody>
                {boqItems.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="text-center py-10 text-gray-400 text-sm">
                      <Calculator className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      No line items. Add from Master Library or create a new row.
                    </td>
                  </tr>
                ) : (
                  boqItems.map((item) => (
                    <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50/50 group transition-colors">
                      <td className="px-2 py-1.5 sticky left-0 bg-white group-hover:bg-gray-50/50 z-10">
                        <input type="text" value={item.itemCode} onChange={(e) => updateItem(item.id, { itemCode: e.target.value })} placeholder="CODE" className="w-full text-xs font-mono text-gray-600 bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="text" value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} placeholder="Description..." className="w-full text-xs text-gray-700 bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors" />
                      </td>
                      <td className="px-1 py-1.5">
                        <select value={item.uom} onChange={(e) => updateItem(item.id, { uom: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none py-1.5 cursor-pointer">
                          {["Nos", "Hrs", "Sqm", "Sqft", "Rmt", "Kg", "MT", "Ltr", "Set", "Lot", "LS", "Cum", "Days"].map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="number" value={item.qty || ""} onChange={(e) => updateItem(item.id, { qty: parseFloat(e.target.value) || 0 })} className={numInputCls} />
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="number" value={item.baseRate || ""} onChange={(e) => updateItem(item.id, { baseRate: parseFloat(e.target.value) || 0 })} className={numInputCls} />
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="number" value={item.labor || ""} onChange={(e) => updateItem(item.id, { labor: parseFloat(e.target.value) || 0 })} className={numInputCls} />
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="number" value={item.machine || ""} onChange={(e) => updateItem(item.id, { machine: parseFloat(e.target.value) || 0 })} className={numInputCls} />
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="number" value={item.overhead || ""} onChange={(e) => updateItem(item.id, { overhead: parseFloat(e.target.value) || 0 })} className={numInputCls} />
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="number" value={item.marginPct || ""} onChange={(e) => updateItem(item.id, { marginPct: parseFloat(e.target.value) || 0 })} className={numInputCls} />
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="number" value={item.discPct || ""} onChange={(e) => updateItem(item.id, { discPct: parseFloat(e.target.value) || 0 })} className={numInputCls} />
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="number" value={item.taxPct || ""} onChange={(e) => updateItem(item.id, { taxPct: parseFloat(e.target.value) || 0 })} className={numInputCls} />
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="number" value={item.wastagePct || ""} onChange={(e) => updateItem(item.id, { wastagePct: parseFloat(e.target.value) || 0 })} className={numInputCls} />
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="number" value={item.freight || ""} onChange={(e) => updateItem(item.id, { freight: parseFloat(e.target.value) || 0 })} className={numInputCls} />
                      </td>
                      <td className="px-1 py-1.5">
                        <input type="text" value={item.leadTime} onChange={(e) => updateItem(item.id, { leadTime: e.target.value })} placeholder="—" className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors" />
                      </td>
                      <td className="px-2 py-1.5 text-right font-bold text-gray-800 text-xs whitespace-nowrap">
                        {formatFullCurrency(calcRowTotal(item))}
                      </td>
                      <td className="px-1 py-1.5">
                        <button onClick={() => removeItem(item.id)} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="w-[260px] shrink-0">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden sticky top-0">
          <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-sm font-bold text-gray-800">Cost Breakdown</h3>
          </div>
          <div className="p-4 space-y-2.5 text-xs">
            {[
              { label: "Base Cost", value: agg.baseCost, color: "text-gray-700" },
              { label: "Labor", value: agg.labor, color: "text-blue-600" },
              { label: "Machine", value: agg.machine, color: "text-purple-600" },
              { label: "Overheads", value: agg.overheads, color: "text-orange-600" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-gray-400">{row.label}</span>
                <span className={`font-semibold ${row.color}`}>{formatFullCurrency(row.value)}</span>
              </div>
            ))}

            <div className="border-t border-gray-100 pt-2.5">
              <div className="flex justify-between items-center font-bold">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800">{formatFullCurrency(agg.subtotal)}</span>
              </div>
            </div>

            {[
              { label: "+ Margin", value: agg.marginAmt, color: "text-green-600" },
              { label: "− Discount", value: agg.discountAmt, color: "text-red-500" },
              { label: "+ Tax", value: agg.taxAmt, color: "text-indigo-600" },
              { label: "+ Freight", value: agg.freight, color: "text-teal-600" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-gray-400">{row.label}</span>
                <span className={`font-semibold ${row.color}`}>{formatFullCurrency(row.value)}</span>
              </div>
            ))}

            <div className="border-t-2 border-[#E31E24]/20 pt-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-gray-800">Grand Total</span>
                <span className="text-base font-black text-[#E31E24]">{formatFullCurrency(agg.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLibrary && (
        <MasterLibraryDrawer
          catalogItems={catalogItems}
          onAddToQuote={handleAddFromLibrary}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}

function ProposalBuilder({ proposal, onBack, onSave }: {
  proposal?: ProposalRecord;
  onBack: () => void;
  onSave: () => void;
}) {
  const [activeView, setActiveView] = useState<BuilderView>("cover");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [clients, setClients] = useState<{ id: number; companyName: string }[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

  const [form, setForm] = useState<Record<string, string>>({
    title: proposal?.title || "",
    clientId: proposal?.clientId?.toString() || "",
    quoteNumber: proposal?.quoteNumber || "",
    revision: proposal?.revision || "R0",
    validFrom: toDateInput(proposal?.validFrom || null),
    validTo: toDateInput(proposal?.validTo || null),
    projectLocation: proposal?.projectLocation || "",
    pocName: proposal?.pocName || "",
    pocContact: proposal?.pocContact || "",
    scopeOfWork: proposal?.scopeOfWork || "",
    inclusions: proposal?.inclusions || "",
    exclusions: proposal?.exclusions || "",
  });

  const [boqItems, setBoqItems] = useState<BOQItem[]>(() => {
    if (proposal?.boqData && Array.isArray(proposal.boqData) && proposal.boqData.length > 0) {
      return proposal.boqData as BOQItem[];
    }
    return [];
  });

  useEffect(() => {
    Promise.all([
      authFetch("/api/clients?limit=100").then(async (r) => r.ok ? (await r.json()).data || [] : []),
      authFetch("/api/service-catalog").then(async (r) => r.ok ? await r.json() : []),
    ]).then(([c, s]) => { setClients(c); setCatalogItems(s); }).catch(() => {});
  }, []);

  const agg = useMemo(() => calcAggregates(boqItems), [boqItems]);

  const handleSave = async () => {
    if (!form.title.trim()) { setSaveError("Proposal title is required"); return; }
    setSaving(true);
    setSaveError("");
    try {
      const body: Record<string, any> = {
        title: form.title,
        clientId: form.clientId ? parseInt(form.clientId) : null,
        quoteNumber: form.quoteNumber,
        revision: form.revision,
        validFrom: form.validFrom || null,
        validTo: form.validTo || null,
        projectLocation: form.projectLocation,
        pocName: form.pocName,
        pocContact: form.pocContact,
        scopeOfWork: form.scopeOfWork,
        inclusions: form.inclusions,
        exclusions: form.exclusions,
        boqData: boqItems,
        grandTotal: agg.grandTotal,
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

  const sidebarItems: { key: BuilderView; label: string; icon: typeof FileText }[] = [
    { key: "cover", label: "Cover Details", icon: FileText },
    { key: "scope", label: "Scope & Terms", icon: ClipboardList },
    { key: "investment", label: "Investment (BOQ)", icon: Calculator },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#E31E24] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Proposals
        </button>
        <div className="flex items-center gap-3">
          {saveError && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-1.5">{saveError}</p>}
          <button onClick={handleSave} disabled={saving || !form.title.trim()} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : proposal?.id ? "Update Proposal" : "Save Proposal"}
          </button>
        </div>
      </div>

      <div className="flex gap-5">
        <div className="w-[200px] shrink-0 space-y-3">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Navigation</h3>
            </div>
            <div className="p-1.5">
              {sidebarItems.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveView(s.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${activeView === s.key ? "bg-[#E31E24] text-white font-medium shadow-md" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2.5">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Summary</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Quote #</span>
                <span className="text-xs font-bold text-gray-700 truncate max-w-[100px]">{form.quoteNumber || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Revision</span>
                <span className="text-xs font-bold text-gray-700">{form.revision || "R0"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Line Items</span>
                <span className="text-xs font-bold text-gray-700">{boqItems.length}</span>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Grand Total</span>
                  <span className="text-sm font-black text-[#E31E24]">{formatCurrency(agg.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeView === "cover" && <CoverDetailsView form={form} setForm={setForm} clients={clients} />}
          {activeView === "scope" && <ScopeTermsView form={form} setForm={setForm} />}
          {activeView === "investment" && <BOQTable boqItems={boqItems} setBoqItems={setBoqItems} catalogItems={catalogItems} />}
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
  const { proposals, loading, fetchProposals } = useEstimo();
  const [builderMode, setBuilderMode] = useState<"list" | "create" | "edit">("list");
  const [editingProposal, setEditingProposal] = useState<ProposalRecord | undefined>(undefined);
  const [search, setSearch] = useState("");

  const handleEditProposal = async (id: number) => {
    const data = await getProposalById(id);
    if (data) {
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
    (p) => p.title.toLowerCase().includes(search.toLowerCase()) || (p.clientName || "").toLowerCase().includes(search.toLowerCase()) || (p.quoteNumber || "").toLowerCase().includes(search.toLowerCase())
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
            <input type="search" placeholder="Search proposals or quote numbers..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" />
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
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quote #</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
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
                      <td className="px-5 py-4 text-gray-600 font-mono text-xs">{p.quoteNumber || "—"}</td>
                      <td className="px-5 py-4"><StatusPill status={p.status} /></td>
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

import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useModule } from "@/context/ModuleContext";
import { useSales } from "../hooks/useSales";
import type { Client, DocItem, SalesDoc, SalesSubModule } from "../types";
import {
  calcDocItem,
  COMPANY_INFO,
  DATE_FIELD_MAP,
  DOC_TYPE_MAP,
  emptyDocItem,
  ENDPOINT_MAP,
  formatCurrency,
  formatDate,
  NUMBER_FIELD_MAP,
  STATUS_OPTIONS,
} from "../utils/salesUtils";
import {
  Search,
  Plus,
  X,
  FileText,
  Trash2,
  ArrowLeft,
  PlusCircle,
  Save,
  Send,
  Eye,
  IndianRupee,
  TrendingUp,
  CircleDollarSign,
  FileCheck,
  FileClock,
  Truck,
  RotateCcw,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";


function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Paid: "bg-green-50 text-green-600 border-green-200",
    Approved: "bg-green-50 text-green-600 border-green-200",
    Accepted: "bg-green-50 text-green-600 border-green-200",
    Completed: "bg-green-50 text-green-600 border-green-200",
    Delivered: "bg-green-50 text-green-600 border-green-200",
    "Credit Issued": "bg-green-50 text-green-600 border-green-200",
    Confirmed: "bg-blue-50 text-blue-600 border-blue-200",
    "In Progress": "bg-blue-50 text-blue-600 border-blue-200",
    Sent: "bg-blue-50 text-blue-600 border-blue-200",
    Dispatched: "bg-blue-50 text-blue-600 border-blue-200",
    "In Transit": "bg-indigo-50 text-indigo-600 border-indigo-200",
    Unpaid: "bg-amber-50 text-amber-600 border-amber-200",
    Partial: "bg-amber-50 text-amber-600 border-amber-200",
    Overdue: "bg-red-50 text-red-600 border-red-200",
    Rejected: "bg-red-50 text-red-600 border-red-200",
    Cancelled: "bg-red-50 text-red-600 border-red-200",
    Draft: "bg-gray-50 text-gray-500 border-gray-200",
    Expired: "bg-gray-50 text-gray-400 border-gray-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}


export default function SalesDashboard() {
  const { activeModule, setActiveModule } = useModule();
  const subModule: SalesSubModule = (activeModule.replace("Sales:", "") || "Overview") as SalesSubModule;
  const { allDocs, typeDocs, clients, loading, fetchAll, fetchTypeDocs } = useSales();
  const [search, setSearch] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [builderDocType, setBuilderDocType] = useState("Quotation");

  useEffect(() => {
    const docType = DOC_TYPE_MAP[subModule];
    if (docType) fetchTypeDocs(ENDPOINT_MAP[docType]);
  }, [subModule, fetchTypeDocs]);

  const filteredDocs = useMemo(() => {
    const targetType = DOC_TYPE_MAP[subModule];
    if (!targetType) return [];

    const numberField = NUMBER_FIELD_MAP[targetType] || "documentNumber";
    let items = typeDocs.map((d: any) => ({
      ...d,
      documentNumber: d[numberField] || d.documentNumber || "",
      documentType: targetType,
    }));

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((d: any) =>
        (d.clientName || "").toLowerCase().includes(q) ||
        (d.documentNumber || "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [typeDocs, subModule, search]);

  const openBuilder = (docType: string, doc?: any) => {
    setBuilderDocType(docType);
    setEditingDoc(doc || null);
    setBuilderOpen(true);
  };

  const handleBuilderSave = async () => {
    await fetchAll();
    const docType = DOC_TYPE_MAP[subModule];
    if (docType) await fetchTypeDocs(docType);
    setBuilderOpen(false);
    setEditingDoc(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this document?")) return;
    const docType = DOC_TYPE_MAP[subModule];
    const endpoint = ENDPOINT_MAP[docType];
    if (!endpoint) return;
    await authFetch(`${endpoint}/${id}`, { method: "DELETE" });
    await fetchAll();
    if (docType) await fetchTypeDocs(docType);
  };

  if (builderOpen) {
    return (
      <DocumentBuilder
        documentType={builderDocType}
        doc={editingDoc}
        clients={clients}
        onSave={handleBuilderSave}
        onCancel={() => { setBuilderOpen(false); setEditingDoc(null); }}
      />
    );
  }

  if (subModule === "Overview") {
    return <OverviewDashboard allDocs={allDocs} loading={loading} setActiveModule={setActiveModule} />;
  }

  const docType = DOC_TYPE_MAP[subModule];
  const canCreate = !!ENDPOINT_MAP[docType];
  const showBalanceDue = docType === "Invoice";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{subModule}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage {subModule.toLowerCase()} documents</p>
        </div>
        {canCreate && (
          <button
            onClick={() => openBuilder(docType, undefined)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
          >
            <Plus className="w-4 h-4" /> Create {subModule === "Invoices" ? "Invoice" : subModule}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder={`Search ${subModule.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No {subModule.toLowerCase()} documents found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Document #</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                {showBalanceDue && <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Balance Due</th>}
                <th className="px-4 py-3 w-[80px]"></th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc: any) => {
                const dateField = DATE_FIELD_MAP[docType];
                const displayDate = doc[dateField] || doc.createdAt;
                return (
                  <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(displayDate)}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-700 font-medium">{doc.documentNumber}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-800 font-medium">{doc.clientName}</td>
                    <td className="px-4 py-3.5 text-center"><StatusPill status={doc.paymentStatus || doc.status} /></td>
                    <td className="px-4 py-3.5 text-right font-bold text-gray-800">{formatCurrency(parseFloat(doc.grandTotal || doc.approximateValue || "0"))}</td>
                    {showBalanceDue && (
                      <td className="px-4 py-3.5 text-right font-semibold text-amber-600">
                        {formatCurrency(parseFloat(doc.balanceDue || "0"))}
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openBuilder(docType, doc)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OverviewDashboard({ allDocs, loading, setActiveModule }: {
  allDocs: SalesDoc[];
  loading: boolean;
  setActiveModule: (m: string) => void;
}) {
  const invoices = allDocs.filter((d) => d.documentType === "Invoice");
  const totalInvoiced = invoices.reduce((s, d) => s + (parseFloat(d.grandTotal) || 0), 0);
  const totalPaid = invoices.filter((d) => d.paymentStatus === "Paid" || d.status === "Paid").reduce((s, d) => s + (parseFloat(d.grandTotal) || 0), 0);
  const totalUnpaid = invoices.filter((d) => ["Unpaid", "Partial", "Overdue"].includes(d.paymentStatus || d.status)).reduce((s, d) => s + (parseFloat(d.balanceDue || d.grandTotal) || 0), 0);
  const draftCount = allDocs.filter((d) => d.status === "Draft").length;

  const metrics = [
    { label: "Total Invoiced", value: formatCurrency(totalInvoiced), icon: TrendingUp, color: "text-blue-600", ring: "border-blue-200", bg: "bg-blue-50" },
    { label: "Total Paid", value: formatCurrency(totalPaid), icon: CircleDollarSign, color: "text-green-600", ring: "border-green-200", bg: "bg-green-50" },
    { label: "Total Unpaid", value: formatCurrency(totalUnpaid), icon: IndianRupee, color: "text-amber-600", ring: "border-amber-200", bg: "bg-amber-50" },
    { label: "Draft Documents", value: draftCount.toString(), icon: FileClock, color: "text-gray-600", ring: "border-gray-200", bg: "bg-gray-50" },
  ];

  const paidCount = invoices.filter((d) => d.paymentStatus === "Paid" || d.status === "Paid").length;
  const unpaidCount = invoices.filter((d) => ["Unpaid", "Partial", "Overdue"].includes(d.paymentStatus || d.status)).length;
  const draftInvCount = invoices.filter((d) => d.status === "Draft").length;

  const donutData = [
    { name: "Paid", value: paidCount, color: "#22c55e" },
    { name: "Unpaid", value: unpaidCount, color: "#f59e0b" },
    { name: "Draft", value: draftInvCount, color: "#9ca3af" },
  ].filter((d) => d.value > 0);

  const recentInvoices = invoices.slice(0, 8);

  const docTypeCounts = [
    { label: "Quotations", count: allDocs.filter((d) => d.documentType === "Quotation").length, module: "Sales:Quotation", icon: FileText, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Proforma Invoices", count: allDocs.filter((d) => d.documentType === "Proforma Invoice").length, module: "Sales:Proforma Invoice", icon: FileCheck, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Sales Orders", count: allDocs.filter((d) => d.documentType === "Sales Order").length, module: "Sales:Sales Order", icon: FileClock, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Delivery Challans", count: allDocs.filter((d) => d.documentType === "Delivery Challan").length, module: "Sales:Delivery Challan", icon: Truck, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Invoices", count: invoices.length, module: "Sales:Invoices", icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
    { label: "Sales Returns", count: allDocs.filter((d) => d.documentType === "Sales Return").length, module: "Sales:Sales Return", icon: RotateCcw, color: "text-red-600", bg: "bg-red-50" },
  ];

  if (loading) return <div className="text-center py-16 text-gray-400">Loading sales data...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">Dashboard across all sales document types</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full border-2 ${m.ring} ${m.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{m.label}</p>
                  <p className="text-xl font-bold text-gray-800 mt-0.5">{m.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {docTypeCounts.map((dt) => {
          const Icon = dt.icon;
          return (
            <button key={dt.label} onClick={() => setActiveModule(dt.module)} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left group">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${dt.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${dt.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{dt.label}</p>
                  <p className="text-lg font-bold text-gray-800">{dt.count}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Invoice Payment Status</h2>
            <p className="text-xs text-gray-400 mt-0.5">Distribution of Paid, Unpaid & Draft</p>
          </div>
          <div className="p-5 h-[280px]">
            {donutData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No invoice data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {donutData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} invoice${value !== 1 ? "s" : ""}`, name]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Recent Invoices</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest invoice entries</p>
            </div>
            <button onClick={() => setActiveModule("Sales:Invoices")} className="text-xs font-semibold text-[#E31E24] hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentInvoices.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">No invoices yet</div>
            ) : (
              recentInvoices.map((inv) => (
                <div key={inv.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-gray-50 rounded-lg shrink-0"><FileCheck className="w-4 h-4 text-gray-400" /></div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-gray-500 truncate">{inv.documentNumber}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{inv.clientName}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(parseFloat(inv.grandTotal) || 0)}</p>
                    <StatusPill status={inv.paymentStatus || inv.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentBuilder({ documentType, doc, clients, onSave, onCancel }: {
  documentType: string;
  doc: any | null;
  clients: Client[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!doc;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [gstType, setGstType] = useState<"cgst_sgst" | "igst">("cgst_sgst");

  const numberField = NUMBER_FIELD_MAP[documentType] || "documentNumber";
  const dateField = DATE_FIELD_MAP[documentType] || "createdAt";
  const statusOptions = STATUS_OPTIONS[documentType] || ["Draft"];
  const endpoint = ENDPOINT_MAP[documentType] || "/api/sales/quotations";
  const isChallan = documentType === "Delivery Challan";

  const [form, setForm] = useState({
    clientId: doc?.clientId?.toString() || "",
    clientName: doc?.clientName || "",
    docDate: doc?.[dateField] ? new Date(doc[dateField]).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    dueDate: doc?.dueDate ? new Date(doc.dueDate).toISOString().split("T")[0] : doc?.validUntil ? new Date(doc.validUntil).toISOString().split("T")[0] : "",
    notes: doc?.notes || "",
    termsAndConditions: doc?.termsAndConditions || "Payment due within 30 days of issue date.\nAll amounts are in Indian Rupees (₹).",
    status: doc?.status || "Draft",
    placeOfSupply: doc?.placeOfSupply || COMPANY_INFO.stateCode,
  });

  const [lineItems, setLineItems] = useState<DocItem[]>(
    doc?.items && doc.items.length > 0
      ? doc.items.map((i: any) => calcDocItem({
          description: i.description || "",
          hsnSac: i.hsnSac || i.hsn_sac || "",
          quantity: i.quantity || i.qty || "1",
          uom: i.uom || "Nos",
          rate: i.rate || "0",
          discountPercent: i.discountPercent || i.discount_percent || "0",
          cgstPercent: i.cgstPercent || i.cgst_percent || i.cgstPercentage || "9",
          cgstAmount: "0", sgstPercent: i.sgstPercent || i.sgst_percent || i.sgstPercentage || "9",
          sgstAmount: "0", igstPercent: i.igstPercent || i.igst_percent || "0", igstAmount: "0",
          taxableAmount: "0", lineTotal: "0", itemType: i.itemType || "Product",
        }, gstType))
      : [emptyDocItem()]
  );

  useEffect(() => {
    if (isEdit && doc?.id) {
      authFetch(`${endpoint}/${doc.id}`).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const detectedGst = data.placeOfSupply && data.placeOfSupply !== COMPANY_INFO.stateCode ? "igst" : "cgst_sgst";
            setGstType(detectedGst);
            setLineItems(data.items.map((i: any) => calcDocItem({
              description: i.description || "",
              hsnSac: i.hsnSac || "",
              quantity: i.quantity || i.dispatchedQty || "1",
              uom: i.uom || "Nos",
              rate: i.rate || "0",
              discountPercent: i.discountPercent || "0",
              cgstPercent: i.cgstPercent || "9",
              cgstAmount: "0", sgstPercent: i.sgstPercent || "9", sgstAmount: "0",
              igstPercent: i.igstPercent || "0", igstAmount: "0",
              taxableAmount: "0", lineTotal: "0", itemType: i.itemType || "Product",
            }, detectedGst)));
          }
        }
      });
    }
  }, [isEdit, doc?.id]);

  useEffect(() => {
    const newGst = form.placeOfSupply === COMPANY_INFO.stateCode ? "cgst_sgst" : "igst";
    if (newGst !== gstType) {
      setGstType(newGst);
      setLineItems((prev) => prev.map((item) => calcDocItem(item, newGst)));
    }
  }, [form.placeOfSupply]);

  const updateLineItem = (index: number, updates: Partial<DocItem>) => {
    setLineItems((prev) => prev.map((item, i) => i === index ? calcDocItem({ ...item, ...updates }, gstType) : item));
  };

  const addLineItem = () => setLineItems((prev) => [...prev, emptyDocItem()]);
  const removeLineItem = (index: number) => setLineItems((prev) => prev.filter((_, i) => i !== index));

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((s, item) => s + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0), 0);
    const taxableAmount = lineItems.reduce((s, item) => s + parseFloat(item.taxableAmount || "0"), 0);
    const cgstTotal = lineItems.reduce((s, item) => s + parseFloat(item.cgstAmount || "0"), 0);
    const sgstTotal = lineItems.reduce((s, item) => s + parseFloat(item.sgstAmount || "0"), 0);
    const igstTotal = lineItems.reduce((s, item) => s + parseFloat(item.igstAmount || "0"), 0);
    const grandTotal = taxableAmount + cgstTotal + sgstTotal + igstTotal;
    return { subtotal, taxableAmount, cgstTotal, sgstTotal, igstTotal, grandTotal };
  }, [lineItems]);

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === parseInt(clientId));
    setForm((f) => ({
      ...f,
      clientId,
      clientName: client?.companyName || "",
      placeOfSupply: client?.stateCode || COMPANY_INFO.stateCode,
    }));
  };

  const handleSave = async (saveStatus?: string) => {
    setSaving(true);
    setError("");
    const status = saveStatus || form.status;

    const basePayload: any = {
      clientId: form.clientId ? parseInt(form.clientId) : 1,
      clientName: form.clientName || "Unknown",
      placeOfSupply: form.placeOfSupply,
      subtotal: totals.subtotal.toFixed(2),
      discountType: "None",
      discountValue: "0",
      discountAmount: "0",
      taxableAmount: totals.taxableAmount.toFixed(2),
      cgstTotal: totals.cgstTotal.toFixed(2),
      sgstTotal: totals.sgstTotal.toFixed(2),
      igstTotal: totals.igstTotal.toFixed(2),
      roundOff: "0",
      grandTotal: totals.grandTotal.toFixed(2),
      notes: form.notes,
      termsAndConditions: form.termsAndConditions,
      status,
      items: lineItems.map(({ ...rest }) => rest),
    };

    if (documentType === "Quotation") {
      basePayload.quotationDate = new Date(form.docDate).toISOString();
      basePayload.validUntil = form.dueDate ? new Date(form.dueDate).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();
    } else if (documentType === "Proforma Invoice") {
      basePayload.proformaDate = new Date(form.docDate).toISOString();
      basePayload.validUntil = form.dueDate ? new Date(form.dueDate).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();
    } else if (documentType === "Sales Order") {
      basePayload.orderDate = new Date(form.docDate).toISOString();
      basePayload.paymentTerms = form.termsAndConditions;
    } else if (documentType === "Invoice") {
      basePayload.invoiceDate = new Date(form.docDate).toISOString();
      basePayload.dueDate = form.dueDate ? new Date(form.dueDate).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();
      basePayload.amountInWords = "";
      basePayload.balanceDue = totals.grandTotal.toFixed(2);
    } else if (documentType === "Delivery Challan") {
      basePayload.challanDate = new Date(form.docDate).toISOString();
      basePayload.approximateValue = totals.grandTotal.toFixed(2);
      delete basePayload.subtotal;
      delete basePayload.taxableAmount;
      delete basePayload.cgstTotal;
      delete basePayload.sgstTotal;
      delete basePayload.igstTotal;
      delete basePayload.discountType;
      delete basePayload.discountValue;
      delete basePayload.discountAmount;
      delete basePayload.roundOff;
      delete basePayload.grandTotal;
      basePayload.items = lineItems.map((item) => ({
        description: item.description,
        hsnSac: item.hsnSac,
        itemType: item.itemType,
        dispatchedQty: item.quantity,
        uom: item.uom,
        rate: item.rate,
      }));
    } else if (documentType === "Sales Return") {
      basePayload.returnDate = new Date(form.docDate).toISOString();
      basePayload.sourceInvoiceId = doc?.sourceInvoiceId || 1;
      basePayload.returnType = "Partial";
      basePayload.reason = "Other";
    }

    try {
      const url = isEdit ? `${endpoint}/${doc!.id}` : endpoint;
      const method = isEdit ? "PATCH" : "POST";
      const res = await authFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(basePayload) });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      onSave();
    } catch { setError("Network error"); } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isEdit ? "Edit" : "New"} {documentType}</h1>
            {isEdit && <p className="text-xs text-gray-400 mt-0.5">{doc?.[numberField]}</p>}
            {!isEdit && <p className="text-xs text-gray-400 mt-0.5">Auto-numbered on save</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => handleSave("Draft")} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button onClick={() => handleSave(statusOptions[1] || "Sent")} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">
            <Send className="w-4 h-4" /> Save & Send
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="p-6 space-y-5">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Billed By</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-bold text-gray-800">{COMPANY_INFO.name}</p>
                <p className="text-xs text-gray-500 mt-1">{COMPANY_INFO.address}</p>
                <p className="text-xs text-gray-500">{COMPANY_INFO.city}</p>
                <p className="text-xs text-gray-400 mt-1.5 font-mono">GSTIN: {COMPANY_INFO.gstin}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
              <select value={form.clientId} onChange={(e) => handleClientChange(e.target.value)} className={inputCls + " cursor-pointer"}>
                <option value="">Select Client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
              {!form.clientId && (
                <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Or type client name..." className={inputCls + " mt-2"} />
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
                <input type="date" value={form.docDate} onChange={(e) => setForm({ ...form, docDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{documentType === "Invoice" ? "Due Date" : "Valid Until"}</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Place of Supply (State Code)</label>
                <input type="text" maxLength={2} value={form.placeOfSupply} onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })} className={inputCls} placeholder="27" />
                <p className="text-[10px] text-gray-400 mt-1">
                  {gstType === "igst" ? "Inter-state → IGST applies" : "Intra-state → CGST + SGST applies"}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls + " cursor-pointer"}>
                  {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Line Items</h2>
          <button onClick={addLineItem} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#E31E24] border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            <PlusCircle className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-2.5 text-left font-semibold min-w-[200px]">Description</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[80px]">HSN/SAC</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[60px]">Qty</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[55px]">UOM</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[80px]">Rate</th>
                {gstType === "cgst_sgst" ? (
                  <>
                    <th className="px-2 py-2.5 text-center font-semibold w-[55px]">CGST%</th>
                    <th className="px-2 py-2.5 text-center font-semibold w-[55px]">SGST%</th>
                  </>
                ) : (
                  <th className="px-2 py-2.5 text-center font-semibold w-[55px]">IGST%</th>
                )}
                <th className="px-2 py-2.5 text-right font-semibold w-[90px]">Tax</th>
                <th className="px-3 py-2.5 text-right font-semibold w-[100px]">Total</th>
                <th className="w-[36px]"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => {
                const taxAmt = parseFloat(item.cgstAmount || "0") + parseFloat(item.sgstAmount || "0") + parseFloat(item.igstAmount || "0");
                return (
                  <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50/30 group transition-colors">
                    <td className="px-3 py-1.5">
                      <input type="text" value={item.description} onChange={(e) => updateLineItem(idx, { description: e.target.value })} placeholder="Item description..." className="w-full text-xs text-gray-700 bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" value={item.hsnSac} onChange={(e) => updateLineItem(idx, { hsnSac: e.target.value })} placeholder="9983" className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors font-mono" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={item.quantity} onChange={(e) => updateLineItem(idx, { quantity: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" value={item.uom} onChange={(e) => updateLineItem(idx, { uom: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={item.rate} onChange={(e) => updateLineItem(idx, { rate: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                    </td>
                    {gstType === "cgst_sgst" ? (
                      <>
                        <td className="px-2 py-1.5">
                          <input type="number" value={item.cgstPercent} onChange={(e) => updateLineItem(idx, { cgstPercent: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={item.sgstPercent} onChange={(e) => updateLineItem(idx, { sgstPercent: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                        </td>
                      </>
                    ) : (
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.igstPercent} onChange={(e) => updateLineItem(idx, { igstPercent: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                      </td>
                    )}
                    <td className="px-2 py-1.5 text-right text-xs text-gray-500 font-medium">{formatCurrency(taxAmt)}</td>
                    <td className="px-3 py-1.5 text-right text-xs font-bold text-gray-800">{formatCurrency(parseFloat(item.lineTotal) || 0)}</td>
                    <td className="px-1 py-1.5">
                      {lineItems.length > 1 && (
                        <button onClick={() => removeLineItem(idx)} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes to the client..." className={inputCls + " resize-none"} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Terms & Conditions</label>
            <textarea rows={3} value={form.termsAndConditions} onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })} className={inputCls + " resize-none"} />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span className="font-semibold text-gray-700">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Taxable Amount</span>
              <span className="font-semibold text-gray-700">{formatCurrency(totals.taxableAmount)}</span>
            </div>
            {gstType === "cgst_sgst" ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">CGST</span>
                  <span className="font-semibold text-gray-700">{formatCurrency(totals.cgstTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SGST</span>
                  <span className="font-semibold text-gray-700">{formatCurrency(totals.sgstTotal)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-400">IGST</span>
                <span className="font-semibold text-gray-700">{formatCurrency(totals.igstTotal)}</span>
              </div>
            )}
            <div className="border-t-2 border-[#E31E24]/20 pt-3">
              <div className="flex justify-between">
                <span className="text-base font-black text-gray-800">Grand Total</span>
                <span className="text-lg font-black text-[#E31E24]">{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

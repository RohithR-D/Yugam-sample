import { useState } from "react";
import {
  Search,
  ShoppingCart,
  Eye,
  Download,
  Truck,
  FileText,
  ClipboardList,
  Package,
  DollarSign,
  AlertOctagon,
} from "lucide-react";

const metrics = [
  { label: "Active POs", value: "36", icon: ClipboardList, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  { label: "Pending Deliveries", value: "14", icon: Package, iconColor: "text-orange-500", ringColor: "border-orange-200" },
  { label: "Spend This Month", value: "₹ 15.2L", icon: DollarSign, iconColor: "text-green-500", ringColor: "border-green-200" },
  { label: "Flagged Issues", value: "3", icon: AlertOctagon, iconColor: "text-red-500", ringColor: "border-red-200" },
];

type DeliveryStage = "Ordered" | "Shipped" | "Partially Received" | "Received";

interface PurchaseOrder {
  id: string;
  supplier: string;
  value: string;
  stage: DeliveryStage;
}

const orders: PurchaseOrder[] = [
  { id: "#PO-2026-112", supplier: "Steel Matrix Ltd", value: "₹ 4.8L", stage: "Ordered" },
  { id: "#PO-2026-108", supplier: "Kaveri Polymers", value: "₹ 2.1L", stage: "Shipped" },
  { id: "#PO-2026-105", supplier: "BrightArc Electronics", value: "₹ 7.6L", stage: "Partially Received" },
  { id: "#PO-2026-101", supplier: "Apex Industrial Supply", value: "₹ 3.4L", stage: "Received" },
];

const stages = ["Ordered", "Shipped", "Received"] as const;

function stageIndex(stage: DeliveryStage): number {
  if (stage === "Ordered") return 0;
  if (stage === "Shipped") return 1;
  if (stage === "Partially Received") return 1;
  return 2;
}

function DeliveryTracker({ stage }: { stage: DeliveryStage }) {
  const activeIdx = stageIndex(stage);
  const isPartial = stage === "Partially Received";

  return (
    <div className="flex items-center w-56">
      {stages.map((s, i) => {
        const completed = activeIdx >= i;
        const isCurrentPartial = isPartial && i === 2;
        const nodeColor = completed
          ? "bg-green-500 border-green-500"
          : isCurrentPartial
          ? "bg-white border-yellow-400 border-2"
          : "bg-white border-gray-300";
        const showCheck = completed && !isCurrentPartial;

        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full border-2 ${nodeColor} flex items-center justify-center`}>
                {showCheck && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isCurrentPartial && <span className="w-2 h-2 rounded-full bg-yellow-400" />}
              </div>
              <span className={`text-[10px] font-medium mt-1 ${completed ? "text-green-600" : "text-gray-400"}`}>
                {i === 2 && isPartial ? "Partial" : s}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-12px] ${activeIdx > i ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FlexDashboard() {
  const [search, setSearch] = useState("");

  const filtered = orders.filter(
    (o) =>
      o.supplier.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flex Procurement</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage suppliers & purchase orders</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
          <ShoppingCart className="w-4 h-4" />
          Create PO
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
                  <p className="text-2xl font-bold text-gray-800 mt-0.5">{m.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search POs or suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((po) => (
          <div
            key={po.id}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono">{po.id}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{po.supplier}</p>
              </div>
            </div>

            <div className="min-w-[100px]">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Value</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{po.value}</p>
            </div>

            <DeliveryTracker stage={po.stage} />

            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors" title="View Details">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Download PO">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Track Shipment">
                <Truck className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

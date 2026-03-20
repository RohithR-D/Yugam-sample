import { useState } from "react";
import {
  Search,
  Package,
  Boxes,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  PlusCircle,
  MinusCircle,
  Clock,
  ShoppingCart,
} from "lucide-react";

const metrics = [
  { label: "Total SKUs", value: "1,248", icon: Boxes, iconColor: "text-blue-500", ringColor: "border-blue-200" },
  { label: "Low Stock Alerts", value: "17", icon: AlertTriangle, iconColor: "text-red-500", ringColor: "border-red-200" },
  { label: "Inbound (24h)", value: "342", icon: TrendingUp, iconColor: "text-green-500", ringColor: "border-green-200" },
  { label: "Valuation", value: "₹ 42.8L", icon: DollarSign, iconColor: "text-orange-500", ringColor: "border-orange-200" },
];

type StockHealth = "Critical" | "Low" | "Healthy" | "Surplus";

interface StockItem {
  sku: string;
  name: string;
  warehouse: string;
  level: number;
  health: StockHealth;
}

const items: StockItem[] = [
  { sku: "#SKU-8821", name: "Industrial Grade Steel", warehouse: "Unit A — Primary", level: 12, health: "Critical" },
  { sku: "#SKU-4410", name: "Copper Wire Spool (500m)", warehouse: "Unit B — Secondary", level: 28, health: "Low" },
  { sku: "#SKU-7733", name: "Hydraulic Press Seal Kit", warehouse: "Unit A — Primary", level: 65, health: "Healthy" },
  { sku: "#SKU-2209", name: "Precision Ball Bearings", warehouse: "Unit C — Overflow", level: 85, health: "Healthy" },
  { sku: "#SKU-1155", name: "Teflon Coating Fluid (20L)", warehouse: "Unit A — Primary", level: 95, health: "Surplus" },
];

function StockLevelBar({ level, health }: { level: number; health: StockHealth }) {
  const segments = 5;
  const filled = Math.round((level / 100) * segments);

  const colorMap: Record<StockHealth, string> = {
    Critical: "bg-red-500",
    Low: "bg-yellow-400",
    Healthy: "bg-green-500",
    Surplus: "bg-blue-400",
  };
  const textMap: Record<StockHealth, string> = {
    Critical: "text-red-600",
    Low: "text-yellow-600",
    Healthy: "text-green-600",
    Surplus: "text-blue-600",
  };

  return (
    <div className="w-56">
      <p className={`text-[11px] font-semibold ${textMap[health]} mb-1.5`}>
        {health === "Critical" ? `Critical: ${level}%` : `Stock Level: ${level}%`}
      </p>
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full ${i < filled ? colorMap[health] : "bg-gray-200"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function VaultDashboard() {
  const [search, setSearch] = useState("");

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.warehouse.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vault Inventory</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time stock tracking & warehouse levels</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all">
          <Package className="w-4 h-4" />
          Add Item
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
          placeholder="Search warehouse or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((item) => (
          <div
            key={item.sku}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between hover:border-red-100 transition-all group"
          >
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className="w-11 h-11 bg-gray-50 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-300" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.name}</p>
              </div>
            </div>

            <div className="min-w-[130px]">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Warehouse</p>
              <p className="text-sm font-medium text-gray-600 mt-0.5">{item.warehouse}</p>
            </div>

            <StockLevelBar level={item.level} health={item.health} />

            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Adjust Stock">
                <PlusCircle className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="Reduce Stock">
                <MinusCircle className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View History">
                <Clock className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors" title="Order More">
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

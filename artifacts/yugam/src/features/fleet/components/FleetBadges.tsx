import { Car, Truck } from "lucide-react";

export function VehicleStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Available: "bg-green-100 text-green-700 border-green-300",
    "On Trip": "bg-blue-100 text-blue-700 border-blue-300",
    Maintenance: "bg-amber-100 text-amber-700 border-amber-300",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-300"}`}
    >
      {status}
    </span>
  );
}

export function TripStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Scheduled: "bg-gray-100 text-gray-600",
    "In Transit": "bg-blue-100 text-blue-700",
    Completed: "bg-green-100 text-green-700",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export function ExpenseTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    Fuel: "bg-orange-50 text-orange-600",
    Repair: "bg-red-50 text-red-600",
    Servicing: "bg-blue-50 text-blue-600",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${styles[type] || "bg-gray-50 text-gray-600"}`}>
      {type}
    </span>
  );
}

export function VehicleTypeBadge({ type }: { type: string }) {
  const icons: Record<string, typeof Truck> = { Truck, Van: Truck, Car };
  const Icon = icons[type] || Truck;

  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <Icon className="w-3.5 h-3.5" /> {type}
    </span>
  );
}

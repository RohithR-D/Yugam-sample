import { AlertTriangle, Navigation, Truck, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getFleetDashboard } from "../services/fleetService";
import type { DashboardData } from "../types";
import { formatDate, PIE_COLORS } from "../utils/fleetUtils";
import { VehicleTypeBadge } from "./FleetBadges";

export function FleetDashboardView() {
  const [data, setData] = useState<DashboardData>({
    total: 0,
    onTrip: 0,
    inMaintenance: 0,
    available: 0,
    expiring: [],
  });

  useEffect(() => {
    getFleetDashboard()
      .then((dashboard) => {
        if (dashboard) {
          setData(dashboard);
        }
      })
      .catch(() => {
        // no-op
      });
  }, []);

  const pieData = useMemo(
    () =>
      [
        { name: "Available", value: data.available },
        { name: "On Trip", value: data.onTrip },
        { name: "Maintenance", value: data.inMaintenance },
      ].filter((entry) => entry.value > 0),
    [data],
  );

  const metricCards = [
    {
      label: "Total Vehicles",
      value: data.total,
      icon: Truck,
      color: "text-gray-700",
      bg: "bg-gray-50",
      ring: "ring-gray-200",
    },
    {
      label: "Vehicles On Trip",
      value: data.onTrip,
      icon: Navigation,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ring: "ring-blue-200",
    },
    {
      label: "In Maintenance",
      value: data.inMaintenance,
      icon: Wrench,
      color: "text-amber-600",
      bg: "bg-amber-50",
      ring: "ring-amber-200",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fleet Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Overview of company vehicle fleet and logistics</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full ${metric.bg} ring-2 ${metric.ring} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{metric.label}</p>
                  <p className="text-3xl font-black text-gray-800 mt-0.5">{metric.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Fleet Status</h3>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No vehicles registered</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-gray-700">Upcoming Expiries (30 days)</h3>
          </div>
          {data.expiring.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">No upcoming expiries</div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-auto">
              {data.expiring.map((vehicle, index) => (
                <div key={index} className="border border-amber-100 bg-amber-50/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">{vehicle.regNumber}</p>
                    <VehicleTypeBadge type={vehicle.vehicleType} />
                  </div>
                  <div className="mt-1.5 flex gap-3">
                    {vehicle.expiries.map((expiry, expiryIndex) => (
                      <span key={expiryIndex} className="text-xs text-amber-700 font-medium">
                        {expiry.type}: {formatDate(expiry.date)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

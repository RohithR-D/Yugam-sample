import {
  DispatchTripsView,
  FleetDashboardView,
  FuelMaintenanceView,
  VehicleDirectoryView,
} from "../components";
import { useFleetSub } from "../hooks/useFleetSub";

export default function FleetDashboard() {
  const sub = useFleetSub();

  switch (sub) {
    case "Fleet Dashboard":
      return <FleetDashboardView />;
    case "Vehicle Directory":
      return <VehicleDirectoryView />;
    case "Dispatch & Trips":
      return <DispatchTripsView />;
    case "Fuel & Maintenance Logs":
      return <FuelMaintenanceView />;
    default:
      return <FleetDashboardView />;
  }
}

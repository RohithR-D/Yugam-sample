import { Router } from "express";
import {
  handleCreateFleetExpense,
  handleCreateFleetTrip,
  handleCreateFleetVehicle,
  handleDeleteFleetExpense,
  handleDeleteFleetVehicle,
  handleGetFleetDashboard,
  handleGetFleetExpenses,
  handleGetFleetTrips,
  handleGetFleetVehicles,
  handleUpdateFleetTripStatus,
  handleUpdateFleetVehicle,
} from "../controllers/fleetController";

const fleetRouter = Router();

fleetRouter.get("/fleet/dashboard", handleGetFleetDashboard);

fleetRouter.get("/fleet/vehicles", handleGetFleetVehicles);
fleetRouter.post("/fleet/vehicles", handleCreateFleetVehicle);
fleetRouter.patch("/fleet/vehicles/:id", handleUpdateFleetVehicle);
fleetRouter.delete("/fleet/vehicles/:id", handleDeleteFleetVehicle);

fleetRouter.get("/fleet/trips", handleGetFleetTrips);
fleetRouter.post("/fleet/trips", handleCreateFleetTrip);
fleetRouter.patch("/fleet/trips/:id/status", handleUpdateFleetTripStatus);

fleetRouter.get("/fleet/expenses", handleGetFleetExpenses);
fleetRouter.post("/fleet/expenses", handleCreateFleetExpense);
fleetRouter.delete("/fleet/expenses/:id", handleDeleteFleetExpense);

export default fleetRouter;

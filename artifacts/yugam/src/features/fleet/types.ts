export type FleetSub =
	| "Fleet Dashboard"
	| "Vehicle Directory"
	| "Dispatch & Trips"
	| "Fuel & Maintenance Logs";

export interface Vehicle {
	id: number;
	regNumber: string;
	type: string;
	make: string;
	model: string;
	status: string;
	rcExpiry: string | null;
	insuranceExpiry: string | null;
	createdAt: string | null;
}

export interface Trip {
	id: number;
	vehicleId: number;
	vehicleReg: string;
	driverName: string;
	origin: string;
	destination: string;
	startTime: string;
	endTime: string | null;
	status: string;
	notes: string;
	createdAt: string | null;
}

export interface Expense {
	id: number;
	vehicleId: number;
	vehicleReg: string;
	expenseDate: string;
	expenseType: string;
	amount: string;
	description: string;
	loggedBy: string;
	createdAt: string | null;
}

export interface DashboardData {
	total: number;
	onTrip: number;
	inMaintenance: number;
	available: number;
	expiring: {
		regNumber: string;
		vehicleType: string;
		expiries: { type: string; date: string }[];
	}[];
}

export interface VehicleFormData {
	regNumber: string;
	type: string;
	make: string;
	model: string;
	status: string;
	rcExpiry: string;
	insuranceExpiry: string;
}

export interface TripFormData {
	vehicleId: string;
	vehicleReg: string;
	driverName: string;
	origin: string;
	destination: string;
	startTime: string;
	status: string;
	notes: string;
}

export interface ExpenseFormData {
	vehicleId: string;
	vehicleReg: string;
	expenseDate: string;
	expenseType: string;
	amount: string;
	description: string;
	loggedBy: string;
}

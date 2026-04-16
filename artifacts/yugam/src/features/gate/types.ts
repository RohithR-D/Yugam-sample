export interface VisitorRecord {
	id: number;
	visitorName: string;
	phone: string;
	photoUrl: string;
	hostEmployeeId: number | null;
	hostName: string;
	purpose: string;
	ticketRef: string;
	classification: string;
	status: string;
	checkInTime: string;
	checkOutTime: string | null;
	createdAt: string | null;
	blacklistAlert?: boolean;
}

export interface Employee {
	id: number;
	name: string;
	department: string;
}

export interface WatchlistEntry {
	id: number;
	name: string;
	phone: string;
	classification: string;
	reason: string;
	createdAt: string | null;
}

export interface GateMetrics {
	currentOccupancy: number;
	totalToday: number;
	expectedVIPs: number;
}

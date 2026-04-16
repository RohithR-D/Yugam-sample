export type ForgeSub =
	| "Production Dashboard"
	| "Bill of Materials"
	| "Workstations & Routing"
	| "Work Orders"
	| "Quality Control"
	| "Downtime Logs";

export interface Workstation {
	id: number;
	name: string;
	type: string;
	costPerHour: string;
	status: string;
	description: string;
	locationId: number | null;
	capacity: number;
	currentStatus: string;
	maintenanceSchedule: string | null;
	lastMaintenanceDate: string | null;
	nextMaintenanceDate: string | null;
	createdAt: string | null;
}

export interface BOM {
	id: number;
	productName: string;
	productCode: string;
	uom: string;
	outputQty: number;
	notes: string;
	productItemId: number | null;
	version: number;
	bomStatus: string;
	estimatedCostPerUnit: string;
	createdAt: string | null;
	materials?: BOMMaterial[];
	routing?: BOMRouting[];
}

export interface BOMMaterial {
	id: number;
	bomId: number;
	itemName: string;
	itemId: number | null;
	qty: string;
	uom: string;
	wastagePercent: string;
}

export interface BOMRouting {
	id: number;
	bomId: number;
	sequenceNo: number;
	workstationId: number;
	workstationName: string;
	operationName: string;
	estimatedMinutes: number;
	sopReference: string | null;
	sopDescription: string | null;
	hasQcCheck: boolean;
	qcChecklistJson: string | null;
	consumableMaterials: string | null;
	setupTimeMinutes: number;
}

export interface WorkOrder {
	id: number;
	woNumber: string;
	productName: string;
	bomId: number | null;
	productItemId: number | null;
	productionLocationId: number | null;
	targetQty: number;
	producedQty: number;
	scrapQty: number;
	assignedWorkstationId: number | null;
	assignedWorkstationName: string;
	status: string;
	priority: string;
	startDate: string | null;
	endDate: string | null;
	expectedEndDate: string | null;
	actualEndDate: string | null;
	notes: string;
	projectId: number | null;
	taskId: number | null;
	currentRoutingStep: number;
	totalRoutingSteps: number;
	materialsCost: string;
	laborCost: string;
	overheadCost: string;
	totalCost: string;
	costPerUnit: string;
	trackIndividualUnits: boolean;
	createdAt: string | null;
}

export interface WOUnit {
	id: number;
	workOrderId: number;
	unitNumber: number;
	unitIdentifier: string;
	currentStepSequence: number;
	currentStepName: string | null;
	status: string;
	startedAt: string | null;
	completedAt: string | null;
	notes: string | null;
}

export interface ProductionLogEntry {
	id: number;
	workOrderId: number;
	unitId: number;
	routingStepId: number;
	sequenceNo: number;
	workstationId: number | null;
	operatorName: string | null;
	status: string;
	startTime: string | null;
	endTime: string | null;
	actualMinutes: number | null;
	setupMinutes: number;
	qcRequired: boolean;
	qcStatus: string;
	qcRecordId: number | null;
	notes: string | null;
}

export interface MaterialConsumption {
	id: number;
	workOrderId: number;
	itemId: number;
	itemName: string;
	bomEstimatedQty: string;
	actualQtyIssued: string;
	actualQtyConsumed: string;
	returnedQty: string;
	uom: string;
	unitCost: string;
	totalCost: string;
	variance: string;
	variancePercent: string;
}

export interface QCRecord {
	id: number;
	workOrderId: number;
	woNumber: string;
	productName: string;
	inspectedQty: number;
	passedQty: number;
	rejectedQty: number;
	rejectionReason: string;
	inspectedBy: string;
	inspectionDate: string | null;
	notes: string;
	routingStepId: number | null;
	unitIdentifier: string | null;
	inspectionType: string;
	result: string;
	checklistResultsJson: string | null;
	reworkRequired: boolean;
	reworkInstructions: string | null;
	defectCategory: string | null;
	createdAt: string | null;
}

export interface DowntimeLog {
	id: number;
	workstationId: number;
	workstationName: string;
	reason: string;
	startTime: string;
	endTime: string | null;
	totalMinutesLost: number;
	notes: string;
	loggedBy: string;
	workOrderId: number | null;
	costImpact: string;
	category: string;
	createdAt: string | null;
}

export interface DashSummary {
	activeWorkOrders: number;
	todayYield: number;
	oee: number;
	scrapRate: number;
	totalMaterialsCost: number;
	totalLaborCost: number;
	totalProductionCost: number;
	workstations: {
		total: number;
		active: number;
		idle: number;
		maintenance: number;
		breakdown: number;
	};
}

export interface CatalogItem {
	id: number;
	name: string;
	sku: string;
	uom: string;
	unitPrice: string;
	globalStock: number;
}

export interface Location {
	id: number;
	name: string;
}

export interface Project {
	id: number;
	projectName: string;
}

export interface Task {
	id: number;
	title: string;
}

export interface ForgeData {
	workstations: Workstation[];
	boms: BOM[];
	workOrders: WorkOrder[];
	qcRecords: QCRecord[];
	downtimeLogs: DowntimeLog[];
	dashSummary: DashSummary | null;
	catalogItems: CatalogItem[];
	locations: Location[];
	projects: Project[];
}

export type TabType = "proposals" | "catalog" | "analytics";
export type BuilderView = "cover" | "scope" | "investment";

export interface ProposalRecord {
	id: number;
	clientId: number | null;
	title: string;
	quoteNumber: string;
	revision: string;
	status: string;
	validFrom: string | null;
	validTo: string | null;
	projectLocation: string;
	pocName: string;
	pocContact: string;
	scopeOfWork: string;
	inclusions: string;
	exclusions: string;
	totalEstimatedHours: string;
	grandTotal: string;
	proposalData?: any;
	boqData?: any;
	createdAt: string | null;
	updatedAt: string | null;
	clientName: string | null;
}

export interface CatalogItem {
	id: number;
	category: string;
	itemCode: string;
	templateName: string;
	description: string;
	uom: string;
	tags: string;
	baseHours: string;
	baseRate: string;
	createdAt: string | null;
}

export interface BOQItem {
	id: string;
	itemCode: string;
	description: string;
	uom: string;
	qty: number;
	baseRate: number;
	labor: number;
	machine: number;
	overhead: number;
	marginPct: number;
	discPct: number;
	taxPct: number;
	wastagePct: number;
	freight: number;
	leadTime: string;
}

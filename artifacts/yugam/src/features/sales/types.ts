export type SalesSubModule =
	| "Overview"
	| "Quotation"
	| "Proforma Invoice"
	| "Sales Order"
	| "Invoices"
	| "Delivery Challan"
	| "Sales Return";

export interface SalesDoc {
	id: number;
	clientId: number | null;
	clientName: string;
	documentType: string;
	documentNumber: string;
	grandTotal: string;
	status: string;
	createdAt: string | null;
	balanceDue?: string;
	paymentStatus?: string;
	[key: string]: any;
}

export interface DocItem {
	id?: number;
	description: string;
	hsnSac: string;
	quantity: string;
	uom: string;
	rate: string;
	discountPercent: string;
	cgstPercent: string;
	cgstAmount: string;
	sgstPercent: string;
	sgstAmount: string;
	igstPercent: string;
	igstAmount: string;
	taxableAmount: string;
	lineTotal: string;
	itemType: string;
}

export interface Client {
	id: number;
	companyName: string;
	stateCode?: string;
	gstin?: string;
}

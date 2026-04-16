export type BillrTab = "tax" | "proforma" | "receipts" | "credit";

export interface InvoiceRecord {
	id: number;
	clientId: number | null;
	clientName: string;
	type: string;
	documentNumber: string;
	invoiceNumber: string;
	poReference: string;
	issueDate: string | null;
	dueDate: string | null;
	subtotal: string;
	discountAmount: string;
	sgstTotal: string;
	cgstTotal: string;
	amount: string;
	grandTotal: string;
	balanceDue: string;
	notes: string;
	terms: string;
	reasonForCredit: string;
	invoiceReference: string;
	status: string;
	createdAt: string | null;
	items?: LineItem[];
}

export interface LineItem {
	id?: number;
	invoiceId?: number;
	description: string;
	hsnSac: string;
	qty: string;
	unit: string;
	rate: string;
	taxPercentage: string;
	taxAmount: string;
	lineTotal: string;
}

export interface ReceiptRecord {
	id: number;
	clientId: number | null;
	clientName: string;
	paymentDate: string | null;
	paymentNumber: string;
	amountReceived: string;
	bankCharges: string;
	paymentMode: string;
	depositTo: string;
	reference: string;
	taxDeducted: boolean;
	createdAt: string | null;
}

export interface Client {
	id: number;
	companyName: string;
}

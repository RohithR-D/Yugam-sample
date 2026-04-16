export type FlexSub =
	| "Material Requests"
	| "Purchase Requests"
	| "Quotation Requests"
	| "Quotation Validations"
	| "Purchase Orders"
	| "Goods Receipts"
	| "Purchase Invoices"
	| "Purchase Returns";

export interface MR { id: number; itemName: string; itemId: number | null; requestedQty: number; requiredByDate: string | null; department: string; project: string; requestedBy: string; status: string; notes: string; createdAt: string | null; }
export interface PR { id: number; materialRequestId: number | null; itemName: string; itemId: number | null; requestedQty: number; estimatedUnitPrice: string; requiredByDate: string | null; department: string; project: string; requestedBy: string; status: string; notes: string; createdAt: string | null; }
export interface RFQ { id: number; purchaseRequestId: number | null; rfqNumber: string; itemName: string; itemId: number | null; quantity: number; vendors: string; status: string; requiredByDate: string | null; notes: string; createdAt: string | null; }
export interface Bid { id: number; rfqId: number; vendorName: string; unitPrice: string; taxPercent: string; leadTimeDays: number; notes: string; selected: string; createdAt: string | null; }
export interface PO { id: number; poNumber: string; vendorName: string; rfqId: number | null; poDate: string | null; deliveryDate: string | null; subtotal: string; cgstTotal: string; sgstTotal: string; igstTotal: string; grandTotal: string; terms: string; status: string; createdAt: string | null; items?: POItem[]; }
export interface POItem { id: number; poId: number; description: string; hsnSac: string; qty: number; rate: string; cgstPercent: string; sgstPercent: string; igstPercent: string; lineTotal: string; }
export interface GRN { id: number; grnNumber: string; poId: number; vendorName: string; receivedDate: string | null; receivedBy: string; notes: string; status: string; createdAt: string | null; items?: GRNItem[]; }
export interface GRNItem { id: number; grnId: number; description: string; orderedQty: number; receivedQty: number; acceptedQty: number; rejectedQty: number; }
export interface PInv { id: number; invoiceNumber: string; vendorName: string; poId: number | null; grnId: number | null; invoiceDate: string | null; invoiceAmount: string; poAmount: string; grnAmount: string; matchStatus: string; paymentStatus: string; notes: string; createdAt: string | null; }
export interface PRet { id: number; returnNumber: string; vendorName: string; poId: number | null; grnId: number | null; itemName: string; returnedQty: number; reason: string; notes: string; returnDate: string | null; status: string; createdAt: string | null; }

export type LedgerSub =
	| "Finance Dashboard"
	| "Chart of Accounts"
	| "Accounts Payable (AP)"
	| "Accounts Receivable (AR)"
	| "Journal Entries"
	| "Financial Statements";

export interface CoaRecord { id: number; accountCode: string; accountName: string; accountType: string; currentBalance: string; parentId: number | null; description: string; isActive: string; createdAt: string | null; }
export interface JournalEntry { id: number; entryDate: string; reference: string; description: string; totalDebit: string; totalCredit: string; status: string; createdAt: string | null; }
export interface JournalLine { id: number; journalEntryId: number; accountId: number; accountCode: string; accountName: string; debit: string; credit: string; memo: string; }
export interface APRecord { id: number; vendorName: string; billNumber: string; billDate: string; dueDate: string; amount: string; paidAmount: string; status: string; entryType: string; notes: string; createdAt: string | null; }
export interface ARRecord { id: number; clientName: string; invoiceNumber: string; invoiceDate: string; dueDate: string; amount: string; receivedAmount: string; status: string; entryType: string; notes: string; createdAt: string | null; }
export interface DashSummary { totalCash: number; totalReceivables: number; totalPayables: number; netIncome: number; arAging: { days30: number; days60: number; days90: number }; apAging: { days30: number; days60: number; days90: number }; }

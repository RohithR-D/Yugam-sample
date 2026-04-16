export type TrailSub = "Expense Dashboard" | "My Claims" | "Approval Queue" | "Petty Cash Ledger";

export interface ClaimRecord { id: number; claimId: string; employeeName: string; date: string; category: string; claimType: string; amount: string; status: string; description: string; distance: string | null; ratePerKm: string | null; numDays: string | null; dailyRate: string | null; ledgerJournalId: string | null; createdAt: string | null; }
export interface PettyCashRecord { id: number; date: string; description: string; cashIn: string; cashOut: string; runningBalance: string; createdAt: string | null; }
export interface DashSummary { totalClaimsThisMonth: number; pendingApprovals: number; totalPettyCashDisbursed: number; categoryBreakdown: { Travel: number; Fuel: number; Meals: number; Misc: number }; }

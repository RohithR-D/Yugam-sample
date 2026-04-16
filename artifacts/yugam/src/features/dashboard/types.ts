export interface DashboardTransaction {
	id: number;
	date: string;
	description: string;
	category: string;
	type: string;
	amount: string;
}

export interface DashboardTask {
	id: number;
	title: string;
	assignee: string;
	status: string;
	priority: string;
	createdAt: string;
}

export interface DashboardSummary {
	activeEmployees: number;
	openTasks: number;
	activeProjects: number;
	totalClients: number;
	activeContracts: number;
	onPremisesVisitors: number;
	pendingShipments: number;
	pendingExpenses: number;
	totalCredits: number;
	totalDebits: number;
	monthlyPL: number;
	outstandingInvoiceAmount: number;
	outstandingInvoiceCount: number;
	recentTransactions: DashboardTransaction[];
	recentTasks: DashboardTask[];
}

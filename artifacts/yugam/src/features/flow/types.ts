export type FlowSub =
	| "Dashboard"
	| "Project Portfolio"
	| "Milestones & Gantt"
	| "Budgets & Costing"
	| "Document Center";

export interface ProjectRecord {
	id: number;
	projectName: string;
	clientName: string;
	budget: string;
	totalValue: string;
	status: string;
	startDate: string | null;
	dueDate: string;
	description: string;
	createdAt: string | null;
}

export interface Milestone {
	id: number;
	projectId: number;
	title: string;
	targetDate: string;
	completionPercent: number;
	notes: string;
	createdAt: string | null;
}

export interface BudgetLine {
	id: number;
	projectId: number;
	category: string;
	description: string;
	estimatedBudget: string;
	actualCost: string;
	notes: string;
	createdAt: string | null;
}

export interface DocRecord {
	id: number;
	projectId: number;
	fileName: string;
	fileUrl: string;
	fileType: string;
	fileSize: string;
	uploadedBy: string;
	notes: string;
	createdAt: string | null;
}

export interface DashSummary {
	activeProjects: number;
	totalPortfolioValue: number;
	scheduleVarianceDays: number;
	budgetBurnRate: number;
	upcomingMilestones: Milestone[];
	categoryBreakdown: {
		category: string;
		estimated: number;
		actual: number;
	}[];
}

export interface ContactRecord {
	id: number;
	name: string;
	email: string;
	phone: string;
	contactType: string;
	clientId: number | null;
	createdAt: string | null;
	companyName?: string | null;
}

export interface ActivityRecord {
	id: number;
	clientId: number;
	activityType: string;
	notes: string;
	createdAt: string | null;
}

export interface ClientRecord {
	id: number;
	companyName: string;
	contactName: string;
	industry: string;
	status: string;
	pipelineStatus: string;
	dealValue: string;
	createdAt: string | null;
	contacts: ContactRecord[];
	activities: ActivityRecord[];
}

export type TabType = "pipeline" | "clients" | "contacts";

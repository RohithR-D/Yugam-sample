export type SyncSub = "Chats" | "Calls" | "Meetings";

export interface ChatMsg {
	id: number;
	threadType: string;
	employeeId: number | null;
	senderName: string;
	messageBody: string;
	timestamp: string | null;
}

export interface CallLog {
	id: number;
	loggedByEmployee: string;
	clientName: string;
	callType: string;
	durationMinutes: number;
	callDate: string | null;
	callOutcome: string;
	detailedNotes: string;
	createdAt: string | null;
}

export interface Meeting {
	id: number;
	loggedByEmployee: string;
	clientName: string;
	meetingTitle: string;
	meetingDate: string | null;
	startTime: string;
	endTime: string;
	attendees: string;
	agendaAndMinutes: string;
	status: string;
	createdAt: string | null;
}

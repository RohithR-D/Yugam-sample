export interface User {
	id: number;
	name: string;
	email: string;
	role: string;
	lastLogin: string | null;
	createdAt: string | null;
}

export interface CreateUserPayload {
	name: string;
	email: string;
	role: string;
}

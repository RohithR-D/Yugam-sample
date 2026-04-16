export interface EmployeeRecord {
	id: number;
	name: string;
	designation: string;
	department: string;
	status: string;
	joinDate: string | null;
	createdAt: string | null;
}

export interface EmployeeFormData {
	name: string;
	designation: string;
	department: string;
	status: string;
	joinDate: string;
}

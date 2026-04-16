export interface PayrollRecord {
	id: number;
	employeeName: string;
	payPeriod: string;
	grossPay: string;
	deductions: string;
	netPay: string;
	status: string;
	createdAt: string | null;
}

export interface PayrollFormData {
	employeeName: string;
	payPeriod: string;
	grossPay: string;
	deductions: string;
	status: string;
}

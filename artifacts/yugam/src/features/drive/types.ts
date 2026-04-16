export interface FileRecord {
	id: number;
	fileName: string;
	folder: string;
	size: string;
	uploadedBy: string;
	uploadDate: string;
	createdAt: string | null;
}

export interface CreateFilePayload {
	fileName: string;
	folder: string;
	size: string;
	uploadedBy: string;
	uploadDate: string;
}

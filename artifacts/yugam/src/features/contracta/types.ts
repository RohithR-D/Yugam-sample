export interface Compliance {
  id: number;
  title: string;
  category: string;
  entityName: string;
  validFrom: string;
  expiryDate: string;
  status: string;
  attachmentUrl: string | null;
  notes: string | null;
  createdAt: string | null;
}

export interface Template {
  id: number;
  templateName: string;
  category: string;
  contentHtml: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DashboardSummary {
  active: number;
  expiringSoon: number;
  expired: number;
  total: number;
  upcomingRenewals: Compliance[];
}

export interface ComplianceFormData {
  title: string;
  entityName: string;
  validFrom: string;
  expiryDate: string;
  notes: string;
}

export interface TemplatePayload {
  templateName: string;
  category: string;
  contentHtml: string;
}


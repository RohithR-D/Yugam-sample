import {
  contractsTable,
  contractaCompliancesTable,
  contractaTemplatesTable,
} from "@workspace/db/schema";

function computeStatus(expiryDate: Date): string {
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "Expired";
  if (diffDays <= 30) return "Expiring Soon";
  return "Active";
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "");
}

export const getContracts = async () => {
  return await contractsTable.find().sort({ createdAt: -1 }).lean();
};

export const createContract = async (data: any) => {
  const contract = await contractsTable.create(data);
  return contract.toObject();
};

export const getContractaCompliances = async (category?: string) => {
  const rows = await contractaCompliancesTable.find().sort({ expiryDate: -1 }).lean();
  const enriched = rows.map((r: any) => ({ ...r, status: computeStatus(new Date(r.expiryDate)) }));
  if (!category) return enriched;
  return enriched.filter((r: any) => r.category === category);
};

export const createContractaCompliance = async (data: any) => {
  const status = computeStatus(new Date(data.expiryDate));
  const row = await contractaCompliancesTable.create({ ...data, status });
  return { ...row.toObject(), status: computeStatus(new Date(row.expiryDate)) };
};

export const deleteContractaCompliance = async (id: number) => {
  const deleted = await contractaCompliancesTable.findOneAndDelete({ id }).lean();
  return deleted !== null;
};

export const getContractaDashboardSummary = async () => {
  const rows = await contractaCompliancesTable.find().lean();
  const enriched = rows.map((r: any) => ({ ...r, status: computeStatus(new Date(r.expiryDate)) }));
  const active = enriched.filter((r) => r.status === "Active").length;
  const expiringSoon = enriched.filter((r) => r.status === "Expiring Soon").length;
  const expired = enriched.filter((r) => r.status === "Expired").length;
  const upcoming = enriched
    .filter((r) => r.status === "Expiring Soon" || r.status === "Active")
    .sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 10);

  return { active, expiringSoon, expired, total: rows.length, upcomingRenewals: upcoming };
};

export const getContractaTemplates = async () => {
  return await contractaTemplatesTable.find().sort({ updatedAt: -1 }).lean();
};

export const createContractaTemplate = async (data: any) => {
  const row = await contractaTemplatesTable.create(data);
  return row.toObject();
};

export const updateContractaTemplate = async (id: number, data: any) => {
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (data.templateName) updates.templateName = data.templateName;
  if (data.category) updates.category = data.category;
  if (data.contentHtml !== undefined) updates.contentHtml = sanitizeHtml(String(data.contentHtml));
  const updated = await contractaTemplatesTable.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  return updated;
};

export const deleteContractaTemplate = async (id: number) => {
  const deleted = await contractaTemplatesTable.findOneAndDelete({ id }).lean();
  return deleted !== null;
};

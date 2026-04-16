export type VaultSub = "Dashboard" | "Item & Product Master" | "Warehouses & Stores" | "Stock Movements" | "Material Issue" | "Store Management" | "Asset Management";

export interface CatalogItem { id: number; name: string; sku: string; category: string; itemType: string; hsnSac: string; unitPrice: string; uom: string; globalStock: number; reorderLevel: number; createdAt: string | null; }
export interface Location { id: number; locationName: string; locationType: string; capacity: number; manager: string; address: string; createdAt: string | null; }
export interface Movement { id: number; itemId: number; movementType: string; quantity: number; fromLocationId: number | null; toLocationId: number | null; referenceNumber: string; notes: string; performedBy: string; movementDate: string | null; createdAt: string | null; }
export interface Indent { id: number; itemId: number; requestedQty: number; approvedQty: number; issuedFromLocationId: number | null; requestedBy: string; department: string; purpose: string; status: string; requestDate: string | null; issueDate: string | null; createdAt: string | null; }
export interface Asset { id: number; assetName: string; serialNumber: string; category: string; status: string; assignedTo: string; purchaseValue: string; purchaseDate: string | null; maintenanceNotes: string; createdAt: string | null; }
export interface DashSummary { totalItems: number; totalValue: number; activeWarehouses: number; pendingIndents: number; categoryBreakdown: Record<string, number>; recentMovements: Movement[]; }

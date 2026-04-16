import { Router } from "express";
import {
  handleGetVaultCatalog,
  handleCreateVaultCatalogItem,
  handleDeleteVaultCatalogItem,
  handleGetVaultLocations,
  handleCreateVaultLocation,
  handleDeleteVaultLocation,
  handleGetStockLedger,
  handleGetStockMovements,
  handleCreateStockMovement,
  handleGetMaterialIndents,
  handleCreateMaterialIndent,
  handleUpdateMaterialIndent,
  handleIssueMaterialIndent,
  handleGetAssets,
  handleCreateAsset,
  handleUpdateAsset,
  handleDeleteAsset,
  handleGetVaultDashboardSummary,
} from "../controllers/vaultController";

const vaultRouter = Router();

vaultRouter.get("/vault/catalog", handleGetVaultCatalog);
vaultRouter.post("/vault/catalog", handleCreateVaultCatalogItem);
vaultRouter.delete("/vault/catalog/:id", handleDeleteVaultCatalogItem);

vaultRouter.get("/vault/locations", handleGetVaultLocations);
vaultRouter.post("/vault/locations", handleCreateVaultLocation);
vaultRouter.delete("/vault/locations/:id", handleDeleteVaultLocation);

vaultRouter.get("/vault/stock-ledger", handleGetStockLedger);
vaultRouter.get("/vault/movements", handleGetStockMovements);
vaultRouter.post("/vault/movements", handleCreateStockMovement);

vaultRouter.get("/vault/indents", handleGetMaterialIndents);
vaultRouter.post("/vault/indents", handleCreateMaterialIndent);
vaultRouter.patch("/vault/indents/:id", handleUpdateMaterialIndent);
vaultRouter.post("/vault/indents/:id/issue", handleIssueMaterialIndent);

vaultRouter.get("/vault/assets", handleGetAssets);
vaultRouter.post("/vault/assets", handleCreateAsset);
vaultRouter.patch("/vault/assets/:id", handleUpdateAsset);
vaultRouter.delete("/vault/assets/:id", handleDeleteAsset);

vaultRouter.get("/vault/dashboard-summary", handleGetVaultDashboardSummary);

export default vaultRouter;

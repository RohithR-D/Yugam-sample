import { authFetch } from "@/lib/authFetch";
import type { Asset, CatalogItem, DashSummary, Indent, Location, Movement } from "../types";

export async function getVaultData() {
  const [catR, locR, mvR, indR, astR, dsR] = await Promise.all([
    authFetch("/api/vault/catalog"),
    authFetch("/api/vault/locations"),
    authFetch("/api/vault/movements"),
    authFetch("/api/vault/indents"),
    authFetch("/api/vault/assets"),
    authFetch("/api/vault/dashboard-summary"),
  ]);

  const [catalog, locations, movements, indents, assets, dashSummary] = await Promise.all([
    catR.ok ? catR.json() : Promise.resolve([] as CatalogItem[]),
    locR.ok ? locR.json() : Promise.resolve([] as Location[]),
    mvR.ok ? mvR.json() : Promise.resolve([] as Movement[]),
    indR.ok ? indR.json() : Promise.resolve([] as Indent[]),
    astR.ok ? astR.json() : Promise.resolve([] as Asset[]),
    dsR.ok ? dsR.json() : Promise.resolve(null as DashSummary | null),
  ]);

  return { catalog, locations, movements, indents, assets, dashSummary };
}

import { useCallback, useEffect, useState } from "react";
import { getVaultData } from "../services/vaultService";
import type { Asset, CatalogItem, DashSummary, Indent, Location, Movement } from "../types";

export function useVault() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [indents, setIndents] = useState<Indent[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [dashSummary, setDashSummary] = useState<DashSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const data = await getVaultData();
      setCatalog(data.catalog);
      setLocations(data.locations);
      setMovements(data.movements);
      setIndents(data.indents);
      setAssets(data.assets);
      setDashSummary(data.dashSummary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { catalog, locations, movements, indents, assets, dashSummary, loading, fetchAll };
}

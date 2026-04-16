import { useCallback, useEffect, useState } from "react";
import { getFlexData } from "../services/flexService";
import type { Bid, GRN, MR, PInv, PO, PR, PRet, RFQ } from "../types";

export function useFlex() {
  const [mrs, setMrs] = useState<MR[]>([]);
  const [prs, setPrs] = useState<PR[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [pos, setPos] = useState<PO[]>([]);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [pinvs, setPinvs] = useState<PInv[]>([]);
  const [prets, setPrets] = useState<PRet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const data = await getFlexData();
      setMrs(data.mrs);
      setPrs(data.prs);
      setRfqs(data.rfqs);
      setBids(data.bids);
      setPos(data.pos);
      setGrns(data.grns);
      setPinvs(data.pinvs);
      setPrets(data.prets);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { mrs, prs, rfqs, bids, pos, grns, pinvs, prets, loading, fetchAll };
}

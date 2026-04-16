import { authFetch } from "@/lib/authFetch";
import type { Bid, GRN, MR, PInv, PO, PR, PRet, RFQ } from "../types";

export async function getFlexData() {
  const [mrR, prR, rfqR, bidR, poR, grnR, piR, prR2] = await Promise.all([
    authFetch("/api/flex/material-requests"),
    authFetch("/api/flex/purchase-requests"),
    authFetch("/api/flex/rfqs"),
    authFetch("/api/flex/rfq-bids"),
    authFetch("/api/flex/purchase-orders"),
    authFetch("/api/flex/goods-receipts"),
    authFetch("/api/flex/purchase-invoices"),
    authFetch("/api/flex/purchase-returns"),
  ]);

  const [mrs, prs, rfqs, bids, pos, grns, pinvs, prets] = await Promise.all([
    mrR.ok ? mrR.json() : Promise.resolve([] as MR[]),
    prR.ok ? prR.json() : Promise.resolve([] as PR[]),
    rfqR.ok ? rfqR.json() : Promise.resolve([] as RFQ[]),
    bidR.ok ? bidR.json() : Promise.resolve([] as Bid[]),
    poR.ok ? poR.json() : Promise.resolve([] as PO[]),
    grnR.ok ? grnR.json() : Promise.resolve([] as GRN[]),
    piR.ok ? piR.json() : Promise.resolve([] as PInv[]),
    prR2.ok ? prR2.json() : Promise.resolve([] as PRet[]),
  ]);

  return { mrs, prs, rfqs, bids, pos, grns, pinvs, prets };
}

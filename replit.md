# Workspace

## Overview

The Yugam ERP system is a comprehensive, TypeScript-based enterprise resource planning solution designed to streamline business operations. It integrates an Express API, a React frontend, and shared libraries within a pnpm monorepo structure. Yugam ERP aims to provide a scalable and modern platform covering essential modules such as HR, Sales, CRM, Invoicing, Inventory, Production, Project Management, and Analytics, catering to diverse business needs and enhancing operational efficiency.

## User Preferences

I want iterative development. I prefer detailed explanations. Ask before making major changes. Do not make changes to the folder `artifacts-monorepo/lib/api-client-react/src/generated/`. Do not make changes to the folder `artifacts-monorepo/lib/api-zod/src/generated/`. Do not make changes to the file `artifacts-monorepo/lib/api-spec/openapi.yaml`.

## System Architecture

The project is structured as a pnpm monorepo, facilitating efficient code sharing and dependency management across various components.

**Monorepo Structure:**
- `artifacts/`: Contains deployable applications (API server, frontend).
- `lib/`: Houses shared libraries (API specifications, database access, generated clients).

**Core Technologies:**
- **Backend:** Node.js, Express, TypeScript.
- **Frontend:** React, Vite, Tailwind CSS.
- **Database:** MongoDB with Mongoose.
- **Validation:** Zod.
- **API Generation:** Orval, driven by OpenAPI.

**TypeScript & Composite Projects:**
- Utilizes TypeScript composite projects for optimized type-checking and build processes, ensuring robust cross-package type resolution.

**API Server (`@workspace/api-server`):**
- Express 5 based API with modular route organization.
- Integrates `@workspace/api-zod` for validation and `@workspace/db` for data persistence.
- Features JWT authentication, global search, standardized pagination, and dedicated analytics endpoints.
- Provides comprehensive RESTful APIs for all ERP modules.

**Database Layer (`@workspace/db`):**
- Employs Mongoose with MongoDB, featuring a comprehensive schema for all ERP entities.
- **46 indexes** on all FK columns optimize query performance.
- **Sales Module (Phase 2):** 15 new tables in `lib/db/src/schema/sales.ts` — document_sequences, client_addresses, quotations/items, proforma_invoices/items, sales_orders/items, delivery_challans/items, sales_invoices/items, sales_returns/items, sales_payments. Old tables renamed to `legacy_*` prefix.
- **Sales API routes:** `artifacts/api-server/src/routes/salesModule.ts` — full CRUD for all 6 document types + payments + client addresses. Auto-numbered documents with row-level locking (doc_sequences table). GST auto-switch: CGST+SGST when place_of_supply matches company state (27), IGST otherwise.
- **Sales Frontend:** `SalesDashboard.tsx` — separate endpoints per doc type, GST auto-switch in line items, per-doc-type status options, Overview dashboard with 6 doc-type count tiles + metrics + charts.
- **Sales→Ledger Automation (Phase 3):** `artifacts/api-server/src/routes/salesLedgerAutomation.ts` — 4 automated triggers connecting Sales to double-entry accounting:
  - Trigger 1: Invoice Approved/Sent → creates journal entry (AR debit, Revenue + GST credits), creates accounts_receivable record, links JE to invoice
  - Trigger 2: Payment Received → creates journal entry (Bank/TDS debit, AR credit), updates invoice payment status + AR record
  - Trigger 3: Sales Return Credit Issued → creates reversing journal entry (Revenue + GST debits, AR credit), creates credit note AR, adjusts original invoice AR
  - Trigger 4: Overdue Check → runs on overview load + dedicated endpoint, marks past-due AR/invoices as "Overdue"
  - Auto-creates 8 required COA accounts if missing (Accounts Receivable, Sales Revenue, CGST/SGST/IGST Output, Bank Account, TDS Receivable, Bank Charges)
  - All triggers wrapped in DB transactions for atomicity; journal entries always balance (debits = credits)
- **Sales→Inventory Automation (Phase 4):** `artifacts/api-server/src/routes/salesInventoryAutomation.ts` — 3 automated triggers connecting Sales to Inventory (Vault):
  - Trigger 1: Delivery Challan Dispatched → creates Outward stock_movements, reduces stock_ledger + inventory_catalog.globalStock, logs low-stock warnings when below reorderLevel. Safety: verifies sufficient stock before dispatch, blocks with error if insufficient
  - Trigger 2: Delivery Challan Dispatched → updates sales_order_items.deliveredQty, recalculates sales_orders.deliveryStatus (Pending/Partial/Delivered)
  - Trigger 3: Sales Return Goods Received (restock=true) → creates Inward stock_movements, increases stock_ledger + globalStock
  - Added dispatch_location_id (FK → inventory_locations) to delivery_challans table
  - All stock updates wrapped in transactions with row-level checks to prevent race conditions
- **Procurement→Inventory→Ledger Automation (Phase 5):** `artifacts/api-server/src/routes/procurementAutomation.ts` — 3 automated triggers connecting Procurement (Flex) to Inventory (Vault) and Accounting (Ledger):
  - Trigger 1: GRN Accepted (status→Complete/Partial) → creates Inward stock_movements, increases stock_ledger + inventory_catalog.globalStock for each accepted GRN item with itemId. Idempotent via referenceNumber guard on stock_movements
  - Trigger 2: Purchase Invoice Matched (matchStatus→Matched) → creates journal entry (Inventory Dr, CGST/SGST/IGST Input Dr, Accounts Payable Cr), creates accounts_payable record with payment_due_days, links JE to invoice, sets paymentStatus to Approved
  - Trigger 3: Purchase Return Confirmed/Sent → reverses stock (Outward movement, reduces globalStock + stock_ledger), creates debit note JE (AP Dr, Inventory + GST Input Cr), creates negative AP record (Debit Note). Blocks if insufficient stock
  - Auto-creates 5 required COA accounts if missing (Inventory/Stock-in-Hand 1200, AP 2100, CGST/SGST/IGST Input 1130-1132)
  - Schema additions: received_at_location_id on goods_receipts, item_id+po_item_id on grn_items, tax breakdown+journal_entry_id+payment_due_days on purchase_invoices, item_id+location_id+tax amounts+journal_entry_id on purchase_returns, item_id on flex_po_items
  - All triggers wrapped in DB transactions; journal entries always balance (debits = credits); idempotent via referenceNumber or journalEntryId guards
- **Production→Inventory Automation (Phase 6):** `artifacts/api-server/src/routes/productionAutomation.ts` — 3 automated triggers connecting Production (Forge) to Inventory (Vault):
  - Trigger 1: Work Order Started (status→In Progress) → consumes BOM materials from inventory. Calculates required qty: (material.qty × targetQty / outputQty) × (1 + wastagePercent/100). Checks stock at production location, creates Outward stock_movements. If insufficient stock: rolls back WO to Draft and returns detailed shortage list (409 Conflict)
  - Trigger 2: Work Order Completed (status→Completed) → adds finished goods (producedQty) to inventory via Inward stock_movement, updates stock_ledger + globalStock. If scrapQty > 0: logs separate Adjustment movement
  - Trigger 3: QC Rejection (forge_quality_control POST with rejectedQty > 0) → creates Adjustment stock_movement with negative quantity, reduces stock_ledger + globalStock
  - Schema additions: productItemId (FK→inventory_catalog) and productionLocationId (FK→inventory_locations) on forge_work_orders
  - All triggers atomic (single transaction with FOR UPDATE locking), idempotent via referenceNumber guards on stock_movements
- **Forge Module Full Rebuild (Phase 8):** Complete rewrite of Forge (Production) module with enhanced schema, backend, and frontend:
  - **Schema:** 6 existing tables updated (workstations: costPerHour/capacity/maintenanceSchedule/nextMaintenanceDate; BOM: version/bomStatus/estimatedCostPerUnit/outputQty/productItemId; BOM routing: setupTimeMinutes/qcRequired/sopReference; WOs: totalRoutingSteps/materialsCost/laborCost/totalProductionCost/trackIndividualUnits/productionLocationId/projectId/taskId; QC: unitId/unitIdentifier/routingStepSequence/defectCategory/reworkRequired; downtime: costImpact/costPerHour). 3 new tables: forge_work_order_units (unit tracking per WO with step progression), forge_production_log (timestamped production events), forge_material_consumption (BOM vs actual material tracking with variance)
  - **Backend routes** (`forge.ts`): WO detail endpoint with all related data (units/materials/QC/downtime/routing), unit advance endpoint, material issue endpoint with stock sufficiency check + row locking, BOM versioning on edit (old→Obsolete, new version→Draft with cost recalculation), BOM cost estimation, project/task/location/inventory helper endpoints
  - **Production automation** (`productionAutomation.ts`): 6 triggers — triggerWorkOrderCreated (unit + material creation, idempotent), triggerUnitAdvance (step progression + QC gating, row-locked), triggerQcLogged (unit status update, row-locked), triggerWorkOrderCompleted (cost calc + FG inventory + project task update), triggerDowntimeLogged (cost impact + workstation status, row-locked). All triggers have FOR UPDATE row locks and state precondition checks
  - **Frontend** (`ForgeDashboard.tsx`): BOM Builder with live cost estimation, SOP/QC checklist fields, status management; WO create form with required BOM, routing preview, material requirements; WO Detail page with 6 tabs (Overview, Unit Tracker, Production Log, Material Consumption, QC Records, Downtime); enhanced Workstation/Downtime/QC forms; Kanban board preserved
  - **Key endpoints:** `/api/forge/work-orders/:id` (detail), `/api/forge/units/:unitId/advance`, `/api/forge/work-orders/:id/issue-material`, `/api/forge/material-variance-report`, `/api/forge/projects`, `/api/forge/projects/:id/tasks`, `/api/forge/locations`, `/api/forge/inventory-items`
- **Cross-Module Wiring (Phase 7):** `artifacts/api-server/src/routes/crossModuleAutomation.ts` — 3 automated trigger families connecting Fleet→Trail→Ledger, Payroll→Ledger, and Trail→Ledger:
  - **Part A — Fleet→Trail→Ledger:**
    - Trigger 1: Fleet expense created with paidBy='Employee' → auto-creates trail_claims record (category='Transport'), sets fleet_expenses.isClaimed=true, trailClaimId=claim.id, reimbursementStatus='Pending'
    - Trigger 2: Trail claim approved (status→'Approved') → creates journal entry (Transport Expense Dr, Employee Reimbursement Payable Cr), updates linked fleet_expenses.reimbursementStatus='Reimbursed'
  - **Part B — Payroll→Ledger:**
    - Trigger: Payroll status→'Processed'/'Paid' → creates journal entry with 5 lines: Salary Expense Dr for grossPay, TDS Payable Cr, PF Payable Cr, ESI Payable Cr, Salary Payable Cr for netPay. Deductions split 40%/40%/20% across TDS/PF/ESI
    - Schema addition: journalEntryId (FK→journal_entries) on payroll table; added 'Processed' to payroll status enum
  - **Part C — Trail Claims→Ledger (standalone):**
    - Trigger: Any trail_claims status→'Approved' AND no existing JE → creates journal entry (relevant Expense Dr, Employee Reimbursement Payable Cr), stores journalEntryId as integer FK
    - Replaces previous inline JE logic which incorrectly stored string JE references
  - Schema additions: paidBy, isClaimed (boolean), trailClaimId (FK→trail_claims), reimbursementStatus on fleet_expenses
  - New COA accounts: Salary Expense (5100), Transport Expense (5300), TDS Payable (2300), PF Payable (2310), ESI Payable (2320), Salary Payable (2400), Employee Reimbursement Payable (2500)
  - All triggers idempotent (journalEntryId/isClaimed guards prevent duplicates), atomic (wrapped in DB transactions)

**API Specifications & Codegen (`@workspace/api-spec`, `@workspace/api-zod`, `@workspace/api-client-react`):**
- OpenAPI 3.1 defines the API contract.
- Orval generates React Query hooks, a fetch client, and Zod schemas from the OpenAPI spec.

**Frontend (`@workspace/yugam`):**
- React, Vite, and Tailwind CSS application.
- **UI/UX Design:**
    - **Theme:** `yugam-red` (#E31E24) accent, `yugam-grey` (#F8F9FA) surfaces, white background.
    - **Font:** Inter (sans-serif).
    - **Layout:** Full-screen with fixed sidebar (250px) and top header (60px).
- **Authentication:** `AuthContext` manages JWT tokens, `authFetch` handles token integration.
- **Key Features:** Global search with command palette, server-side pagination, interactive dashboards with `recharts`, icon-based sidebar navigation.
- **Modules:** Comprehensive modules covering CRM (Orbit), CPQ (Estimo), Invoicing (Billr), Sales, Employee Communications (Sync & Comms), Inventory (Vault), Procurement (Flex), Production (Forge), Project Management (Flow), Tasks & Ticketing (Sprint & Solve), Accounts & Finance (Ledger), Expense Management (Trail), Legal & Compliance (Contracta), Reports & Analytics (Vision), Physical Security & Visitor Management (Gate), and Fleet Management. Each module features dedicated dashboards, data tables, and specific functionalities tailored to its domain.

## External Dependencies

- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **API Specification:** OpenAPI 3.1
- **API Codegen:** Orval
- **Frontend State Management/Data Fetching:** React Query
- **Charting Library:** recharts
- **Date Utilities:** Day.js
- **Form Validation:** Zod
- **Hashing:** bcryptjs
- **JWT:** jsonwebtoken
- **UI Icons:** lucide-react
- **CORS Middleware:** `cors`
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
- **Database:** PostgreSQL with Drizzle ORM.
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
- Employs Drizzle ORM with PostgreSQL, featuring a comprehensive schema for all ERP entities.
- Drizzle Kit is used for schema migrations.
- **46 formal FK constraints** enforce referential integrity across modules.
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
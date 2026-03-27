# Workspace

## Overview

This is a pnpm workspace monorepo using TypeScript, designed for the Yugam ERP system. It includes a robust Express API server, a comprehensive React frontend, and shared libraries for database interactions, API specifications, and generated clients. The project aims to provide a full-fledged Enterprise Resource Planning solution with modules for HR, Sales, CRM, Invoicing, Inventory, Production, and Analytics, catering to diverse business needs with a modern and scalable architecture.

## User Preferences

I want iterative development. I prefer detailed explanations. Ask before making major changes. Do not make changes to the folder `artifacts-monorepo/lib/api-client-react/src/generated/`. Do not make changes to the folder `artifacts-monorepo/lib/api-zod/src/generated/`. Do not make changes to the file `artifacts-monorepo/lib/api-spec/openapi.yaml`.

## System Architecture

The project is structured as a pnpm monorepo, facilitating shared code and dependency management.

**Monorepo Structure:**
- `artifacts/`: Contains deployable applications (`api-server`, `yugam`).
- `lib/`: Houses shared libraries (`api-spec`, `api-client-react`, `api-zod`, `db`).
- `scripts/`: Utility scripts.

**Core Technologies:**
- **Backend:** Node.js 24, Express 5, TypeScript 5.9.
- **Frontend:** React, Vite, Tailwind CSS.
- **Database:** PostgreSQL with Drizzle ORM.
- **Validation:** Zod for schema validation.
- **API Generation:** Orval for OpenAPI spec-driven client and schema generation.
- **Build Tool:** esbuild for efficient bundling.

**TypeScript & Composite Projects:**
- Utilizes TypeScript composite projects with `composite: true` in `tsconfig.base.json` for optimized type-checking and build processes across packages.
- Root `tsconfig.json` manages project references to ensure correct cross-package type resolution and build order.

**API Server (`@workspace/api-server`):**
- Express 5 based API server.
- Routes are organized in `src/routes/` and leverage `@workspace/api-zod` for request/response validation and `@workspace/db` for persistence.
- **Authentication:** JWT-based authentication with login, user profile (`/api/auth/me`), and protected routes.
- **Global Search:** Unified search across multiple entities (clients, employees, projects, etc.) via `GET /api/search?q=`.
- **Pagination:** Standardized pagination (page, limit) for list endpoints.
- **Analytics:** Dedicated endpoints for financial trends and operational statistics.
- Comprehensive set of RESTful APIs for all ERP modules (users, clients, invoices, employees, inventory, projects, tasks, etc.).

**Database Layer (`@workspace/db`):**
- Drizzle ORM with PostgreSQL.
- Exports a Drizzle client and a comprehensive schema, including models for users, clients, invoices, employees, inventory, projects, tasks, transactions, and more.
- Drizzle Kit for schema migrations.

**API Specifications & Codegen (`@workspace/api-spec`, `@workspace/api-zod`, `@workspace/api-client-react`):**
- OpenAPI 3.1 specification (`openapi.yaml`) defines the API.
- Orval is used to generate:
    - React Query hooks and a fetch client (`@workspace/api-client-react`).
    - Zod schemas for API validation (`@workspace/api-zod`).

**Frontend (`@workspace/yugam`):**
- React, Vite, and Tailwind CSS application.
- **UI/UX:**
    - **Theme:** `yugam-red` (#E31E24) as primary accent, `yugam-grey` (#F8F9FA) for surfaces, pure white for background.
    - **Font:** Inter (sans-serif).
    - **Layout:** Full-screen layout with a fixed 250px sidebar, 60px top header, and a flexible main content area.
    - **Components:** Reusable layout components for `MainLayout`, `Sidebar`, and `Header`.
- **Authentication:** `AuthContext` handles JWT token storage (localStorage), with a dedicated `LoginPage`. `authFetch` wrapper manages token attachment and 401 handling.
- **Global Search:** Integrated search bar in the header with debounced API calls and a categorized command palette dropdown.
- **Pagination:** Server-side pagination implementation in data tables.
- **Advanced Analytics:** Vision module features interactive dashboards using `recharts` to visualize financial trends, operational statistics, and project/invoice statuses, powered by live data from API endpoints.
- **Navigation:** Icon-based navigation for HR Management, Sales Hub, and Settings modules.
- **Orbit CRM (Relational):** Upgraded from flat list to relational CRM with three tabs: Pipeline (drag-drop Kanban with Lead/Contacted/Proposal/Won/Lost stages, PATCH updates), Clients Directory (paginated table), Contacts Directory (paginated table with company join). Client profile deep-dive shows company details, linked contacts, and chronological activity timeline with note logging. Schema: `clients` (company_name, industry, pipeline_status, deal_value), `contacts` (name, email, phone, contact_type, client_id FK), `client_activities` (client_id FK, activity_type, notes). APIs: GET/POST/PATCH `/api/clients`, GET `/api/clients/:id`, GET/POST `/api/contacts`, GET/POST `/api/client-activities`.
- **Estimo CPQ Engine:** Full Configure-Price-Quote system with industrial BOQ engine. Schema: `service_catalog` (category, item_code, template_name, description, uom, tags, base_hours, base_rate), `proposals` (client_id FK, title, quote_number, revision, valid_from, valid_to, project_location, poc_name, poc_contact, scope_of_work, inclusions, exclusions, boq_data JSONB, grand_total, proposal_data JSONB). API: CRUD `/api/service-catalog`, full CRUD `/api/proposals` (GET list with client join, GET by id with boqData, POST, PATCH with field+date validation, DELETE). Frontend: 3-tab outer layout (Proposals table, Service Catalog grid with category/itemCode badges, Analytics). ProposalBuilder: state-driven 3-view architecture — Cover Details (client, quote#, revision, dates, location, POC), Scope & Terms (scope, inclusions, exclusions), Investment BOQ (split-view: left = wide data table with Item Code/Description/UOM/Qty/Base Rate/Labor/Machine/OH/Margin%/Disc%/Tax%/Wastage%/Freight/Lead Time/Total; right = fixed Cost Breakdown sidebar aggregating Base Cost/Labor/Machine/Overheads/Subtotal/Margin/Discount/Tax/Freight/Grand Total). Master Library: two-pane "Add to Cart" drawer — left pane with vertical category menu (All Items/Labor/Materials/Equipment/Software with icons and counts) + search input; right pane with multi-select item table (checkbox, Item Code, Description, Category, UOM, Base Rate); sticky bottom bar shows selected count with cart icon + "Add to Quote" button; batch-adds selected items as BOQ rows with Qty=1 carrying over itemCode/description/uom/baseRate. Service Catalog "Add Template" form captures category/itemCode/uom. Math engine: instant per-row and aggregate recalculation on every cell change.
- **Billr Financial Engine:** GST-compliant invoicing module with 4 sub-modules via tab navigation. Schema: `invoices` (client_id FK, type [Tax/Proforma/Credit], document_number, po_reference, issue_date, due_date, subtotal, discount_amount, sgst_total, cgst_total, grand_total, balance_due, notes, terms, reason_for_credit, invoice_reference, status), `invoice_items` (invoice_id FK cascade, description, hsn_sac, qty, unit, rate, tax_percentage, tax_amount, line_total), `receipts` (client_id FK, payment_date, payment_number, amount_received, bank_charges, payment_mode, deposit_to, reference, tax_deducted). API: full CRUD `/api/invoices` (GET with ?type= filter, GET /:id with joined items, POST with nested items, PATCH with item replacement, DELETE cascade), GET/POST/DELETE `/api/receipts`. Frontend: 4-tab navigation (Tax Invoices, Proformas, Receipts, Credit Notes) with data tables (Date, Document#, Customer, Status pill, Amount, Balance Due). Document Builder: full-screen reusable form for all invoice types — split header (Billed By static company info / Billed To client dropdown + right side with Doc#, dates, PO/Invoice Reference for credit notes, Reason dropdown for credits), Line Items table (Items, HSN/SAC, Qty, Unit, Rate, Tax%, Tax Amt, Amount with auto-calc), Summary panel (Sub Total, editable Discount, SGST, CGST, Grand Total), Notes & Terms textareas, Cancel/Save Draft/Save & Send actions. Receipt Drawer: right slide-out with Customer, Payment Received, Bank Charges, Payment Date, Payment Number, Payment Mode, Deposit To, Reference, TDS toggle.
- **Sales Module:** Complete Sales Hub with 6 sub-modules accessible via expandable sidebar navigation. Schema: `sales_documents` (client_id FK, client_name, document_type enum [Quotation/Proforma Invoice/Sales Order/Invoice/Delivery Challan/Sales Return], document_number, issue_date, due_date, subtotal, sgst_total, cgst_total, grand_total, notes, terms, status [Paid/Unpaid/Drafting]), `sales_document_items` (document_id FK cascade, description, hsn_sac, qty, rate, cgst_percentage, sgst_percentage, line_total). API: full CRUD `/api/sales-documents` (GET with ?type= filter, GET /:id with joined items, transactional POST/PATCH with item replacement, DELETE). Sidebar: "Sales" entry in "Front Office & Sales" category expands to show 6 sub-modules in order (Quotation, Proforma Invoice, Sales Order, Invoices, Delivery Challan, Sales Return). Overview Dashboard: 4 metric cards (Total Sales, Total Paid, Total Unpaid, Drafting Invoice) + donut chart "Total Invoice Status" (Paid/Unpaid/Drafting) + Recent Invoices list. Unified Document Builder: Billed By (static company info) + Billed To (client selector), line items table (Item, HSN/SAC, Qty, Rate, CGST%, SGST%, Tax Amount, Total Amount), dynamic summary (Sub Total, CGST, SGST, Grand Total), Notes & Terms, Save Draft / Save & Send actions.
- **Sync & Comms Module:** Complete employee activity tracker with 3 sub-modules via expandable sidebar. Schema: `chat_messages` (thread_type [Internal/Client/Supplier], employee_id, sender_name, message_body, timestamp), `employee_call_logs` (logged_by_employee, client_name, call_type [Inbound/Outbound], duration_minutes, call_date, call_outcome [Interested/Follow-up/Not Interested/Issue Resolved], detailed_notes), `employee_meetings` (logged_by_employee, client_name, meeting_title, meeting_date, start_time, end_time, attendees, agenda_and_minutes, status [Scheduled/Completed/Canceled]). API: GET/POST `/api/chat-messages` (?threadType= filter), CRUD `/api/call-logs`, CRUD `/api/meetings` (PATCH with status validation). Frontend Chats: Slack-style split-pane UI — left pane with 3 tabs (Internal/Client/Supplier) + channel list, right pane with message bubbles and text input. Frontend Calls: data table with search, "Log a Call" button opening modal (Employee, Client, Type dropdown, Duration, Date, Outcome dropdown, Notes textarea), clickable rows opening side-drawer with detailed notes. Frontend Meetings: split view — calendar on left with event dots, right side with Upcoming/Scheduled and Past/Completed lists, "Log / Schedule Meeting" modal (Title, Employee, Client, Date, Start/End Time, Attendees, Status, Agenda textarea).
- **Vault Inventory Module:** Complete inventory management with 7 sub-modules via expandable sidebar. Schemas: `inventory_catalog` (name, sku, category, item_type [Raw Material/Finished Product], hsn_sac, unit_price, uom, global_stock, reorder_level), `inventory_locations` (location_name, location_type [Warehouse/Store], capacity, manager, address), `stock_ledger` (item_id FK, location_id FK, quantity, updated_at), `stock_movements` (item_id FK, movement_type [Inward/Outward/Transfer/Adjustment], quantity, from_location_id, to_location_id, reference_number, notes, performed_by, movement_date), `material_indents` (item_id FK, requested_qty, approved_qty, issued_from_location_id, requested_by, department, purpose, status [Pending/Approved/Issued/Rejected], request_date, issue_date), `assets` (asset_name, serial_number, category, status [Active/Allocated/Maintenance/Sold], assigned_to, purchase_value, purchase_date, maintenance_notes). API: CRUD `/api/vault/catalog`, `/api/vault/locations`, GET `/api/vault/stock-ledger`, transactional POST `/api/vault/movements` (validates movement type requirements, updates stock_ledger + global_stock atomically), CRUD `/api/vault/indents` + atomic POST `/api/vault/indents/:id/issue` (updates indent + creates outward movement + adjusts stock in single transaction), CRUD `/api/vault/assets`, GET `/api/vault/dashboard-summary`. Frontend: 7 sub-modules — Dashboard (4 metric cards + category pie chart + recent movements feed), Item & Product Master (searchable table + add modal), Warehouses & Stores (location table + add modal), Stock Movements (ledger table + record movement modal with type-conditional fields), Material Issue (pending/issued tabs + create indent + atomic issue modal), Store Management (store cards + finished product table + sale modal), Asset Management (searchable table + add modal + allocate/maintenance/delete actions).
- **Full-stack Modules:** Implements 21 complete modules covering Dashboard, User Management, CRM, Quoting, Invoicing, Communications, Employee Management, Recruitment, Payroll, Inventory, Procurement, Production, Logistics, Project Management, Task Management, Accounting, Expense Tracking, Contract Management, Analytics, Visitor Management, and File Storage.

## External Dependencies

- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **API Specification:** OpenAPI 3.1
- **API Codegen:** Orval
- **Frontend State Management/Data Fetching:** React Query
- **Charting Library:** recharts
- **Date Utilities:** Day.js
- **Form Validation:** Zod, drizzle-zod
- **Hashing:** bcryptjs
- **JWT:** jsonwebtoken
- **UI Icons:** lucide-react
- **HTTP Client:** `authFetch` (custom wrapper)
- **CORS Middleware:** `cors`
# Workspace

## Overview

This pnpm monorepo houses the Yugam ERP system, a comprehensive enterprise resource planning solution built with TypeScript. It integrates an Express API, a React frontend, and shared libraries for database and API management. Yugam ERP aims to streamline business operations across various modules including HR, Sales, CRM, Invoicing, Inventory, Production, and Analytics, offering a scalable and modern platform for diverse business needs.

## User Preferences

I want iterative development. I prefer detailed explanations. Ask before making major changes. Do not make changes to the folder `artifacts-monorepo/lib/api-client-react/src/generated/`. Do not make changes to the folder `artifacts-monorepo/lib/api-zod/src/generated/`. Do not make changes to the file `artifacts-monorepo/lib/api-spec/openapi.yaml`.

## System Architecture

The project is structured as a pnpm monorepo to manage shared code and dependencies efficiently.

**Monorepo Structure:**
- `artifacts/`: Deployable applications (API server, frontend).
- `lib/`: Shared libraries (API specifications, database access, generated clients).

**Core Technologies:**
- **Backend:** Node.js, Express, TypeScript.
- **Frontend:** React, Vite, Tailwind CSS.
- **Database:** PostgreSQL with Drizzle ORM.
- **Validation:** Zod.
- **API Generation:** Orval for OpenAPI spec-driven code generation.

**TypeScript & Composite Projects:**
- Utilizes TypeScript composite projects for optimized type-checking and build processes across packages, ensuring correct cross-package type resolution.

**API Server (`@workspace/api-server`):**
- Express 5 based API with routes organized for modularity.
- Integrates `@workspace/api-zod` for request/response validation and `@workspace/db` for data persistence.
- Features JWT authentication, global search capabilities, standardized pagination, and dedicated analytics endpoints.
- Provides comprehensive RESTful APIs for all ERP modules.

**Database Layer (`@workspace/db`):**
- Uses Drizzle ORM with PostgreSQL, including a comprehensive schema for all ERP entities.
- Drizzle Kit is used for schema migrations.

**API Specifications & Codegen (`@workspace/api-spec`, `@workspace/api-zod`, `@workspace/api-client-react`):**
- OpenAPI 3.1 specification defines the API contract.
- Orval generates React Query hooks, a fetch client, and Zod schemas for API validation based on the OpenAPI spec.

**Frontend (`@workspace/yugam`):**
- React, Vite, and Tailwind CSS application.
- **UI/UX:**
    - **Theme:** `yugam-red` (#E31E24) accent, `yugam-grey` (#F8F9FA) surfaces, white background.
    - **Font:** Inter (sans-serif).
    - **Layout:** Full-screen with a fixed sidebar (250px), top header (60px), and flexible content area.
    - Reusable layout components for consistent UI.
- **Authentication:** `AuthContext` manages JWT tokens; `authFetch` handles token attachment and error responses.
- **Global Search:** Debounced search bar with a categorized command palette.
- **Pagination:** Server-side pagination for data tables.
- **Advanced Analytics:** Interactive dashboards with `recharts` for visualizing business trends.
- **Navigation:** Icon-based sidebar navigation for key modules.
- **Orbit CRM:** Relational CRM with Kanban view for pipeline, client/contact directories, and activity timelines.
- **Estimo CPQ Engine:** Configurable Price Quote system with industrial Bill of Quantity (BOQ) engine, including proposal builder and service catalog management.
- **Billr Financial Engine:** GST-compliant invoicing module supporting various invoice types, receipts, and credit notes with a full-screen document builder.
- **Sales Module:** Comprehensive sales hub with sub-modules for quotations, sales orders, and delivery challans, featuring a unified document builder.
- **Sync & Comms Module:** Employee activity tracker for chats, call logs, and meetings, with Slack-style chat UI and calendar views.
- **Vault Inventory Module:** Complete inventory management system covering catalog, locations, stock movements, material indents, and asset management.
- **Flex Procurement Module:** Manages the full procurement lifecycle from material requests to purchase orders, goods receipts, and purchase invoices, with 3-way matching.
- **Forge Production Module:** Manufacturing/production management with 6 sub-modules: Production Dashboard (OEE/yield/scrap metrics), Bill of Materials (BOM builder with material lines and routing steps), Workstations & Routing (card grid with status/utilization), Work Orders (Kanban: Draft→In Progress→QC→Completed), Quality Control (inspection ledger with pass rates), and Downtime Logs (reason-coded stoppages with auto-calculated minutes). DB tables: forge_workstations, forge_bom, forge_bom_materials, forge_bom_routing, forge_work_orders, forge_quality_control, forge_downtime_logs.
- **Flow Project Management Module:** Macro project management with 5 sub-modules: Flow Dashboard (executive metrics: active projects, portfolio value, schedule variance, burn rate + upcoming milestones + category burn chart), Project Portfolio (card list with milestone-based progress bars, status pills, create/delete projects), Milestones & Gantt (visual timeline with month markers, completion dots, add/edit/delete milestones per project), Budgets & Costing (financial matrix: Material/Procurement/Labor categories, estimated vs actual with variance, burn % bars, line item detail table), Document Center (file repository categorized by Contracts/Architectural Drawings/Compliance Permits/BOQs with upload/view/delete). DB tables: projects (expanded with totalValue, startDate, description, status enum: Planning/Active/On Hold/Handover), flow_milestones, flow_budgets, flow_documents. API: /api/flow/* endpoints.
- **Sprint & Solve Module:** Tasks & ticketing with 5 sub-modules: My Workspace (personalized dashboard with active tasks/tickets, Start Timer per task), Task Boards (4-column Kanban: New→In Progress→Review→Done, drag-to-advance, full Add Task modal with Project/Assignee/Priority/DateTime/Attachments/Reminder), Backlog & Planning (sortable backlog table with inline user assignment and sprint assignment), Issue Desk (helpdesk table with Ticket ID/Name/Type/Priority/Status, Add Ticket modal with two-tier assignment: Team→User, types: Question/Bug/Maintenance/HR), Timesheets (time ledger with auto-calculated hours, reference linking to tasks/tickets). DB tables: tasks (expanded with parentProject, startDate, attachments, reminder, status: New/In Progress/Review/Done), sprint_tickets, sprint_timesheets. API: /api/sprint/* endpoints.
- **Ledger (Accounts & Finance) Module:** Strict double-entry accounting system with 6 sub-modules: Finance Dashboard (Total Cash/Receivables/Payables/Net Income metrics, AR/AP Aging bar chart 30/60/90 days, recent receivables/payables lists), Chart of Accounts (hierarchical collapsible list grouped by Asset/Liability/Equity/Revenue/Expense, Add Account modal with code/type/name/balance/description), Accounts Payable (vendor bills ledger with Pending Bills/Debit Notes tabs, Record Payment modal with balance tracking), Accounts Receivable (client invoices with Pending Invoices/Credit Notes tabs, Receive Payment modal), Journal Entries (document builder with Date/Reference/Description header, dynamic debit/credit line items table, auto-calculated balanced/unbalanced indicator, Save disabled when unbalanced, view lines modal), Financial Statements (Profit & Loss/Balance Sheet/Trial Balance tabs, date range filter with backend computation, Download PDF + Export Tally-Formatted XLS buttons). Core accounting: journal entry creation is atomic (DB transaction), posts debit/credit amounts to COA balances, validates account IDs exist in COA, journal deletion reverses balance postings. Financial statements use period-aware endpoint computing balances from journal lines when date filter is active. DB tables: chart_of_accounts, journal_entries, journal_lines, accounts_payable, accounts_receivable. API: /api/ledger/* endpoints.
- **Trail (Expense Management) Module:** Expense management with 4 sub-modules: Expense Dashboard (Total Claims/Pending Approvals/Petty Cash metrics, category pie chart, recent claims), My Claims (submit Standard Receipt/Mileage-Fuel/Per Diem claims with auto-calculations for distance×rate and days×dailyRate), Approval Queue (approve/reject pending claims with Ledger bridge — approval auto-posts journal entry: Debit Expense, Credit Employee Payable when COA accounts exist), Petty Cash Ledger (cash in/out tracking with server-computed running balance). Status guard: only Pending claims can be approved/rejected. Delete guard: Approved/Paid claims cannot be deleted. DB tables: trail_claims, petty_cash. API: /api/trail/* endpoints.
- **Contracta (Legal, Compliance & Document Hub) Module:** Legal and compliance management with 5 sub-modules: Compliance Dashboard (high-alert executive view with Active Contracts/Expiring in 30 Days/Total Expired metrics, Upcoming Renewals table sorted by expiry), Client Agreements (table view filtered to Client category with Upload Contract modal), Vendor Contracts (table view filtered to Vendor category), Statutory Compliances (government licenses/factory permits with emphasized Expiry Date column, overdue badges), Letter & Doc Builder (rich text WYSIWYG editor with template management — left panel: saved templates list with create/delete, main area: contentEditable editor with formatting toolbar B/I/U/H1-H3/lists/alignment, Insert Variable dropdown for {{Employee_Name}}/{{Date}}/{{Salary}}/etc placeholders, Save/Preview/Generate & Print buttons, print preview optimized for pre-printed company letterheads with no UI headers/footers). Auto-computed status: Active/Expiring Soon (<30 days)/Expired. Server-side HTML sanitization strips scripts/event handlers/iframes. DB tables: contracta_compliances, contracta_templates. API: /api/contracta/* endpoints.
- **Vision (Reports & Analytics) Module:** CEO-level business intelligence with 4 sub-modules: Executive Dashboard (4 metric cards: Gross Revenue/Net Profit/Active Projects/Open Tickets, dual-axis line chart for Cash Inflow vs Cash Outflow by month), Financial Health (AR/AP Aging grouped bar chart by 30/60/90/90+ day buckets, Top 5 Outstanding Invoices data table sorted by grandTotal), Ops & Production (SVG gauge chart for Factory Capacity utilization from work orders, horizontal bar chart for Top Consumed Materials from BOM, gantt-style timeline bars for Active Projects with elapsed progress), Report Center (6 categorized quick-generate cards: Attendance/Payroll/Expense/Project/Purchase/Sale Report — each with Start Date/End Date inputs and PDF/XLS generate buttons, Recently Generated Reports history table with Date/Report Name/Generated By/Format/Download). DB tables: vision_generated_reports. API: /api/vision/* endpoints (executive-summary, financial-health, ops-production, generated-reports).
- **Gate (Physical Security & Visitor Management) Module:** Security desk module with 4 sub-modules: Gate Dashboard (real-time occupancy monitoring with Current Occupancy/Total Visitors Today/Expected VIPs metric cards, massive red EMERGENCY ROLL CALL button that generates printable list of all In-Premises persons for fire safety, Recent Activity table with VIP gold/Blacklist red row highlighting), Access Portal (split-screen check-in/out: Check-In Mode has live camera placeholder with Capture Photo button on left + visitor details form on right with Name/Phone/Host Employee dropdown linked to HR/Purpose Meeting|Interview|Delivery|Maintenance/Ticket Ref, auto-detects Blacklist/VIP from watchlist on check-in, Generate 58mm Gate Pass button with thermal receipt print simulation; Check-Out Mode has QR scan placeholder + manual Pass ID input for instant checkout), Visitor Logs (comprehensive data table with ID/Visitor/Phone/Host/Purpose/Class/Check In/Check Out/Status columns, search and filter by classification Standard|VIP|Blacklist and status In-Premises|Checked-Out, row color-coding: gold border for VIP, red border for Blacklist, inline Check Out button for In-Premises visitors), Security Settings & Watchlist (admin management for Blacklist and VIP entries with Name/Phone/Reason, split view showing Blacklist with red styling and VIP with gold styling, Notification Settings tab with toggles: Notify Pantry/Housekeeping on VIP Check-In, Blacklist Entry Alert, Auto-Generate Gate Pass). XSS protection: HTML escaping on print outputs. DB tables: visitors (enhanced with phone/photoUrl/hostEmployeeId/purpose/ticketRef/classification), gate_watchlist, gate_settings. API: /api/gate/* endpoints (dashboard, roll-call, employees, visitors, check-in, check-out, scan-checkout, watchlist CRUD, settings).
- **Full-stack Modules:** Implements 21 comprehensive modules covering key ERP functionalities like CRM, Quoting, Invoicing, Inventory, Procurement, Production, Project Management, Task & Ticketing, and Analytics.

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
- **CORS Middleware:** `cors`
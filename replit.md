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
- **Full-stack Modules:** Implements 21 comprehensive modules covering key ERP functionalities like CRM, Quoting, Invoicing, Inventory, Procurement, Production, and Analytics.

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
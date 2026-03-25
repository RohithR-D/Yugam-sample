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
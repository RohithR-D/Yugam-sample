# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── yugam/              # Yugam ERP frontend (React + Vite + Tailwind CSS)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /healthz`; `src/routes/users.ts` exposes `GET/POST /api/users`; `src/routes/clients.ts` exposes `GET/POST /api/clients`; `src/routes/quotes.ts` exposes `GET/POST /api/quotes`; `src/routes/invoices.ts` exposes `GET/POST /api/invoices`; `src/routes/communications.ts` exposes `GET/POST /api/communications`; `src/routes/employees.ts` exposes `GET/POST /api/employees`; `src/routes/candidates.ts` exposes `GET/POST /api/candidates`; `src/routes/payroll.ts` exposes `GET/POST /api/payroll`
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas
  - `src/schema/users.ts` — `usersTable` (id, name, email, role, lastLogin, createdAt) with `insertUserSchema`
  - `src/schema/clients.ts` — `clientsTable` (id, companyName, contactName, status, dealValue, createdAt) with `insertClientSchema`
  - `src/schema/quotes.ts` — `quotesTable` (id, clientName, quoteNumber, totalAmount, status, issueDate, createdAt) with `insertQuoteSchema` (status validated as Draft/Sent/Accepted/Rejected enum)
  - `src/schema/invoices.ts` — `invoicesTable` (id, clientName, invoiceNumber, amount, status, dueDate, createdAt) with `insertInvoiceSchema` (status validated as Paid/Unpaid/Overdue/Draft enum)
  - `src/schema/communications.ts` — `communicationsTable` (id, recipientName, subject, type, status, sentAt, createdAt) with `insertCommunicationSchema` (type: Email/SMS/Call; status: Sent/Delivered/Failed)
  - `src/schema/employees.ts` — `employeesTable` (id, name, designation, department, status, joinDate, createdAt) with `insertEmployeeSchema` (status: Active/On Leave/Offboarded)
  - `src/schema/candidates.ts` — `candidatesTable` (id, name, roleApplied, status, appliedDate, createdAt) with `insertCandidateSchema` (status: Applied/Interviewing/Offered/Rejected)
  - `src/schema/payroll.ts` — `payrollTable` (id, employeeName, payPeriod, grossPay, deductions, netPay, status, createdAt) with `insertPayrollSchema` (status: Processing/Paid; netPay auto-calculated server-side)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/yugam` (`@workspace/yugam`)

Yugam ERP frontend — React + Vite + Tailwind CSS application served at `/`.

- **Theme colors**: Primary accent `yugam-red` (#E31E24), surface `yugam-grey` (#F8F9FA), background pure white (#FFFFFF)
- **Font**: Inter (sans-serif)
- **Layout**: Full-screen flex with fixed 250px sidebar, 60px top header, flex-1 main content
- **Components**:
  - `src/components/layout/MainLayout.tsx` — root layout wrapper
  - `src/components/layout/Sidebar.tsx` — left sidebar with logo and navigation
  - `src/components/layout/Header.tsx` — top header with search and user profile
- **Navigation items**: HR Management, Sales Hub, Settings (using lucide-react icons)
- **API Proxy**: Vite dev server proxies `/api` requests to the Express API server at `http://localhost:8080`
- **Full-stack modules**: Settings > User Management fetches/creates users via `/api/users`; Orbit CRM fetches/creates clients via `/api/clients`; Estimo Quotes fetches/creates quotes via `/api/quotes`; Billr Invoicing fetches/creates invoices via `/api/invoices`; Sync Communications fetches/creates comms via `/api/communications`; Crew Management fetches/creates employees via `/api/employees`; Hire Pipeline fetches/creates candidates via `/api/candidates`; CrewPay Payroll fetches/creates payslips via `/api/payroll`
- **Dev**: `pnpm --filter @workspace/yugam run dev`

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

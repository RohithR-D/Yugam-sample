import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from "@/components/layout/MainLayout";
import { ModuleProvider, useModule } from "@/context/ModuleContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import CrewDashboard from "@/pages/CrewDashboard";
import HirePipeline from "@/pages/HirePipeline";
import CrewPayDashboard from "@/pages/CrewPayDashboard";
import OrbitDashboard from "@/pages/OrbitDashboard";
import EstimoDashboard from "@/pages/EstimoDashboard";
import BillrDashboard from "@/pages/BillrDashboard";
import SalesDashboard from "@/pages/SalesDashboard";
import SyncDashboard from "@/pages/SyncDashboard";
import VaultDashboard from "@/pages/VaultDashboard";
import FlexDashboard from "@/pages/FlexDashboard";
import ForgeDashboard from "@/pages/ForgeDashboard";
import FleetDashboard from "@/pages/FleetDashboard";
import FlowDashboard from "@/pages/FlowDashboard";
import SprintSolveDashboard from "@/pages/SprintSolveDashboard";
import LedgerDashboard from "@/pages/LedgerDashboard";
import TrailDashboard from "@/pages/TrailDashboard";
import ContractaDashboard from "@/pages/ContractaDashboard";
import VisionDashboard from "@/pages/VisionDashboard";
import GateDashboard from "@/pages/GateDashboard";
import DriveDashboard from "@/pages/DriveDashboard";
import SettingsDashboard from "@/pages/SettingsDashboard";
import MainDashboard from "@/pages/MainDashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ModuleView() {
  const { activeModule } = useModule();

  switch (activeModule) {
    case "Dashboard":
      return <MainDashboard />;
    case "Crew":
      return <CrewDashboard />;
    case "Hire":
      return <HirePipeline />;
    case "CrewPay":
      return <CrewPayDashboard />;
    case "Orbit":
      return <OrbitDashboard />;
    case "Estimo":
      return <EstimoDashboard />;
    case "Billr":
      return <BillrDashboard />;
    case "Sales:Overview":
    case "Sales:Quotation":
    case "Sales:Proforma Invoice":
    case "Sales:Sales Order":
    case "Sales:Invoices":
    case "Sales:Delivery Challan":
    case "Sales:Sales Return":
      return <SalesDashboard />;
    case "Sync:Chats":
    case "Sync:Calls":
    case "Sync:Meetings":
      return <SyncDashboard />;
    case "Vault:Dashboard":
    case "Vault:Item & Product Master":
    case "Vault:Warehouses & Stores":
    case "Vault:Stock Movements":
    case "Vault:Material Issue":
    case "Vault:Store Management":
    case "Vault:Asset Management":
      return <VaultDashboard />;
    case "Flex:Material Requests":
    case "Flex:Purchase Requests":
    case "Flex:Quotation Requests":
    case "Flex:Quotation Validations":
    case "Flex:Purchase Orders":
    case "Flex:Goods Receipts":
    case "Flex:Purchase Invoices":
    case "Flex:Purchase Returns":
      return <FlexDashboard />;
    case "Forge:Production Dashboard":
    case "Forge:Bill of Materials":
    case "Forge:Workstations & Routing":
    case "Forge:Work Orders":
    case "Forge:Quality Control":
    case "Forge:Downtime Logs":
      return <ForgeDashboard />;
    case "Fleet":
      return <FleetDashboard />;
    case "Flow:Dashboard":
    case "Flow:Project Portfolio":
    case "Flow:Milestones & Gantt":
    case "Flow:Budgets & Costing":
    case "Flow:Document Center":
      return <FlowDashboard />;
    case "Sprint & Solve:My Workspace":
    case "Sprint & Solve:Task Boards":
    case "Sprint & Solve:Backlog & Planning":
    case "Sprint & Solve:Issue Desk (Tickets)":
    case "Sprint & Solve:Timesheets":
      return <SprintSolveDashboard />;
    case "Ledger:Finance Dashboard":
    case "Ledger:Chart of Accounts":
    case "Ledger:Accounts Payable (AP)":
    case "Ledger:Accounts Receivable (AR)":
    case "Ledger:Journal Entries":
    case "Ledger:Financial Statements":
      return <LedgerDashboard />;
    case "Trail:Expense Dashboard":
    case "Trail:My Claims":
    case "Trail:Approval Queue":
    case "Trail:Petty Cash Ledger":
      return <TrailDashboard />;
    case "Contracta:Compliance Dashboard":
    case "Contracta:Client Agreements":
    case "Contracta:Vendor Contracts":
    case "Contracta:Statutory Compliances":
    case "Contracta:Letter & Doc Builder":
      return <ContractaDashboard />;
    case "Vision":
      return <VisionDashboard />;
    case "Gate":
      return <GateDashboard />;
    case "Drive":
      return <DriveDashboard />;
    case "Settings":
      return <SettingsDashboard />;
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{activeModule}</h1>
            <p className="mt-2 text-sm text-muted-foreground">This module is coming soon.</p>
          </div>
        </div>
      );
  }
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E31E24]" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <MainLayout>
      <ModuleView />
    </MainLayout>
  );
}

function Home() {
  return <AuthGate />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ModuleProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </ModuleProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

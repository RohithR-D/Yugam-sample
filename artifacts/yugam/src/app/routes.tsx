import { Switch, Route } from "wouter";
import { useModule } from "@/context/ModuleContext";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoginPage from "@/features/auth/pages/LoginPage";
import CrewDashboard from "@/features/crew/pages/CrewDashboard";
import HirePipeline from "@/features/hire/pages/HirePipeline";
import CrewPayDashboard from "@/features/crewpay/pages/CrewPayDashboard";
import OrbitDashboard from "@/features/crm/pages/OrbitDashboard";
import EstimoDashboard from "@/features/estimo/pages/EstimoDashboard";
import BillrDashboard from "@/features/billr/pages/BillrDashboard";
import SalesDashboard from "@/features/sales/pages/SalesDashboard";
import SyncDashboard from "@/features/sync/pages/SyncDashboard";
import VaultDashboard from "@/features/vault/pages/VaultDashboard";
import FlexDashboard from "@/features/flex/pages/FlexDashboard";
import ForgeDashboard from "@/features/forge/pages/ForgeDashboard";
import FleetDashboard from "@/features/fleet/pages/FleetDashboard";
import FlowDashboard from "@/features/flow/pages/FlowDashboard";
import SprintSolveDashboard from "@/features/sprint/pages/SprintSolveDashboard";
import LedgerDashboard from "@/features/ledger/pages/LedgerDashboard";
import TrailDashboard from "@/features/trail/pages/TrailDashboard";
import ContractaDashboard from "@/features/contracta/pages/ContractaDashboard";
import VisionDashboard from "@/features/vision/pages/VisionDashboard";
import GateDashboard from "@/features/gate/pages/GateDashboard";
import DriveDashboard from "@/features/drive/pages/DriveDashboard";
import SettingsDashboard from "@/features/settings/pages/SettingsDashboard";
import MainDashboard from "@/features/dashboard/pages/MainDashboard";
import NotFound from "@/app/pages/NotFound";

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
    case "Fleet:Fleet Dashboard":
    case "Fleet:Vehicle Directory":
    case "Fleet:Dispatch & Trips":
    case "Fleet:Fuel & Maintenance Logs":
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
    case "Vision:Executive Dashboard":
    case "Vision:Financial Health":
    case "Vision:Ops & Production":
    case "Vision:Report Center":
      return <VisionDashboard />;
    case "Gate:Gate Dashboard":
    case "Gate:Access Portal":
    case "Gate:Visitor Logs":
    case "Gate:Security Settings & Watchlist":
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

export function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

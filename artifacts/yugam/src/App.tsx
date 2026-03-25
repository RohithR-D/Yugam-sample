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
    case "Sync":
      return <SyncDashboard />;
    case "Vault":
      return <VaultDashboard />;
    case "Flex":
      return <FlexDashboard />;
    case "Forge":
      return <ForgeDashboard />;
    case "Fleet":
      return <FleetDashboard />;
    case "Flow":
      return <FlowDashboard />;
    case "Sprint & Solve":
      return <SprintSolveDashboard />;
    case "Ledger":
      return <LedgerDashboard />;
    case "Trail":
      return <TrailDashboard />;
    case "Contracta":
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

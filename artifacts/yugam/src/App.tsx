import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from "@/components/layout/MainLayout";
import { ModuleProvider, useModule } from "@/context/ModuleContext";
import CrewDashboard from "@/pages/CrewDashboard";
import HirePipeline from "@/pages/HirePipeline";
import CrewPayDashboard from "@/pages/CrewPayDashboard";
import OrbitDashboard from "@/pages/OrbitDashboard";
import EstimoDashboard from "@/pages/EstimoDashboard";
import BillrDashboard from "@/pages/BillrDashboard";
import SyncDashboard from "@/pages/SyncDashboard";
import VaultDashboard from "@/pages/VaultDashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ModuleView() {
  const { activeModule } = useModule();

  switch (activeModule) {
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

function Home() {
  return (
    <MainLayout>
      <ModuleView />
    </MainLayout>
  );
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
        <ModuleProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </ModuleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

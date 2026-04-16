import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ModuleProvider } from "@/context/ModuleContext";
import { AuthProvider } from "@/context/AuthContext";
import { Router as WouterRouter } from "wouter";

interface AppProvidersProps {
  children: ReactNode;
  client: QueryClient;
}

export function AppProviders({ children, client }: AppProvidersProps) {
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <AuthProvider>
          <ModuleProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>{children}</WouterRouter>
            <Toaster />
          </ModuleProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

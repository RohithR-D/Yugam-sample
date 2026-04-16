import { QueryClient } from "@tanstack/react-query";
import { AppProviders } from "./providers";
import { Router } from "./routes";

const queryClient = new QueryClient();

export default function App() {
  return (
    <AppProviders client={queryClient}>
      <Router />
    </AppProviders>
  );
}

import { createContext, useContext, useState } from "react";

interface ModuleContextValue {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

const ModuleContext = createContext<ModuleContextValue>({
  activeModule: "Dashboard",
  setActiveModule: () => {},
});

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [activeModule, setActiveModule] = useState("Dashboard");
  return (
    <ModuleContext.Provider value={{ activeModule, setActiveModule }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  return useContext(ModuleContext);
}

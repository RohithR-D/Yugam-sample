import { useState } from "react";

export function useSettingsTab(defaultTab = "Company Profile") {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return { activeTab, setActiveTab };
}

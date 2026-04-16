import { useModule } from "@/context/ModuleContext";
import ComplianceDashboardView from "../components/ComplianceDashboardView";
import ComplianceTableView from "../components/ComplianceTableView";
import LetterDocBuilderView from "../components/LetterDocBuilderView";

export default function ContractaDashboard() {
  const { activeModule } = useModule();
  const sub = activeModule.startsWith("Contracta:") ? activeModule.replace("Contracta:", "") : "Compliance Dashboard";

  switch (sub) {
    case "Compliance Dashboard":
      return <ComplianceDashboardView />;
    case "Client Agreements":
      return <ComplianceTableView
        category="Client"
        title="Client Agreements"
        subtitle="Manage client contracts, service agreements, and NDAs"
      />;
    case "Vendor Contracts":
      return <ComplianceTableView
        category="Vendor"
        title="Vendor Contracts"
        subtitle="Track vendor agreements, supply contracts, and purchase terms"
      />;
    case "Statutory Compliances":
      return <ComplianceTableView
        category="Statutory"
        title="Statutory Compliances"
        subtitle="Government licenses, factory permits, and regulatory compliances"
      />;
    case "Letter & Doc Builder":
      return <LetterDocBuilderView />;
    default:
      return <ComplianceDashboardView />;
  }
}

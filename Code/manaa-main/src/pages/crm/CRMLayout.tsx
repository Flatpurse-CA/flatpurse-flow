import { Outlet } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SubPageTabs from "@/components/SubPageTabs";

interface CRMLayoutProps {
  selectedBusinessId?: string | null;
}

const tabs = [
  { to: ".", label: "Overview" },
  { to: "leads", label: "Leads" },
  { to: "contacts", label: "Contacts" },
  { to: "pipeline", label: "Pipeline" },
  { to: "forms", label: "Forms" },
  { to: "tasks", label: "Tasks" },
  { to: "insights", label: "Insights" },
];

export default function CRMLayout({ selectedBusinessId }: CRMLayoutProps) {
  return (
    <div className="space-y-0">
      <PageHeader title="CRM" subtitle="Manage clients & grow revenue" />
      <div className="px-4 sm:px-6 py-4 overflow-x-hidden space-y-4">
        <SubPageTabs tabs={tabs} />
        <Outlet context={{ businessId: selectedBusinessId }} />
      </div>
    </div>
  );
}

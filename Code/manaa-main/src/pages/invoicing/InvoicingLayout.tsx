import { Outlet } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SubPageTabs from "@/components/SubPageTabs";

interface InvoicingLayoutProps {
  selectedBusinessId?: string | null;
}

const tabs = [
  { to: ".", label: "All" },
  { to: "drafts", label: "Drafts" },
  { to: "clients", label: "Clients" },
  { to: "revenue", label: "Revenue" },
];

export default function InvoicingLayout({ selectedBusinessId }: InvoicingLayoutProps) {
  return (
    <div className="space-y-0">
      <PageHeader title="Invoicing" subtitle="Create & manage invoices" />
      <div className="px-4 sm:px-6 py-4 overflow-x-hidden space-y-4">
        <SubPageTabs tabs={tabs} />
        <Outlet context={{ businessId: selectedBusinessId }} />
      </div>
    </div>
  );
}

import { Outlet } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SubPageTabs from "@/components/SubPageTabs";

interface InventoryLayoutProps {
  selectedBusinessId?: string | null;
}

const tabs = [
  { to: ".", label: "Products" },
  { to: "sales", label: "Sales" },
  { to: "unpaid", label: "Unpaid" },
  { to: "batches", label: "Batches" },
  { to: "warehouses", label: "Warehouses" },
  { to: "purchase-orders", label: "POs" },
];

export default function InventoryLayout({ selectedBusinessId }: InventoryLayoutProps) {
  return (
    <div className="space-y-0">
      <PageHeader title="Inventory" subtitle="Track products, sales & payments" />
      <div className="px-4 sm:px-6 py-4 overflow-x-hidden space-y-4">
        <div className="md:hidden">
          <SubPageTabs tabs={tabs} />
        </div>
        <Outlet context={{ businessId: selectedBusinessId }} />
      </div>
    </div>
  );
}

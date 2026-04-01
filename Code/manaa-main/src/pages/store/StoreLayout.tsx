import { Outlet, useOutletContext } from "react-router-dom";
import SubPageTabs from "@/components/SubPageTabs";

const tabs = [
  { to: ".", label: "Storefront" },
  { to: "products", label: "Products" },
  { to: "orders", label: "Orders" },
  { to: "team", label: "Team" },
  { to: "branches", label: "Branches" },
];

interface StoreLayoutProps {
  selectedBusinessId: string | null;
}

export default function StoreLayout({ selectedBusinessId }: StoreLayoutProps) {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="md:hidden">
        <SubPageTabs tabs={tabs} />
      </div>
      <Outlet context={{ selectedBusinessId }} />
    </div>
  );
}

export function useStoreContext() {
  return useOutletContext<{ selectedBusinessId: string | null }>();
}

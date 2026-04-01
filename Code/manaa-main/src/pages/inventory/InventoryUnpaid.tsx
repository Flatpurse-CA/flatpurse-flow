import { useOutletContext } from "react-router-dom";
import { useBusinesses, useInventory, useInventorySales } from "@/hooks/useData";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { SalesList } from "./InventorySales";

export default function InventoryUnpaid() {
  const { businessId } = useOutletContext<{ businessId: string | null }>();
  const { data: businesses } = useBusinesses();
  const bizId = businessId || businesses?.[0]?.id;
  const { data: sales, isLoading } = useInventorySales(bizId);
  const { data: products } = useInventory(bizId);

  const unpaidSales = (sales || []).filter((s) => s.status === "unpaid");
  const totalOwed = unpaidSales.reduce((s, sale) => s + sale.total, 0);

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-foreground">Unpaid</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Unpaid Sales</p>
            <p className="text-lg font-semibold">{unpaidSales.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-cash-out-light">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total Owed</p>
            <p className="text-lg font-semibold text-cash-out">{formatNaira(totalOwed)}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <SalesList
          sales={unpaidSales}
          products={products || []}
          businessId={bizId!}
          showStatus={false}
          emptyIcon={<Clock className="w-8 h-8 text-muted-foreground mb-3" />}
          emptyTitle="No unpaid sales"
          emptyDescription="All sales are settled. Outstanding payments will appear here."
        />
      )}
    </div>
  );
}

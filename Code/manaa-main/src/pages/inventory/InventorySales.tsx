import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  useBusinesses, useInventory, useInventorySales, useCreateInventorySale,
  useDeleteInventorySale, useUpdateInventorySale, useUpdateInventoryItem,
  InventorySale, InventoryItem,
} from "@/hooks/useData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Plus, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNaira } from "@/lib/currency";
import { format } from "date-fns";

function SaleForm({ sale, products, businessId, onClose }: {
  sale?: InventorySale;
  products: InventoryItem[];
  businessId: string;
  onClose: () => void;
}) {
  const createSale = useCreateInventorySale();
  const updateSale = useUpdateInventorySale();
  const updateItem = useUpdateInventoryItem();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState(sale?.inventory_item_id || "");
  const [quantity, setQuantity] = useState(sale?.quantity?.toString() || "1");
  const [status, setStatus] = useState(sale?.status || "paid");

  const product = products.find((p) => p.id === selectedProduct);
  const unitPrice = product?.unit_price || 0;
  const total = unitPrice * (parseInt(quantity) || 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const qty = parseInt(quantity) || 1;

    if (!sale && product && qty > product.quantity_in_stock) {
      toast({ title: "Insufficient stock", description: `Only ${product.quantity_in_stock} available`, variant: "destructive" });
      return;
    }

    const vals = {
      inventory_item_id: selectedProduct,
      customer_name: form.get("customer_name") as string,
      customer_phone: form.get("customer_phone") as string,
      quantity: qty,
      unit_price: unitPrice,
      total,
      status,
      payment_method: form.get("payment_method") as string,
      notes: form.get("notes") as string,
      sale_date: (form.get("sale_date") as string) || new Date().toISOString().split("T")[0],
    };

    try {
      if (sale) {
        await updateSale.mutateAsync({ id: sale.id, ...vals });
        toast({ title: "Sale updated!" });
      } else {
        await createSale.mutateAsync({ business_id: businessId, ...vals });
        // Deduct stock
        if (product) {
          await updateItem.mutateAsync({
            id: product.id,
            quantity_in_stock: Math.max(0, product.quantity_in_stock - qty),
          });
        }
        toast({ title: "Sale recorded!" });
      }
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const isPending = createSale.isPending || updateSale.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Product</Label>
        <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} ({p.quantity_in_stock} in stock)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Customer Name</Label>
          <Input name="customer_name" defaultValue={sale?.customer_name} placeholder="Customer" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Phone</Label>
          <Input name="customer_phone" defaultValue={sale?.customer_phone} placeholder="08012345678" className="h-9" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Quantity</Label>
          <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Unit Price</Label>
          <Input value={formatNaira(unitPrice)} disabled className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Total</Label>
          <Input value={formatNaira(total)} disabled className="h-9 font-semibold" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="escrow">Escrow</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Payment Method</Label>
          <Input name="payment_method" defaultValue={sale?.payment_method} placeholder="Cash, Transfer…" className="h-9" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Sale Date</Label>
        <Input name="sale_date" type="date" defaultValue={sale?.sale_date?.split("T")[0] || new Date().toISOString().split("T")[0]} className="h-9" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Input name="notes" defaultValue={sale?.notes} placeholder="Optional notes" className="h-9" />
      </div>
      <DialogFooter>
        <Button type="submit" size="sm" disabled={isPending || !selectedProduct}>
          {isPending ? "Saving…" : sale ? "Update" : "Record Sale"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface SalesListProps {
  sales: InventorySale[];
  products: InventoryItem[];
  businessId: string;
  showStatus?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function SalesList({ sales, products, businessId, showStatus = true, emptyIcon, emptyTitle, emptyDescription }: SalesListProps) {
  const deleteSale = useDeleteInventorySale();
  const { toast } = useToast();
  const [editSale, setEditSale] = useState<InventorySale | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sale?")) return;
    try {
      await deleteSale.mutateAsync({ id, businessId });
      toast({ title: "Sale deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getProductName = (itemId: string) => products.find((p) => p.id === itemId)?.name || "Unknown";

  const statusColor = (s: string) => {
    if (s === "paid") return "default";
    if (s === "unpaid") return "destructive";
    return "secondary";
  };

  if (!sales.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        {emptyIcon || <ShoppingCart className="w-8 h-8 text-muted-foreground mb-3" />}
        <h3 className="text-sm font-semibold mb-1">{emptyTitle || "No sales yet"}</h3>
        <p className="text-muted-foreground text-xs text-center max-w-xs">
          {emptyDescription || "Record your first sale to start tracking revenue."}
        </p>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between px-4 py-3 group">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{getProductName(sale.inventory_item_id)}</p>
                    <span className="text-[10px] text-muted-foreground">×{sale.quantity}</span>
                    {showStatus && (
                      <Badge variant={statusColor(sale.status)} className="text-[10px] px-1.5 py-0 capitalize">
                        {sale.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sale.customer_name || "Walk-in"} · {format(new Date(sale.sale_date), "dd MMM yyyy")}
                    {sale.payment_method ? ` · ${sale.payment_method}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium tabular-nums">{formatNaira(sale.total)}</p>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground"
                    onClick={() => setEditSale(sale)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(sale.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editSale} onOpenChange={(o) => !o && setEditSale(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Sale</DialogTitle></DialogHeader>
          {editSale && <SaleForm sale={editSale} products={products} businessId={businessId} onClose={() => setEditSale(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function InventorySales() {
  const { businessId } = useOutletContext<{ businessId: string | null }>();
  const { data: businesses } = useBusinesses();
  const bizId = businessId || businesses?.[0]?.id;
  const { data: sales, isLoading } = useInventorySales(bizId);
  const { data: products } = useInventory(bizId);
  const [createOpen, setCreateOpen] = useState(false);

  const allSales = sales || [];
  const totalRevenue = allSales.reduce((s, sale) => s + sale.total, 0);
  const paidRevenue = allSales.filter((s) => s.status === "paid").reduce((s, sale) => s + sale.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Sales</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Record Sale</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Sale</DialogTitle></DialogHeader>
            <SaleForm products={products || []} businessId={bizId!} onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total Sales</p>
            <p className="text-lg font-semibold">{allSales.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total Revenue</p>
            <p className="text-lg font-semibold">{formatNaira(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Paid Revenue</p>
            <p className="text-lg font-semibold">{formatNaira(paidRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <SalesList sales={allSales} products={products || []} businessId={bizId!} />
      )}
    </div>
  );
}

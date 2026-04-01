import { useState } from "react";
import {
  useBusinesses, useInventory, useCreateInventoryItem, useDeleteInventoryItem,
} from "@/hooks/useData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Package, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNaira } from "@/lib/currency";
import PageHeader from "@/components/PageHeader";

interface InventoryPageProps {
  selectedBusinessId?: string | null;
}

export default function InventoryPage({ selectedBusinessId }: InventoryPageProps) {
  const { data: businesses } = useBusinesses();
  const businessId = selectedBusinessId || businesses?.[0]?.id;
  const { data: items, isLoading } = useInventory(businessId);
  const createItem = useCreateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createItem.mutateAsync({
        business_id: businessId!,
        name: form.get("name") as string,
        sku: form.get("sku") as string,
        unit_price: parseFloat(form.get("unit_price") as string) || 0,
        cost_price: parseFloat(form.get("cost_price") as string) || 0,
        quantity_in_stock: parseInt(form.get("quantity") as string) || 0,
        low_stock_threshold: parseInt(form.get("threshold") as string) || 5,
        supplier: form.get("supplier") as string,
        category: form.get("category") as string || "General",
      });
      setOpen(false);
      toast({ title: "Item added!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await deleteItem.mutateAsync({ id, businessId: businessId! });
      toast({ title: "Item deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const lowStockItems = items?.filter((i) => i.quantity_in_stock <= i.low_stock_threshold) || [];
  const totalValue = items?.reduce((s, i) => s + i.quantity_in_stock * i.cost_price, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" subtitle="Track products & stock levels">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Product Name</Label>
                  <Input name="name" required placeholder="Widget A" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">SKU</Label>
                  <Input name="sku" placeholder="SKU-001" className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Unit Price (₦)</Label>
                  <Input name="unit_price" type="number" step="0.01" placeholder="0.00" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cost Price (₦)</Label>
                  <Input name="cost_price" type="number" step="0.01" placeholder="0.00" className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Quantity</Label>
                  <Input name="quantity" type="number" defaultValue="0" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Low Stock Alert</Label>
                  <Input name="threshold" type="number" defaultValue="5" className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Supplier</Label>
                  <Input name="supplier" placeholder="Supplier name" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Input name="category" placeholder="General" className="h-9" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" size="sm" disabled={createItem.isPending}>
                  {createItem.isPending ? "Adding..." : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="px-4 sm:px-6 space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total Items</p>
            <p className="text-lg font-semibold">{items?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Stock Value</p>
            <p className="text-lg font-semibold">{formatNaira(totalValue)}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-none ${lowStockItems.length > 0 ? "bg-cash-out-light" : "bg-secondary"}`}>
          <CardContent className="p-4 flex items-center gap-2">
            {lowStockItems.length > 0 && <AlertTriangle className="w-4 h-4 text-cash-out" />}
            <div>
              <p className="text-[11px] text-muted-foreground">Low Stock Alerts</p>
              <p className="text-lg font-semibold">{lowStockItems.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : !items?.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Package className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm mb-4">No inventory items yet</p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add your first item
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3 group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{item.name}</p>
                        {item.sku && <span className="text-[10px] text-muted-foreground font-mono">{item.sku}</span>}
                        {item.quantity_in_stock <= item.low_stock_threshold && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Low Stock</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.category} · {item.supplier || "No supplier"} · Qty: {item.quantity_in_stock}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">{formatNaira(item.unit_price)}</p>
                      <p className="text-[10px] text-muted-foreground">Cost: {formatNaira(item.cost_price)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

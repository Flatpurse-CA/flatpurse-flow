import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  useBusinesses, useInventory, useBatches, useCreateBatch, useDeleteBatch,
  InventoryBatch,
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
import { Layers, Plus, Trash2, AlertTriangle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNaira } from "@/lib/currency";
import { format, isPast, addDays } from "date-fns";

function BatchForm({ businessId, onClose }: { businessId: string; onClose: () => void }) {
  const { data: products } = useInventory(businessId);
  const create = useCreateBatch();
  const { toast } = useToast();
  const [productId, setProductId] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await create.mutateAsync({
        business_id: businessId,
        inventory_item_id: productId,
        batch_number: form.get("batch_number") as string,
        quantity: parseInt(form.get("quantity") as string) || 0,
        cost_price: parseFloat(form.get("cost_price") as string) || 0,
        manufacture_date: (form.get("manufacture_date") as string) || null,
        expiry_date: (form.get("expiry_date") as string) || null,
        notes: form.get("notes") as string,
      });
      toast({ title: "Batch added!" });
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Product</Label>
        <Select value={productId} onValueChange={setProductId} required>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
          <SelectContent>
            {products?.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Batch / Lot Number</Label>
          <Input name="batch_number" required placeholder="LOT-2026-001" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Quantity</Label>
          <Input name="quantity" type="number" required placeholder="100" className="h-9" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Cost Price per Unit</Label>
        <Input name="cost_price" type="number" step="0.01" placeholder="0.00" className="h-9" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Manufacture Date</Label>
          <Input name="manufacture_date" type="date" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Expiry Date</Label>
          <Input name="expiry_date" type="date" className="h-9" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Input name="notes" placeholder="Optional notes" className="h-9" />
      </div>
      <DialogFooter>
        <Button type="submit" size="sm" disabled={create.isPending || !productId}>
          {create.isPending ? "Saving…" : "Add Batch"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function InventoryBatches() {
  const { businessId } = useOutletContext<{ businessId: string | null }>();
  const { data: businesses } = useBusinesses();
  const bizId = businessId || businesses?.[0]?.id;
  const { data: batches, isLoading } = useBatches(bizId);
  const { data: products } = useInventory(bizId);
  const deleteBatch = useDeleteBatch();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  const getProductName = (itemId: string) => products?.find((p) => p.id === itemId)?.name || "Unknown";

  const expiringSoon = batches?.filter((b) => {
    if (!b.expiry_date) return false;
    const exp = new Date(b.expiry_date);
    return !isPast(exp) && exp <= addDays(new Date(), 30);
  }) || [];

  const expired = batches?.filter((b) => b.expiry_date && isPast(new Date(b.expiry_date))) || [];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this batch?")) return;
    try {
      await deleteBatch.mutateAsync({ id, businessId: bizId! });
      toast({ title: "Batch deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Batches & Expiry</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Batch</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Batch</DialogTitle></DialogHeader>
            <BatchForm businessId={bizId!} onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total Batches</p>
            <p className="text-lg font-semibold">{batches?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-none ${expiringSoon.length > 0 ? "bg-amber-50 dark:bg-amber-950/20" : "bg-secondary"}`}>
          <CardContent className="p-4 flex items-center gap-2">
            {expiringSoon.length > 0 && <Calendar className="w-4 h-4 text-amber-500" />}
            <div>
              <p className="text-[11px] text-muted-foreground">Expiring Soon</p>
              <p className="text-lg font-semibold">{expiringSoon.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-none ${expired.length > 0 ? "bg-cash-out-light" : "bg-secondary"}`}>
          <CardContent className="p-4 flex items-center gap-2">
            {expired.length > 0 && <AlertTriangle className="w-4 h-4 text-cash-out" />}
            <div>
              <p className="text-[11px] text-muted-foreground">Expired</p>
              <p className="text-lg font-semibold">{expired.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : !batches?.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Layers className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm mb-4">No batches tracked yet</p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add your first batch
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {batches.map((batch) => {
                const isExpired = batch.expiry_date && isPast(new Date(batch.expiry_date));
                const isExpiringSoon = batch.expiry_date && !isExpired && new Date(batch.expiry_date) <= addDays(new Date(), 30);
                return (
                  <div key={batch.id} className="flex items-center justify-between px-4 py-3 group">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{getProductName(batch.inventory_item_id)}</p>
                        <span className="text-[10px] text-muted-foreground font-mono">{batch.batch_number}</span>
                        {isExpired && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Expired</Badge>}
                        {isExpiringSoon && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-600">Expiring</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Qty: {batch.quantity} · Cost: {formatNaira(batch.cost_price)}
                        {batch.expiry_date ? ` · Exp: ${format(new Date(batch.expiry_date), "dd MMM yyyy")}` : ""}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(batch.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

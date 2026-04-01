import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  useBusinesses, usePurchaseOrders, useCreatePurchaseOrder, useDeletePurchaseOrder,
  useUpdatePurchaseOrder, useInventory, useWarehouses,
  PurchaseOrder, InventoryItem,
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
import { ClipboardList, Plus, Trash2, Pencil, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNaira } from "@/lib/currency";
import { format } from "date-fns";

function POForm({ po, businessId, onClose }: {
  po?: PurchaseOrder;
  businessId: string;
  onClose: () => void;
}) {
  const create = useCreatePurchaseOrder();
  const update = useUpdatePurchaseOrder();
  const { data: warehouses } = useWarehouses(businessId);
  const { toast } = useToast();
  const [status, setStatus] = useState(po?.status || "draft");
  const [warehouseId, setWarehouseId] = useState(po?.warehouse_id || "none");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const vals = {
      po_number: form.get("po_number") as string,
      supplier_name: form.get("supplier_name") as string,
      supplier_contact: form.get("supplier_contact") as string,
      warehouse_id: warehouseId === "none" ? null : warehouseId || null,
      status,
      order_date: (form.get("order_date") as string) || new Date().toISOString().split("T")[0],
      expected_date: (form.get("expected_date") as string) || null,
      subtotal: parseFloat(form.get("subtotal") as string) || 0,
      tax_amount: parseFloat(form.get("tax_amount") as string) || 0,
      total: parseFloat(form.get("total") as string) || 0,
      notes: form.get("notes") as string,
    };
    try {
      if (po) {
        await update.mutateAsync({ id: po.id, ...vals });
        toast({ title: "Purchase order updated!" });
      } else {
        await create.mutateAsync({ business_id: businessId, ...vals });
        toast({ title: "Purchase order created!" });
      }
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">PO Number</Label>
          <Input name="po_number" required defaultValue={po?.po_number} placeholder="PO-001" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="partial">Partially Received</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Supplier Name</Label>
          <Input name="supplier_name" required defaultValue={po?.supplier_name} placeholder="Supplier Ltd" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Supplier Contact</Label>
          <Input name="supplier_contact" defaultValue={po?.supplier_contact} placeholder="Phone / Email" className="h-9" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Destination Warehouse</Label>
        <Select value={warehouseId} onValueChange={setWarehouseId}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {warehouses?.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Order Date</Label>
          <Input name="order_date" type="date" defaultValue={po?.order_date?.split("T")[0] || new Date().toISOString().split("T")[0]} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Expected Delivery</Label>
          <Input name="expected_date" type="date" defaultValue={po?.expected_date?.split("T")[0] || ""} className="h-9" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Subtotal</Label>
          <Input name="subtotal" type="number" step="0.01" defaultValue={po?.subtotal || ""} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tax</Label>
          <Input name="tax_amount" type="number" step="0.01" defaultValue={po?.tax_amount || ""} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Total</Label>
          <Input name="total" type="number" step="0.01" defaultValue={po?.total || ""} className="h-9" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Input name="notes" defaultValue={po?.notes} placeholder="Optional notes" className="h-9" />
      </div>
      <DialogFooter>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : po ? "Update" : "Create PO"}
        </Button>
      </DialogFooter>
    </form>
  );
}

const statusColor = (s: string) => {
  switch (s) {
    case "draft": return "secondary";
    case "sent": return "default";
    case "partial": return "outline" as const;
    case "received": return "default";
    case "cancelled": return "destructive";
    default: return "secondary";
  }
};

export default function InventoryPurchaseOrders() {
  const { businessId } = useOutletContext<{ businessId: string | null }>();
  const { data: businesses } = useBusinesses();
  const bizId = businessId || businesses?.[0]?.id;
  const { data: pos, isLoading } = usePurchaseOrders(bizId);
  const deletePO = useDeletePurchaseOrder();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPO, setEditPO] = useState<PurchaseOrder | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this purchase order?")) return;
    try {
      await deletePO.mutateAsync({ id, businessId: bizId! });
      toast({ title: "Purchase order deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const totalValue = pos?.reduce((s, p) => s + p.total, 0) ?? 0;
  const pendingCount = pos?.filter((p) => p.status === "sent" || p.status === "partial").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Purchase Orders</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> New PO</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
            <POForm businessId={bizId!} onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total POs</p>
            <p className="text-lg font-semibold">{pos?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total Value</p>
            <p className="text-lg font-semibold">{formatNaira(totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Pending</p>
            <p className="text-lg font-semibold">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : !pos?.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <ClipboardList className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm mb-4">No purchase orders yet</p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create your first PO
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pos.map((po) => (
                <div key={po.id} className="flex items-center justify-between px-4 py-3 group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium font-mono">{po.po_number}</p>
                      <Badge variant={statusColor(po.status)} className="text-[10px] px-1.5 py-0 capitalize">
                        {po.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {po.supplier_name} · {format(new Date(po.order_date), "dd MMM yyyy")}
                      {po.expected_date ? ` · ETA ${format(new Date(po.expected_date), "dd MMM")}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium tabular-nums">{formatNaira(po.total)}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground" onClick={() => setEditPO(po)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(po.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editPO} onOpenChange={(o) => !o && setEditPO(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Purchase Order</DialogTitle></DialogHeader>
          {editPO && <POForm po={editPO} businessId={bizId!} onClose={() => setEditPO(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

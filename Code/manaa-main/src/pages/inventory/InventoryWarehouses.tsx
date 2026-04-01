import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  useBusinesses, useWarehouses, useCreateWarehouse, useDeleteWarehouse, useUpdateWarehouse,
  Warehouse,
} from "@/hooks/useData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Warehouse as WarehouseIcon, Plus, Trash2, Pencil, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

function WarehouseForm({ warehouse, businessId, onClose }: {
  warehouse?: Warehouse;
  businessId: string;
  onClose: () => void;
}) {
  const create = useCreateWarehouse();
  const update = useUpdateWarehouse();
  const { toast } = useToast();
  const [isDefault, setIsDefault] = useState(warehouse?.is_default || false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const vals = {
      name: form.get("name") as string,
      address: form.get("address") as string,
      is_default: isDefault,
    };
    try {
      if (warehouse) {
        await update.mutateAsync({ id: warehouse.id, ...vals });
        toast({ title: "Warehouse updated!" });
      } else {
        await create.mutateAsync({ business_id: businessId, ...vals });
        toast({ title: "Warehouse added!" });
      }
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Warehouse Name</Label>
        <Input name="name" required defaultValue={warehouse?.name} placeholder="Main Warehouse" className="h-9" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Address</Label>
        <Input name="address" defaultValue={warehouse?.address} placeholder="123 Warehouse Street" className="h-9" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isDefault} onCheckedChange={setIsDefault} />
        <Label className="text-xs">Default warehouse</Label>
      </div>
      <DialogFooter>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : warehouse ? "Update" : "Add Warehouse"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function InventoryWarehouses() {
  const { businessId } = useOutletContext<{ businessId: string | null }>();
  const { data: businesses } = useBusinesses();
  const bizId = businessId || businesses?.[0]?.id;
  const { data: warehouses, isLoading } = useWarehouses(bizId);
  const deleteWarehouse = useDeleteWarehouse();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Warehouse | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this warehouse?")) return;
    try {
      await deleteWarehouse.mutateAsync({ id, businessId: bizId! });
      toast({ title: "Warehouse deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Warehouses & Locations</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Warehouse</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Warehouse</DialogTitle></DialogHeader>
            <WarehouseForm businessId={bizId!} onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : !warehouses?.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <WarehouseIcon className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm mb-4">No warehouses yet</p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add your first warehouse
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {warehouses.map((wh) => (
                <div key={wh.id} className="flex items-center justify-between px-4 py-3 group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{wh.name}</p>
                        {wh.is_default && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Default</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{wh.address || "No address"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground" onClick={() => setEditItem(wh)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(wh.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Warehouse</DialogTitle></DialogHeader>
          {editItem && <WarehouseForm warehouse={editItem} businessId={bizId!} onClose={() => setEditItem(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

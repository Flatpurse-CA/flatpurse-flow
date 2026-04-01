import { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  useBusinesses, useInventory, useCreateInventoryItem, useDeleteInventoryItem, useUpdateInventoryItem,
  useWarehouses, InventoryItem,
} from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Package, Plus, Trash2, AlertTriangle, Pencil, ImagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNaira } from "@/lib/currency";

function ImageUpload({ value, onChange, uploading, setUploading, businessId }: {
  value: string;
  onChange: (url: string) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  businessId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${businessId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    onChange(urlData.publicUrl);
    setUploading(false);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Product Image</Label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      {value ? (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
          <img src={value} alt="Product" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground/30 transition-colors"
        >
          <ImagePlus className="w-5 h-5" />
          <span className="text-[9px]">{uploading ? "Uploading…" : "Add"}</span>
        </button>
      )}
    </div>
  );
}

function ProductForm({ item, businessId, onClose }: {
  item?: InventoryItem;
  businessId: string;
  onClose: () => void;
}) {
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const { data: warehouses } = useWarehouses(businessId);
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState(item?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [uom, setUom] = useState((item as any)?.uom || "pcs");
  const [valuation, setValuation] = useState((item as any)?.valuation_method || "weighted_average");
  const [warehouseId, setWarehouseId] = useState((item as any)?.warehouse_id || "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const vals: any = {
      name: form.get("name") as string,
      sku: form.get("sku") as string,
      barcode: form.get("barcode") as string,
      unit_price: parseFloat(form.get("unit_price") as string) || 0,
      cost_price: parseFloat(form.get("cost_price") as string) || 0,
      quantity_in_stock: parseInt(form.get("quantity") as string) || 0,
      low_stock_threshold: parseInt(form.get("threshold") as string) || 5,
      supplier: form.get("supplier") as string,
      category: (form.get("category") as string) || "General",
      image_url: imageUrl,
      uom,
      valuation_method: valuation,
      warehouse_id: warehouseId || null,
    };
    try {
      if (item) {
        await updateItem.mutateAsync({ id: item.id, business_id: businessId, ...vals });
        toast({ title: "Product updated!" });
      } else {
        await createItem.mutateAsync({ business_id: businessId, ...vals });
        toast({ title: "Product added!" });
      }
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        uploading={uploading}
        setUploading={setUploading}
        businessId={businessId}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Product Name</Label>
          <Input name="name" required defaultValue={item?.name} placeholder="Widget A" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">SKU</Label>
          <Input name="sku" defaultValue={item?.sku} placeholder="SKU-001" className="h-9" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Barcode</Label>
        <Input name="barcode" defaultValue={(item as any)?.barcode} placeholder="Scan or enter barcode" className="h-9" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Unit Price (₦)</Label>
          <Input name="unit_price" type="number" step="0.01" defaultValue={item?.unit_price || ""} placeholder="0.00" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Cost Price (₦)</Label>
          <Input name="cost_price" type="number" step="0.01" defaultValue={item?.cost_price || ""} placeholder="0.00" className="h-9" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Quantity</Label>
          <Input name="quantity" type="number" defaultValue={item?.quantity_in_stock ?? 0} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Low Stock Alert</Label>
          <Input name="threshold" type="number" defaultValue={item?.low_stock_threshold ?? 5} className="h-9" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Unit of Measure</Label>
          <Select value={uom} onValueChange={setUom}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pcs">Pieces (pcs)</SelectItem>
              <SelectItem value="kg">Kilograms (kg)</SelectItem>
              <SelectItem value="g">Grams (g)</SelectItem>
              <SelectItem value="l">Litres (L)</SelectItem>
              <SelectItem value="ml">Millilitres (mL)</SelectItem>
              <SelectItem value="m">Metres (m)</SelectItem>
              <SelectItem value="box">Box</SelectItem>
              <SelectItem value="carton">Carton</SelectItem>
              <SelectItem value="pack">Pack</SelectItem>
              <SelectItem value="dozen">Dozen</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Valuation</Label>
          <Select value={valuation} onValueChange={setValuation}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weighted_average">Weighted Average</SelectItem>
              <SelectItem value="fifo">FIFO</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Supplier</Label>
          <Input name="supplier" defaultValue={item?.supplier} placeholder="Supplier name" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Input name="category" defaultValue={item?.category} placeholder="General" className="h-9" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Warehouse</Label>
        <Select value={warehouseId} onValueChange={setWarehouseId}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {warehouses?.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" size="sm" disabled={isPending || uploading}>
          {isPending ? "Saving…" : item ? "Update" : "Add Item"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function InventoryProducts() {
  const { businessId } = useOutletContext<{ businessId: string | null }>();
  const { data: businesses } = useBusinesses();
  const bizId = businessId || businesses?.[0]?.id;
  const { data: items, isLoading } = useInventory(bizId);
  const deleteItem = useDeleteInventoryItem();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await deleteItem.mutateAsync({ id, businessId: bizId! });
      toast({ title: "Item deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const lowStockItems = items?.filter((i) => i.quantity_in_stock <= i.low_stock_threshold) || [];
  const totalValue = items?.reduce((s, i) => s + i.quantity_in_stock * i.cost_price, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Products</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
            </DialogHeader>
            <ProductForm businessId={bizId!} onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

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
          <Button size="sm" onClick={() => setCreateOpen(true)}>
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
                    {item.image_url ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{item.name}</p>
                        {item.sku && <span className="text-[10px] text-muted-foreground font-mono">{item.sku}</span>}
                        {item.quantity_in_stock <= item.low_stock_threshold && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Low Stock</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.category} · {item.supplier || "No supplier"} · {item.quantity_in_stock} {(item as any).uom || "pcs"}
                        {(item as any).barcode ? ` · ${(item as any).barcode}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">{formatNaira(item.unit_price)}</p>
                      <p className="text-[10px] text-muted-foreground">Cost: {formatNaira(item.cost_price)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground"
                      onClick={() => setEditItem(item)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
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

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editItem && (
            <ProductForm item={editItem} businessId={bizId!} onClose={() => setEditItem(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

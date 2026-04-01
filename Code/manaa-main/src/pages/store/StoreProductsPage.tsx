import { useState } from "react";
import { useStoreContext } from "./StoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Search, Eye, EyeOff, Package } from "lucide-react";

export default function StoreProductsPage() {
  const { selectedBusinessId } = useStoreContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["store-products", selectedBusinessId],
    queryFn: async () => {
      if (!selectedBusinessId) return [];
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, description, unit_price, cost_price, image_url, quantity_in_stock, category, store_visible")
        .eq("business_id", selectedBusinessId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBusinessId,
  });

  const toggleVisible = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase
        .from("inventory_items")
        .update({ store_visible: visible })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      toast({ title: "Product visibility updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = products.filter((p: any) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const visibleCount = products.filter((p: any) => p.store_visible).length;

  if (!selectedBusinessId) return <p className="text-sm text-muted-foreground">Select a workspace first.</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Store Products</h2>
        <p className="text-sm text-muted-foreground">
          {visibleCount} of {products.length} products visible in your store. Toggle visibility to show/hide products from your public storefront.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="h-9 pl-9" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Package className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No products found. Add products in Inventory first.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product: any) => (
            <Card key={product.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="py-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{product.name}</p>
                    {product.store_visible ? (
                      <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                        <Eye className="w-3 h-3 mr-0.5" /> Visible
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                        <EyeOff className="w-3 h-3 mr-0.5" /> Hidden
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(product.unit_price, "NGN")} · {product.quantity_in_stock} in stock
                    {product.category ? ` · ${product.category}` : ""}
                  </p>
                </div>
                <Switch
                  checked={product.store_visible}
                  onCheckedChange={(v) => toggleVisible.mutate({ id: product.id, visible: v })}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

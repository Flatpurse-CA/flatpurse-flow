import { useState } from "react";
import { useStoreContext } from "./StoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Package, Clock, Truck, CheckCircle, XCircle, Search, MessageCircle, Copy, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Package },
  packed: { label: "Packed", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Package },
  shipped: { label: "Shipped", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
};

export default function OrdersPage() {
  const { selectedBusinessId } = useStoreContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings-orders", selectedBusinessId],
    queryFn: async () => {
      if (!selectedBusinessId) return null;
      const { data } = await supabase.from("store_settings").select("whatsapp_number").eq("business_id", selectedBusinessId).maybeSingle();
      return data;
    },
    enabled: !!selectedBusinessId,
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", selectedBusinessId],
    queryFn: async () => {
      if (!selectedBusinessId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("business_id", selectedBusinessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBusinessId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Order updated!" });
    },
  });

  const createOrder = useMutation({
    mutationFn: async (formData: any) => {
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("orders").insert({
        business_id: selectedBusinessId!,
        order_number: orderNumber,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        total: parseFloat(formData.total) || 0,
        subtotal: parseFloat(formData.total) || 0,
        notes: formData.notes,
        source: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setCreateOpen(false);
      toast({ title: "Order created!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sendWhatsAppUpdate = (order: any) => {
    const phone = order.customer_phone?.replace(/[^0-9]/g, "") || "";
    if (!phone) {
      toast({ title: "No phone number", description: "This order has no customer phone number.", variant: "destructive" });
      return;
    }
    const statusLabel = STATUS_CONFIG[order.status]?.label || order.status;
    const trackUrl = order.tracking_token ? `${window.location.origin}/track/${order.order_number}?token=${order.tracking_token}` : "";
    const msg = encodeURIComponent(
      `Hi ${order.customer_name}! 📦\n\nYour order ${order.order_number} is now: *${statusLabel}*\n\nTotal: ${formatCurrency(order.total, "NGN")}${trackUrl ? `\n\nTrack your order: ${trackUrl}` : ""}\n\nThank you for your order!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const copyTrackingLink = (order: any) => {
    if (!order.tracking_token) {
      toast({ title: "No tracking token", variant: "destructive" });
      return;
    }
    const url = `${window.location.origin}/track/${order.order_number}?token=${order.tracking_token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Tracking link copied!" });
  };

  const filtered = orders.filter((o: any) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search && !o.customer_name?.toLowerCase().includes(search.toLowerCase()) && !o.order_number?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!selectedBusinessId) return <p className="text-sm text-muted-foreground">Select a workspace first.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Orders</h2>
          <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Order</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Order</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createOrder.mutate(Object.fromEntries(fd));
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label className="text-xs">Customer Name</Label>
                <Input name="customer_name" required className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input name="customer_phone" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input name="customer_address" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Total (₦)</Label>
                <Input name="total" type="number" step="0.01" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea name="notes" rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={createOrder.isPending}>
                {createOrder.isPending ? "Creating..." : "Create Order"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="h-9 pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Package className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order: any) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = config.icon;
            return (
              <Card key={order.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{order.order_number}</p>
                        <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${order.payment_status === "paid" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                          {order.payment_status}
                        </Badge>
                        {order.source === "storefront" && (
                          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600">Storefront</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{order.customer_name} {order.customer_phone ? `· ${order.customer_phone}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{formatCurrency(order.total, "NGN")}</p>
                      <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}>
                        <SelectTrigger className="h-7 text-[10px] w-[100px] mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    {order.customer_phone && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => sendWhatsAppUpdate(order)}>
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Update
                      </Button>
                    )}
                    {order.tracking_token && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => copyTrackingLink(order)}>
                        <Copy className="w-3.5 h-3.5" /> Tracking Link
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/currency";
import { Phone, Instagram, MapPin, ShoppingBag, ShoppingCart, Plus, Minus, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  unit_price: number;
  image_url: string | null;
  quantity: number;
  max_stock: number;
}

export default function PublicStorefront() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string; trackingToken: string } | null>(null);

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*, businesses(name, currency, logo_url)")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["public-products", store?.business_id],
    queryFn: async () => {
      if (!store?.business_id) return [];
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, description, unit_price, image_url, quantity_in_stock, category")
        .eq("business_id", store.business_id)
        .eq("store_visible", true)
        .gt("quantity_in_stock", 0)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!store?.business_id,
  });

  const currency = (store as any)?.businesses?.currency || "NGN";
  const themeColor = store?.theme_color || "#C0D904";

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity_in_stock) return prev;
        return prev.map((c) => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: product.id, name: product.name, unit_price: product.unit_price, image_url: product.image_url, quantity: 1, max_stock: product.quantity_in_stock }];
    });
    toast({ title: `${product.name} added to cart` });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const newQty = c.quantity + delta;
      if (newQty < 1) return c;
      if (newQty > c.max_stock) return c;
      return { ...c, quantity: newQty };
    }));
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.id !== id));

  const cartTotal = cart.reduce((sum, c) => sum + c.unit_price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!store?.business_id || cart.length === 0) return;
    setSubmitting(true);

    try {
      const fd = new FormData(e.currentTarget);
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          business_id: store.business_id,
          order_number: orderNumber,
          customer_name: fd.get("name") as string,
          customer_phone: fd.get("phone") as string,
          customer_email: fd.get("email") as string,
          customer_address: fd.get("address") as string,
          notes: fd.get("notes") as string,
          subtotal: cartTotal,
          total: cartTotal,
          source: "storefront",
        })
        .select("id, tracking_token")
        .single();
      if (orderErr) throw orderErr;

      // Insert order items
      const items = cart.map((c) => ({
        order_id: order.id,
        inventory_item_id: c.id,
        name: c.name,
        quantity: c.quantity,
        unit_price: c.unit_price,
        total: c.unit_price * c.quantity,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(items);
      if (itemsErr) throw itemsErr;

      setOrderSuccess({ orderNumber, trackingToken: order.tracking_token });
      setCart([]);
      setCheckoutOpen(false);

      // Send WhatsApp notification to store owner
      if (store.whatsapp_number) {
        const phone = store.whatsapp_number.replace(/[^0-9]/g, "");
        const itemsList = cart.map((c) => `• ${c.name} x${c.quantity} — ${formatCurrency(c.unit_price * c.quantity, currency)}`).join("\n");
        const msg = encodeURIComponent(`🛒 New Order: ${orderNumber}\n\nCustomer: ${fd.get("name")}\nPhone: ${fd.get("phone")}\n\nItems:\n${itemsList}\n\nTotal: ${formatCurrency(cartTotal, currency)}\n\nAddress: ${fd.get("address") || "N/A"}`);
        window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Order failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <h1 className="text-xl font-bold">Store not found</h1>
          <p className="text-sm text-muted-foreground">This store doesn't exist or isn't published yet.</p>
        </div>
      </div>
    );
  }

  // Order success screen
  if (orderSuccess) {
    const trackUrl = `${window.location.origin}/track/${orderSuccess.orderNumber}?token=${orderSuccess.trackingToken}`;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${themeColor}20` }}>
            <ShoppingBag className="w-8 h-8" style={{ color: themeColor }} />
          </div>
          <h1 className="text-2xl font-bold">Order Placed! 🎉</h1>
          <p className="text-sm text-muted-foreground">Your order <span className="font-semibold text-foreground">{orderSuccess.orderNumber}</span> has been submitted.</p>
          <div className="space-y-2">
            <Button
              className="w-full"
              style={{ backgroundColor: themeColor, color: "#000" }}
              onClick={() => {
                navigator.clipboard.writeText(trackUrl);
                toast({ title: "Tracking link copied!" });
              }}
            >
              Copy Tracking Link
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setOrderSuccess(null)}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Get categories from products
  const categories = [...new Set(products.map((p: any) => p.category || "General"))].sort();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${themeColor}20, ${themeColor}05)` }}>
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-4">
            {(store as any).businesses?.logo_url && (
              <img src={(store as any).businesses.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover border border-border" />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{store.store_name || (store as any).businesses?.name}</h1>
              {store.store_description && <p className="text-sm text-muted-foreground mt-1">{store.store_description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {store.whatsapp_number && (
              <a href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <Phone className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            {store.instagram_handle && (
              <a href={`https://instagram.com/${store.instagram_handle.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <Instagram className="w-3.5 h-3.5" /> {store.instagram_handle}
              </a>
            )}
            {store.delivery_note && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" /> {store.delivery_note}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {categories.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {categories.map((cat) => (
              <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
            ))}
          </div>
        )}
        <h2 className="text-lg font-bold mb-4">{products.length} Product{products.length !== 1 ? "s" : ""}</h2>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No products available right now.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p: any) => {
              const inCart = cart.find((c) => c.id === p.id);
              return (
                <Card key={p.id} className="overflow-hidden group">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {inCart && (
                      <Badge className="absolute top-2 right-2 text-[10px]" style={{ backgroundColor: themeColor, color: "#000" }}>
                        {inCart.quantity} in cart
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                    <p className="text-base font-bold" style={{ color: themeColor }}>{formatCurrency(p.unit_price, currency)}</p>
                    {p.quantity_in_stock <= 5 && (
                      <p className="text-[10px] text-orange-500">Only {p.quantity_in_stock} left</p>
                    )}
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      style={{ backgroundColor: themeColor, color: "#000" }}
                      onClick={() => addToCart(p)}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-muted-foreground">
        Powered by <a href="/" className="font-semibold hover:underline">Manaa</a>
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && !checkoutOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button
            onClick={() => setCartOpen(true)}
            className="rounded-full px-6 py-3 shadow-lg text-sm font-semibold gap-2"
            style={{ backgroundColor: themeColor, color: "#000" }}
          >
            <ShoppingCart className="w-5 h-5" />
            View Cart ({cartCount}) · {formatCurrency(cartTotal, currency)}
          </Button>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[80vh] overflow-auto animate-in slide-in-from-bottom">
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Your Cart ({cartCount})</h3>
              <button onClick={() => setCartOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-muted-foreground/30" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs" style={{ color: themeColor }}>{formatCurrency(item.unit_price * item.quantity, currency)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateCartQty(item.id, -1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateCartQty(item.id, 1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                    <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center ml-1"><Trash2 className="w-3 h-3 text-destructive" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 bg-card border-t border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold">{formatCurrency(cartTotal, currency)}</span>
              </div>
              <Button
                className="w-full"
                style={{ backgroundColor: themeColor, color: "#000" }}
                onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout form */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCheckoutOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[90vh] overflow-auto animate-in slide-in-from-bottom">
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Checkout</h3>
              <button onClick={() => setCheckoutOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCheckout} className="p-4 space-y-4">
              {/* Order summary */}
              <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} ×{item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.unit_price * item.quantity, currency)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-1.5 flex justify-between font-bold text-sm">
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal, currency)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input name="name" required className="h-9" placeholder="Your name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone Number *</Label>
                <Input name="phone" required className="h-9" placeholder="+234..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input name="email" type="email" className="h-9" placeholder="your@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Delivery Address</Label>
                <Textarea name="address" rows={2} placeholder="Street address, city..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Order Notes</Label>
                <Textarea name="notes" rows={2} placeholder="Any special requests..." />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
                style={{ backgroundColor: themeColor, color: "#000" }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {submitting ? "Placing Order..." : `Place Order · ${formatCurrency(cartTotal, currency)}`}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

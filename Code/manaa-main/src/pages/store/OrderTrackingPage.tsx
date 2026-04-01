import { useSearchParams, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/currency";
import { Package, Clock, Truck, CheckCircle, XCircle, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Package },
  { key: "packed", label: "Packed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

export default function OrderTrackingPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { data: order, isLoading } = useQuery({
    queryKey: ["track-order", orderNumber, token],
    queryFn: async () => {
      if (!orderNumber || !token) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_number", orderNumber)
        .eq("tracking_token", token)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderNumber && !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-2">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <h1 className="text-xl font-bold">Order not found</h1>
          <p className="text-sm text-muted-foreground">This tracking link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentStepIndex = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>

        {/* Status tracker */}
        {isCancelled ? (
          <Card>
            <CardContent className="py-6 text-center space-y-2">
              <XCircle className="w-10 h-10 mx-auto text-destructive" />
              <p className="text-lg font-bold text-destructive">Order Cancelled</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between relative">
                {/* Progress line */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted z-0" />
                <div
                  className="absolute top-5 left-5 h-0.5 bg-primary z-0 transition-all"
                  style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`, maxWidth: "calc(100% - 40px)" }}
                />
                {STEPS.map((step, i) => {
                  const isActive = i <= currentStepIndex;
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center z-10 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isActive ? "bg-primary border-primary text-primary-foreground" : "bg-background border-muted text-muted-foreground"
                      }`}>
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] mt-1.5 font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order items */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-semibold">Items</p>
            {(order as any).order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.name} ×{item.quantity}</span>
                <span className="font-medium">{formatCurrency(item.total, "NGN")}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
              <span>Total</span>
              <span>{formatCurrency(order.total, "NGN")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Customer info */}
        <Card>
          <CardContent className="py-4 space-y-2">
            <p className="text-sm font-semibold">Delivery Details</p>
            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
            {order.customer_phone && <p className="text-sm text-muted-foreground">{order.customer_phone}</p>}
            {order.customer_address && <p className="text-sm text-muted-foreground">{order.customer_address}</p>}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          Powered by <a href="/" className="font-semibold hover:underline">Manaa</a>
        </div>
      </div>
    </div>
  );
}

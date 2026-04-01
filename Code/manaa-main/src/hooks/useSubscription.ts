import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  billing_cycle: string | null;
  status: string;
  current_period_end: string | null;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user?.id,
  });

  const isActivePlan = (plan: string) => {
    if (!subscription) return false;
    if (subscription.plan !== plan || subscription.status !== "active") return false;
    if (subscription.current_period_end) {
      return new Date(subscription.current_period_end) > new Date();
    }
    return true;
  };

  const isPro = isActivePlan("pro") || isActivePlan("business");
  const isBusiness = isActivePlan("business");

  const initializeCheckout = async (plan: "monthly" | "annual" | "pro_monthly" | "pro_biannual" | "pro_annual" | "biz_monthly" | "biz_biannual" | "biz_annual" | "business_monthly" | "business_biannual" | "business_annual") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/paystack-initialize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      }
    );

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Payment initialization failed");
    return result as { authorization_url: string; reference: string };
  };

  return {
    subscription,
    isPro,
    isBusiness,
    isLoading,
    refetch,
    initializeCheckout,
  };
}

// Limits
export const FREE_LIMITS = {
  maxBusinesses: 1,
  maxBooksPerBusiness: 2,
  maxInvoicesPerMonth: 10,
};

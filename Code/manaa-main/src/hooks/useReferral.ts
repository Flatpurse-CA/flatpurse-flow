import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useReferral() {
  const { user } = useAuth();

  const { data: referralCode, isLoading: codeLoading } = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // Try to get existing code
      const { data, error } = await supabase
        .from("referral_codes" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as unknown as { id: string; user_id: string; code: string; created_at: string };

      // Generate one if missing (for existing users before the trigger)
      const newCode = "MNA-" + Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]).join("");
      const { data: inserted, error: insertErr } = await supabase
        .from("referral_codes" as any)
        .insert({ user_id: user.id, code: newCode })
        .select()
        .single();
      if (insertErr) throw insertErr;
      return inserted as unknown as { id: string; user_id: string; code: string; created_at: string };
    },
    enabled: !!user?.id,
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ["referrals", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("referrals" as any)
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Array<{
        id: string; referrer_id: string; referred_id: string; status: string; created_at: string;
      }>;
    },
    enabled: !!user?.id,
  });

  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ["referral-earnings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("referral_earnings" as any)
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Array<{
        id: string; referral_id: string; referrer_id: string; amount: number;
        earning_type: string; credited: boolean; created_at: string;
      }>;
    },
    enabled: !!user?.id,
  });

  const referralLink = referralCode?.code
    ? `${window.location.origin}/auth?ref=${referralCode.code}`
    : "";

  const totalEarnings = earnings?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalCredited = earnings?.filter((e) => e.credited).reduce((sum, e) => sum + e.amount, 0) || 0;
  const pendingEarnings = totalEarnings - totalCredited;
  const totalReferrals = referrals?.length || 0;
  const convertedReferrals = referrals?.filter((r) => r.status === "converted").length || 0;

  return {
    referralCode: referralCode?.code || "",
    referralLink,
    referrals,
    earnings,
    totalEarnings,
    totalCredited,
    pendingEarnings,
    totalReferrals,
    convertedReferrals,
    isLoading: codeLoading || referralsLoading || earningsLoading,
  };
}

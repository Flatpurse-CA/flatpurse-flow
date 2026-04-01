import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * After a referred user logs in for the first time, this hook
 * checks localStorage for a stored referral code and creates
 * a referral record linking the new user to the referrer.
 */
export function useReferralLink() {
  const { user } = useAuth();
  const linked = useRef(false);

  useEffect(() => {
    if (!user?.id || linked.current) return;
    linked.current = true;

    const refCode = localStorage.getItem("manaa_ref_code");
    if (!refCode) return;

    (async () => {
      try {
        // Look up the referral code
        const { data: codeRow } = await supabase
          .from("referral_codes" as any)
          .select("user_id")
          .eq("code", refCode)
          .maybeSingle();

        if (!codeRow || (codeRow as any).user_id === user.id) {
          localStorage.removeItem("manaa_ref_code");
          return;
        }

        // Check if already linked
        const { data: existing } = await supabase
          .from("referrals" as any)
          .select("id")
          .eq("referred_id", user.id)
          .maybeSingle();

        if (existing) {
          localStorage.removeItem("manaa_ref_code");
          return;
        }

        // Create the referral - use service role via edge function
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/referral-link`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ ref_code: refCode }),
          }
        );

        localStorage.removeItem("manaa_ref_code");
      } catch (err) {
        console.error("Referral link error:", err);
      }
    })();
  }, [user?.id]);
}

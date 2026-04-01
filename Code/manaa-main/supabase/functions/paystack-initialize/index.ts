import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_AMOUNTS: Record<string, { amount: number; plan: string; billing_cycle: string }> = {
  // Pro plans (kobo)
  pro_monthly:  { amount: 450000,  plan: "pro", billing_cycle: "monthly" },
  pro_biannual: { amount: 2500000, plan: "pro", billing_cycle: "biannual" },
  pro_annual:   { amount: 5000000, plan: "pro", billing_cycle: "annual" },
  // Business plans (kobo)
  biz_monthly:  { amount: 750000,  plan: "business", billing_cycle: "monthly" },
  biz_biannual: { amount: 4000000, plan: "business", billing_cycle: "biannual" },
  biz_annual:   { amount: 8500000, plan: "business", billing_cycle: "annual" },
  // Legacy aliases
  monthly:      { amount: 450000,  plan: "pro", billing_cycle: "monthly" },
  annual:       { amount: 5000000, plan: "pro", billing_cycle: "annual" },
  business_monthly:  { amount: 750000,  plan: "business", billing_cycle: "monthly" },
  business_biannual: { amount: 4000000, plan: "business", billing_cycle: "biannual" },
  business_annual:   { amount: 8500000, plan: "business", billing_cycle: "annual" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    const { plan } = await req.json();
    const planConfig = PLAN_AMOUNTS[plan];
    if (!planConfig) {
      return new Response(JSON.stringify({ error: "Invalid plan. Use pro_monthly, pro_biannual, pro_annual, biz_monthly, biz_biannual, or biz_annual." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        amount: planConfig.amount,
        currency: "NGN",
        callback_url: `${req.headers.get("origin") || "https://manaa.lovable.app"}/settings?tab=billing&status=success`,
        metadata: {
          user_id: userId,
          plan: planConfig.plan,
          billing_cycle: planConfig.billing_cycle,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      console.error("Paystack init failed:", paystackData);
      throw new Error(paystackData.message || "Paystack initialization failed");
    }

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

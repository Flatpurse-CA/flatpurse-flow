import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, mono-webhook-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const event = JSON.parse(body);

    console.log("Mono webhook event:", event.event, JSON.stringify(event.data || {}).slice(0, 200));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const MONO_SECRET = Deno.env.get("MONO_SECRET_KEY");
    if (!MONO_SECRET) {
      throw new Error("MONO_SECRET_KEY not configured");
    }

    // Handle different Mono events
    if (event.event === "mono.events.account_connected") {
      const monoData = event.data;
      const monoAccountId = monoData?.account?._id || monoData?.account?.id;

      if (!monoAccountId) {
        console.error("No account ID in webhook data");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Exchange code for account details using Mono API
      const accountInfoRes = await fetch(
        `https://api.withmono.com/v2/accounts/${monoAccountId}`,
        {
          headers: {
            "mono-sec-key": MONO_SECRET,
            "Content-Type": "application/json",
          },
        }
      );

      if (accountInfoRes.ok) {
        const accountInfo = await accountInfoRes.json();
        console.log("Mono account info:", JSON.stringify(accountInfo).slice(0, 300));

        // Update linked_bank_accounts with institution details
        const { error: updateErr } = await supabase
          .from("linked_bank_accounts")
          .update({
            institution_name: accountInfo.data?.institution?.name || accountInfo.data?.account?.institution?.name || "",
            account_number: accountInfo.data?.accountNumber || accountInfo.data?.account?.accountNumber || "",
            account_name: accountInfo.data?.name || accountInfo.data?.account?.name || "",
            status: "active",
          })
          .eq("mono_account_id", monoAccountId);

        if (updateErr) {
          console.error("Update linked account error:", updateErr);
        }
      }

      // Trigger initial sync
      const syncUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mono-sync`;
      await fetch(syncUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ mono_account_id: monoAccountId }),
      });

      console.log("Initial sync triggered for:", monoAccountId);
    }

    if (event.event === "mono.events.account_updated") {
      const monoAccountId = event.data?.account?._id || event.data?.account?.id || event.data?.account;

      if (monoAccountId) {
        // Trigger re-sync
        const syncUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mono-sync`;
        await fetch(syncUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ mono_account_id: monoAccountId }),
        });
        console.log("Re-sync triggered for:", monoAccountId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Mono webhook error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

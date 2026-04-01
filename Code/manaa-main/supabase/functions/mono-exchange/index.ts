import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// This function is called from the frontend after the Mono Connect widget
// returns a code. It exchanges the code for an account ID and saves the link.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MONO_SECRET = Deno.env.get("MONO_SECRET_KEY");
    if (!MONO_SECRET) throw new Error("MONO_SECRET_KEY not configured");

    // Validate user auth
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

    const { code, account_id } = await req.json();
    if (!code || !account_id) {
      return new Response(JSON.stringify({ error: "code and account_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange code for Mono account ID
    const exchangeRes = await fetch("https://api.withmono.com/v2/accounts/auth", {
      method: "POST",
      headers: {
        "mono-sec-key": MONO_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!exchangeRes.ok) {
      const errText = await exchangeRes.text();
      console.error("Mono exchange error:", exchangeRes.status, errText);
      throw new Error(`Mono code exchange failed: ${exchangeRes.status}`);
    }

    const exchangeData = await exchangeRes.json();
    const monoAccountId = exchangeData.data?.id || exchangeData.id;

    if (!monoAccountId) {
      console.error("No mono account ID from exchange:", JSON.stringify(exchangeData));
      throw new Error("Failed to get Mono account ID");
    }

    console.log("Mono account ID obtained:", monoAccountId);

    // Check if already linked
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing } = await adminSupabase
      .from("linked_bank_accounts")
      .select("id")
      .eq("mono_account_id", monoAccountId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "This bank account is already linked", mono_account_id: monoAccountId }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch account info from Mono
    let institutionName = "";
    let accountNumber = "";
    let accountName = "";

    const infoRes = await fetch(`https://api.withmono.com/v2/accounts/${monoAccountId}`, {
      headers: {
        "mono-sec-key": MONO_SECRET,
        "Content-Type": "application/json",
      },
    });

    if (infoRes.ok) {
      const info = await infoRes.json();
      const d = info.data || info;
      institutionName = d.institution?.name || d.account?.institution?.name || "";
      accountNumber = d.accountNumber || d.account?.accountNumber || "";
      accountName = d.name || d.account?.name || "";
    }

    // Insert linked account
    const { data: linked, error: insertErr } = await adminSupabase
      .from("linked_bank_accounts")
      .insert({
        user_id: userId,
        account_id: account_id,
        mono_account_id: monoAccountId,
        institution_name: institutionName,
        account_number: accountNumber,
        account_name: accountName,
        status: "active",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert linked account error:", insertErr);
      throw new Error(insertErr.message);
    }

    // Trigger initial sync
    const syncUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mono-sync`;
    fetch(syncUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ mono_account_id: monoAccountId }),
    }).catch((e) => console.error("Sync trigger failed:", e));

    return new Response(
      JSON.stringify({
        success: true,
        linked_account: linked,
        mono_account_id: monoAccountId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Mono exchange error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

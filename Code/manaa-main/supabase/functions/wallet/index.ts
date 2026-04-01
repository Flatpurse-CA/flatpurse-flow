import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ── Get or create wallet ──
    if (action === "get-wallet") {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (wallet) {
        return json({ wallet });
      }

      // Create wallet if it doesn't exist
      const { data: newWallet, error: createErr } = await supabase
        .from("wallets")
        .insert({ user_id: userId, balance: 0 })
        .select()
        .single();

      if (createErr) {
        console.error("Wallet creation error:", createErr);
        return json({ error: "Failed to create wallet" }, 500);
      }

      return json({ wallet: newWallet });
    }

    // ── Create DVA (Dedicated Virtual Account) ──
    if (action === "create-dva") {
      const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
      if (!PAYSTACK_SECRET) {
        return json({ error: "Payment provider not configured" }, 500);
      }

      // Parse phone from request body
      let phone = "";
      try {
        const body = await req.json();
        phone = body.phone || "";
      } catch {
        // no body
      }

      if (!phone) {
        return json({ error: "Phone number is required to create a virtual account" }, 400);
      }

      // Check if wallet already has a DVA
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (wallet?.virtual_account_number) {
        return json({
          wallet,
          message: "Virtual account already exists",
        });
      }

      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();

      const fullName = profile?.full_name || userEmail.split("@")[0];
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(" ") || firstName;

      // Step 1: Create or get Paystack customer
      let customerCode = wallet?.paystack_customer_code;

      if (!customerCode) {
        console.log("Creating Paystack customer with phone:", phone);
        const custRes = await fetch("https://api.paystack.co/customer", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            first_name: firstName,
            last_name: lastName,
            phone,
            metadata: { user_id: userId },
          }),
        });

        const custData = await custRes.json();
        console.log("Paystack customer response:", JSON.stringify(custData));
        if (!custRes.ok || !custData.status) {
          console.error("Paystack customer creation failed:", custData);
          return json({ error: "Failed to create customer profile" }, 500);
        }

        customerCode = custData.data.customer_code;
      } else {
        // Update existing customer with phone number
        console.log("Updating existing customer with phone:", phone, customerCode);
        await fetch(`https://api.paystack.co/customer/${customerCode}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone }),
        });
      }

      // Step 2: Create Dedicated Virtual Account
      console.log("Creating DVA for customer:", customerCode);
      const dvaRes = await fetch("https://api.paystack.co/dedicated_account", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: customerCode,
          preferred_bank: "wema-bank",
          phone,
        }),
      });

      const dvaData = await dvaRes.json();
      if (!dvaRes.ok || !dvaData.status) {
        console.error("Paystack DVA creation failed:", dvaData);
        return json({
          error: dvaData.message || "Failed to create virtual account. Please ensure your Paystack account supports DVA.",
        }, 500);
      }

      const dva = dvaData.data;

      // Step 3: Update wallet with DVA details
      const walletId = wallet?.id;
      const updateData = {
        virtual_account_number: dva.account_number,
        virtual_account_bank: dva.bank?.name || "Wema Bank",
        virtual_account_name: dva.account_name || fullName,
        paystack_customer_code: customerCode,
        paystack_dva_id: String(dva.id),
      };

      if (walletId) {
        await supabase.from("wallets").update(updateData).eq("id", walletId);
      } else {
        await supabase.from("wallets").insert({
          user_id: userId,
          balance: 0,
          ...updateData,
        });
      }

      // Fetch updated wallet
      const { data: updatedWallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      return json({ wallet: updatedWallet });
    }

    // ── Get wallet transactions ──
    if (action === "transactions") {
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      const { data: transactions, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Fetch transactions error:", error);
        return json({ error: "Failed to fetch transactions" }, 500);
      }

      return json({ transactions });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error: unknown) {
    console.error("Wallet error:", error);
    return json({ error: "An internal error occurred" }, 500);
  }
});

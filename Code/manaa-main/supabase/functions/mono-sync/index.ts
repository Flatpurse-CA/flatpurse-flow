import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MONO_SECRET = Deno.env.get("MONO_SECRET_KEY");
    if (!MONO_SECRET) throw new Error("MONO_SECRET_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { mono_account_id, start_date, end_date } = await req.json();
    if (!mono_account_id) {
      return new Response(JSON.stringify({ error: "mono_account_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the linked account
    const { data: linkedAccount, error: linkErr } = await supabase
      .from("linked_bank_accounts")
      .select("*")
      .eq("mono_account_id", mono_account_id)
      .maybeSingle();

    if (linkErr || !linkedAccount) {
      console.error("Linked account not found:", mono_account_id, linkErr);
      return new Response(JSON.stringify({ error: "Linked account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!linkedAccount.account_id) {
      console.error("No Manaa account linked yet for:", mono_account_id);
      return new Response(JSON.stringify({ error: "No Manaa account linked" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build date range — use provided dates or default to last 90 days
    const pad = (d: Date) => `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;

    let start: string;
    let end: string;

    if (start_date && end_date) {
      // Dates come as yyyy-MM-dd from the client
      const s = new Date(start_date);
      const e = new Date(end_date);
      start = pad(s);
      end = pad(e);
    } else {
      const now = new Date();
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
      start = pad(threeMonthsAgo);
      end = pad(now);
    }

    const txRes = await fetch(
      `https://api.withmono.com/v2/accounts/${mono_account_id}/transactions?start=${start}&end=${end}&paginate=false`,
      {
        headers: {
          "mono-sec-key": MONO_SECRET,
          "Content-Type": "application/json",
        },
      }
    );

    if (!txRes.ok) {
      const errText = await txRes.text();
      console.error("Mono transactions API error:", txRes.status, errText);
      throw new Error(`Mono API error: ${txRes.status}`);
    }

    const txData = await txRes.json();
    const monoTransactions = txData.data || txData.transactions || [];

    console.log(`Fetched ${monoTransactions.length} transactions from Mono for ${mono_account_id}`);

    // Get existing mono_tx_ids for this account to check for duplicates
    const { data: existingTxs } = await supabase
      .from("transactions")
      .select("mono_tx_id")
      .eq("account_id", linkedAccount.account_id)
      .not("mono_tx_id", "is", null)
      .limit(5000);

    const existingSet = new Set(
      (existingTxs || []).map((t) => t.mono_tx_id).filter(Boolean)
    );

    // Map Mono transactions to our format and insert
    let inserted = 0;
    let skipped = 0;

    // Calculate running balance
    const { data: accountData } = await supabase
      .from("accounts")
      .select("initial_balance")
      .eq("id", linkedAccount.account_id)
      .single();

    // Get current balance from existing transactions
    const { data: allTxs } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("account_id", linkedAccount.account_id);

    let currentBalance = (allTxs || []).reduce((acc, t) => {
      return t.type === "cash_in" ? acc + Number(t.amount) : acc - Number(t.amount);
    }, 0);

    // Sort mono transactions by date ascending for proper balance tracking
    const sortedTxs = [...monoTransactions].sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Auto-categorization map based on narration keywords
    const categorizeTx = (narration: string, isCredit: boolean): string => {
      const n = (narration || "").toUpperCase();
      if (isCredit) {
        if (n.includes("SALARY") || n.includes("PAYROLL")) return "Salaries";
        if (n.includes("TRANSFER") || n.includes("NIP") || n.includes("TRF")) return "Other Income";
        if (n.includes("INTEREST")) return "Investment";
        if (n.includes("REFUND") || n.includes("REVERSAL")) return "Other Income";
        return "Other Income";
      } else {
        if (n.includes("POS") || n.includes("PURCHASE")) return "Supplies";
        if (n.includes("ATM") || n.includes("CASH WITHDRAWAL")) return "Other Expense";
        if (n.includes("AIRTIME") || n.includes("DATA") || n.includes("MTN") || n.includes("GLO") || n.includes("AIRTEL")) return "Utilities";
        if (n.includes("ELECTRICITY") || n.includes("POWER") || n.includes("PHCN") || n.includes("EKEDC") || n.includes("IKEDC")) return "Utilities";
        if (n.includes("UBER") || n.includes("BOLT") || n.includes("TRANSPORT") || n.includes("FUEL") || n.includes("PETROL")) return "Transport";
        if (n.includes("FOOD") || n.includes("RESTAURANT") || n.includes("EATERY")) return "Food & Drinks";
        if (n.includes("RENT") || n.includes("LEASE")) return "Rent";
        if (n.includes("TRANSFER") || n.includes("NIP") || n.includes("TRF")) return "Other Expense";
        if (n.includes("LOAN") || n.includes("REPAYMENT")) return "Loan Payment";
        return "Other Expense";
      }
    };

    for (const mt of sortedTxs) {
      const monoTxId = mt._id || mt.id;
      if (!monoTxId) continue;

      // Dedupe using Mono's unique transaction ID
      if (existingSet.has(monoTxId)) {
        skipped++;
        continue;
      }

      const rawAmount = mt.amount || 0;
      console.log(`Raw Mono amount: ${rawAmount}, type: ${mt.type}, narration: ${mt.narration?.substring(0, 50)}`);
      // Mono v2 returns amounts in kobo (smallest unit) — divide by 100
      // If amounts seem 100x too small, the API may already return naira
      const amount = Math.abs(rawAmount) / 100;
      if (amount === 0) continue;

      const isCredit = mt.type === "credit";
      const txType = isCredit ? "cash_in" : "cash_out";
      const txDate = mt.date?.split("T")[0] || new Date().toISOString().split("T")[0];
      const description = mt.narration || mt.description || "Bank transaction";
      const category = categorizeTx(description, isCredit);

      currentBalance = isCredit ? currentBalance + amount : currentBalance - amount;

      const { error: insertErr } = await supabase.from("transactions").insert({
        account_id: linkedAccount.account_id,
        type: txType,
        amount,
        category,
        description,
        customer_name: "",
        customer_detail: "",
        transaction_date: txDate,
        balance_after: currentBalance,
        mono_tx_id: monoTxId,
      });

      if (insertErr) {
        console.error("Insert tx error:", insertErr);
      } else {
        inserted++;
        existingSet.add(monoTxId);
      }
    }

    // Update last synced timestamp
    await supabase
      .from("linked_bank_accounts")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", linkedAccount.id);

    console.log(`Sync complete: ${inserted} inserted, ${skipped} skipped`);

    return new Response(
      JSON.stringify({ success: true, inserted, skipped, total: monoTransactions.length }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Mono sync error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

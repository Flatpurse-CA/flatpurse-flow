import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    const key = new TextEncoder().encode(PAYSTACK_SECRET);
    const data = new TextEncoder().encode(body);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", key, { name: "HMAC", hash: "SHA-512" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, data);
    const expectedSignature = encodeHex(new Uint8Array(sig));

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    console.log("Paystack webhook event:", event.event);

    // Use service role for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event.event === "charge.success") {
      const txData = event.data;
      const metadata = txData.metadata || {};
      const userId = metadata.user_id;
      const billingCycle = metadata.billing_cycle || metadata.plan || "monthly";

      // Check if this is a DVA (Dedicated Virtual Account) transfer
      const channel = txData.channel;
      const isDVA = channel === "dedicated_nuban";

      if (isDVA) {
        // Handle DVA wallet credit
        const customerCode = txData.customer?.customer_code;
        if (!customerCode) {
          console.error("No customer_code in DVA charge");
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Find wallet by paystack_customer_code
        const { data: wallet, error: walletErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("paystack_customer_code", customerCode)
          .maybeSingle();

        if (walletErr || !wallet) {
          console.error("Wallet not found for customer:", customerCode, walletErr);
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check for duplicate reference
        const { data: existing } = await supabase
          .from("wallet_transactions")
          .select("id")
          .eq("reference", txData.reference)
          .maybeSingle();

        if (existing) {
          console.log("Duplicate DVA transaction:", txData.reference);
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const amountNaira = txData.amount / 100; // Paystack amounts are in kobo
        const newBalance = (wallet.balance || 0) + amountNaira;

        // Update wallet balance
        const { error: updateErr } = await supabase
          .from("wallets")
          .update({ balance: newBalance })
          .eq("id", wallet.id);

        if (updateErr) {
          console.error("Wallet balance update error:", updateErr);
          throw new Error(updateErr.message);
        }

        // Record wallet transaction
        const { error: txErr } = await supabase
          .from("wallet_transactions")
          .insert({
            wallet_id: wallet.id,
            user_id: wallet.user_id,
            type: "credit",
            amount: amountNaira,
            balance_after: newBalance,
            reference: txData.reference,
            description: `Transfer from ${txData.authorization?.sender_name || txData.customer?.email || "Bank Transfer"}`,
            source: "transfer",
            status: "completed",
            metadata: {
              channel,
              sender_bank: txData.authorization?.sender_bank,
              sender_name: txData.authorization?.sender_name,
            },
          });

        if (txErr) {
          console.error("Wallet transaction insert error:", txErr);
        }

        console.log(`Wallet credited: ${amountNaira} for user ${wallet.user_id}`);
    } else if (userId) {
        // Handle subscription payment (existing logic)
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingCycle === "annual") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        const { error } = await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              plan: "pro",
              billing_cycle: billingCycle,
              paystack_customer_code: txData.customer?.customer_code || null,
              paystack_reference: txData.reference,
              status: "active",
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("Subscription upsert error:", error);
          throw new Error(error.message);
        }

        console.log(`Pro activated for user ${userId}, cycle: ${billingCycle}`);

        // === REFERRAL EARNINGS ===
        try {
          const amountNaira = txData.amount / 100;

          // Check if this user was referred
          const { data: referral } = await supabase
            .from("referrals")
            .select("*")
            .eq("referred_id", userId)
            .maybeSingle();

          if (referral) {
            // Check how many earnings already exist for this referral
            const { data: existingEarnings } = await supabase
              .from("referral_earnings")
              .select("id")
              .eq("referral_id", referral.id);

            const isFirst = !existingEarnings || existingEarnings.length === 0;
            const rate = isFirst ? 0.10 : 0.05;
            const earningAmount = Math.round(amountNaira * rate * 100) / 100;

            // Create earning record
            await supabase.from("referral_earnings").insert({
              referral_id: referral.id,
              referrer_id: referral.referrer_id,
              amount: earningAmount,
              earning_type: isFirst ? "first" : "renewal",
              payment_reference: txData.reference,
              credited: false,
            });

            // Update referral status to converted
            if (referral.status === "pending") {
              await supabase
                .from("referrals")
                .update({ status: "converted" })
                .eq("id", referral.id);
            }

            // Credit to wallet
            const { data: wallet } = await supabase
              .from("wallets")
              .select("*")
              .eq("user_id", referral.referrer_id)
              .maybeSingle();

            if (wallet) {
              const newBalance = (wallet.balance || 0) + earningAmount;
              await supabase
                .from("wallets")
                .update({ balance: newBalance })
                .eq("id", wallet.id);

              await supabase.from("wallet_transactions").insert({
                wallet_id: wallet.id,
                user_id: referral.referrer_id,
                type: "credit",
                amount: earningAmount,
                balance_after: newBalance,
                reference: `ref-${txData.reference}`,
                description: `Referral earning (${isFirst ? "10%" : "5%"})`,
                source: "referral",
                status: "completed",
              });

              // Mark as credited
              await supabase
                .from("referral_earnings")
                .update({ credited: true })
                .eq("payment_reference", txData.reference)
                .eq("referrer_id", referral.referrer_id);
            }

            // Send notification
            await supabase.from("notifications").insert({
              user_id: referral.referrer_id,
              title: "Referral Earning! 🎉",
              message: `You earned ₦${earningAmount.toLocaleString()} from a referral ${isFirst ? "signup" : "renewal"}!`,
              type: "referral",
            });

            console.log(`Referral earning: ₦${earningAmount} for ${referral.referrer_id}`);
          }
        } catch (refErr) {
          console.error("Referral processing error:", refErr);
          // Don't fail the webhook for referral errors
        }

      } else {
        console.error("No user_id in metadata and not a DVA charge");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

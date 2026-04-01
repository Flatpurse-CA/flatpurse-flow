import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    // Verify admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Forbidden: not an admin");

    const body = await req.json();
    const { type, subject, html_body, to_emails, to_user_ids, target } = body;
    // type: "individual" | "broadcast" | "welcome" | "subscription_reminder"
    // target: "all" | "pro" | "free" for broadcast

    let recipients: string[] = [];

    if (type === "individual") {
      if (to_emails?.length) {
        recipients = to_emails;
      } else if (to_user_ids?.length) {
        for (const uid of to_user_ids) {
          const { data: userData } = await adminClient.auth.admin.getUserById(uid);
          if (userData?.user?.email) recipients.push(userData.user.email);
        }
      }
    } else if (type === "broadcast") {
      // Fetch all users
      const allEmails: string[] = [];
      for (let p = 1; p <= 50; p++) {
        const { data: batch } = await adminClient.auth.admin.listUsers({ page: p, perPage: 50 });
        if (!batch?.users?.length) break;

        if (target === "all") {
          batch.users.forEach(u => { if (u.email) allEmails.push(u.email); });
        } else {
          // Need to check subscriptions
          const uids = batch.users.map(u => u.id);
          const { data: subs } = await adminClient
            .from("subscriptions").select("user_id, plan, status")
            .in("user_id", uids);
          const proIds = new Set(subs?.filter(s => s.plan === "pro" && s.status === "active").map(s => s.user_id) || []);

          batch.users.forEach(u => {
            if (!u.email) return;
            if (target === "pro" && proIds.has(u.id)) allEmails.push(u.email);
            if (target === "free" && !proIds.has(u.id)) allEmails.push(u.email);
          });
        }
        if (batch.users.length < 50) break;
      }
      recipients = allEmails;
    } else if (type === "welcome" || type === "subscription_reminder") {
      if (to_user_ids?.length) {
        for (const uid of to_user_ids) {
          const { data: userData } = await adminClient.auth.admin.getUserById(uid);
          if (userData?.user?.email) recipients.push(userData.user.email);
        }
      } else if (to_emails?.length) {
        recipients = to_emails;
      }
    }

    if (!recipients.length) {
      return new Response(JSON.stringify({ error: "No recipients found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send emails in batches of 50 via Resend
    const fromEmail = "Manaa <hello@notify.app.usemanaa.com>";
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += 50) {
      const batch = recipients.slice(i, i + 50);
      
      // Send individually to avoid BCC issues
      const promises = batch.map(async (email) => {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [email],
              subject: subject || "Message from Manaa",
              html: html_body || "<p>Hello from Manaa!</p>",
            }),
          });
          if (res.ok) { sent++; } else { failed++; console.error(`Failed to send to ${email}:`, await res.text()); }
        } catch (e) {
          failed++;
          console.error(`Error sending to ${email}:`, e);
        }
      });
      await Promise.all(promises);
    }

    return new Response(JSON.stringify({ sent, failed, total: recipients.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("Unauthorized") ? 401 : msg.includes("Forbidden") ? 403 : 400;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

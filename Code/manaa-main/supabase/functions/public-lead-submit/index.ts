import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, fields } = await req.json();

    if (!slug || !fields || typeof fields !== "object") {
      return new Response(
        JSON.stringify({ error: "Missing slug or fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate field lengths
    const name = String(fields.name || "").trim().slice(0, 100);
    if (!name) {
      return new Response(
        JSON.stringify({ error: "Name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitize = (str: string) => str.replace(/<[^>]*>/g, "");

    const email = String(fields.email || "").trim().slice(0, 255);
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const phone = String(fields.phone || "").trim().slice(0, 30);
    if (phone) {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(phone)) {
        return new Response(
          JSON.stringify({ error: "Invalid phone format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const company = sanitize(String(fields.company || "").trim().slice(0, 100));
    const notes = sanitize(String(fields.message || fields.notes || "").trim().slice(0, 1000));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the form
    const { data: form, error: formErr } = await supabase
      .from("lead_forms")
      .select("id, business_id, title, is_active")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (formErr || !form) {
      return new Response(
        JSON.stringify({ error: "Form not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the contact as a lead
    const { error: contactErr } = await supabase.from("contacts").insert({
      business_id: form.business_id,
      name: sanitize(name),
      email: email || null,
      phone: phone || null,
      company: company || null,
      notes: notes ? `[Form: ${form.title}] ${notes}` : `[Form: ${form.title}]`,
      status: "lead",
      tags: ["form-lead", slug],
    });

    if (contactErr) {
      console.error("Contact insert error:", contactErr);
      return new Response(
        JSON.stringify({ error: "Failed to submit" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Lead submit error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

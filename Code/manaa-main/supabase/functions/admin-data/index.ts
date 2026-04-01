import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const rateLimitMap = new Map<string, number[]>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Forbidden: not an admin");

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Rate limiting for sensitive actions
    const rateLimitedActions = ["toggle_admin", "toggle_pro", "delete_user"];
    if (rateLimitedActions.includes(action || "") && req.method === "POST") {
      const now = Date.now();
      const key = `${action}:${user.id}`;
      if (!rateLimitMap.has(key)) rateLimitMap.set(key, []);
      const timestamps = rateLimitMap.get(key)!.filter((t: number) => now - t < 3600_000);
      if (timestamps.length >= 10) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      timestamps.push(now);
      rateLimitMap.set(key, timestamps);
    }

    // ==================== STATS ====================
    if (action === "stats") {
      const [usersRes, bizRes, txRes, invoicesRes, subsRes, proSubsRes, accountsRes] = await Promise.all([
        adminClient.from("profiles").select("id", { count: "exact", head: true }),
        adminClient.from("businesses").select("id", { count: "exact", head: true }),
        adminClient.from("transactions").select("id", { count: "exact", head: true }),
        adminClient.from("invoices").select("id", { count: "exact", head: true }),
        adminClient.from("subscriptions").select("id", { count: "exact", head: true }),
        adminClient.from("subscriptions").select("id", { count: "exact", head: true }).eq("plan", "pro").eq("status", "active"),
        adminClient.from("accounts").select("id", { count: "exact", head: true }),
      ]);

      // Sum all transaction amounts
      const { data: cashInData } = await adminClient
        .from("transactions")
        .select("amount")
        .eq("type", "cash_in")
        .limit(10000);

      const { data: cashOutData } = await adminClient
        .from("transactions")
        .select("amount")
        .eq("type", "cash_out")
        .limit(10000);

      const totalCashIn = cashInData?.reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
      const totalCashOut = cashOutData?.reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

      // MRR
      const { data: activeSubs } = await adminClient
        .from("subscriptions")
        .select("billing_cycle")
        .eq("plan", "pro")
        .eq("status", "active");

      let monthlyRevenue = 0;
      activeSubs?.forEach((s) => {
        if (s.billing_cycle === "annual") monthlyRevenue += 50000 / 12;
        else if (s.billing_cycle !== "admin_granted") monthlyRevenue += 4500;
      });

      // Inventory & contacts counts
      const [inventoryRes, contactsRes, dealsRes] = await Promise.all([
        adminClient.from("inventory_items").select("id", { count: "exact", head: true }),
        adminClient.from("contacts").select("id", { count: "exact", head: true }),
        adminClient.from("deals").select("id", { count: "exact", head: true }),
      ]);

      return new Response(JSON.stringify({
        total_users: usersRes.count ?? 0,
        total_businesses: bizRes.count ?? 0,
        total_transactions: txRes.count ?? 0,
        total_invoices: invoicesRes.count ?? 0,
        total_subscriptions: subsRes.count ?? 0,
        active_pro_users: proSubsRes.count ?? 0,
        estimated_mrr: Math.round(monthlyRevenue),
        total_books: accountsRes.count ?? 0,
        total_cash_in: totalCashIn,
        total_cash_out: totalCashOut,
        total_tracked: totalCashIn + totalCashOut,
        total_inventory_items: inventoryRes.count ?? 0,
        total_contacts: contactsRes.count ?? 0,
        total_deals: dealsRes.count ?? 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ==================== USERS (with search + filter) ====================
    if (action === "users") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const search = url.searchParams.get("search") || "";
      const filter = url.searchParams.get("filter") || "all"; // all | free | pro
      const perPage = 20;

      // If searching or filtering, fetch all users
      let allUsers: any[] = [];
      if (search || filter !== "all") {
        for (let p = 1; p <= 25; p++) {
          const { data: batch } = await adminClient.auth.admin.listUsers({ page: p, perPage: 20 });
          if (!batch?.users?.length) break;
          allUsers.push(...batch.users);
          if (batch.users.length < 20) break;
        }
        if (search) {
          const q = search.toLowerCase();
          allUsers = allUsers.filter(u =>
            u.email?.toLowerCase().includes(q) ||
            u.user_metadata?.full_name?.toLowerCase().includes(q)
          );
        }
      } else {
        const { data: usersData } = await adminClient.auth.admin.listUsers({ page, perPage });
        allUsers = usersData?.users || [];
      }

      const userIds = allUsers.map(u => u.id);

      const [rolesRes, bizRes, subsRes, profilesRes] = await Promise.all([
        userIds.length ? adminClient.from("user_roles").select("user_id, role").in("user_id", userIds) : { data: [] },
        userIds.length ? adminClient.from("businesses").select("user_id").in("user_id", userIds) : { data: [] },
        userIds.length ? adminClient.from("subscriptions").select("user_id, plan, status, billing_cycle, current_period_end").in("user_id", userIds) : { data: [] },
        userIds.length ? adminClient.from("profiles").select("user_id, full_name, avatar_url, industry, position, use_mode").in("user_id", userIds) : { data: [] },
      ]);

      const rolesMap: Record<string, string[]> = {};
      (rolesRes.data as any[])?.forEach((r: any) => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      });

      const bizCountMap: Record<string, number> = {};
      (bizRes.data as any[])?.forEach((b: any) => {
        bizCountMap[b.user_id] = (bizCountMap[b.user_id] || 0) + 1;
      });

      const subsMap: Record<string, any> = {};
      (subsRes.data as any[])?.forEach((s: any) => { subsMap[s.user_id] = s; });

      const profilesMap: Record<string, any> = {};
      (profilesRes.data as any[])?.forEach((p: any) => { profilesMap[p.user_id] = p; });

      let users = allUsers.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        full_name: profilesMap[u.id]?.full_name || u.user_metadata?.full_name || "",
        avatar_url: profilesMap[u.id]?.avatar_url || "",
        industry: profilesMap[u.id]?.industry || "",
        position: profilesMap[u.id]?.position || "",
        use_mode: profilesMap[u.id]?.use_mode || "",
        roles: rolesMap[u.id] || [],
        business_count: bizCountMap[u.id] || 0,
        subscription: subsMap[u.id] || null,
        email_confirmed: !!u.email_confirmed_at,
        phone: u.phone || "",
      }));

      // Apply filter
      if (filter === "pro") {
        users = users.filter(u => u.subscription?.plan === "pro" && u.subscription?.status === "active");
      } else if (filter === "free") {
        users = users.filter(u => !u.subscription || u.subscription.plan !== "pro" || u.subscription.status !== "active");
      }

      // For non-search non-filter, get total from profiles
      let totalCount = users.length;
      if (!search && filter === "all") {
        const { count } = await adminClient.from("profiles").select("id", { count: "exact", head: true });
        totalCount = count ?? users.length;
      }

      // Paginate if we fetched all
      let paginatedUsers = users;
      if (search || filter !== "all") {
        totalCount = users.length;
        const start = (page - 1) * perPage;
        paginatedUsers = users.slice(start, start + perPage);
      }

      return new Response(JSON.stringify({ users: paginatedUsers, total: totalCount, page, perPage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==================== USER DETAIL ====================
    if (action === "user_detail") {
      const targetId = url.searchParams.get("user_id");
      if (!targetId) throw new Error("Missing user_id");

      const { data: userData } = await adminClient.auth.admin.getUserById(targetId);
      if (!userData?.user) throw new Error("User not found");

      const u = userData.user;

      const [profileRes, bizRes, accountsRes, txRes, subsRes, rolesRes, invoicesRes] = await Promise.all([
        adminClient.from("profiles").select("*").eq("user_id", targetId).maybeSingle(),
        adminClient.from("businesses").select("id, name, currency, created_at").eq("user_id", targetId),
        adminClient.from("accounts").select("id, name, type, initial_balance, business_id").in("business_id",
          (await adminClient.from("businesses").select("id").eq("user_id", targetId)).data?.map(b => b.id) || []
        ),
        adminClient.rpc("has_role", { _user_id: targetId, _role: "admin" }),
        adminClient.from("subscriptions").select("*").eq("user_id", targetId).maybeSingle(),
        adminClient.from("user_roles").select("role").eq("user_id", targetId),
        adminClient.from("invoices").select("id", { count: "exact", head: true }).in("business_id",
          (await adminClient.from("businesses").select("id").eq("user_id", targetId)).data?.map(b => b.id) || []
        ),
      ]);

      // Count transactions across all user's accounts
      const accountIds = accountsRes.data?.map(a => a.id) || [];
      let txCount = 0;
      let totalIn = 0;
      let totalOut = 0;
      if (accountIds.length) {
        const { data: txData } = await adminClient.from("transactions").select("type, amount").in("account_id", accountIds).limit(5000);
        txCount = txData?.length || 0;
        txData?.forEach(t => {
          if (t.type === "cash_in") totalIn += Number(t.amount);
          else totalOut += Number(t.amount);
        });
      }

      return new Response(JSON.stringify({
        id: u.id,
        email: u.email,
        phone: u.phone || "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed: !!u.email_confirmed_at,
        profile: profileRes.data,
        businesses: bizRes.data || [],
        books: accountsRes.data || [],
        subscription: subsRes.data,
        roles: rolesRes.data?.map(r => r.role) || [],
        stats: {
          transaction_count: txCount,
          total_cash_in: totalIn,
          total_cash_out: totalOut,
          invoice_count: invoicesRes.count ?? 0,
          book_count: accountIds.length,
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ==================== UPDATE USER ====================
    if (action === "update_user" && req.method === "POST") {
      const { target_user_id, full_name, email } = await req.json();
      if (!target_user_id) throw new Error("Missing target_user_id");

      // Update profile name
      if (full_name !== undefined) {
        await adminClient.from("profiles").update({ full_name }).eq("user_id", target_user_id);
      }

      // Update email via admin API
      if (email) {
        await adminClient.auth.admin.updateUserById(target_user_id, { email });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==================== DELETE USER ====================
    if (action === "delete_user" && req.method === "POST") {
      const { target_user_id } = await req.json();
      if (!target_user_id) throw new Error("Missing target_user_id");
      if (target_user_id === user.id) throw new Error("Cannot delete yourself");

      // Delete user data in order (respecting foreign keys)
      const userBiz = await adminClient.from("businesses").select("id").eq("user_id", target_user_id);
      const bizIds = userBiz.data?.map(b => b.id) || [];

      if (bizIds.length) {
        const accts = await adminClient.from("accounts").select("id").in("business_id", bizIds);
        const acctIds = accts.data?.map(a => a.id) || [];
        if (acctIds.length) {
          await adminClient.from("transactions").delete().in("account_id", acctIds);
        }
        await adminClient.from("accounts").delete().in("business_id", bizIds);
        await adminClient.from("invoices").delete().in("business_id", bizIds);
        await adminClient.from("inventory_items").delete().in("business_id", bizIds);
        await adminClient.from("contacts").delete().in("business_id", bizIds);
        await adminClient.from("deals").delete().in("business_id", bizIds);
        await adminClient.from("deal_stages").delete().in("business_id", bizIds);
        await adminClient.from("reminders").delete().in("business_id", bizIds);
        await adminClient.from("businesses").delete().in("id", bizIds);
      }

      await adminClient.from("subscriptions").delete().eq("user_id", target_user_id);
      await adminClient.from("user_roles").delete().eq("user_id", target_user_id);
      await adminClient.from("profiles").delete().eq("user_id", target_user_id);
      await adminClient.from("notifications").delete().eq("user_id", target_user_id);
      await adminClient.from("categories").delete().eq("user_id", target_user_id);
      await adminClient.from("push_subscriptions").delete().eq("user_id", target_user_id);

      // Finally delete the auth user
      await adminClient.auth.admin.deleteUser(target_user_id);

      return new Response(JSON.stringify({ deleted: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==================== BUSINESSES ====================
    if (action === "businesses") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const perPage = 20;
      const from = (page - 1) * perPage;

      const { data: businesses, count } = await adminClient
        .from("businesses")
        .select("*, accounts(id)", { count: "exact" })
        .range(from, from + perPage - 1)
        .order("created_at", { ascending: false });

      const ownerIds = [...new Set(businesses?.map(b => b.user_id) || [])];
      const { data: ownerUsers } = ownerIds.length > 0
        ? await adminClient.auth.admin.listUsers({ perPage: 50 })
        : { data: { users: [] } };

      const ownerMap: Record<string, string> = {};
      (ownerUsers as any)?.users?.forEach((u: any) => {
        ownerMap[u.id] = u.email || "";
      });

      const enriched = businesses?.map(b => ({
        ...b,
        owner_email: ownerMap[b.user_id] || "—",
        account_count: b.accounts?.length || 0,
      }));

      return new Response(JSON.stringify({ businesses: enriched, total: count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==================== SUBSCRIPTIONS ====================
    if (action === "subscriptions") {
      const { data: subs } = await adminClient
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      const userIds = [...new Set(subs?.map(s => s.user_id) || [])];
      const { data: usersData } = userIds.length > 0
        ? await adminClient.auth.admin.listUsers({ perPage: 50 })
        : { data: { users: [] } };

      const emailMap: Record<string, string> = {};
      (usersData as any)?.users?.forEach((u: any) => {
        emailMap[u.id] = u.email || "";
      });

      const enriched = subs?.map(s => ({
        ...s,
        user_email: emailMap[s.user_id] || "—",
      }));

      return new Response(JSON.stringify({ subscriptions: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==================== TOGGLE ADMIN ====================
    if (action === "toggle_admin" && req.method === "POST") {
      const { target_user_id } = await req.json();
      if (!target_user_id) throw new Error("Missing target_user_id");

      const { data: existing } = await adminClient
        .from("user_roles").select("id").eq("user_id", target_user_id).eq("role", "admin").maybeSingle();

      if (existing) {
        if (target_user_id === user.id) throw new Error("Cannot remove your own admin role");
        await adminClient.from("user_roles").delete().eq("id", existing.id);
        return new Response(JSON.stringify({ admin: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        await adminClient.from("user_roles").insert({ user_id: target_user_id, role: "admin" });
        return new Response(JSON.stringify({ admin: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ==================== TOGGLE PRO ====================
    if (action === "toggle_pro" && req.method === "POST") {
      const { target_user_id } = await req.json();
      if (!target_user_id) throw new Error("Missing target_user_id");

      const { data: existing } = await adminClient
        .from("subscriptions").select("id, plan").eq("user_id", target_user_id).maybeSingle();

      if (existing && existing.plan === "pro") {
        await adminClient.from("subscriptions")
          .update({ plan: "free", status: "cancelled", billing_cycle: null, current_period_end: null })
          .eq("id", existing.id);
        return new Response(JSON.stringify({ pro: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const now = new Date();
        const farFuture = new Date("2099-12-31T23:59:59Z");

        if (existing) {
          await adminClient.from("subscriptions").update({
            plan: "pro", status: "active", billing_cycle: "admin_granted",
            current_period_start: now.toISOString(), current_period_end: farFuture.toISOString(),
          }).eq("id", existing.id);
        } else {
          await adminClient.from("subscriptions").insert({
            user_id: target_user_id, plan: "pro", status: "active", billing_cycle: "admin_granted",
            current_period_start: now.toISOString(), current_period_end: farFuture.toISOString(),
          });
        }
        return new Response(JSON.stringify({ pro: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ==================== CATEGORIES ====================
    if (action === "categories") {
      const { data: categories } = await adminClient.from("categories").select("name, type").limit(100);
      const unique = [...new Map(categories?.map(c => [`${c.name}-${c.type}`, c]) || []).values()];
      return new Response(JSON.stringify({ categories: unique }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==================== FINANCE OVERVIEW ====================
    if (action === "finance_overview") {
      // Revenue breakdown by subscription type
      const { data: allSubs } = await adminClient
        .from("subscriptions")
        .select("plan, status, billing_cycle, current_period_start, current_period_end, created_at, updated_at")
        .order("created_at", { ascending: false });

      const activePro = allSubs?.filter(s => s.plan === "pro" && s.status === "active") || [];
      const monthlySubs = activePro.filter(s => s.billing_cycle === "monthly");
      const annualSubs = activePro.filter(s => s.billing_cycle === "annual");
      const adminGranted = activePro.filter(s => s.billing_cycle === "admin_granted");
      const cancelledSubs = allSubs?.filter(s => s.status === "cancelled") || [];

      const monthlyRevenue = monthlySubs.length * 4500;
      const annualRevenue = annualSubs.length * 50000;
      const totalRevenue = monthlyRevenue + annualRevenue;
      const mrr = monthlyRevenue + (annualRevenue / 12);
      const arr = mrr * 12;

      // Platform transaction volume
      const { data: txInData } = await adminClient.from("transactions").select("amount").eq("type", "cash_in").limit(10000);
      const { data: txOutData } = await adminClient.from("transactions").select("amount").eq("type", "cash_out").limit(10000);
      const totalCashIn = txInData?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const totalCashOut = txOutData?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;

      // Monthly revenue trend (last 6 months)
      const now = new Date();
      const monthlyTrend: { month: string; revenue: number; new_subs: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const label = d.toLocaleString("en", { month: "short", year: "2-digit" });
        const newInMonth = allSubs?.filter(s => {
          const cd = new Date(s.created_at);
          return cd >= d && cd <= monthEnd && s.plan === "pro";
        }) || [];
        let rev = 0;
        newInMonth.forEach(s => {
          if (s.billing_cycle === "annual") rev += 50000;
          else if (s.billing_cycle !== "admin_granted") rev += 4500;
        });
        monthlyTrend.push({ month: label, revenue: rev, new_subs: newInMonth.length });
      }

      // Invoice stats
      const { data: invoiceStats } = await adminClient.from("invoices").select("status, total").limit(5000);
      const totalInvoiced = invoiceStats?.reduce((s, i) => s + Number(i.total), 0) ?? 0;
      const paidInvoices = invoiceStats?.filter(i => i.status === "paid") || [];
      const totalPaid = paidInvoices.reduce((s, i) => s + Number(i.total), 0);
      const unpaidInvoices = invoiceStats?.filter(i => i.status !== "paid" && i.status !== "cancelled") || [];
      const totalUnpaid = unpaidInvoices.reduce((s, i) => s + Number(i.total), 0);

      return new Response(JSON.stringify({
        subscription_summary: {
          total_active: activePro.length,
          monthly: monthlySubs.length,
          annual: annualSubs.length,
          admin_granted: adminGranted.length,
          cancelled: cancelledSubs.length,
        },
        revenue: {
          mrr: Math.round(mrr),
          arr: Math.round(arr),
          total_revenue: totalRevenue,
          monthly_revenue: monthlyRevenue,
          annual_revenue: annualRevenue,
        },
        platform_volume: {
          total_cash_in: totalCashIn,
          total_cash_out: totalCashOut,
          total_tracked: totalCashIn + totalCashOut,
        },
        invoicing: {
          total_invoiced: totalInvoiced,
          total_paid: totalPaid,
          total_unpaid: totalUnpaid,
          invoice_count: invoiceStats?.length ?? 0,
          paid_count: paidInvoices.length,
          unpaid_count: unpaidInvoices.length,
        },
        monthly_trend: monthlyTrend,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ==================== FINANCE PAYMENTS ====================
    if (action === "finance_payments") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const perPage = 30;
      const filter = url.searchParams.get("filter") || "all"; // all, active, cancelled, admin_granted

      let query = adminClient.from("subscriptions").select("*", { count: "exact" });

      if (filter === "active") query = query.eq("status", "active").eq("plan", "pro");
      else if (filter === "cancelled") query = query.eq("status", "cancelled");
      else if (filter === "admin_granted") query = query.eq("billing_cycle", "admin_granted");
      else if (filter === "paid") query = query.neq("billing_cycle", "admin_granted").eq("plan", "pro");

      const { data: subs, count } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      // Get user emails
      const userIds = [...new Set(subs?.map(s => s.user_id) || [])];
      let emailMap: Record<string, string> = {};
      if (userIds.length) {
        for (let p = 1; p <= 5; p++) {
          const { data: batch } = await adminClient.auth.admin.listUsers({ page: p, perPage: 50 });
          if (!batch?.users?.length) break;
          batch.users.forEach(u => { emailMap[u.id] = u.email || ""; });
          if (batch.users.length < 50) break;
        }
      }

      const enriched = subs?.map(s => ({
        ...s,
        user_email: emailMap[s.user_id] || "—",
        amount: s.billing_cycle === "annual" ? 50000 : s.billing_cycle === "admin_granted" ? 0 : 4500,
      }));

      return new Response(JSON.stringify({ payments: enriched, total: count, page, perPage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==================== FINANCE REPORTS ====================
    if (action === "finance_reports") {
      // Comprehensive financial report data
      const { data: allTx } = await adminClient.from("transactions").select("type, amount, category, transaction_date, created_at").limit(10000);

      // Category breakdown
      const categoryMap: Record<string, { income: number; expense: number }> = {};
      allTx?.forEach(t => {
        if (!categoryMap[t.category]) categoryMap[t.category] = { income: 0, expense: 0 };
        if (t.type === "cash_in") categoryMap[t.category].income += Number(t.amount);
        else categoryMap[t.category].expense += Number(t.amount);
      });
      const categoryBreakdown = Object.entries(categoryMap)
        .map(([name, data]) => ({ name, ...data, total: data.income + data.expense }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 15);

      // Monthly transaction volume (last 12 months)
      const now = new Date();
      const monthlyVolume: { month: string; cash_in: number; cash_out: number; tx_count: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const label = d.toLocaleString("en", { month: "short", year: "2-digit" });
        const monthTx = allTx?.filter(t => {
          const td = new Date(t.transaction_date);
          return td >= d && td <= monthEnd;
        }) || [];
        const ci = monthTx.filter(t => t.type === "cash_in").reduce((s, t) => s + Number(t.amount), 0);
        const co = monthTx.filter(t => t.type === "cash_out").reduce((s, t) => s + Number(t.amount), 0);
        monthlyVolume.push({ month: label, cash_in: ci, cash_out: co, tx_count: monthTx.length });
      }

      // Business-level breakdown (top 10)
      const { data: bizData } = await adminClient.from("businesses").select("id, name, user_id").limit(100);
      const { data: acctData } = await adminClient.from("accounts").select("id, business_id").limit(1000);
      const bizAcctMap: Record<string, string[]> = {};
      acctData?.forEach(a => {
        if (!bizAcctMap[a.business_id]) bizAcctMap[a.business_id] = [];
        bizAcctMap[a.business_id].push(a.id);
      });

      const bizBreakdown = bizData?.map(b => {
        const acctIds = bizAcctMap[b.id] || [];
        const bizTx = allTx?.filter(t => acctIds.includes((t as any).account_id)) || [];
        // We don't have account_id in our select, so skip this for now
        return { name: b.name, id: b.id };
      }).slice(0, 10) || [];

      return new Response(JSON.stringify({
        category_breakdown: categoryBreakdown,
        monthly_volume: monthlyVolume,
        top_businesses: bizBreakdown,
        total_transactions: allTx?.length ?? 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = (err as Error).message;
    console.error("Admin function error:", msg);

    // Map internal errors to generic client-facing messages
    const statusMap: Record<string, number> = {
      "No auth header": 401, "Unauthorized": 401, "Forbidden: not an admin": 403,
      "Unknown action": 400, "Missing target_user_id": 400, "Missing user_id": 400,
      "User not found": 404, "Cannot remove your own admin role": 400,
      "Cannot delete yourself": 400, "Rate limit exceeded. Try again later.": 429,
    };
    const status = statusMap[msg] ?? 400;

    // Generic messages grouped by status code
    const genericMessages: Record<number, string> = {
      401: "Access denied",
      403: "Access denied",
      404: "Resource not found",
      400: "Bad request",
      429: "Too many requests",
    };
    const safeMsg = genericMessages[status] || "An error occurred";

    return new Response(JSON.stringify({ error: safeMsg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

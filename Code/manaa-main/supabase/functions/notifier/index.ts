const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function dbGet(table: string, params = ""): Promise<unknown[]> {
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/${table}${params}`, {
    headers: {
      apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
  });
  return r.json();
}

async function dbPost(table: string, body: unknown): Promise<unknown> {
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function dbDel(table: string, params: string): Promise<void> {
  await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/${table}${params}`, {
    method: "DELETE",
    headers: {
      apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
  });
}

async function getUser(auth: string) {
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
    headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY")!, Authorization: auth },
  });
  if (!r.ok) return null;
  return r.json();
}

function b64u(buf: ArrayBuffer): string {
  let s = ""; for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64d(s: string): Uint8Array {
  const p = s + "=".repeat((4 - (s.length % 4)) % 4);
  const d = atob(p.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(d, c => c.charCodeAt(0));
}
function merge(...a: Uint8Array[]): Uint8Array {
  const r = new Uint8Array(a.reduce((n, x) => n + x.length, 0));
  let o = 0; for (const x of a) { r.set(x, o); o += x.length; } return r;
}

async function getVapid() {
  const rows = await dbGet("push_config", "?key=in.(vapid_pub,vapid_jwk)&select=key,value") as { key: string; value: string }[];
  if (rows.length === 2) return { pub: rows.find(r => r.key === "vapid_pub")!.value, jwk: JSON.parse(rows.find(r => r.key === "vapid_jwk")!.value) as JsonWebKey };
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const raw = await crypto.subtle.exportKey("raw", kp.publicKey);
  const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  const pub = b64u(raw);
  await dbPost("push_config", [{ key: "vapid_pub", value: pub }, { key: "vapid_jwk", value: JSON.stringify(jwk) }]);
  return { pub, jwk };
}

async function hm(k: Uint8Array, d: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, d));
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, msg: string, vPub: string, vJwk: JsonWebKey) {
  const te = new TextEncoder();
  const ep = new URL(sub.endpoint);
  const h = b64u(te.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })).buffer);
  const now = Math.floor(Date.now() / 1000);
  const c = b64u(te.encode(JSON.stringify({ aud: `${ep.protocol}//${ep.host}`, exp: now + 86400, sub: "mailto:hello@manaa.app" })).buffer);
  const us = `${h}.${c}`;
  const sk = await crypto.subtle.importKey("jwk", vJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, sk, te.encode(us));
  const jwt = `${us}.${b64u(sig)}`;
  const sp = b64d(sub.p256dh), sa = b64d(sub.auth);
  const lk = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const pk = await crypto.subtle.importKey("raw", sp, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: pk }, lk.privateKey, 256));
  const lp = new Uint8Array(await crypto.subtle.exportKey("raw", lk.publicKey));
  const p1 = await hm(sa, sh);
  const ikm = (await hm(p1, merge(te.encode("WebPush: info\0"), sp, lp, new Uint8Array([1])))).slice(0, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const p2 = await hm(salt, ikm);
  const cek = (await hm(p2, merge(te.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hm(p2, merge(te.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);
  const aes = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, merge(te.encode(msg), new Uint8Array([2]))));
  const rs = new Uint8Array(4); new DataView(rs.buffer).setUint32(0, 4096);
  return fetch(sub.endpoint, { method: "POST", headers: { Authorization: `vapid t=${jwt}, k=${vPub}`, "Content-Type": "application/octet-stream", "Content-Encoding": "aes128gcm", TTL: "86400" }, body: merge(salt, rs, new Uint8Array([lp.length]), lp, ct) });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const a = new URL(req.url).searchParams.get("action");
    if (a === "vapid-key") { const { pub } = await getVapid(); return json({ publicKey: pub }); }
    if (a === "subscribe") {
      const ah = req.headers.get("Authorization"); if (!ah) return json({ error: "Unauthorized" }, 401);
      const u = await getUser(ah); if (!u?.id) return json({ error: "Unauthorized" }, 401);
      const { subscription } = await req.json();
      await dbPost("push_subscriptions", { user_id: u.id, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth });
      return json({ success: true });
    }
    if (a === "unsubscribe") {
      const ah = req.headers.get("Authorization"); if (!ah) return json({ error: "Unauthorized" }, 401);
      const u = await getUser(ah); if (!u?.id) return json({ error: "Unauthorized" }, 401);
      await dbDel("push_subscriptions", `?user_id=eq.${u.id}`); return json({ success: true });
    }
    if (a === "check") {
      const ah = req.headers.get("Authorization"); if (!ah) return json({ subscribed: false });
      const u = await getUser(ah); if (!u?.id) return json({ subscribed: false });
      const d = await dbGet("push_subscriptions", `?user_id=eq.${u.id}&select=id&limit=1`);
      return json({ subscribed: d.length > 0 });
    }
    if (a === "send-test") {
      const ah = req.headers.get("Authorization"); if (!ah) return json({ error: "Unauthorized" }, 401);
      const u = await getUser(ah); if (!u?.id) return json({ error: "Unauthorized" }, 401);
      const subs = await dbGet("push_subscriptions", `?user_id=eq.${u.id}&select=*`) as { endpoint: string; p256dh: string; auth: string }[];
      if (!subs.length) return json({ error: "No push subscription found. Enable notifications first." }, 400);
      const { pub, jwk } = await getVapid();
      const msg = JSON.stringify({ title: "🎉 Manaa is Live!", body: "Congratulations! Push notifications are working perfectly. You're all set!", icon: "https://manaa.lovable.app/manaa-notification-icon.png", badge: "https://manaa.lovable.app/manaa-notification-icon.png", data: { url: "/dashboard" } });
      let sent = 0;
      for (const s of subs) { try { const r = await sendPush(s, msg, pub, jwk); if (r.ok || r.status === 201) sent++; } catch { /* skip */ } }
      return json({ sent });
    }
    if (a === "send-admin") {
      const ah = req.headers.get("Authorization"); if (!ah) return json({ error: "Unauthorized" }, 401);
      const u = await getUser(ah); if (!u?.id) return json({ error: "Unauthorized" }, 401);
      // Check admin role
      const roles = await dbGet("user_roles", `?user_id=eq.${u.id}&role=eq.admin&select=id&limit=1`) as unknown[];
      if (!roles.length) return json({ error: "Forbidden" }, 403);
      const { title, body, target, user_ids } = await req.json();
      if (!title || !body) return json({ error: "Title and body required" }, 400);
      const { pub, jwk } = await getVapid();
      const msg = JSON.stringify({ title, body, icon: "https://manaa.lovable.app/manaa-notification-icon.png", badge: "https://manaa.lovable.app/manaa-notification-icon.png", data: { url: "/dashboard" } });
      let subs: { endpoint: string; p256dh: string; auth: string; user_id: string }[] = [];
      if (target === "specific" && user_ids?.length) {
        for (const uid of user_ids) {
          const s = await dbGet("push_subscriptions", `?user_id=eq.${uid}&select=*`) as any[];
          subs.push(...s);
        }
      } else {
        subs = await dbGet("push_subscriptions", "?select=*") as any[];
      }
      if (!subs.length) return json({ sent: 0, total: 0 });
      let sent = 0, failed = 0; const stale: string[] = [];
      for (const s of subs) { try { const r = await sendPush(s, msg, pub, jwk); if (r.ok || r.status === 201) sent++; else { if (r.status === 410 || r.status === 404) stale.push(s.endpoint); failed++; } } catch { failed++; } }
      for (const ep of stale) await dbDel("push_subscriptions", `?endpoint=eq.${encodeURIComponent(ep)}`);
      // Also store in-app notifications for each unique user
      const uniqueUserIds = [...new Set(subs.map(s => s.user_id))];
      for (const uid of uniqueUserIds) {
        await dbPost("notifications", { user_id: uid, title, message: body, type: "admin" });
      }
      return json({ sent, failed, cleaned: stale.length, total: subs.length });
    }
    if (a === "send-reminders") {
      const schedulerSecret = Deno.env.get("SCHEDULER_SECRET");
      const providedSecret = req.headers.get("x-scheduler-secret");
      if (!schedulerSecret || providedSecret !== schedulerSecret) {
        return json({ error: "Unauthorized" }, 401);
      }
      const subs = await dbGet("push_subscriptions", "?select=*") as { endpoint: string; p256dh: string; auth: string }[];
      if (!subs.length) return json({ sent: 0 });
      const { pub, jwk } = await getVapid();
      const hr = (new Date().getUTCHours() + 1) % 24;
      const am = hr >= 7 && hr < 12;
      const msg = JSON.stringify({ title: am ? "Good morning! 🌅" : "End of day check-in 🌙", body: am ? "Have you recorded your daily bread? Open Manaa to stay on track 🍞" : "Have you recorded today's sales? Don't forget to update your books 📒", icon: "https://manaa.lovable.app/manaa-notification-icon.png", badge: "https://manaa.lovable.app/manaa-notification-icon.png", data: { url: "/dashboard" } });
      let sent = 0, failed = 0; const stale: string[] = [];
      for (const s of subs) { try { const r = await sendPush(s, msg, pub, jwk); if (r.ok || r.status === 201) sent++; else { if (r.status === 410 || r.status === 404) stale.push(s.endpoint); failed++; } } catch { failed++; } }
      for (const ep of stale) await dbDel("push_subscriptions", `?endpoint=eq.${encodeURIComponent(ep)}`);
      return json({ sent, failed, cleaned: stale.length });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) { console.error("Push error:", e); return json({ error: "An internal error occurred" }, 500); }
});

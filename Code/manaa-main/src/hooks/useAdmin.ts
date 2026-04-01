import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function adminFetch(action: string, params?: Record<string, string>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`);
  url.searchParams.set("action", action);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

async function adminPost(action: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`);
  url.searchParams.set("action", action);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}`);
  }
  return res.json();
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    staleTime: 60_000,
  });
}

export function useAdminStats() {
  return useQuery({ queryKey: ["admin-stats"], queryFn: () => adminFetch("stats") });
}

export function useAdminUsers(page = 1, search = "", filter = "all") {
  return useQuery({
    queryKey: ["admin-users", page, search, filter],
    queryFn: () => adminFetch("users", { page: String(page), search, filter }),
  });
}

export function useAdminUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => adminFetch("user_detail", { user_id: userId! }),
    enabled: !!userId,
  });
}

export function useAdminBusinesses(page = 1) {
  return useQuery({
    queryKey: ["admin-businesses", page],
    queryFn: () => adminFetch("businesses", { page: String(page) }),
  });
}

export function useAdminSubscriptions() {
  return useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: () => adminFetch("subscriptions"),
  });
}

export function useAdminFinanceOverview() {
  return useQuery({
    queryKey: ["admin-finance-overview"],
    queryFn: () => adminFetch("finance_overview"),
  });
}

export function useAdminFinancePayments(page = 1, filter = "all") {
  return useQuery({
    queryKey: ["admin-finance-payments", page, filter],
    queryFn: () => adminFetch("finance_payments", { page: String(page), filter }),
  });
}

export function useAdminFinanceReports() {
  return useQuery({
    queryKey: ["admin-finance-reports"],
    queryFn: () => adminFetch("finance_reports"),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => adminFetch("categories"),
  });
}

export function useToggleAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => adminPost("toggle_admin", { target_user_id: targetUserId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user-detail"] });
    },
  });
}

export function useTogglePro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => adminPost("toggle_pro", { target_user_id: targetUserId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-user-detail"] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { target_user_id: string; full_name?: string; email?: string }) =>
      adminPost("update_user", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user-detail"] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => adminPost("delete_user", { target_user_id: targetUserId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

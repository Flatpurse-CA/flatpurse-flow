import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

async function callWallet(action: string, params?: Record<string, string>, body?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams({ action, ...params });
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/wallet?${searchParams}`,
    {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function useWallet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: () => callWallet("get-wallet").then((d) => d.wallet),
    enabled: !!user,
  });
}

export function useWalletTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wallet-transactions", user?.id],
    queryFn: () => callWallet("transactions").then((d) => d.transactions),
    enabled: !!user,
  });
}

export function useCreateDVA() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (phone: string) => callWallet("create-dva", undefined, { phone }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet", user?.id] });
    },
  });
}

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Connect from "@mono.co/connect.js";

export interface LinkedBankAccount {
  id: string;
  user_id: string;
  account_id: string | null;
  mono_account_id: string;
  institution_name: string;
  account_number: string;
  account_name: string;
  status: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useLinkedBankAccounts(accountId: string | undefined) {
  return useQuery({
    queryKey: ["linked-bank-accounts", accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("linked_bank_accounts")
        .select("*")
        .eq("account_id", accountId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LinkedBankAccount[];
    },
  });
}

export function useMonoConnect() {
  const [linking, setLinking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const openMonoWidget = useCallback(
    (accountId: string, onSuccess?: () => void) => {
      setLinking(true);

      const publicKey = import.meta.env.VITE_MONO_PUBLIC_KEY;
      if (!publicKey) {
        toast({
          title: "Configuration error",
          description: "Mono public key not configured",
          variant: "destructive",
        });
        setLinking(false);
        return;
      }

      try {
        const widget = new Connect({
          key: publicKey,
          scope: "auth",
          onSuccess: async (response: { code: string }) => {
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              const token = sessionData?.session?.access_token;

              const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
              const res = await fetch(
                `https://${projectId}.supabase.co/functions/v1/mono-exchange`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    code: response.code,
                    account_id: accountId,
                  }),
                }
              );

              const result = await res.json();

              if (!res.ok) {
                throw new Error(result.error || "Failed to link account");
              }

              toast({ title: "Bank account linked!", description: "Syncing transactions..." });
              qc.invalidateQueries({ queryKey: ["linked-bank-accounts", accountId] });
              qc.invalidateQueries({ queryKey: ["transactions", accountId] });
              onSuccess?.();
            } catch (err: any) {
              toast({
                title: "Linking failed",
                description: err.message,
                variant: "destructive",
              });
            } finally {
              setLinking(false);
            }
          },
          onClose: () => {
            setLinking(false);
          },
          onEvent: (eventName: string, data: any) => {
            console.log("Mono event:", eventName, data);
          },
        });

        widget.setup();
        widget.open();
      } catch (err: any) {
        console.error("Mono widget error:", err);
        toast({
          title: "Error",
          description: "Failed to load bank connection widget",
          variant: "destructive",
        });
        setLinking(false);
      }
    },
    [toast, qc]
  );

  const triggerSync = useCallback(
    async (monoAccountId: string, accountId: string, startDate?: string, endDate?: string) => {
      setSyncing(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

        const body: Record<string, string> = { mono_account_id: monoAccountId };
        if (startDate && endDate) {
          body.start_date = startDate;
          body.end_date = endDate;
        }

        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/mono-sync`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          }
        );

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Sync failed");
        }

        toast({
          title: "Sync complete",
          description: `${result.inserted} new transactions imported`,
        });

        qc.invalidateQueries({ queryKey: ["transactions", accountId] });
        qc.invalidateQueries({ queryKey: ["linked-bank-accounts", accountId] });
      } catch (err: any) {
        toast({
          title: "Sync failed",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setSyncing(false);
      }
    },
    [toast, qc]
  );

  const unlinkAccount = useCallback(
    async (linkedId: string, accountId: string) => {
      try {
        const { error } = await supabase
          .from("linked_bank_accounts")
          .delete()
          .eq("id", linkedId);
        if (error) throw error;
        toast({ title: "Bank account unlinked" });
        qc.invalidateQueries({ queryKey: ["linked-bank-accounts", accountId] });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      }
    },
    [toast, qc]
  );

  return { openMonoWidget, triggerSync, unlinkAccount, linking, syncing };
}

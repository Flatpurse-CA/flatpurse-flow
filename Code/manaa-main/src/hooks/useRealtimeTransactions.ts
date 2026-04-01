import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to realtime changes on:
 * - transactions → invalidates transaction lists, business summaries, account balances
 * - accounts     → invalidates account queries (balance changes)
 * - notifications → invalidates notification count and drawer
 */
export function useRealtimeTransactions() {
  const qc = useQueryClient();

  useEffect(() => {
    // ── Transactions ──────────────────────────────────────────────
    const txChannel = supabase
      .channel("realtime-transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          qc.invalidateQueries({ queryKey: ["transactions"] });
          qc.invalidateQueries({ queryKey: ["business-transactions"] });
          qc.invalidateQueries({ queryKey: ["all-transactions"] });
          qc.invalidateQueries({ queryKey: ["account-single"] });
          // Balances are derived from transactions, so invalidate accounts too
          qc.invalidateQueries({ queryKey: ["accounts"] });
        }
      )
      .subscribe();

    // ── Accounts (balance updates) ────────────────────────────────
    const accountsChannel = supabase
      .channel("realtime-accounts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts" },
        () => {
          qc.invalidateQueries({ queryKey: ["accounts"] });
          qc.invalidateQueries({ queryKey: ["account-single"] });
          qc.invalidateQueries({ queryKey: ["business-transactions"] });
        }
      )
      .subscribe();

    // ── Notifications ─────────────────────────────────────────────
    const notifChannel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    // ── Businesses ─────────────────────────────────────────────────
    const bizChannel = supabase
      .channel("realtime-businesses")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "businesses" },
        () => {
          qc.invalidateQueries({ queryKey: ["businesses"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(txChannel);
      supabase.removeChannel(accountsChannel);
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(bizChannel);
    };
  }, [qc]);
}

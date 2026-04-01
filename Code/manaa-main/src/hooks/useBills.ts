import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BillType = "one-time" | "recurring";

export interface RecurringBill {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  amount: number;
  category: string;
  due_day: number;
  due_date: string | null;
  bill_type: BillType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillPayment {
  id: string;
  bill_id: string;
  user_id: string;
  transaction_id: string | null;
  paid_at: string;
  amount: number;
  month: number;
  year: number;
}

export function useBills() {
  return useQuery({
    queryKey: ["recurring-bills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_bills")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as RecurringBill[];
    },
  });
}

export function useBillPayments(month: number, year: number) {
  return useQuery({
    queryKey: ["bill-payments", month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bill_payments")
        .select("*")
        .eq("month", month)
        .eq("year", year);
      if (error) throw error;
      return data as BillPayment[];
    },
  });
}

export function useCreateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: {
      account_id: string;
      name: string;
      amount: number;
      category: string;
      due_date?: string;
      bill_type: BillType;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("recurring_bills")
        .insert({ ...vals, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as RecurringBill;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-bills"] }),
  });
}

export function useDeleteBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_bills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-bills"] }),
  });
}

export function useMarkBillPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: {
      bill: RecurringBill;
      month: number;
      year: number;
      accountName: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get current balance for the bill's account
      const { data: acct } = await supabase
        .from("accounts")
        .select("initial_balance")
        .eq("id", vals.bill.account_id)
        .single();

      const { data: txs } = await supabase
        .from("transactions")
        .select("type, amount")
        .eq("account_id", vals.bill.account_id);
      
      const currentBalance = (acct?.initial_balance || 0) + (txs || []).reduce((acc, t) => {
        return t.type === "cash_in" ? acc + Number(t.amount) : acc - Number(t.amount);
      }, 0);

      const balanceAfter = currentBalance - vals.bill.amount;

      // Create the transaction
      const { data: tx, error: txErr } = await supabase
        .from("transactions")
        .insert({
          account_id: vals.bill.account_id,
          type: "cash_out",
          amount: vals.bill.amount,
          category: vals.bill.category,
          description: `Bill: ${vals.bill.name}`,
          transaction_date: new Date().toISOString().split("T")[0],
          balance_after: balanceAfter,
        })
        .select()
        .single();
      if (txErr) throw txErr;

      // Record the payment
      const { error: payErr } = await supabase
        .from("bill_payments")
        .insert({
          bill_id: vals.bill.id,
          user_id: user.id,
          transaction_id: tx.id,
          amount: vals.bill.amount,
          month: vals.month,
          year: vals.year,
        });
      if (payErr) throw payErr;

      return { tx, accountId: vals.bill.account_id };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["bill-payments"] });
      qc.invalidateQueries({ queryKey: ["bill-payments-all"] });
      qc.invalidateQueries({ queryKey: ["bill-payments-all-list"] });
      qc.invalidateQueries({ queryKey: ["recurring-bills"] });
      qc.invalidateQueries({ queryKey: ["transactions", result.accountId] });
      qc.invalidateQueries({ queryKey: ["business-transactions"] });
      qc.invalidateQueries({ queryKey: ["all-transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

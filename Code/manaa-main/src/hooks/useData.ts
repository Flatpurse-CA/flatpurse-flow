import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface Business {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  official_email?: string | null;
  currency?: string;
  tin?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
}

export interface Account {
  id: string;
  business_id: string;
  name: string;
  type: string;
  initial_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: "cash_in" | "cash_out";
  amount: number;
  category: string;
  description: string;
  customer_name: string;
  customer_detail: string;
  receipt_url: string | null;
  transaction_date: string;
  balance_after: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  created_at: string;
}

export interface InventoryItem {
  id: string;
  business_id: string;
  name: string;
  description: string;
  sku: string;
  unit_price: number;
  cost_price: number;
  quantity_in_stock: number;
  low_stock_threshold: number;
  supplier: string;
  category: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  status: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface Contact {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DealStage {
  id: string;
  business_id: string;
  name: string;
  position: number;
  color: string;
  created_at: string;
}

export interface Deal {
  id: string;
  business_id: string;
  contact_id: string | null;
  stage_id: string;
  title: string;
  value: number;
  description: string;
  expected_close_date: string | null;
  priority: string;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  business_id: string;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  business_id: string;
  deal_id: string | null;
  contact_id: string | null;
  title: string;
  description: string;
  due_date: string;
  is_completed: boolean;
  created_at: string;
}

// ==========================================
// BUSINESSES
// ==========================================
export function useBusinesses() {
  return useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Business[];
    },
  });
}

export function useCreateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: { name: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Enforce free-tier business limit
      const { count, error: countErr } = await supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (!countErr && count !== null) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan, status, current_period_end")
          .eq("user_id", user.id)
          .maybeSingle();
        const isPro = sub?.plan === "pro" && sub?.status === "active" &&
          (!sub?.current_period_end || new Date(sub.current_period_end) > new Date());
        if (!isPro && count >= 1) {
          throw new Error("Free plan allows 1 workspace. Upgrade to Pro for unlimited.");
        }
      }
      const { data, error } = await supabase
        .from("businesses")
        .insert({ name: vals.name, description: vals.description || "", user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Business;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["businesses"] }),
  });
}

export function useDeleteBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("businesses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["businesses"] }),
  });
}

// ==========================================
// ACCOUNTS
// ==========================================
export function useAccounts(businessId: string | undefined) {
  return useQuery({
    queryKey: ["accounts", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Account[];
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: { business_id: string; name: string; type?: string; initial_balance?: number; skipLimitCheck?: boolean }) => {
      // Enforce free-tier book limit
      if (!vals.skipLimitCheck) {
        const { count, error: countErr } = await supabase
          .from("accounts")
          .select("id", { count: "exact", head: true })
          .eq("business_id", vals.business_id);
        if (!countErr && count !== null) {
          // Check subscription
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: sub } = await supabase
              .from("subscriptions")
              .select("plan, status, current_period_end")
              .eq("user_id", user.id)
              .maybeSingle();
            const isPro = sub?.plan === "pro" && sub?.status === "active" &&
              (!sub?.current_period_end || new Date(sub.current_period_end) > new Date());
            if (!isPro && count >= 2) {
              throw new Error("Free plan allows up to 2 books per workspace. Upgrade to Pro for unlimited.");
            }
          }
        }
      }

      const { data, error } = await supabase
        .from("accounts")
        .insert({
          business_id: vals.business_id,
          name: vals.name,
          type: vals.type || "cash",
          initial_balance: vals.initial_balance || 0,
        })
        .select()
        .single();
      if (error) throw error;
      const account = data as Account;

      // Auto-create opening balance transaction if initial_balance > 0
      if (vals.initial_balance && vals.initial_balance > 0) {
        await supabase.from("transactions").insert({
          account_id: account.id,
          type: "cash_in",
          amount: vals.initial_balance,
          category: "Opening Balance",
          description: "Opening balance",
          transaction_date: new Date().toISOString().split("T")[0],
          balance_after: vals.initial_balance,
        });
      }

      return account;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["accounts", vars.business_id] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId, updates }: { id: string; businessId: string; updates: { name?: string; initial_balance?: number } }) => {
      const { error } = await supabase.from("accounts").update(updates).eq("id", id);
      if (error) throw error;

      // Sync the opening balance transaction when initial_balance changes
      if (updates.initial_balance !== undefined) {
        const newBal = updates.initial_balance;
        // Try to update existing opening balance transaction
        const { data: existing } = await supabase
          .from("transactions")
          .select("id")
          .eq("account_id", id)
          .eq("category", "Opening Balance")
          .maybeSingle();

        if (existing && newBal > 0) {
          await supabase.from("transactions").update({
            amount: newBal,
            balance_after: newBal,
          }).eq("id", existing.id);
        } else if (existing && newBal <= 0) {
          await supabase.from("transactions").delete().eq("id", existing.id);
        } else if (!existing && newBal > 0) {
          await supabase.from("transactions").insert({
            account_id: id,
            type: "cash_in",
            amount: newBal,
            category: "Opening Balance",
            description: "Opening balance",
            transaction_date: new Date().toISOString().split("T")[0],
            balance_after: newBal,
          });
        }
      }

      return businessId;
    },
    onSuccess: (businessId) => {
      qc.invalidateQueries({ queryKey: ["accounts", businessId] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["all-transactions"] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => qc.invalidateQueries({ queryKey: ["accounts", businessId] }),
  });
}

// ==========================================
// TRANSACTIONS
// ==========================================
export function useTransactions(accountId: string | undefined) {
  return useQuery({
    queryKey: ["transactions", accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("account_id", accountId!)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
  });
}

export function useAccountBalance(accountId: string | undefined) {
  const { data: transactions } = useTransactions(accountId);
  const { data: accounts } = useQuery({
    queryKey: ["account-single", accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("initial_balance")
        .eq("id", accountId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (!transactions) return undefined;
  return transactions.reduce((acc, t) => {
    return t.type === "cash_in" ? acc + Number(t.amount) : acc - Number(t.amount);
  }, 0);
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: {
      account_id: string;
      type: "cash_in" | "cash_out";
      amount: number;
      category: string;
      description?: string;
      customer_name?: string;
      customer_detail?: string;
      receipt_url?: string;
      transaction_date?: string;
      balance_after: number;
    }) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          account_id: vals.account_id,
          type: vals.type,
          amount: vals.amount,
          category: vals.category,
          description: vals.description || "",
          customer_name: vals.customer_name || "",
          customer_detail: vals.customer_detail || "",
          receipt_url: vals.receipt_url || null,
          transaction_date: vals.transaction_date || new Date().toISOString().split("T")[0],
          balance_after: vals.balance_after,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Transaction;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["transactions", vars.account_id] });
      qc.invalidateQueries({ queryKey: ["account-single", vars.account_id] });
      qc.invalidateQueries({ queryKey: ["business-transactions"] });
      qc.invalidateQueries({ queryKey: ["all-transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accountId, updates }: { id: string; accountId: string; updates: Partial<Pick<Transaction, 'category' | 'description' | 'customer_name' | 'customer_detail' | 'amount' | 'transaction_date'>> }) => {
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { data, accountId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["transactions", result.accountId] });
      qc.invalidateQueries({ queryKey: ["all-transactions"] });
      qc.invalidateQueries({ queryKey: ["business-transactions"] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accountId }: { id: string; accountId: string }) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      return accountId;
    },
    onSuccess: (accountId) => {
      qc.invalidateQueries({ queryKey: ["transactions", accountId] });
    },
  });
}

// ==========================================
// CATEGORIES
// ==========================================
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: { name: string; type: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("categories")
        .insert({ name: vals.name, type: vals.type, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

// File validation helpers
const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_RECEIPT_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "pdf"];
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

function validateReceiptFile(file: File, maxSizeMB = 10): void {
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, GIF, WebP images and PDFs are allowed.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_RECEIPT_EXTENSIONS.includes(ext)) {
    throw new Error("Invalid file extension. Only jpg, jpeg, png, gif, webp, and pdf files are allowed.");
  }
  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${maxSizeMB}MB.`);
  }
}

function validateImageFile(file: File, maxSizeMB = 5): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    throw new Error("Invalid file extension. Only jpg, jpeg, png, gif, and webp files are allowed.");
  }
  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${maxSizeMB}MB.`);
  }
}

// Receipt upload
export async function uploadReceipt(file: File, userId: string): Promise<string> {
  validateReceiptFile(file);
  const ext = file.name.split(".").pop()?.toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("receipts").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("receipts").getPublicUrl(path);
  return data.publicUrl;
}

// All transactions for a business (for reports)
export function useBusinessTransactions(businessId: string | undefined) {
  return useQuery({
    queryKey: ["business-transactions", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data: accounts, error: accError } = await supabase
        .from("accounts")
        .select("id, name")
        .eq("business_id", businessId!);
      if (accError) throw accError;
      if (!accounts?.length) return [];

      const accountIds = accounts.map((a) => a.id);
      // Fetch all transactions (paginate to avoid 1000-row default limit)
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data: page, error } = await supabase
          .from("transactions")
          .select("*")
          .in("account_id", accountIds)
          .order("transaction_date", { ascending: false })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!page?.length) break;
        allData = allData.concat(page);
        if (page.length < pageSize) break;
        from += pageSize;
      }

      return (allData as Transaction[]).map((t) => ({
        ...t,
        account_name: accounts.find((a) => a.id === t.account_id)?.name || "Unknown",
      }));
    },
  });
}

// All transactions across all businesses (for dashboard)
export function useAllTransactions() {
  const { data: businesses } = useBusinesses();
  return useQuery({
    queryKey: ["all-transactions", businesses?.map((b) => b.id)],
    enabled: !!businesses?.length,
    queryFn: async () => {
      const allAccounts: { id: string; name: string; business_id: string }[] = [];
      for (const biz of businesses!) {
        const { data } = await supabase
          .from("accounts")
          .select("id, name, business_id")
          .eq("business_id", biz.id);
        if (data) allAccounts.push(...data);
      }
      if (!allAccounts.length) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .in("account_id", allAccounts.map((a) => a.id))
        .order("transaction_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as Transaction[]).map((t) => ({
        ...t,
        account_name: allAccounts.find((a) => a.id === t.account_id)?.name || "Unknown",
        business_name: businesses!.find((b) => b.id === allAccounts.find((a) => a.id === t.account_id)?.business_id)?.name || "",
      }));
    },
  });
}

// ==========================================
// WAREHOUSES
// ==========================================
export interface Warehouse {
  id: string;
  business_id: string;
  name: string;
  address: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useWarehouses(businessId: string | undefined) {
  return useQuery({
    queryKey: ["warehouses", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("business_id", businessId!)
        .order("name");
      if (error) throw error;
      return data as Warehouse[];
    },
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: { business_id: string; name: string; address?: string; is_default?: boolean }) => {
      const { data, error } = await supabase.from("warehouses").insert(vals).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["warehouses", vars.business_id] }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...vals }: Partial<Warehouse> & { id: string }) => {
      const { data, error } = await supabase.from("warehouses").update(vals).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => qc.invalidateQueries({ queryKey: ["warehouses", data.business_id] }),
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from("warehouses").delete().eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => qc.invalidateQueries({ queryKey: ["warehouses", businessId] }),
  });
}

// ==========================================
// INVENTORY BATCHES
// ==========================================
export interface InventoryBatch {
  id: string;
  inventory_item_id: string;
  business_id: string;
  batch_number: string;
  quantity: number;
  cost_price: number;
  manufacture_date: string | null;
  expiry_date: string | null;
  notes: string;
  created_at: string;
}

export function useBatches(businessId: string | undefined) {
  return useQuery({
    queryKey: ["inventory-batches", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_batches")
        .select("*")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InventoryBatch[];
    },
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: Partial<InventoryBatch> & { business_id: string; inventory_item_id: string }) => {
      const { data, error } = await supabase.from("inventory_batches").insert(vals).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["inventory-batches", vars.business_id] }),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from("inventory_batches").delete().eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => qc.invalidateQueries({ queryKey: ["inventory-batches", businessId] }),
  });
}

// ==========================================
// PURCHASE ORDERS
// ==========================================
export interface PurchaseOrder {
  id: string;
  business_id: string;
  po_number: string;
  supplier_name: string;
  supplier_contact: string;
  warehouse_id: string | null;
  status: string;
  order_date: string;
  expected_date: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id: string | null;
  description: string;
  quantity: number;
  unit_cost: number;
  total: number;
  received_quantity: number;
  created_at: string;
}

export function usePurchaseOrders(businessId: string | undefined) {
  return useQuery({
    queryKey: ["purchase-orders", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: Partial<PurchaseOrder> & { business_id: string; po_number: string }) => {
      const { data, error } = await supabase.from("purchase_orders").insert(vals).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["purchase-orders", vars.business_id] }),
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...vals }: Partial<PurchaseOrder> & { id: string }) => {
      const { data, error } = await supabase.from("purchase_orders").update(vals).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => qc.invalidateQueries({ queryKey: ["purchase-orders", data.business_id] }),
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => qc.invalidateQueries({ queryKey: ["purchase-orders", businessId] }),
  });
}

export function usePurchaseOrderItems(poId: string | undefined) {
  return useQuery({
    queryKey: ["po-items", poId],
    enabled: !!poId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select("*")
        .eq("purchase_order_id", poId!);
      if (error) throw error;
      return data as PurchaseOrderItem[];
    },
  });
}

export function useCreatePOItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: Partial<PurchaseOrderItem> & { purchase_order_id: string }) => {
      const { data, error } = await supabase.from("purchase_order_items").insert(vals).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["po-items", vars.purchase_order_id] }),
  });
}

export function useDeletePOItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, poId }: { id: string; poId: string }) => {
      const { error } = await supabase.from("purchase_order_items").delete().eq("id", id);
      if (error) throw error;
      return poId;
    },
    onSuccess: (poId) => qc.invalidateQueries({ queryKey: ["po-items", poId] }),
  });
}

// ==========================================
// INVENTORY
// ==========================================
export function useInventory(businessId: string | undefined) {
  return useQuery({
    queryKey: ["inventory", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("business_id", businessId!)
        .order("name");
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: Partial<InventoryItem> & { business_id: string; name: string }) => {
      const { data, error } = await supabase
        .from("inventory_items")
        .insert(vals)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["inventory", vars.business_id] }),
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...vals }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("inventory_items")
        .update(vals)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["inventory", (data as any).business_id] }),
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from("inventory_items").delete().eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => qc.invalidateQueries({ queryKey: ["inventory", businessId] }),
  });
}

// ==========================================
// INVENTORY SALES
// ==========================================
export interface InventorySale {
  id: string;
  business_id: string;
  inventory_item_id: string;
  customer_name: string;
  customer_phone: string;
  quantity: number;
  unit_price: number;
  total: number;
  status: string; // paid | unpaid | escrow
  payment_method: string;
  notes: string;
  sale_date: string;
  created_at: string;
  updated_at: string;
}

export function useInventorySales(businessId: string | undefined) {
  return useQuery({
    queryKey: ["inventory-sales", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_sales")
        .select("*")
        .eq("business_id", businessId!)
        .order("sale_date", { ascending: false });
      if (error) throw error;
      return data as InventorySale[];
    },
  });
}

export function useCreateInventorySale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: Partial<InventorySale> & { business_id: string; inventory_item_id: string; quantity: number; unit_price: number; total: number }) => {
      const { data, error } = await supabase
        .from("inventory_sales")
        .insert(vals)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["inventory-sales", vars.business_id] });
      qc.invalidateQueries({ queryKey: ["inventory", vars.business_id] });
    },
  });
}

export function useUpdateInventorySale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...vals }: Partial<InventorySale> & { id: string }) => {
      const { data, error } = await supabase
        .from("inventory_sales")
        .update(vals)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["inventory-sales", data.business_id] });
      qc.invalidateQueries({ queryKey: ["inventory", data.business_id] });
    },
  });
}

export function useDeleteInventorySale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from("inventory_sales").delete().eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => {
      qc.invalidateQueries({ queryKey: ["inventory-sales", businessId] });
      qc.invalidateQueries({ queryKey: ["inventory", businessId] });
    },
  });
}

// ==========================================
// INVOICES
// ==========================================
export function useInvoices(businessId: string | undefined) {
  return useQuery({
    queryKey: ["invoices", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, ...vals }: Partial<Invoice> & { business_id: string; invoice_number: string; items?: { description: string; quantity: number; unit_price: number }[] }) => {
      // Enforce free-tier invoice limit (10/month)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan, status, current_period_end")
          .eq("user_id", user.id)
          .maybeSingle();
        const isPro = sub?.plan === "pro" && sub?.status === "active" &&
          (!sub?.current_period_end || new Date(sub.current_period_end) > new Date());
        if (!isPro) {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          const { count } = await supabase
            .from("invoices")
            .select("id", { count: "exact", head: true })
            .eq("business_id", vals.business_id)
            .gte("created_at", startOfMonth.toISOString());
          if (count !== null && count >= 10) {
            throw new Error("Free plan allows 10 invoices per month. Upgrade to Pro for unlimited, or wait until next month.");
          }
        }
      }

      const { data, error } = await supabase
        .from("invoices")
        .insert(vals)
        .select()
        .single();
      if (error) throw error;

      // Insert line items if provided
      if (items?.length && data) {
        const lineItems = items.map((item) => ({
          invoice_id: data.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
        }));
        const { error: itemsError } = await supabase.from("invoice_items").insert(lineItems);
        if (itemsError) throw itemsError;
      }

      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["invoices", vars.business_id] }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...vals }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update(vals)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["invoices", (data as any).business_id] }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => qc.invalidateQueries({ queryKey: ["invoices", businessId] }),
  });
}

export function useInvoiceItems(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoice-items", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId!)
        .order("created_at");
      if (error) throw error;
      return data as InvoiceItem[];
    },
  });
}

// ==========================================
// CRM - CONTACTS
// ==========================================
export function useContacts(businessId: string | undefined, status?: string) {
  return useQuery({
    queryKey: ["contacts", businessId, status],
    enabled: !!businessId,
    queryFn: async () => {
      let query = supabase
        .from("contacts")
        .select("*")
        .eq("business_id", businessId!)
        .order("name");
      if (status) {
        query = query.eq("status", status);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: Partial<Contact> & { business_id: string; name: string }) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert(vals)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["contacts", vars.business_id] }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...vals }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from("contacts")
        .update(vals)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["contacts", (data as any).business_id] }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => qc.invalidateQueries({ queryKey: ["contacts", businessId] }),
  });
}

// ==========================================
// CRM - DEAL STAGES
// ==========================================
export function useDealStages(businessId: string | undefined) {
  return useQuery({
    queryKey: ["deal-stages", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_stages")
        .select("*")
        .eq("business_id", businessId!)
        .order("position");
      if (error) throw error;
      return data as DealStage[];
    },
  });
}

export function useCreateDealStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: { business_id: string; name: string; position: number; color?: string }) => {
      const { data, error } = await supabase
        .from("deal_stages")
        .insert(vals)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["deal-stages", vars.business_id] }),
  });
}

export function useDeleteDealStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from("deal_stages").delete().eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => qc.invalidateQueries({ queryKey: ["deal-stages", businessId] }),
  });
}

export function useUpdateDealStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId, name, color, position }: { id: string; businessId: string; name?: string; color?: string; position?: number }) => {
      const updates: Record<string, any> = {};
      if (name !== undefined) updates.name = name;
      if (color !== undefined) updates.color = color;
      if (position !== undefined) updates.position = position;
      const { error } = await supabase.from("deal_stages").update(updates).eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => qc.invalidateQueries({ queryKey: ["deal-stages", businessId] }),
  });
}

// ==========================================
// CRM - DEALS
// ==========================================
export function useDeals(businessId: string | undefined) {
  return useQuery({
    queryKey: ["deals", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: Partial<Deal> & { business_id: string; stage_id: string; title: string }) => {
      const { data, error } = await supabase
        .from("deals")
        .insert(vals)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["deals", vars.business_id] }),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...vals }: Partial<Deal> & { id: string }) => {
      const { data, error } = await supabase
        .from("deals")
        .update(vals)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["deals", (data as any).business_id] }),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => qc.invalidateQueries({ queryKey: ["deals", businessId] }),
  });
}

// ==========================================
// CRM - DEAL ACTIVITIES
// ==========================================
export function useDealActivities(dealId: string | undefined) {
  return useQuery({
    queryKey: ["deal-activities", dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_activities")
        .select("*")
        .eq("deal_id", dealId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DealActivity[];
    },
  });
}

export function useCreateDealActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: { deal_id: string; business_id: string; type: string; title: string; description?: string }) => {
      const { data, error } = await supabase
        .from("deal_activities")
        .insert(vals as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["deal-activities", vars.deal_id] }),
  });
}

// ==========================================
// CRM - REMINDERS
// ==========================================
export function useReminders(businessId: string | undefined) {
  return useQuery({
    queryKey: ["reminders", businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("business_id", businessId!)
        .order("due_date");
      if (error) throw error;
      return data as Reminder[];
    },
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: Partial<Reminder> & { business_id: string; title: string; due_date: string }) => {
      const { data, error } = await supabase
        .from("reminders")
        .insert(vals)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["reminders", vars.business_id] }),
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...vals }: Partial<Reminder> & { id: string }) => {
      const { data, error } = await supabase
        .from("reminders")
        .update(vals)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["reminders", (data as any).business_id] }),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => qc.invalidateQueries({ queryKey: ["reminders", businessId] }),
  });
}

// ─── Notifications ──────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
  });
}

export function useUnreadNotificationCount() {
  const { data } = useNotifications();
  return data?.filter((n) => !n.is_read).length ?? 0;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true } as any)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ==========================================
// PROFILE
// ==========================================
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vals: { full_name?: string; position?: string; industry?: string; avatar_url?: string; use_mode?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update(vals as any)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  validateImageFile(file);
  const ext = file.name.split(".").pop()?.toLowerCase();
  const path = `${userId}/avatar.${ext}`;
  // Remove old avatar first
  await supabase.storage.from("avatars").remove([path]);
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl + "?t=" + Date.now(); // cache bust
}

import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLinkedBankAccounts, useMonoConnect } from "@/hooks/useMonoConnect";
import StatementImport from "@/components/StatementImport";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { printStatement as printStatementUtil } from "@/lib/print";
import {
  useTransactions, useCreateTransaction, useDeleteTransaction, useUpdateTransaction,
  useAccountBalance, useCategories, useAccounts,
} from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { uploadReceipt } from "@/hooks/useData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";
import {
  ArrowLeft, Plus, TrendingUp, TrendingDown, Trash2, Upload, Receipt,
  Search, Filter, Download, X, FileText, Printer, CheckSquare, Pencil, CalendarIcon,
  Landmark, RefreshCw, Unlink,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { parseISO } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/PageHeader";
import InlineCategorySelect from "@/components/InlineCategorySelect";
import TransactionSidebar from "@/components/TransactionSidebar";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { formatNaira } from "@/lib/currency";

export default function AccountDetailPage() {
  const { businessId, accountId } = useParams<{ businessId: string; accountId: string }>();
  const { user } = useAuth();
  const { data: accounts } = useAccounts(businessId);
  const { data: transactions, isLoading } = useTransactions(accountId);
  const { data: categories } = useCategories();
  const balance = useAccountBalance(accountId);
  const createTx = useCreateTransaction();
  const deleteTx = useDeleteTransaction();
  const updateTx = useUpdateTransaction();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [txType, setTxType] = useState<"cash_in" | "cash_out">("cash_in");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "cash_in" | "cash_out">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [sidebarTx, setSidebarTx] = useState<any>(null);

  // Sync date range dialog
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncFrom, setSyncFrom] = useState<Date | undefined>(undefined);
  const [syncTo, setSyncTo] = useState<Date | undefined>(new Date());

  // Mono bank linking
  const { data: linkedAccounts } = useLinkedBankAccounts(accountId);
  const { openMonoWidget, triggerSync, unlinkAccount, linking, syncing } = useMonoConnect();
  const linkedBank = linkedAccounts?.[0]; // Currently supporting one linked bank per account

  // Edit transaction state
  const [editTx, setEditTx] = useState<any>(null);
  const [editForm, setEditForm] = useState({ description: "", category: "", customer_name: "", customer_detail: "", amount: "" });
  const [editDate, setEditDate] = useState<Date>(new Date());

  const openEditTx = (tx: any) => {
    setEditTx(tx);
    setEditForm({
      description: tx.description || "",
      category: tx.category || "",
      customer_name: tx.customer_name || "",
      customer_detail: tx.customer_detail || "",
      amount: String(tx.amount || ""),
    });
    setEditDate(tx.transaction_date ? parseISO(tx.transaction_date) : new Date());
  };

  const handleEditSave = async () => {
    if (!editTx) return;
    const parsedAmount = parseFloat(editForm.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }
    try {
      await updateTx.mutateAsync({
        id: editTx.id,
        accountId: editTx.account_id,
        updates: {
          description: editForm.description,
          category: editForm.category,
          customer_name: editForm.customer_name,
          customer_detail: editForm.customer_detail,
          amount: parsedAmount,
          transaction_date: format(editDate, "yyyy-MM-dd"),
        },
      });
      toast({ title: "Transaction updated" });
      setEditTx(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const account = accounts?.find((a) => a.id === accountId);
  const cashIn = transactions?.filter((t) => t.type === "cash_in").reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const cashOut = transactions?.filter((t) => t.type === "cash_out").reduce((s, t) => s + Number(t.amount), 0) ?? 0;

  const filteredCategories = categories?.filter((c) =>
    txType === "cash_in" ? c.type === "income" : c.type === "expense"
  );

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((tx) => {
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          tx.category?.toLowerCase().includes(q) ||
          tx.description?.toLowerCase().includes(q) ||
          tx.customer_name?.toLowerCase().includes(q) ||
          String(tx.amount).includes(q);
        if (!match) return false;
      }
      if (dateFrom && tx.transaction_date < dateFrom) return false;
      if (dateTo && tx.transaction_date > dateTo) return false;
      return true;
    });
  }, [transactions, filterType, searchQuery, dateFrom, dateTo]);

  // Pagination
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const paginatedTransactions = useMemo(
    () => filteredTransactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredTransactions, currentPage]
  );

  // Reset page when filters change
  useMemo(() => { setCurrentPage(1); }, [filterType, searchQuery, dateFrom, dateTo]);

  const hasActiveFilters = filterType !== "all" || searchQuery || dateFrom || dateTo;

  const clearFilters = () => {
    setFilterType("all");
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
  };

  // Export to CSV
  const exportCSV = () => {
    if (!filteredTransactions.length) {
      toast({ title: "No transactions to export", variant: "destructive" });
      return;
    }
    const headers = ["Date", "Type", "Category", "Description", "Customer", "Amount", "Balance After"];
    const rows = filteredTransactions.map((tx) => [
      tx.transaction_date,
      tx.type === "cash_in" ? "Cash In" : "Cash Out",
      tx.category,
      tx.description || "",
      tx.customer_name || "",
      tx.type === "cash_in" ? String(tx.amount) : `-${tx.amount}`,
      String(tx.balance_after),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${account?.name || "transactions"}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported successfully" });
  };

  // Print statement
  const printStatement = () => {
    if (!filteredTransactions.length) {
      toast({ title: "No transactions to print", variant: "destructive" });
      return;
    }
    printStatementUtil({
      accountName: account?.name || "Book Statement",
      transactions: filteredTransactions,
      cashIn,
      cashOut,
      balance: balance ?? 0,
      isFiltered: !!hasActiveFilters,
    });
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    const form = new FormData(e.currentTarget);
    try {
      let receipt_url: string | undefined;
      if (receiptFile && user) {
        receipt_url = await uploadReceipt(receiptFile, user.id);
      }
      const amount = parseFloat(form.get("amount") as string);
      const currentBalance = balance ?? 0;
      const newBalance = txType === "cash_in" ? currentBalance + amount : currentBalance - amount;
      await createTx.mutateAsync({
        account_id: accountId!,
        type: txType,
        amount,
        category: form.get("category") as string,
        description: form.get("description") as string,
        customer_name: form.get("customer_name") as string,
        customer_detail: form.get("customer_detail") as string,
        receipt_url,
        transaction_date: form.get("date") as string,
        balance_after: newBalance,
      });
      setOpen(false);
      setReceiptFile(null);
      toast({ title: "Transaction recorded!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await deleteTx.mutateAsync({ id, accountId: accountId! });
      toast({ title: "Transaction deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((tx) => tx.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} transaction(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      for (const id of selectedIds) {
        await deleteTx.mutateAsync({ id, accountId: accountId! });
      }
      toast({ title: `${selectedIds.size} transactions deleted` });
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err: any) {
      toast({ title: "Error deleting", description: err.message, variant: "destructive" });
    } finally {
      setBulkDeleting(false);
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const txFormFields = (formId: string, useNativeSelect = false) => (
    <form id={formId} onSubmit={handleCreate} className="space-y-3 pb-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={txType === "cash_in" ? "default" : "outline"}
          size="sm"
          className={txType === "cash_in" ? "bg-cash-in hover:bg-cash-in/90 text-cash-in-foreground" : ""}
          onClick={() => setTxType("cash_in")}
        >
          <TrendingUp className="w-3.5 h-3.5 mr-1" /> Cash In
        </Button>
        <Button
          type="button"
          variant={txType === "cash_out" ? "default" : "outline"}
          size="sm"
          className={txType === "cash_out" ? "bg-cash-out hover:bg-cash-out/90 text-cash-out-foreground" : ""}
          onClick={() => setTxType("cash_out")}
        >
          <TrendingDown className="w-3.5 h-3.5 mr-1" /> Cash Out
        </Button>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Amount (₦)</Label>
        <Input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" className="h-9" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Category</Label>
        {useNativeSelect ? (
          <select
            name="category"
            required
            defaultValue=""
            className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="" disabled>Select category</option>
            {filteredCategories?.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        ) : (
          <Select name="category" required>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {filteredCategories?.map((c) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea name="description" placeholder="What was this for?" className="min-h-[50px]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Customer Name</Label>
          <Input name="customer_name" placeholder="Optional" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Phone / Detail</Label>
          <Input name="customer_detail" placeholder="08012345678" className="h-9" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Date</Label>
        <Input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="h-9" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Receipt (optional)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            className="text-xs h-9"
          />
          {receiptFile && <Upload className="w-4 h-4 text-foreground" />}
        </div>
      </div>
    </form>
  );

  const txForm = (
    <div className="space-y-3">
      {txFormFields("tx-form-dialog")}
      <div className="pt-2">
        <Button type="submit" form="tx-form-dialog" size="sm" className="w-full" disabled={createTx.isPending || uploading}>
          {uploading ? "Uploading..." : createTx.isPending ? "Saving..." : "Save Transaction"}
        </Button>
      </div>
    </div>
  );

  const recordButton = (
    <Button size="sm" onClick={() => setOpen(true)}>
      <Plus className="w-4 h-4 mr-1.5" /> Record
    </Button>
  );

  return (
    <div className="space-y-6 overflow-x-hidden">
      <PageHeader
        title={account?.name || "Book"}
        subtitle={account?.type?.replace("_", " ")}
      >
        <Link to={`/businesses/${businessId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
      </PageHeader>

      <div className="px-4 sm:px-6 space-y-4">

        {/* Finance Overview – Dark Card (matches Dashboard) */}
        <div className="rounded-2xl bg-foreground text-background dark:bg-accent-green dark:text-accent-green-foreground p-5 sm:p-6 overflow-visible">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-shrink">
              <p className="text-[10px] text-background/40 dark:text-accent-green-foreground/50 uppercase tracking-wider mb-1">Balance</p>
              <p className={`text-2xl sm:text-3xl font-bold tracking-tight truncate ${(balance ?? 0) >= 0 ? "text-[hsl(142,71%,55%)] dark:text-accent-green-foreground" : "text-[hsl(0,72%,60%)] dark:text-[hsl(0,80%,65%)]"}`}>
                {formatNaira(balance ?? 0)}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-5 shrink-0">
              <div className="text-right">
                <p className="text-[10px] text-background/40 dark:text-accent-green-foreground/50 uppercase tracking-wider mb-0.5">Cash In</p>
                <p className="text-[11px] sm:text-sm font-semibold text-[hsl(142,71%,55%)] dark:text-accent-green-foreground truncate max-w-[90px] sm:max-w-none">{formatNaira(cashIn)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-background/40 dark:text-accent-green-foreground/50 uppercase tracking-wider mb-0.5">Cash Out</p>
                <p className="text-[11px] sm:text-sm font-semibold text-[hsl(0,72%,60%)] dark:text-[hsl(0,100%,75%)] truncate max-w-[90px] sm:max-w-none">{formatNaira(cashOut)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 -mx-5 sm:-mx-6 border-t border-background/10 dark:border-accent-green-foreground/15" />

          <div className="pt-4 space-y-3">
            {/* Primary action buttons – equal width on mobile */}
            <div className="flex items-center gap-2">
              <Button
                className="h-9 flex-1 min-w-0 px-2 sm:px-4 text-xs rounded-xl bg-[hsl(142,71%,85%)] hover:bg-[hsl(142,71%,78%)] text-[hsl(142,71%,25%)] dark:bg-accent-green-foreground/90 dark:hover:bg-accent-green-foreground dark:text-accent-green border-0 font-semibold"
                onClick={() => { setTxType("cash_in"); setOpen(true); }}
              >
                <TrendingUp className="w-4 h-4 mr-1 shrink-0" /> Cash In
              </Button>
              <Button
                className="h-9 flex-1 min-w-0 px-2 sm:px-4 text-xs rounded-xl bg-[hsl(0,72%,90%)] hover:bg-[hsl(0,72%,83%)] text-[hsl(0,72%,35%)] dark:bg-[hsl(0,75%,55%)] dark:hover:bg-[hsl(0,75%,48%)] dark:text-white border-0 font-semibold"
                onClick={() => { setTxType("cash_out"); setOpen(true); }}
              >
                <TrendingDown className="w-4 h-4 mr-1 shrink-0" /> Cash Out
              </Button>
              {/* Link Bank button hidden */}
            </div>
            {/* Secondary icon actions */}
            <div className="flex items-center justify-end gap-1">
              {linkedBank && (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-background/50 hover:text-background hover:bg-background/10 dark:text-accent-green-foreground/50 dark:hover:text-accent-green-foreground dark:hover:bg-accent-green-foreground/10" onClick={() => setSyncDialogOpen(true)} disabled={syncing} title="Sync Transactions">
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => unlinkAccount(linkedBank.id, accountId!)} title="Unlink Bank">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-background/50 hover:text-background hover:bg-background/10 dark:text-accent-green-foreground/50 dark:hover:text-accent-green-foreground dark:hover:bg-accent-green-foreground/10" onClick={() => setImportOpen(true)} title="Import Statement">
                <Upload className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-background/50 hover:text-background hover:bg-background/10 dark:text-accent-green-foreground/50 dark:hover:text-accent-green-foreground dark:hover:bg-accent-green-foreground/10" onClick={exportCSV} title="Export CSV">
                <Download className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-background/50 hover:text-background hover:bg-background/10 dark:text-accent-green-foreground/50 dark:hover:text-accent-green-foreground dark:hover:bg-accent-green-foreground/10" onClick={printStatement} title="Print Statement">
                <Printer className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
        {/* Search & Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <Button
              variant={selectMode ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={showFilters ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3.5 h-3.5" />
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border/50">
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Types</SelectItem>
                  <SelectItem value="cash_in" className="text-xs">Cash In</SelectItem>
                  <SelectItem value="cash_out" className="text-xs">Cash Out</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-7 w-[130px] text-xs"
                placeholder="From"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-7 w-[130px] text-xs"
                placeholder="To"
              />
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={clearFilters}>
                  <X className="w-3 h-3 mr-1" /> Clear
                </Button>
              )}
            </div>
          )}

          {hasActiveFilters && (
            <p className="text-[11px] text-muted-foreground">
              Showing {filteredTransactions.length} of {transactions?.length || 0} transactions
            </p>
          )}
        </div>

        {/* Transactions list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
          </div>
        ) : !transactions?.length ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium text-sm mb-1">No transactions yet</p>
            <p className="text-muted-foreground text-xs mb-5 max-w-[240px] mx-auto">
              Start recording your cash in and cash out to track this book's activity
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                className="bg-cash-in hover:bg-cash-in/90 text-cash-in-foreground h-8 text-xs"
                onClick={() => { setTxType("cash_in"); setOpen(true); }}
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Cash In
              </Button>
              <Button
                size="sm"
                className="bg-cash-out hover:bg-cash-out/90 text-cash-out-foreground h-8 text-xs"
                onClick={() => { setTxType("cash_out"); setOpen(true); }}
              >
                <TrendingDown className="w-3.5 h-3.5 mr-1" /> Cash Out
              </Button>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No transactions match your filters</p>
            <Button variant="link" size="sm" className="text-xs mt-1" onClick={clearFilters}>Clear filters</Button>
          </div>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                {/* Select all header row */}
                {selectMode && (
                  <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-secondary/30">
                    <Checkbox
                      checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="shrink-0"
                    />
                    <span className="text-xs text-muted-foreground flex-1">
                      {selectedIds.size === filteredTransactions.length ? "All selected" : `${selectedIds.size} selected`}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={exitSelectMode}>
                      Cancel
                    </Button>
                  </div>
                )}
                <div className="divide-y divide-border">
                  {paginatedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className={`flex items-center justify-between px-4 py-3 group cursor-pointer hover:bg-secondary/30 transition-colors ${selectMode && selectedIds.has(tx.id) ? "bg-primary/5" : ""}`}
                      onClick={() => {
                        if (selectMode) { toggleSelect(tx.id); return; }
                        if (isMobile) navigate(`/transaction/${tx.id}`);
                        else setSidebarTx(tx);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {selectMode ? (
                          <Checkbox
                            checked={selectedIds.has(tx.id)}
                            onCheckedChange={() => toggleSelect(tx.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0"
                          />
                        ) : (
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.type === "cash_in" ? "bg-cash-in" : "bg-cash-out"}`} />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <InlineCategorySelect
                              value={tx.category}
                              txType={tx.type as "cash_in" | "cash_out"}
                              categories={categories || []}
                              onSave={async (newCategory) => {
                                await updateTx.mutateAsync({
                                  id: tx.id,
                                  accountId: tx.account_id,
                                  updates: { category: newCategory },
                                });
                              }}
                              className="truncate"
                            />
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                              {tx.type === "cash_in" ? "In" : "Out"}
                            </Badge>
                            {(tx as any).mono_tx_id && (
                              <span title="Synced from bank"><Landmark className="w-3 h-3 text-muted-foreground shrink-0" /></span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {tx.description}{tx.customer_name ? ` · ${tx.customer_name}` : ""} · {format(new Date(tx.transaction_date), "dd MMM yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className={`text-sm font-medium tabular-nums ${tx.type === "cash_in" ? "text-cash-in" : "text-cash-out"}`}>
                            {tx.type === "cash_in" ? "+" : "-"}{formatNaira(Number(tx.amount))}
                          </p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">Bal: {formatNaira(Number(tx.balance_after))}</p>
                        </div>
                        {!selectMode && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Edit transaction"
                              onClick={(e) => { e.stopPropagation(); openEditTx(tx); }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            {tx.receipt_url && (
                              <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Receipt className="w-3 h-3" /></Button>
                              </a>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-1 pt-2">
                <p className="text-xs text-muted-foreground">
                  {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} · Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Sticky bulk delete bar */}
        {selectMode && selectedIds.size > 0 && (
          <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-destructive text-destructive-foreground px-4 py-3 shadow-lg">
              <span className="text-sm font-medium">{selectedIds.size} transaction{selectedIds.size > 1 ? "s" : ""}</span>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs font-semibold"
                disabled={bulkDeleting}
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {bulkDeleting ? "Deleting..." : "Delete All"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Record Transaction Modal/Drawer */}
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen} direction="bottom" shouldScaleBackground={false}>
          <DrawerContent className="flex flex-col" style={{ maxHeight: "calc(92dvh - 56px)", marginBottom: "56px" }}>
            <DrawerHeader className="pb-2 pt-2 shrink-0">
              <DrawerTitle className="text-[15px]">Record Transaction</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto overscroll-contain flex-1 min-h-0">
              {txFormFields("tx-form-mobile", true)}
            </div>
            <div className="px-4 pt-3 pb-4 shrink-0 border-t border-border bg-background">
              <Button type="submit" form="tx-form-mobile" size="sm" className="w-full" disabled={createTx.isPending || uploading}>
                {uploading ? "Uploading..." : createTx.isPending ? "Saving..." : "Save Transaction"}
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Transaction</DialogTitle>
            </DialogHeader>
            {txForm}
          </DialogContent>
        </Dialog>
      )}

      {/* Statement Import */}
      <ErrorBoundary fallbackMessage="Something went wrong with the import. Please try again.">
        <StatementImport accountId={accountId!} open={importOpen} onOpenChange={setImportOpen} />
      </ErrorBoundary>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editTx} onOpenChange={(open) => !open && setEditTx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              {isMobile ? (
                <Input
                  type="date"
                  className="h-9 text-sm"
                  value={format(editDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    const d = new Date(e.target.value + "T00:00:00");
                    if (!isNaN(d.getTime())) setEditDate(d);
                  }}
                />
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className={cn("w-full h-9 justify-start text-left text-sm font-normal")}>
                      <CalendarIcon className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      {format(editDate, "dd MMM yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[200]" align="start">
                    <Calendar mode="single" selected={editDate} onSelect={(d) => d && setEditDate(d)} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                <Input className="h-9 text-sm pl-7" type="number" min="0" step="0.01" value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input className="h-9 text-sm" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} placeholder="Transaction description" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="z-[300]">
                  {categories
                    ?.filter((c) => editTx?.type === "cash_in" ? c.type === "income" : c.type === "expense")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Customer Name</Label>
              <Input className="h-9 text-sm" value={editForm.customer_name} onChange={(e) => setEditForm((f) => ({ ...f, customer_name: e.target.value }))} placeholder="Customer name (optional)" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Customer Detail</Label>
              <Textarea className="text-sm resize-none" rows={2} value={editForm.customer_detail} onChange={(e) => setEditForm((f) => ({ ...f, customer_detail: e.target.value }))} placeholder="Additional detail (optional)" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditTx(null)}>Cancel</Button>
            <Button size="sm" className="text-xs" onClick={handleEditSave} disabled={updateTx.isPending}>
              {updateTx.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Sidebar (Desktop) */}
      <TransactionSidebar
        tx={sidebarTx}
        open={!!sidebarTx}
        onClose={() => setSidebarTx(null)}
        categories={categories || []}
        onUpdate={async (id, accountId, updates) => {
          await updateTx.mutateAsync({ id, accountId, updates });
        }}
        onDelete={async (id, accountId) => {
          await deleteTx.mutateAsync({ id, accountId });
        }}
      />

      {/* Sync Date Range Dialog */}
      {linkedBank && (
        <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sync Transactions</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <Input type="date" value={syncFrom ? syncFrom.toISOString().split("T")[0] : ""} onChange={e => setSyncFrom(e.target.value ? new Date(e.target.value) : undefined)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <Input type="date" value={syncTo ? syncTo.toISOString().split("T")[0] : ""} onChange={e => setSyncTo(e.target.value ? new Date(e.target.value) : undefined)} />
                </div>
              </div>
              <Button className="w-full" disabled={syncing} onClick={() => {
                triggerSync(
                  linkedBank.mono_account_id,
                  accountId!,
                  syncFrom?.toISOString().split("T")[0],
                  syncTo?.toISOString().split("T")[0]
                );
                setSyncDialogOpen(false);
              }}>
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

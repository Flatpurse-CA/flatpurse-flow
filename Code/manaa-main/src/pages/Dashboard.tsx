
import { useState, useEffect } from "react";
import { useBusinesses, useBusinessTransactions, useUpdateTransaction, useCategories } from "@/hooks/useData";
import { Card } from "@/components/ui/card";
import { printReceipt as printReceiptUtil } from "@/lib/print";
import {
  Building2, Plus, ArrowDownLeft, ArrowUpRight,
  BarChart3, FileText, Users, Zap, ExternalLink, Printer,
  Receipt, Filter, Download, X, Briefcase, HelpCircle, Pencil, CalendarIcon,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import InlineCategorySelect from "@/components/InlineCategorySelect";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";
import { formatNaira } from "@/lib/currency";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import CashModal from "@/components/CashModal";
import GuidedTour, { type TourStep } from "@/components/GuidedTour";


interface DashboardProps {
  selectedBusinessId?: string | null;
}

export default function Dashboard({ selectedBusinessId }: DashboardProps) {
  const { data: businesses, isLoading } = useBusinesses();
  const { data: recentTxs } = useBusinessTransactions(selectedBusinessId || undefined);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const updateTx = useUpdateTransaction();
  const { data: editCategories } = useCategories();

  // Cash In/Out modal state
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashModalType, setCashModalType] = useState<"cash_in" | "cash_out">("cash_in");

  // Filter state
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);

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

  // Auto-show tour on first desktop visit
  useEffect(() => {
    if (!isMobile && !localStorage.getItem("manaa_tour_seen") && businesses?.length) {
      const timer = setTimeout(() => setShowTour(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isMobile, businesses]);

  const tourSteps: TourStep[] = [
    { target: "finance-card", title: "Financial Summary", description: "See your net balance, total income and expenses at a glance. This updates in real-time as you record transactions." },
    { target: "cash-in-btn", title: "Record Cash In", description: "Tap here to record money coming into your business — sales, payments received, or any income." },
    { target: "cash-out-btn", title: "Record Cash Out", description: "Use this to log expenses, purchases, or any money going out of your business." },
    { target: "quick-actions", title: "Quick Actions", description: "Quickly navigate to manage your workspaces, view reports, create invoices, or access CRM." },
    { target: "transactions-section", title: "Recent Transactions", description: "All your recent transactions appear here. Filter, export as CSV, or print receipts for any entry." },
  ];

  const openCashModal = (type: "cash_in" | "cash_out") => {
    setCashModalType(type);
    setCashModalOpen(true);
  };

  // Print receipt for a single transaction
  const printReceipt = (tx: any) => printReceiptUtil(tx);

  // Export transactions as CSV
  const exportCSV = () => {
    if (!filteredTxs?.length) return;
    const headers = ["Date", "Description", "Category", "Type", "Amount", "Balance After", "Business", "Book", "Customer"];
    const rows = filteredTxs.map((tx: any) => [
      tx.transaction_date,
      tx.description || "",
      tx.category,
      tx.type === "cash_in" ? "Cash In" : "Cash Out",
      tx.amount,
      tx.balance_after,
      tx.business_name || "",
      tx.account_name || "",
      tx.customer_name || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported successfully" });
  };

  // Filtered transactions
  const filteredTxs = recentTxs?.filter((tx: any) => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterCategory !== "all" && tx.category !== filterCategory) return false;
    if (filterDateFrom && tx.transaction_date < filterDateFrom) return false;
    if (filterDateTo && tx.transaction_date > filterDateTo) return false;
    return true;
  });

  const allCategories = [...new Set(recentTxs?.map((tx: any) => tx.category) || [])];
  const hasActiveFilters = filterType !== "all" || filterCategory !== "all" || filterDateFrom || filterDateTo;

  const clearFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-36 bg-muted animate-pulse rounded-xl" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!businesses?.length) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to Manaa</h2>
          <p className="text-muted-foreground text-sm mb-6">Create your first workspace to start tracking finances.</p>
          <Link to="/businesses">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> Create a Workspace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalIn = recentTxs?.filter((t) => t.type === "cash_in").reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const totalOut = recentTxs?.filter((t) => t.type === "cash_out").reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const net = totalIn - totalOut;

  return (
    <div className="space-y-0 overflow-x-hidden w-full max-w-full">
      {/* Desktop only page header */}
      <div className="hidden sm:block">
        <PageHeader title="Dashboard" subtitle={`Overview across ${businesses.length} workspace${businesses.length > 1 ? "s" : ""}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button data-tour="quick-actions" size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Quick Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => navigate("/businesses")}>
                <Building2 className="w-3.5 h-3.5" /> Workspaces
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => navigate("/reporting")}>
                <BarChart3 className="w-3.5 h-3.5" /> Reports
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => navigate("/invoicing")}>
                <FileText className="w-3.5 h-3.5" /> Invoices
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => navigate("/crm")}>
                <Users className="w-3.5 h-3.5" /> CRM
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PageHeader>
      </div>

      <div className="px-4 sm:px-6 py-6 space-y-8 w-full max-w-full overflow-hidden">

        {/* Finance Overview – Dark Card */}
        <div data-tour="finance-card" className="rounded-2xl bg-foreground text-background dark:bg-accent-green dark:text-accent-green-foreground p-5 sm:p-8">
          <p className="hidden sm:block text-[11px] text-background/40 dark:text-accent-green-foreground/50 uppercase tracking-widest font-medium mb-4">Financial Summary</p>

          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-shrink">
              <p className="text-[10px] text-background/40 dark:text-accent-green-foreground/50 uppercase tracking-wider mb-1">Net Balance</p>
              <p className={`text-xl sm:text-4xl font-bold tracking-tight truncate ${net >= 0 ? "text-[hsl(142,71%,55%)] dark:text-accent-green-foreground" : "text-[hsl(0,72%,60%)] dark:text-[hsl(0,80%,65%)]"}`}>
                {formatNaira(net)}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-5 shrink-0">
              <div className="text-right">
                <p className="text-[10px] text-background/40 dark:text-accent-green-foreground/50 uppercase tracking-wider mb-0.5">Income</p>
                <p className="text-[11px] sm:text-sm font-semibold text-[hsl(142,71%,55%)] dark:text-accent-green-foreground truncate max-w-[90px] sm:max-w-none">{formatNaira(totalIn)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-background/40 dark:text-accent-green-foreground/50 uppercase tracking-wider mb-0.5">Expenses</p>
                <p className="text-[11px] sm:text-sm font-semibold text-[hsl(0,72%,60%)] dark:text-[hsl(0,100%,75%)] truncate max-w-[90px] sm:max-w-none">{formatNaira(totalOut)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 -mx-5 sm:-mx-8 border-t border-background/10 dark:border-accent-green-foreground/15" />
          <div className="pt-5 flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none min-w-0">
              <Button
                data-tour="cash-in-btn"
                className="h-9 sm:h-10 flex-1 sm:flex-none min-w-0 px-3 sm:px-5 text-xs sm:text-sm rounded-xl bg-[hsl(142,71%,85%)] hover:bg-[hsl(142,71%,78%)] text-[hsl(142,71%,25%)] dark:bg-accent-green-foreground/90 dark:hover:bg-accent-green-foreground dark:text-accent-green border-0 font-semibold"
                onClick={() => openCashModal("cash_in")}
              >
                <ArrowDownLeft className="w-4 h-4 mr-1 shrink-0" /> Cash In
              </Button>
              <Button
                data-tour="cash-out-btn"
                className="h-9 sm:h-10 flex-1 sm:flex-none min-w-0 px-3 sm:px-5 text-xs sm:text-sm rounded-xl bg-[hsl(0,72%,90%)] hover:bg-[hsl(0,72%,83%)] text-[hsl(0,72%,35%)] dark:bg-[hsl(0,75%,55%)] dark:hover:bg-[hsl(0,75%,48%)] dark:text-white border-0 font-semibold"
                onClick={() => openCashModal("cash_out")}
              >
                <ArrowUpRight className="w-4 h-4 mr-1 shrink-0" /> Cash Out
              </Button>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-right">
              <div>
                <p className="text-[10px] text-background/40 dark:text-accent-green-foreground/50 uppercase tracking-wider">Transactions</p>
                <p className="text-sm font-semibold text-background dark:text-accent-green-foreground">{recentTxs?.length ?? 0} <span className="text-[10px] font-normal text-background/40 dark:text-accent-green-foreground/50">this period</span></p>
              </div>
              <div className="w-px h-8 bg-background/10 dark:bg-accent-green-foreground/15" />
              <div>
                <p className="text-[10px] text-background/40 dark:text-accent-green-foreground/50 uppercase tracking-wider">Today</p>
                <p className="text-sm font-semibold text-background dark:text-accent-green-foreground">
                  {recentTxs?.filter((t) => t.transaction_date === new Date().toISOString().split("T")[0]).length ?? 0} <span className="text-[10px] font-normal text-background/40 dark:text-accent-green-foreground/50">entries</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Quick Actions */}
        {isMobile && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Workspaces", icon: Briefcase, path: "/businesses" },
              { label: "Reports", icon: BarChart3, path: "/reporting" },
              { label: "Invoices", icon: FileText, path: "/invoicing" },
              { label: "Guide", icon: HelpCircle, path: null },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => item.path ? navigate(item.path) : setShowTour(true)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-lg bg-secondary/60 text-foreground active:scale-95 transition-transform"
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[9px] font-medium text-muted-foreground">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Recent Transactions Table */}
        {recentTxs && recentTxs.length > 0 && (
          <div data-tour="transactions-section">
            {/* Header: title left, controls right */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Transactions
                </h2>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                    Filtered
                    <button onClick={clearFilters} className="ml-1 hover:text-foreground">
                      <X className="w-2.5 h-2.5 inline" />
                    </button>
                  </Badge>
                )}
              </div>

              {/* Right: filter + export + report */}
              <div className="flex items-center gap-1.5">
                {isMobile ? (
                  <>
                    <Button variant={hasActiveFilters ? "default" : "outline"} size="sm" className="h-7 w-7 p-0" onClick={() => setFilterOpen(true)}>
                      <Filter className="w-3 h-3" />
                    </Button>
                    <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
                      <DrawerContent>
                        <DrawerHeader className="pb-2">
                          <DrawerTitle className="text-xs font-semibold uppercase tracking-wider">Filter Transactions</DrawerTitle>
                        </DrawerHeader>
                        <div className="px-4 pb-6 space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-[11px]">Type</Label>
                            <Select value={filterType} onValueChange={setFilterType}>
                              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                                <SelectItem value="cash_in" className="text-xs">Cash In</SelectItem>
                                <SelectItem value="cash_out" className="text-xs">Cash Out</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px]">Category</Label>
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                                {allCategories.map((c) => (
                                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-[11px]">From</Label>
                              <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[11px]">To</Label>
                              <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-9 text-xs" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <Button size="sm" variant="outline" className="h-9 text-xs flex-1" onClick={clearFilters}>Clear</Button>
                            <Button size="sm" className="h-9 text-xs flex-1" onClick={() => setFilterOpen(false)}>Apply</Button>
                          </div>
                        </div>
                      </DrawerContent>
                    </Drawer>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={exportCSV} title="Export">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigate("/reporting")} title="Reports">
                      <BarChart3 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                      <PopoverTrigger asChild>
                        <Button variant={hasActiveFilters ? "default" : "outline"} size="sm" className="h-7 text-[11px] gap-1.5">
                          <Filter className="w-3 h-3" /> Filter
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-72 p-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter Transactions</p>
                        <div className="space-y-1.5">
                          <Label className="text-[11px]">Type</Label>
                          <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all" className="text-xs">All Types</SelectItem>
                              <SelectItem value="cash_in" className="text-xs">Cash In</SelectItem>
                              <SelectItem value="cash_out" className="text-xs">Cash Out</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px]">Category</Label>
                          <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                              {allCategories.map((c) => (
                                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label className="text-[11px]">From</Label>
                            <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-8 text-xs" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px]">To</Label>
                            <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-8 text-xs" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1" onClick={clearFilters}>Clear</Button>
                          <Button size="sm" className="h-7 text-[11px] flex-1" onClick={() => setFilterOpen(false)}>Apply</Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={exportCSV}>
                      <Download className="w-3 h-3" /> Export
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={() => navigate("/reporting")}>
                      <BarChart3 className="w-3 h-3" /> Report
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile: Clickable transaction list */}
            <div className="sm:hidden space-y-1 w-full min-w-0 pb-4">
              {(filteredTxs || []).map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg border border-border/40 w-full min-w-0"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
                      tx.type === "cash_in" ? "bg-cash-in/10 text-cash-in" : "bg-cash-out/10 text-cash-out"
                    }`}
                    onClick={() => navigate(`/transaction/${tx.id}`)}
                  >
                    {tx.type === "cash_in" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/transaction/${tx.id}`)}>
                    <p className="text-[13px] font-medium truncate">
                      {tx.description || tx.customer_name || tx.category}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      <span onClick={(e) => e.stopPropagation()} className="inline-flex">
                        <InlineCategorySelect
                          value={tx.category}
                          txType={tx.type as "cash_in" | "cash_out"}
                          categories={editCategories || []}
                          onSave={async (newCategory) => {
                            await updateTx.mutateAsync({
                              id: tx.id,
                              accountId: tx.account_id,
                              updates: { category: newCategory },
                            });
                          }}
                          className="text-[10px] text-muted-foreground font-normal"
                        />
                      </span>
                      {" · "}{format(new Date(tx.transaction_date), "dd MMM")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <p className={`text-[13px] font-semibold tabular-nums whitespace-nowrap ${tx.type === "cash_in" ? "text-cash-in" : "text-cash-out"}`}>
                      {tx.type === "cash_in" ? "+" : "−"}{formatNaira(Number(tx.amount))}
                    </p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditTx(tx)} title="Edit">
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredTxs && filteredTxs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No transactions match filters.
                </div>
              )}
            </div>

            {/* Desktop: Table */}
            <Card className="border-border/60 overflow-hidden hidden sm:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/60">
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider h-9">Date</TableHead>
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider h-9">Description</TableHead>
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider h-9">Category</TableHead>
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider h-9">Type</TableHead>
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider h-9 text-right">Amount</TableHead>
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider h-9 text-right">Balance</TableHead>
                      <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider h-9 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredTxs || []).slice(0, 15).map((tx: any) => {
                      const business = businesses.find((b) => b.name === tx.business_name);
                      return (
                        <TableRow key={tx.id} className="border-border/40 hover:bg-secondary/30">
                          <TableCell className="text-[12px] text-muted-foreground py-2.5 whitespace-nowrap">
                            {format(new Date(tx.transaction_date), "dd MMM yy")}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium truncate max-w-[180px]">
                                {tx.description || tx.customer_name || tx.category}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">{tx.business_name} · {tx.account_name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <InlineCategorySelect
                              value={tx.category}
                              txType={tx.type as "cash_in" | "cash_out"}
                              categories={editCategories || []}
                              onSave={async (newCategory) => {
                                await updateTx.mutateAsync({
                                  id: tx.id,
                                  accountId: tx.account_id,
                                  updates: { category: newCategory },
                                });
                              }}
                              className="text-[11px] text-muted-foreground font-normal"
                            />
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 font-medium border ${
                                tx.type === "cash_in"
                                  ? "text-cash-in border-cash-in/30 bg-cash-in/5"
                                  : "text-cash-out border-cash-out/30 bg-cash-out/5"
                              }`}
                            >
                              {tx.type === "cash_in" ? "In" : "Out"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            <span className={`text-[13px] font-semibold tabular-nums ${tx.type === "cash_in" ? "text-cash-in" : "text-cash-out"}`}>
                              {tx.type === "cash_in" ? "+" : "−"}{formatNaira(Number(tx.amount))}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            <span className="text-[12px] tabular-nums text-muted-foreground">
                              {formatNaira(Number(tx.balance_after))}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Edit transaction"
                                onClick={() => openEditTx(tx)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              {business && (
                                <Link to={`/businesses/${business.id}/accounts/${tx.account_id}`}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="View book">
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </Link>
                              )}
                              {tx.receipt_url ? (
                                <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="View receipt">
                                    <Receipt className="w-3 h-3" />
                                  </Button>
                                </a>
                              ) : (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/30" title="No receipt" disabled>
                                  <Receipt className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Print receipt"
                                onClick={() => printReceipt(tx)}
                              >
                                <Printer className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {filteredTxs && filteredTxs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No transactions match the current filters.
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editTx} onOpenChange={(open) => !open && setEditTx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full h-9 justify-start text-left text-sm font-normal")}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    {format(editDate, "dd MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[200]" align="start">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={(d) => d && setEditDate(d)}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                <Input
                  className="h-9 text-sm pl-7"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                className="h-9 text-sm"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Transaction description"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="z-[300]">
                  {editCategories
                    ?.filter((c) => editTx?.type === "cash_in" ? c.type === "income" : c.type === "expense")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Customer Name</Label>
              <Input
                className="h-9 text-sm"
                value={editForm.customer_name}
                onChange={(e) => setEditForm((f) => ({ ...f, customer_name: e.target.value }))}
                placeholder="Customer name (optional)"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Customer Detail</Label>
              <Textarea
                className="text-sm resize-none"
                rows={2}
                value={editForm.customer_detail}
                onChange={(e) => setEditForm((f) => ({ ...f, customer_detail: e.target.value }))}
                placeholder="Additional detail (optional)"
              />
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

      {/* Cash In/Out Modal */}
      <CashModal open={cashModalOpen} onOpenChange={setCashModalOpen} defaultType={cashModalType} selectedBusinessId={selectedBusinessId} />

      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        open={showTour}
        onClose={() => setShowTour(false)}
      />
    </div>
  );
}


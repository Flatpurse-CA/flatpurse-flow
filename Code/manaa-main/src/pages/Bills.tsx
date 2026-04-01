import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useBills, useCreateBill } from "@/hooks/useBills";
import type { BillPayment, BillType } from "@/hooks/useBills";
import { useAccounts, useCategories } from "@/hooks/useData";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { formatNaira } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Plus, Receipt, BookOpen, Tag, CalendarIcon, ChevronRight, ChevronLeft, Repeat, CircleDot, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function BillsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Month navigation
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1); // 1-based
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const goToPrevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToCurrentMonth = () => { setViewMonth(now.getMonth() + 1); setViewYear(now.getFullYear()); };
  const isCurrentMonth = viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const { data: bills, isLoading } = useBills();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts(businessId);

  const accountIds = new Set(accounts?.map(a => a.id) || []);
  const filteredBills = bills?.filter(b => accountIds.has(b.account_id)) || [];
  const billIds = filteredBills.map(b => b.id);

  const { data: allPayments } = useQuery({
    queryKey: ["bill-payments-all-list", ...billIds],
    queryFn: async () => {
      if (!billIds.length) return [] as BillPayment[];
      const { data, error } = await supabase
        .from("bill_payments")
        .select("*")
        .in("bill_id", billIds);
      if (error) throw error;
      return data as BillPayment[];
    },
    enabled: billIds.length > 0,
  });

  useEffect(() => {
    const channel = supabase
      .channel("bills-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "recurring_bills" }, () => {
        qc.invalidateQueries({ queryKey: ["recurring-bills"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bill_payments" }, () => {
        qc.invalidateQueries({ queryKey: ["bill-payments"] });
        qc.invalidateQueries({ queryKey: ["bill-payments-all-list"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const createBill = useCreateBill();

  // Form state
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("Other Expense");
  const [formDueDate, setFormDueDate] = useState<Date | undefined>(undefined);
  const [formAccountId, setFormAccountId] = useState("");
  const [formBillType, setFormBillType] = useState<BillType>("one-time");

  const expenseCategories = categories?.filter(c => c.type === "expense") || [];

  // Paid logic: recurring = check viewed month, one-time = any payment
  const isPaid = (bill: { id: string; bill_type: BillType }) => {
    const payments = allPayments?.filter(p => p.bill_id === bill.id) || [];
    if (!payments.length) return false;
    if (bill.bill_type === "recurring") {
      return payments.some(p => p.month === viewMonth && p.year === viewYear);
    }
    return true; // one-time: any payment = paid
  };

  // Filter bills for view: show recurring always, one-time only if unpaid or paid in viewed month
  const visibleBills = filteredBills.filter(b => {
    if (b.bill_type === "recurring") return true;
    // One-time: show if unpaid, or if paid in the viewed month
    const payments = allPayments?.filter(p => p.bill_id === b.id) || [];
    if (!payments.length) return true;
    return payments.some(p => p.month === viewMonth && p.year === viewYear);
  });

  const totalBills = visibleBills.reduce((s, b) => s + Number(b.amount), 0);
  const paidTotal = visibleBills.filter(b => isPaid(b)).reduce((s, b) => s + Number(b.amount), 0);
  const unpaidTotal = totalBills - paidTotal;

  const handleCreate = async () => {
    if (!formName.trim() || !formAmount || !formAccountId) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    try {
      await createBill.mutateAsync({
        name: formName.trim(),
        amount: parseFloat(formAmount),
        category: formCategory,
        due_date: formDueDate ? format(formDueDate, "yyyy-MM-dd") : undefined,
        account_id: formAccountId,
        bill_type: formBillType,
      });
      toast({ title: "Bill added" });
      setAddOpen(false);
      setFormName("");
      setFormAmount("");
      setFormCategory("Other Expense");
      setFormDueDate(undefined);
      setFormAccountId("");
      setFormBillType("one-time");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const hasNoBooks = !accounts?.length;
  const hasNoCategories = !expenseCategories.length;

  const formContent = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Bill Name</Label>
        <Input placeholder="e.g. Solar, NEPA, Hosting" value={formName} onChange={e => setFormName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Amount</Label>
        <Input type="number" placeholder="0.00" value={formAmount} onChange={e => setFormAmount(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Type</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormBillType("one-time")}
            className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors",
              formBillType === "one-time"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            <CircleDot className="w-3.5 h-3.5" /> One-time
          </button>
          <button
            type="button"
            onClick={() => setFormBillType("recurring")}
            className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors",
              formBillType === "recurring"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            <Repeat className="w-3.5 h-3.5" /> Recurring
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Category</Label>
        {hasNoCategories ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border bg-muted/50">
            <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">No expense categories yet.</p>
            </div>
            <Link to="/settings?tab=categories" onClick={() => setAddOpen(false)}>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 shrink-0">Create</Button>
            </Link>
          </div>
        ) : (
          <Select value={formCategory} onValueChange={setFormCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="z-[80]">
              {expenseCategories.map(c => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Due Date {formBillType === "recurring" && "(next due)"}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !formDueDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formDueDate ? format(formDueDate, "PPP") : <span>Pick a date (optional)</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[80]" align="start">
            <Calendar mode="single" selected={formDueDate} onSelect={setFormDueDate} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Pay from (Book)</Label>
        {hasNoBooks ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border bg-muted/50">
            <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">No books yet. Create one first.</p>
            </div>
            <Link to={`/businesses/${businessId}`} onClick={() => setAddOpen(false)}>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 shrink-0">Create</Button>
            </Link>
          </div>
        ) : (
          <Select value={formAccountId} onValueChange={setFormAccountId}>
            <SelectTrigger><SelectValue placeholder="Select a book" /></SelectTrigger>
            <SelectContent className="z-[80]">
              {accounts?.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Button className="w-full" onClick={handleCreate} disabled={createBill.isPending || hasNoBooks}>
        {createBill.isPending ? "Adding..." : "Add Bill"}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  // Sort: unpaid first, then by due_date ascending
  const sortedBills = [...visibleBills].sort((a, b) => {
    const aPaid = isPaid(a) ? 1 : 0;
    const bPaid = isPaid(b) ? 1 : 0;
    if (aPaid !== bPaid) return aPaid - bPaid;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  return (
    <div className="space-y-0 overflow-x-hidden w-full max-w-full">
      <div className="px-4 sm:px-6 py-6 space-y-6 w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Bills</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)} className="h-8 text-xs gap-1.5">
              <History className="w-3.5 h-3.5" /> History
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)} className="h-8 text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button
            onClick={goToCurrentMonth}
            className={cn(
              "text-sm font-medium px-3 py-1 rounded-md transition-colors",
              isCurrentMonth ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
            {!isCurrentMonth && <span className="text-[10px] ml-1.5 text-primary">(tap for today)</span>}
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Summary Card */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Bills</p>
              <p className="text-lg font-bold">{formatNaira(totalBills)}</p>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Paid</p>
                <p className="text-sm font-semibold text-[hsl(var(--cash-in))]">{formatNaira(paidTotal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Unpaid</p>
                <p className="text-sm font-semibold text-[hsl(var(--cash-out))]">{formatNaira(unpaidTotal)}</p>
              </div>
            </div>
          </div>
          {totalBills > 0 && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-[hsl(var(--cash-in))] transition-all duration-500" style={{ width: `${(paidTotal / totalBills) * 100}%` }} />
            </div>
          )}
        </Card>

        {/* Bills List */}
        {!sortedBills.length ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No bills yet</h3>
            <p className="text-xs text-muted-foreground mb-4">Add your expenses to track and pay them.</p>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Your First Bill
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedBills.map(bill => {
              const paid = isPaid(bill);
              const account = accounts?.find(a => a.id === bill.account_id);
              return (
                <Card
                  key={bill.id}
                  className={`p-3.5 flex items-center gap-3 transition-opacity cursor-pointer hover:bg-accent/50 ${paid ? "opacity-60" : ""}`}
                  onClick={() => navigate(`/businesses/${businessId}/bills/${bill.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-medium truncate ${paid ? "line-through" : ""}`}>{bill.name}</p>
                      {paid && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-[hsl(var(--cash-in-light))] text-[hsl(var(--cash-in))]">Paid</Badge>}
                      {bill.bill_type === "recurring" && !paid && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          <Repeat className="w-2 h-2 mr-0.5" /> Monthly
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {bill.category}
                      {bill.due_date && ` · Due ${format(new Date(bill.due_date), "MMM d, yyyy")}`}
                      {account && ` · ${account.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-semibold">{formatNaira(bill.amount)}</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment History Modal */}
      {(() => {
        const sortedPayments = [...(allPayments || [])].sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
        const historyContent = (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {!sortedPayments.length ? (
              <p className="text-xs text-muted-foreground text-center py-8">No payments recorded yet.</p>
            ) : (
              sortedPayments.map(p => {
                const bill = filteredBills.find(b => b.id === p.bill_id);
                const account = accounts?.find(a => a.id === bill?.account_id);
                return (
                  <Card
                    key={p.id}
                    className="p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      setHistoryOpen(false);
                      if (p.transaction_id && bill?.account_id) {
                        navigate(`/businesses/${businessId}/accounts/${bill.account_id}/transactions/${p.transaction_id}`);
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{bill?.name || "Unknown Bill"}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {format(new Date(p.paid_at), "MMM d, yyyy")}
                        {bill?.bill_type === "recurring" && ` · ${format(new Date(p.year, p.month - 1), "MMM yyyy")}`}
                        {account && ` · ${account.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <p className="text-sm font-semibold text-[hsl(var(--cash-out))]">
                        -{formatNaira(p.amount)}
                      </p>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        );
        return isMobile ? (
          <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader><DrawerTitle className="text-sm">Payment History</DrawerTitle></DrawerHeader>
              <div className="px-4 pb-6">{historyContent}</div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Payment History</DialogTitle></DialogHeader>
              {historyContent}
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Add Bill Modal */}
      {isMobile ? (
        <Drawer open={addOpen} onOpenChange={setAddOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader><DrawerTitle className="text-sm">Add Bill</DrawerTitle></DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">{formContent}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Bill</DialogTitle></DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

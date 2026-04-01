import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBills, useMarkBillPaid, useDeleteBill, type BillPayment } from "@/hooks/useBills";
import { useAccounts, useCategories } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatNaira } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, Check, Wallet, Pencil, Trash2, CalendarIcon, Repeat, CircleDot } from "lucide-react";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function BillDetailPage() {
  const { businessId, billId } = useParams<{ businessId: string; billId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const qc = useQueryClient();
  const { data: bills } = useBills();
  const { data: accounts } = useAccounts(businessId);
  const { data: categories } = useCategories();
  const markPaid = useMarkBillPaid();
  const deleteBill = useDeleteBill();

  const bill = bills?.find(b => b.id === billId);
  const account = bill ? accounts?.find(a => a.id === bill.account_id) : null;
  const expenseCategories = categories?.filter(c => c.type === "expense") || [];

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(undefined);
  const [editAccountId, setEditAccountId] = useState("");
  const [editBillType, setEditBillType] = useState<string>("one-time");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bill && editOpen) {
      setEditName(bill.name);
      setEditAmount(String(bill.amount));
      setEditCategory(bill.category);
      setEditDueDate(bill.due_date ? new Date(bill.due_date) : undefined);
      setEditAccountId(bill.account_id);
      setEditBillType(bill.bill_type);
    }
  }, [bill, editOpen]);

  // Fetch ALL payments for this bill
  const { data: allPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["bill-payments-all", billId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bill_payments")
        .select("*")
        .eq("bill_id", billId!)
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return data as BillPayment[];
    },
    enabled: !!billId,
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("bill-detail-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bill_payments" }, () => {
        qc.invalidateQueries({ queryKey: ["bill-payments-all", billId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "recurring_bills" }, () => {
        qc.invalidateQueries({ queryKey: ["recurring-bills"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc, billId]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const isPaid = (() => {
    if (!allPayments?.length) return false;
    if (bill?.bill_type === "recurring") {
      return allPayments.some(p => p.month === currentMonth && p.year === currentYear);
    }
    return true; // one-time: any payment = done
  })();

  const handlePay = async () => {
    if (!bill || !account) return;
    const now = new Date();
    try {
      await markPaid.mutateAsync({
        bill,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        accountName: account.name,
      });
      toast({ title: `"${bill.name}" marked as paid`, description: "Transaction recorded automatically." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!editName.trim() || !editAmount || !editAccountId) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const accountChanged = bill && editAccountId !== bill.account_id;

      const { error } = await supabase
        .from("recurring_bills")
        .update({
          name: editName.trim(),
          amount: parseFloat(editAmount),
          category: editCategory,
          due_date: editDueDate ? format(editDueDate, "yyyy-MM-dd") : null,
          account_id: editAccountId,
          bill_type: editBillType,
        })
        .eq("id", billId!);
      if (error) throw error;

      // If the book changed, move associated payment transactions to the new book
      if (accountChanged && allPayments?.length) {
        const txIds = allPayments
          .map(p => p.transaction_id)
          .filter((id): id is string => !!id);
        if (txIds.length) {
          const { error: txErr } = await supabase
            .from("transactions")
            .update({ account_id: editAccountId })
            .in("id", txIds);
          if (txErr) console.error("Failed to move transactions:", txErr);
        }
      }

      qc.invalidateQueries({ queryKey: ["recurring-bills"] });
      qc.invalidateQueries({ queryKey: ["bill-payments-all-list"] });
      qc.invalidateQueries({ queryKey: ["bill-payments-all"] });
      qc.invalidateQueries({ queryKey: ["bill-payments"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["business-transactions"] });
      qc.invalidateQueries({ queryKey: ["all-transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast({ title: accountChanged ? "Bill updated & transactions moved" : "Bill updated" });
      setEditOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBill.mutateAsync(billId!);
      toast({ title: "Bill deleted" });
      navigate(`/businesses/${businessId}/bills`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (!bill) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Bill not found.</p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Go Back
        </Button>
      </div>
    );
  }

  const editFormContent = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Bill Name</Label>
        <Input value={editName} onChange={e => setEditName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Amount</Label>
        <Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Bill Type</Label>
        <Select value={editBillType} onValueChange={setEditBillType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent className="z-[80]">
            <SelectItem value="one-time">One-time</SelectItem>
            <SelectItem value="recurring">Recurring (monthly)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Category</Label>
        <Select value={editCategory} onValueChange={setEditCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent className="z-[80]">
            {expenseCategories.map(c => (
              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editDueDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {editDueDate ? format(editDueDate, "PPP") : <span>Pick a date (optional)</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[80]" align="start">
            <Calendar mode="single" selected={editDueDate} onSelect={setEditDueDate} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Pay from (Book)</Label>
        <Select value={editAccountId} onValueChange={setEditAccountId}>
          <SelectTrigger><SelectValue placeholder="Select a book" /></SelectTrigger>
          <SelectContent className="z-[80]">
            {accounts?.map(a => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" onClick={handleEdit} disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-0 overflow-x-hidden w-full max-w-full">
      <div className="px-4 sm:px-6 py-6 space-y-6 w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{bill.name}</h1>
            <p className="text-xs text-muted-foreground">{bill.category}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bill Info Card */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">{formatNaira(bill.amount)}</p>
            {isPaid ? (
              <Badge variant="secondary" className="bg-[hsl(var(--cash-in-light))] text-[hsl(var(--cash-in))]">
                {bill.bill_type === "recurring" ? "Paid this month" : "Paid"}
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-[hsl(var(--cash-out-light))] text-[hsl(var(--cash-out))]">Unpaid</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 capitalize">
              {bill.bill_type === "recurring" ? <><Repeat className="w-3 h-3" /> Recurring (monthly)</> : <><CircleDot className="w-3 h-3" /> One-time</>}
            </span>
            {bill.due_date && (
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Due {format(new Date(bill.due_date), "MMM d, yyyy")}
              </span>
            )}
            {account && (
              <span className="flex items-center gap-1">
                <Wallet className="w-3 h-3" /> {account.name}
              </span>
            )}
          </div>

          {!isPaid && (
            <Button className="w-full" onClick={handlePay} disabled={markPaid.isPending}>
              <Check className="w-4 h-4 mr-2" />
              {markPaid.isPending ? "Processing..." : bill.bill_type === "recurring" ? `Pay for ${MONTH_NAMES[currentMonth - 1]} ${currentYear}` : "Mark as Paid"}
            </Button>
          )}
        </Card>

        {/* Payment History */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Payment History</h2>
          {paymentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !allPayments?.length ? (
            <Card className="p-6 text-center">
              <p className="text-xs text-muted-foreground">No payments recorded yet for this bill.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {allPayments.map(payment => (
                <Card key={payment.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Paid on {format(new Date(payment.paid_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{formatNaira(payment.amount)}</p>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-[hsl(var(--cash-in-light))] text-[hsl(var(--cash-in))]">Paid</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isMobile ? (
        <Drawer open={editOpen} onOpenChange={setEditOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader><DrawerTitle className="text-sm">Edit Bill</DrawerTitle></DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">{editFormContent}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Bill</DialogTitle>
              <DialogDescription>Update the details of this bill.</DialogDescription>
            </DialogHeader>
            {editFormContent}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{bill.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this bill and all its payment records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

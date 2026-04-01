import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  useBusinesses, useInvoices, useCreateInvoice, useDeleteInvoice, useUpdateInvoice,
  useAccounts, useCreateTransaction,
} from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Plus, Trash2, MessageCircle, Download, Mail, MoreHorizontal, Receipt, BookOpen, CheckCircle2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatNaira, VAT_RATE } from "@/lib/currency";
import { downloadInvoicePDF, type InvoicePrintData } from "@/lib/print-invoice";
import UpgradeModal from "@/components/UpgradeModal";

export default function InvoicingAll() {
  const { businessId } = useOutletContext<{ businessId: string | undefined }>();
  const { data: businesses } = useBusinesses();
  const { data: invoices, isLoading } = useInvoices(businessId);
  const { data: accounts } = useAccounts(businessId);
  const createInv = useCreateInvoice();
  const deleteInv = useDeleteInvoice();
  const updateInv = useUpdateInvoice();
  const createTx = useCreateTransaction();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([{ description: "", quantity: 1, unit_price: 0 }]);
  const [includeVAT, setIncludeVAT] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [createBookId, setCreateBookId] = useState<string>("");

  // Mark as paid dialog state
  const [paidDialog, setPaidDialog] = useState<{ open: boolean; invoice: any | null }>({ open: false, invoice: null });
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isPaidLoading, setIsPaidLoading] = useState(false);

  // Edit invoice state
  const [editDialog, setEditDialog] = useState<{ open: boolean; invoice: any | null }>({ open: false, invoice: null });
  const [editItems, setEditItems] = useState<{ description: string; quantity: number; unit_price: number }[]>([]);
  const [editIncludeVAT, setEditIncludeVAT] = useState(true);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const business = businesses?.find(b => b.id === businessId);

  const getInvoicePrintData = async (inv: any): Promise<InvoicePrintData> => {
    const { data: lineItems } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", inv.id)
      .order("created_at");
    return {
      invoice_number: inv.invoice_number,
      status: inv.status,
      customer_name: inv.customer_name,
      customer_email: inv.customer_email,
      customer_address: inv.customer_address,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      subtotal: inv.subtotal,
      tax_rate: inv.tax_rate,
      tax_amount: inv.tax_amount,
      total: inv.total,
      notes: inv.notes,
      business_name: business?.name,
      business_address: business?.address || undefined,
      business_email: business?.official_email || undefined,
      business_phone: business?.phone || undefined,
      bank_name: business?.bank_name || undefined,
      bank_account_number: business?.bank_account_number || undefined,
      bank_account_name: business?.bank_account_name || undefined,
      items: (lineItems || []).map((i: any) => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.total,
      })),
    };
  };

  const handleDownload = async (inv: any, type: "invoice" | "receipt" = "invoice") => {
    const data = await getInvoicePrintData(inv);
    toast({ title: `Generating ${type === "receipt" ? "receipt" : "invoice"} PDF...` });
    await downloadInvoicePDF(data, type);
    toast({ title: `${type === "receipt" ? "Receipt" : "Invoice"} PDF downloaded` });
  };

  const handleEmailShare = (inv: any) => {
    const subject = encodeURIComponent(`Invoice ${inv.invoice_number} — ${formatNaira(Number(inv.total))}`);
    const body = encodeURIComponent(
      `Hi ${inv.customer_name},\n\nPlease find attached invoice ${inv.invoice_number} for ${formatNaira(Number(inv.total))}.\n\nDue date: ${format(new Date(inv.due_date), "dd MMM yyyy")}\n\nThank you for your business!\n\n— Sent via Manaa`
    );
    window.open(`mailto:${inv.customer_email || ""}?subject=${subject}&body=${body}`, "_self");
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!businessId) {
      toast({ title: "Please select a business first", variant: "destructive" });
      return;
    }
    const form = new FormData(e.currentTarget);
    const taxRate = includeVAT ? (parseFloat(form.get("tax_rate") as string) || 0) : 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Save bank details to business for future invoices
    const bankName = form.get("bank_name") as string;
    const bankAccountNumber = form.get("bank_account_number") as string;
    const bankAccountName = form.get("bank_account_name") as string;
    if (businessId && (bankName || bankAccountNumber || bankAccountName)) {
      await supabase.from("businesses").update({
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_account_name: bankAccountName,
      } as any).eq("id", businessId);
    }

    try {
      await createInv.mutateAsync({
        business_id: businessId!,
        invoice_number: `INV-${Date.now().toString().slice(-6)}`,
        customer_name: form.get("customer_name") as string,
        customer_email: form.get("customer_email") as string,
        customer_address: form.get("customer_address") as string,
        issue_date: form.get("issue_date") as string,
        due_date: form.get("due_date") as string,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        notes: form.get("notes") as string,
        items: items.filter(i => i.description || i.unit_price > 0),
      });
      // If a book was selected, auto-record as cash_in transaction
      if (createBookId && createBookId !== "none") {
        const { data: lastTx } = await supabase
          .from("transactions")
          .select("balance_after")
          .eq("account_id", createBookId)
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const currentBalance = lastTx?.balance_after ?? 0;
        const newBalance = Number(currentBalance) + total;

        await createTx.mutateAsync({
          account_id: createBookId,
          type: "cash_in",
          amount: total,
          category: "Sales",
          description: `Invoice ${`INV-${Date.now().toString().slice(-6)}`} — ${form.get("customer_name") as string}`,
          customer_name: form.get("customer_name") as string || "",
          transaction_date: new Date().toISOString().split("T")[0],
          balance_after: newBalance,
        });
      }

      setOpen(false);
      setItems([{ description: "", quantity: 1, unit_price: 0 }]);
      setCreateBookId("");
      toast({ title: (createBookId && createBookId !== "none") ? "Invoice created & recorded to book!" : "Invoice created!" });
    } catch (err: any) {
      if (err.message?.includes("Free plan") || err.message?.includes("Upgrade to Pro")) {
        setShowUpgrade(true);
      }
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice? This will also remove any linked transaction from your book.")) return;
    try {
      // Find the invoice to get its number for matching the transaction
      const inv = invoices?.find(i => i.id === id);
      if (inv) {
        // Delete any transaction that was auto-recorded from this invoice
        await supabase
          .from("transactions")
          .delete()
          .like("description", `Invoice ${inv.invoice_number}%`);
      }
      await deleteInv.mutateAsync({ id, businessId: businessId! });
      toast({ title: "Invoice & linked transaction deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openEditDialog = async (inv: any) => {
    // Load line items for this invoice
    const { data: lineItems } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", inv.id)
      .order("created_at");
    setEditItems(
      (lineItems || []).map((i: any) => ({ description: i.description, quantity: Number(i.quantity), unit_price: Number(i.unit_price) }))
    );
    setEditIncludeVAT(Number(inv.tax_rate) > 0);
    setEditDialog({ open: true, invoice: inv });
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inv = editDialog.invoice;
    if (!inv) return;
    setIsEditLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      const taxRate = editIncludeVAT ? (parseFloat(form.get("edit_tax_rate") as string) || 0) : 0;
      const editSubtotal = editItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
      const taxAmount = editSubtotal * (taxRate / 100);
      const total = editSubtotal + taxAmount;

      await updateInv.mutateAsync({
        id: inv.id,
        customer_name: form.get("edit_customer_name") as string,
        customer_email: form.get("edit_customer_email") as string,
        customer_address: form.get("edit_customer_address") as string,
        issue_date: form.get("edit_issue_date") as string,
        due_date: form.get("edit_due_date") as string,
        subtotal: editSubtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        notes: form.get("edit_notes") as string,
      });

      // Replace line items: delete old, insert new
      await supabase.from("invoice_items").delete().eq("invoice_id", inv.id);
      const validItems = editItems.filter(i => i.description || i.unit_price > 0);
      if (validItems.length > 0) {
        await supabase.from("invoice_items").insert(
          validItems.map(item => ({
            invoice_id: inv.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.quantity * item.unit_price,
          }))
        );
      }

      setEditDialog({ open: false, invoice: null });
      toast({ title: "Invoice updated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsEditLoading(false);
    }
  };

  const openMarkPaidDialog = async (inv: any) => {
    // Check if this invoice was already recorded to a book
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id")
      .like("description", `Invoice ${inv.invoice_number}%`)
      .limit(1);

    if (existingTx && existingTx.length > 0) {
      // Already recorded — just mark as paid, no dialog needed
      try {
        await updateInv.mutateAsync({ id: inv.id, status: "paid" });
        toast({ title: "Invoice marked as paid (already recorded to book)" });
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
      return;
    }

    setSelectedAccountId("");
    setPaidDialog({ open: true, invoice: inv });
  };

  const handleMarkPaid = async () => {
    const inv = paidDialog.invoice;
    if (!inv) return;
    setIsPaidLoading(true);
    try {
      // Mark invoice as paid
      await updateInv.mutateAsync({ id: inv.id, status: "paid" });

      // If a book is selected, create a cash_in transaction
      if (selectedAccountId) {
        // Get current balance for the account
        const { data: lastTx } = await supabase
          .from("transactions")
          .select("balance_after")
          .eq("account_id", selectedAccountId)
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const currentBalance = lastTx?.balance_after ?? 0;
        const newBalance = Number(currentBalance) + Number(inv.total);

        await createTx.mutateAsync({
          account_id: selectedAccountId,
          type: "cash_in",
          amount: Number(inv.total),
          category: "Sales",
          description: `Invoice ${inv.invoice_number} — ${inv.customer_name}`,
          customer_name: inv.customer_name || "",
          transaction_date: new Date().toISOString().split("T")[0],
          balance_after: newBalance,
        });

        toast({ title: "Invoice marked as paid & recorded to book" });
      } else {
        toast({ title: "Invoice marked as paid" });
      }

      setPaidDialog({ open: false, invoice: null });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsPaidLoading(false);
    }
  };

  const shareOnWhatsApp = (inv: any) => {
    const message = encodeURIComponent(
      `Hi ${inv.customer_name},\n\nYour invoice ${inv.invoice_number} for ${formatNaira(Number(inv.total))} is ${inv.status === "paid" ? "paid" : `due on ${format(new Date(inv.due_date), "dd MMM yyyy")}`}.\n\nThank you for your business!\n— Sent via Manaa`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "paid": return "bg-cash-in/10 text-cash-in border-cash-in/20";
      case "sent": return "bg-info/10 text-info border-info/20";
      case "overdue": return "bg-cash-out/10 text-cash-out border-cash-out/20";
      default: return "bg-secondary text-muted-foreground";
    }
  };

  const totalPaid = invoices?.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0) ?? 0;
  const totalPending = invoices?.filter((i) => i.status !== "paid").reduce((s, i) => s + Number(i.total), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Create button */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Customer Name</Label>
                  <Input name="customer_name" required placeholder="John Doe" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Customer Email</Label>
                  <Input name="customer_email" type="email" placeholder="john@example.com" className="h-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Customer Address</Label>
                <Input name="customer_address" placeholder="123 Main St, Lagos" className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Issue Date</Label>
                  <Input name="issue_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Due Date</Label>
                  <Input name="due_date" type="date" defaultValue={new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]} className="h-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Line Items</Label>
                <div className="grid grid-cols-[1fr_60px_100px_30px] gap-2 text-[10px] text-muted-foreground px-0.5">
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Amount (₦)</span>
                  <span />
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_60px_100px_30px] gap-2 items-end">
                    <Input placeholder="Item or service" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} className="h-8 text-xs" />
                    <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)} className="h-8 text-xs" placeholder="Qty" />
                    <Input type="number" step="0.01" min="0" value={item.unit_price || ""} onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} className="h-8 text-xs" placeholder="0.00" />
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(idx)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={addItem}>
                  <Plus className="w-3 h-3 mr-1" /> Add Line
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Include VAT</Label>
                    <Switch checked={includeVAT} onCheckedChange={setIncludeVAT} />
                  </div>
                  {includeVAT && (
                    <>
                      <Input name="tax_rate" type="number" step="0.01" defaultValue={VAT_RATE.toString()} className="h-9" />
                      <p className="text-[10px] text-muted-foreground">Nigeria VAT: {VAT_RATE}%</p>
                    </>
                  )}
                </div>
                <div className="flex items-end">
                  <div>
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="text-sm font-semibold">{formatNaira(subtotal)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea name="notes" placeholder="Thank you for your business!" className="min-h-[40px] text-xs" />
              </div>

              {/* Bank Details */}
              <div className="space-y-2 rounded-lg border border-border p-3 bg-secondary/30">
                <p className="text-xs font-medium flex items-center gap-1.5">🏦 Bank Details <span className="text-muted-foreground font-normal">(optional, shown on invoice)</span></p>
                <div className="space-y-2">
                  <Input name="bank_name" placeholder="Bank Name, e.g. GTBank" className="h-8 text-xs" defaultValue={business?.bank_name || ""} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input name="bank_account_number" placeholder="Account Number" className="h-8 text-xs" defaultValue={business?.bank_account_number || ""} />
                    <Input name="bank_account_name" placeholder="Account Name" className="h-8 text-xs" defaultValue={business?.bank_account_name || ""} />
                  </div>
                </div>
              </div>

              {/* Record to Book */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Record to Book <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Select value={createBookId} onValueChange={setCreateBookId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select a book to auto-record income" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {accounts?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">If selected, a Cash In transaction will be created automatically.</p>
              </div>
              <DialogFooter>
                <Button type="submit" size="sm" disabled={createInv.isPending}>
                  {createInv.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total Invoices</p>
            <p className="text-lg font-semibold">{invoices?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-cash-in-light">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Paid</p>
            <p className="text-lg font-semibold text-cash-in">{formatNaira(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-cash-out-light">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Pending</p>
            <p className="text-lg font-semibold text-cash-out">{formatNaira(totalPending)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : !invoices?.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FileText className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm mb-4">No invoices yet</p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create your first invoice
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3 group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{inv.invoice_number}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor(inv.status)}`}>
                          {inv.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {inv.customer_name} · Due {format(new Date(inv.due_date), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold tabular-nums">{formatNaira(Number(inv.total))}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {inv.status !== "paid" && (
                          <DropdownMenuItem onClick={() => openEditDialog(inv)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Invoice
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDownload(inv, "invoice")}>
                          <Download className="w-3.5 h-3.5 mr-2" /> Download Invoice
                        </DropdownMenuItem>
                        {inv.status === "paid" && (
                          <DropdownMenuItem onClick={() => handleDownload(inv, "receipt")}>
                            <Receipt className="w-3.5 h-3.5 mr-2" /> Download Receipt
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleEmailShare(inv)}>
                          <Mail className="w-3.5 h-3.5 mr-2" /> Send via Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareOnWhatsApp(inv)}>
                          <MessageCircle className="w-3.5 h-3.5 mr-2" /> Share on WhatsApp
                        </DropdownMenuItem>
                        {inv.status !== "paid" && (
                          <DropdownMenuItem onClick={() => openMarkPaidDialog(inv)}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Mark as Paid
                          </DropdownMenuItem>
                        )}
                        {inv.status === "paid" && (
                          <DropdownMenuItem onClick={() => openMarkPaidDialog(inv)}>
                            <BookOpen className="w-3.5 h-3.5 mr-2" /> Record to Book
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(inv.id)}>
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark as Paid / Record to Book Dialog */}
      <Dialog open={paidDialog.open} onOpenChange={(o) => setPaidDialog({ open: o, invoice: o ? paidDialog.invoice : null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {paidDialog.invoice?.status === "paid" ? (
                <><BookOpen className="w-4 h-4" /> Record to Book</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Mark as Paid</>
              )}
            </DialogTitle>
            <DialogDescription>
              {paidDialog.invoice?.status === "paid"
                ? `Record ${formatNaira(Number(paidDialog.invoice?.total || 0))} from ${paidDialog.invoice?.invoice_number} as income in a book.`
                : `Mark ${paidDialog.invoice?.invoice_number} (${formatNaira(Number(paidDialog.invoice?.total || 0))}) as paid and optionally record it to a book.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3 bg-secondary/30 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice</span>
                <span className="font-medium">{paidDialog.invoice?.invoice_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{paidDialog.invoice?.customer_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-cash-in">{formatNaira(Number(paidDialog.invoice?.total || 0))}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {paidDialog.invoice?.status === "paid" ? "Select Book" : "Record to Book (optional)"}
              </Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select a book to record income" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                {paidDialog.invoice?.status === "paid"
                  ? "Select a book to record this payment as cash in."
                  : "If selected, a Cash In transaction will be automatically created in the chosen book."
                }
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setPaidDialog({ open: false, invoice: null })}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isPaidLoading || (paidDialog.invoice?.status === "paid" && !selectedAccountId)}
              onClick={handleMarkPaid}
            >
              {isPaidLoading ? "Processing..." : paidDialog.invoice?.status === "paid" ? "Record to Book" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(o) => setEditDialog({ open: o, invoice: o ? editDialog.invoice : null })}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice {editDialog.invoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Customer Name</Label>
                <Input name="edit_customer_name" required defaultValue={editDialog.invoice?.customer_name || ""} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Customer Email</Label>
                <Input name="edit_customer_email" type="email" defaultValue={editDialog.invoice?.customer_email || ""} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Customer Address</Label>
              <Input name="edit_customer_address" defaultValue={editDialog.invoice?.customer_address || ""} className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Issue Date</Label>
                <Input name="edit_issue_date" type="date" defaultValue={editDialog.invoice?.issue_date || ""} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Due Date</Label>
                <Input name="edit_due_date" type="date" defaultValue={editDialog.invoice?.due_date || ""} className="h-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Line Items</Label>
              <div className="grid grid-cols-[1fr_60px_100px_30px] gap-2 text-[10px] text-muted-foreground px-0.5">
                <span>Description</span>
                <span>Qty</span>
                <span>Amount (₦)</span>
                <span />
              </div>
              {editItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_60px_100px_30px] gap-2 items-end">
                  <Input placeholder="Item or service" value={item.description} onChange={(e) => setEditItems(editItems.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))} className="h-8 text-xs" />
                  <Input type="number" min="1" value={item.quantity} onChange={(e) => setEditItems(editItems.map((it, i) => i === idx ? { ...it, quantity: parseInt(e.target.value) || 0 } : it))} className="h-8 text-xs" />
                  <Input type="number" step="0.01" min="0" value={item.unit_price || ""} onChange={(e) => setEditItems(editItems.map((it, i) => i === idx ? { ...it, unit_price: parseFloat(e.target.value) || 0 } : it))} className="h-8 text-xs" />
                  {editItems.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={() => setEditItems([...editItems, { description: "", quantity: 1, unit_price: 0 }])}>
                <Plus className="w-3 h-3 mr-1" /> Add Line
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Include VAT</Label>
                  <Switch checked={editIncludeVAT} onCheckedChange={setEditIncludeVAT} />
                </div>
                {editIncludeVAT && (
                  <>
                    <Input name="edit_tax_rate" type="number" step="0.01" defaultValue={editDialog.invoice?.tax_rate?.toString() || VAT_RATE.toString()} className="h-9" />
                    <p className="text-[10px] text-muted-foreground">Nigeria VAT: {VAT_RATE}%</p>
                  </>
                )}
              </div>
              <div className="flex items-end">
                <div>
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                  <p className="text-sm font-semibold">{formatNaira(editItems.reduce((s, i) => s + i.quantity * i.unit_price, 0))}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea name="edit_notes" defaultValue={editDialog.invoice?.notes || ""} className="min-h-[40px] text-xs" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditDialog({ open: false, invoice: null })}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isEditLoading}>
                {isEditLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}

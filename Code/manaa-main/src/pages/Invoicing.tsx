import { useState } from "react";
import {
  useBusinesses, useInvoices, useCreateInvoice, useDeleteInvoice, useUpdateInvoice,
} from "@/hooks/useData";
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
import { FileText, Plus, Trash2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatNaira, VAT_RATE } from "@/lib/currency";
import PageHeader from "@/components/PageHeader";

interface InvoicingPageProps {
  selectedBusinessId?: string | null;
}

export default function InvoicingPage({ selectedBusinessId }: InvoicingPageProps) {
  const { data: businesses } = useBusinesses();
  const businessId = selectedBusinessId || businesses?.[0]?.id;
  const { data: invoices, isLoading } = useInvoices(businessId);
  const createInv = useCreateInvoice();
  const deleteInv = useDeleteInvoice();
  const updateInv = useUpdateInvoice();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([{ description: "", quantity: 1, unit_price: 0 }]);

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const taxRate = parseFloat(form.get("tax_rate") as string) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
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
      setOpen(false);
      setItems([{ description: "", quantity: 1, unit_price: 0 }]);
      toast({ title: "Invoice created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      await deleteInv.mutateAsync({ id, businessId: businessId! });
      toast({ title: "Invoice deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const markPaid = async (id: string) => {
    try {
      await updateInv.mutateAsync({ id, status: "paid" });
      toast({ title: "Invoice marked as paid" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
      <PageHeader title="Invoicing" subtitle="Create & manage invoices">
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
                  <Label className="text-xs">VAT Rate (%)</Label>
                  <Input name="tax_rate" type="number" step="0.01" defaultValue={VAT_RATE.toString()} className="h-9" />
                  <p className="text-[10px] text-muted-foreground">Nigeria VAT: {VAT_RATE}%</p>
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
              <DialogFooter>
                <Button type="submit" size="sm" disabled={createInv.isPending}>
                  {createInv.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="px-4 sm:px-6 space-y-6">

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
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => shareOnWhatsApp(inv)}
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </Button>
                      {inv.status !== "paid" && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markPaid(inv.id)}>
                          Mark Paid
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(inv.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

import { useOutletContext } from "react-router-dom";
import { useInvoices, useUpdateInvoice, useDeleteInvoice } from "@/hooks/useData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, AlertTriangle, Clock, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isPast } from "date-fns";
import { formatNaira } from "@/lib/currency";

export default function InvoicingDrafts() {
  const { businessId } = useOutletContext<{ businessId: string | undefined }>();
  const { data: invoices, isLoading } = useInvoices(businessId);
  const updateInv = useUpdateInvoice();
  const deleteInv = useDeleteInvoice();
  const { toast } = useToast();

  const drafts = invoices?.filter(i => i.status === "draft") || [];
  const overdue = invoices?.filter(i => i.status !== "paid" && i.status !== "cancelled" && isPast(new Date(i.due_date))) || [];
  const actionItems = [...new Map([...drafts, ...overdue].map(i => [i.id, i])).values()];

  const markPaid = async (id: string) => {
    try {
      await updateInv.mutateAsync({ id, status: "paid" });
      toast({ title: "Invoice marked as paid" });
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

  const shareOnWhatsApp = (inv: any) => {
    const message = encodeURIComponent(
      `Hi ${inv.customer_name},\n\nYour invoice ${inv.invoice_number} for ${formatNaira(Number(inv.total))} is due on ${format(new Date(inv.due_date), "dd MMM yyyy")}.\n\nPlease make payment at your earliest convenience.\n— Sent via Manaa`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">Drafts</p>
              <p className="text-lg font-semibold">{drafts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-cash-out-light">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-cash-out" />
            <div>
              <p className="text-[11px] text-muted-foreground">Overdue</p>
              <p className="text-lg font-semibold text-cash-out">{overdue.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {!actionItems.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FileText className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No drafts or overdue invoices 🎉</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {actionItems.map((inv) => {
                const isOverdue = isPast(new Date(inv.due_date)) && inv.status !== "paid";
                return (
                  <div key={inv.id} className="flex items-center justify-between px-4 py-3 group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${isOverdue ? "bg-cash-out/10" : "bg-secondary"}`}>
                        {isOverdue ? <AlertTriangle className="w-4 h-4 text-cash-out" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{inv.invoice_number}</p>
                          {isOverdue && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-cash-out/10 text-cash-out border-cash-out/20">
                              Overdue
                            </Badge>
                          )}
                          {inv.status === "draft" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Draft</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {inv.customer_name} · Due {format(new Date(inv.due_date), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold tabular-nums">{formatNaira(Number(inv.total))}</p>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => shareOnWhatsApp(inv)}>
                          <MessageCircle className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markPaid(inv.id)}>
                          Mark Paid
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(inv.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

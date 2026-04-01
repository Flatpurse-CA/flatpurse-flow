import { format } from "date-fns";
import { formatNaira } from "@/lib/currency";
import { printReceipt as printReceiptUtil } from "@/lib/print";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Printer, Copy, Trash2, Receipt } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import InlineCategorySelect from "@/components/InlineCategorySelect";
import { useToast } from "@/hooks/use-toast";

interface TransactionSidebarProps {
  tx: any | null;
  open: boolean;
  onClose: () => void;
  categories: { id: string; name: string; type: string }[];
  onUpdate: (id: string, accountId: string, updates: Record<string, any>) => Promise<void>;
  onDelete: (id: string, accountId: string) => Promise<void>;
}

export default function TransactionSidebar({
  tx,
  open,
  onClose,
  categories,
  onUpdate,
  onDelete,
}: TransactionSidebarProps) {
  const { toast } = useToast();

  if (!tx) return null;

  const handlePrint = () => {
    printReceiptUtil(tx);
  };

  const copyAmount = () => {
    navigator.clipboard.writeText(String(tx.amount));
    toast({ title: "Amount copied" });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[380px] sm:w-[420px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-semibold">Transaction Details</SheetTitle>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Amount Hero */}
          <div className="text-center space-y-2">
            <Badge
              variant="outline"
              className={`text-xs px-2.5 py-0.5 font-medium border ${
                tx.type === "cash_in"
                  ? "text-cash-in border-cash-in/30 bg-cash-in/5"
                  : "text-cash-out border-cash-out/30 bg-cash-out/5"
              }`}
            >
              {tx.type === "cash_in" ? "Cash In" : "Cash Out"}
            </Badge>
            <p className={`text-2xl font-bold tracking-tight ${tx.type === "cash_in" ? "text-cash-in" : "text-cash-out"}`}>
              {tx.type === "cash_in" ? "+" : "−"}{formatNaira(Number(tx.amount))}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(tx.transaction_date), "EEEE, dd MMMM yyyy")}
            </p>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-border/60 divide-y divide-border/40">
            <DetailRow label="Description" value={tx.description || "—"} />

            {/* Editable Category */}
            <div className="flex items-center justify-between px-4 py-3 gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Category</span>
              <InlineCategorySelect
                value={tx.category}
                txType={tx.type as "cash_in" | "cash_out"}
                categories={categories}
                onSave={async (newCategory) => {
                  await onUpdate(tx.id, tx.account_id, { category: newCategory });
                }}
                className="text-sm font-medium text-right"
              />
            </div>

            <DetailRow label="Balance After" value={formatNaira(Number(tx.balance_after))} />
            {tx.customer_name && <DetailRow label="Customer" value={tx.customer_name} />}
            {tx.customer_detail && <DetailRow label="Detail" value={tx.customer_detail} />}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            {tx.receipt_url ? (
              <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1.5">
                  <Receipt className="w-3.5 h-3.5" /> Receipt
                </Button>
              </a>
            ) : (
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={copyAmount}>
                <Copy className="w-3.5 h-3.5" /> Copy Amount
              </Button>
            )}
          </div>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5">
                <Trash2 className="w-3.5 h-3.5" /> Delete Transaction
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this {tx.type === "cash_in" ? "Cash In" : "Cash Out"} of {formatNaira(Number(tx.amount))}. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    try {
                      await onDelete(tx.id, tx.account_id);
                      toast({ title: "Transaction deleted" });
                      onClose();
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

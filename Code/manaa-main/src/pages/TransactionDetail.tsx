import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAllTransactions, useBusinesses, useDeleteTransaction, useUpdateTransaction, useCategories } from "@/hooks/useData";
import { format } from "date-fns";
import { formatNaira } from "@/lib/currency";
import { printReceipt as printReceiptUtil } from "@/lib/print";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, ExternalLink, Receipt, Copy, Trash2, Pencil, Check, X } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: transactions } = useAllTransactions();
  const { data: businesses } = useBusinesses();
  const { data: categories } = useCategories();
  const deleteTx = useDeleteTransaction();
  const updateTx = useUpdateTransaction();

  const [editingCategory, setEditingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const tx = transactions?.find((t: any) => t.id === id);

  if (!tx) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <p className="text-muted-foreground text-sm">Transaction not found.</p>
      </div>
    );
  }

  const business = businesses?.find((b) => b.name === tx.business_name);

  const filteredCategories = categories?.filter((c) =>
    tx.type === "cash_in" ? c.type === "income" : c.type === "expense"
  );

  const startEditCategory = () => {
    setSelectedCategory(tx.category);
    setEditingCategory(true);
  };

  const saveCategory = async () => {
    if (selectedCategory && selectedCategory !== tx.category) {
      try {
        await updateTx.mutateAsync({
          id: tx.id,
          accountId: tx.account_id,
          updates: { category: selectedCategory },
        });
        toast({ title: "Category updated" });
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
    setEditingCategory(false);
  };

  const printReceipt = () => printReceiptUtil(tx);

  const copyAmount = () => {
    navigator.clipboard.writeText(String(tx.amount));
    toast({ title: "Amount copied" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold">Transaction Details</span>
      </div>

      <div className="px-4 py-6 space-y-6 pb-24">
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
          <p className={`text-3xl font-bold tracking-tight ${tx.type === "cash_in" ? "text-cash-in" : "text-cash-out"}`}>
            {tx.type === "cash_in" ? "+" : "−"}{formatNaira(Number(tx.amount))}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(tx.transaction_date), "EEEE, dd MMMM yyyy")}
          </p>
        </div>

        {/* Details */}
        <div className="rounded-xl border border-border/60 divide-y divide-border/40">
          <DetailRow label="Description" value={tx.description || "—"} />
          
          {/* Editable Category Row */}
          <div className="flex items-center justify-between px-4 py-3 gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Category</span>
            {editingCategory ? (
              <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-8 text-xs w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories?.map((c) => (
                      <SelectItem key={c.id} value={c.name} className="text-xs">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={saveCategory} disabled={updateTx.isPending}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingCategory(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <button
                onClick={startEditCategory}
                className="flex items-center gap-1.5 text-sm font-medium text-right hover:text-primary transition-colors group"
              >
                <span className="truncate max-w-[160px]">{tx.category}</span>
                <Pencil className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
              </button>
            )}
          </div>

          <DetailRow label="Business" value={tx.business_name || "—"} />
          <DetailRow label="Book" value={tx.account_name || "—"} />
          <DetailRow label="Balance After" value={formatNaira(Number(tx.balance_after))} />
          {tx.customer_name && <DetailRow label="Customer" value={tx.customer_name} />}
          {tx.customer_detail && <DetailRow label="Customer Detail" value={tx.customer_detail} />}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          {business && (
            <Link to={`/businesses/${business.id}/accounts/${tx.account_id}`} className="col-span-1">
              <Button variant="outline" className="w-full h-11 text-xs gap-2">
                <ExternalLink className="w-4 h-4" /> View Book
              </Button>
            </Link>
          )}
          <Button variant="outline" className="h-11 text-xs gap-2" onClick={printReceipt}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          {tx.receipt_url && (
            <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer" className="col-span-1">
              <Button variant="outline" className="w-full h-11 text-xs gap-2">
                <Receipt className="w-4 h-4" /> Receipt
              </Button>
            </a>
          )}
          <Button variant="outline" className="h-11 text-xs gap-2" onClick={copyAmount}>
            <Copy className="w-4 h-4" /> Copy Amount
          </Button>
        </div>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full h-11 text-xs gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5">
              <Trash2 className="w-4 h-4" /> Delete Transaction
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
                    await deleteTx.mutateAsync({ id: tx.id, accountId: tx.account_id });
                    toast({ title: "Transaction deleted" });
                    navigate(-1);
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
    </div>
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

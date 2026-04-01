import { useState, useEffect } from "react";
import { useBusinesses, useAccounts, useCategories, useCreateTransaction, useAccountBalance, useCreateAccount } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { uploadReceipt } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, TrendingDown, Upload, Plus, CalendarIcon } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";


interface CashModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "cash_in" | "cash_out";
  selectedBusinessId?: string | null;
}

export default function CashModal({ open, onOpenChange, defaultType = "cash_in", selectedBusinessId }: CashModalProps) {
  const { data: businesses } = useBusinesses();
  const { data: categories } = useCategories();
  const { user } = useAuth();
  const { toast } = useToast();

  const [txType, setTxType] = useState<"cash_in" | "cash_out">(defaultType);
  const [selectedBizId, setSelectedBizId] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showNewBook, setShowNewBook] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  
  const [txDate, setTxDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Reset all state whenever the modal opens (Radix doesn't call onOpenChange(true)
  // when the open prop is set externally, so we watch the prop directly)
  useEffect(() => {
    if (open) {
      setTxType(defaultType);
      setSelectedBizId(selectedBusinessId || "");
      setSelectedAccountId("");
      setSelectedCategory("");
      setReceiptFile(null);
      setShowNewBook(false);
      setNewBookName("");
      setTxDate(new Date());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: modalAccounts } = useAccounts(selectedBizId || undefined);
  const balance = useAccountBalance(selectedAccountId || undefined);
  const createTx = useCreateTransaction();
  const createAccount = useCreateAccount();

  const filteredCategories = categories?.filter((c) =>
    txType === "cash_in" ? c.type === "income" : c.type === "expense"
  );

  const handleOpenChange = (val: boolean) => {
    onOpenChange(val);
  };

  const handleCreateBook = async () => {
    if (!newBookName.trim() || !selectedBizId) return;
    try {
      const newAccount = await createAccount.mutateAsync({
        business_id: selectedBizId,
        name: newBookName.trim(),
      });
      setSelectedAccountId(newAccount.id);
      setShowNewBook(false);
      setNewBookName("");
      toast({ title: "Book created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAccountId) {
      toast({ title: "Please select a book", variant: "destructive" });
      return;
    }
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
        account_id: selectedAccountId,
        type: txType,
        amount,
        category: form.get("category") as string,
        description: form.get("description") as string,
        customer_name: form.get("customer_name") as string,
        customer_detail: form.get("customer_detail") as string,
        receipt_url,
        transaction_date: format(txDate, "yyyy-MM-dd"),
        balance_after: newBalance,
      });
      handleOpenChange(false);
      toast({ title: "Transaction recorded!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-3">
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
        <Label className="text-xs">Business</Label>
        <Select value={selectedBizId} onValueChange={(v) => { setSelectedBizId(v); setSelectedAccountId(""); }}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select business" /></SelectTrigger>
          <SelectContent>
            {businesses?.map((b) => (
              <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Book</Label>
          {selectedBizId && !showNewBook && (
            <button
              type="button"
              onClick={() => setShowNewBook(true)}
              className="text-[11px] text-primary font-medium flex items-center gap-0.5 hover:underline"
            >
              <Plus className="w-3 h-3" /> Add new book
            </button>
          )}
        </div>
        {showNewBook ? (
          <div className="space-y-2 p-3 rounded-lg bg-secondary/50 border border-border">
            <Input
              value={newBookName}
              onChange={(e) => setNewBookName(e.target.value)}
              placeholder="Book name (e.g. Main Cash)"
              className="h-8 text-xs"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs flex-1"
                disabled={!newBookName.trim() || createAccount.isPending}
                onClick={handleCreateBook}
              >
                {createAccount.isPending ? "Creating..." : "Create Book"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => { setShowNewBook(false); setNewBookName(""); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={!selectedBizId}>
            <SelectTrigger className="h-9"><SelectValue placeholder={selectedBizId ? (modalAccounts?.length ? "Select book" : "No books — add one above") : "Select business first"} /></SelectTrigger>
            <SelectContent>
              {modalAccounts?.map((a) => (
                <SelectItem key={a.id} value={a.id} className="text-xs">{a.name} ({a.type})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Amount (₦)</Label>
        <Input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" className="h-9" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Category</Label>
        <Select name="category" required>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {filteredCategories?.map((c) => (
              <SelectItem key={c.id} value={c.name} className="text-xs">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn("w-full h-9 justify-start text-left text-sm font-normal", !txDate && "text-muted-foreground")}
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              {txDate ? format(txDate, "dd MMM yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={txDate}
              onSelect={(d) => d && setTxDate(d)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
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
      <div className="pt-2">
        <Button type="submit" size="sm" className="w-full" disabled={createTx.isPending || uploading || !selectedAccountId}>
          {uploading ? "Uploading..." : createTx.isPending ? "Saving..." : "Save Transaction"}
        </Button>
      </div>
    </form>
  );

  const isMobile = useIsMobile();

  

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom" shouldScaleBackground={false}>
        <DrawerContent className="flex flex-col" style={{ maxHeight: "calc(92dvh - 56px)", marginBottom: "56px" }} onOpenAutoFocus={(e) => e.preventDefault()}>
          <DrawerHeader className="pb-2 pt-2 shrink-0">
            <DrawerTitle className="text-[15px]">
              {txType === "cash_in" ? "Cash In" : "Cash Out"}
            </DrawerTitle>
          </DrawerHeader>
          <div
            className="px-4 overflow-y-auto overscroll-contain flex-1 min-h-0"
            onFocusCapture={(e) => {
              setTimeout(() => {
                (e.target as HTMLElement)?.scrollIntoView?.({ block: "center", behavior: "smooth" });
              }, 350);
            }}
          >
            <form id="cash-modal-form-mobile" onSubmit={handleSubmit} className="space-y-3 pb-2">
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
                <Label className="text-xs">Business</Label>
                <select
                  value={selectedBizId}
                  onChange={(e) => { setSelectedBizId(e.target.value); setSelectedAccountId(""); }}
                  className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="" disabled>Select business</option>
                  {businesses?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Book</Label>
                  {selectedBizId && !showNewBook && (
                    <button
                      type="button"
                      onClick={() => setShowNewBook(true)}
                      className="text-[11px] text-primary font-medium flex items-center gap-0.5 hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Add new book
                    </button>
                  )}
                </div>
                {showNewBook ? (
                  <div className="space-y-2 p-3 rounded-lg bg-secondary/50 border border-border">
                    <Input
                      value={newBookName}
                      onChange={(e) => setNewBookName(e.target.value)}
                      placeholder="Book name (e.g. Main Cash)"
                      className="h-8 text-xs"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        disabled={!newBookName.trim() || createAccount.isPending}
                        onClick={handleCreateBook}
                      >
                        {createAccount.isPending ? "Creating..." : "Create Book"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => { setShowNewBook(false); setNewBookName(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    disabled={!selectedBizId}
                    className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>{selectedBizId ? (modalAccounts?.length ? "Select book" : "No books — add one above") : "Select business first"}</option>
                    {modalAccounts?.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Amount (₦)</Label>
                <Input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <select
                  name="category"
                  required
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="" disabled>Select category</option>
                  {filteredCategories?.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
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
                <Input
                  type="date"
                  className="h-9"
                  value={format(txDate, "yyyy-MM-dd")}
                  onChange={(e) => e.target.value && setTxDate(new Date(e.target.value + "T00:00:00"))}
                />
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
          </div>
          {/* Pinned save button always visible at the bottom */}
          <div className="px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shrink-0 border-t border-border bg-background">
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={createTx.isPending || uploading || !selectedAccountId}
              form="cash-modal-form-mobile"
            >
              {uploading ? "Uploading..." : createTx.isPending ? "Saving..." : "Save Transaction"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[15px]">
            {txType === "cash_in" ? "Cash In" : "Cash Out"}
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}

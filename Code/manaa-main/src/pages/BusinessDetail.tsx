import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useBusinesses, useAccounts, useCreateAccount, useDeleteAccount, useDeleteBusiness, useUpdateAccount,
} from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BookOpen, Plus, ChevronRight, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import PageHeader from "@/components/PageHeader";
import SubPageTabs from "@/components/SubPageTabs";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function BusinessDetailPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data: businesses } = useBusinesses();
  const { data: accounts, isLoading } = useAccounts(businessId);
  const createAcc = useCreateAccount();
  const deleteAcc = useDeleteAccount();
  const updateAcc = useUpdateAccount();
  const deleteBiz = useDeleteBusiness();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);
  const [editBook, setEditBook] = useState<{ id: string; name: string; initial_balance: number } | null>(null);
  const qc = useQueryClient();

  // Realtime subscription for accounts
  useEffect(() => {
    if (!businessId) return;
    const channel = supabase
      .channel(`accounts-${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter: `business_id=eq.${businessId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["accounts", businessId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessId, qc]);

  const business = businesses?.find((b) => b.id === businessId);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    try {
      await createAcc.mutateAsync({
        business_id: businessId!,
        name: name,
        initial_balance: parseFloat(form.get("balance") as string) || 0,
      });
      setOpen(false);
      toast({ title: "Book created!" });
    } catch (err: any) {
      if (err.message?.includes("Upgrade to Pro")) {
        setUpgradeOpen(true);
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editBook) return;
    const form = new FormData(e.currentTarget);
    try {
      await updateAcc.mutateAsync({
        id: editBook.id,
        businessId: businessId!,
        updates: {
          name: form.get("name") as string,
          initial_balance: parseFloat(form.get("balance") as string) || 0,
        },
      });
      setEditBook(null);
      toast({ title: "Book updated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAcc.mutateAsync({ id, businessId: businessId! });
      toast({ title: "Book deleted" });
      setDeleteBookId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteBusiness = async () => {
    try {
      await deleteBiz.mutateAsync(businessId!);
      toast({ title: "Workspace deleted" });
      navigate("/businesses");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title={business?.name || "Workspace"}
        subtitle={`${accounts?.length || 0} ${(accounts?.length || 0) === 1 ? "book" : "books"}`}
      >
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-xs font-medium text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Workspace?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{business?.name}" and all its books, transactions, and data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteBusiness} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Workspace
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs font-medium">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> New Book
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base">Create Book</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Book Name</Label>
                  <Input name="name" required placeholder="e.g. Main Cash" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opening Balance (₦)</Label>
                  <Input name="balance" type="number" step="0.01" defaultValue="0" className="h-9" />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="submit" size="sm" className="w-full h-9" disabled={createAcc.isPending}>
                    {createAcc.isPending ? "Creating..." : "Create Book"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      {/* Sub-page tabs */}
      <div className="px-4 sm:px-6 pt-4">
        <SubPageTabs tabs={[
          { to: `/businesses/${businessId}`, label: "Books" },
          { to: `/businesses/${businessId}/bills`, label: "Bills" },
        ]} />
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : !accounts?.length ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-5">
              <BookOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium text-sm mb-1">No books yet</p>
            <p className="text-muted-foreground text-xs mb-6">Create your first book to start tracking transactions</p>
            <Button size="sm" className="h-8 text-xs" onClick={() => setOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Book
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center hover:bg-secondary/40 transition-colors">
                <Link
                  to={`/businesses/${businessId}/accounts/${acc.id}`}
                  className="flex items-center gap-3.5 flex-1 px-4 py-3.5 min-w-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{acc.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{acc.type.replace("_", " ")}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                </Link>
                <div className="flex items-center gap-1 mr-3 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditBook({ id: acc.id, name: acc.name, initial_balance: acc.initial_balance })}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteBookId(acc.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />

      {/* Edit Book Dialog */}
      <Dialog open={!!editBook} onOpenChange={(o) => !o && setEditBook(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Book</DialogTitle>
          </DialogHeader>
          {editBook && (
            <form onSubmit={handleEdit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Book Name</Label>
                <Input name="name" required defaultValue={editBook.name} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opening Balance (₦)</Label>
                <Input name="balance" type="number" step="0.01" defaultValue={editBook.initial_balance} className="h-9" />
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" size="sm" className="w-full h-9" disabled={updateAcc.isPending}>
                  {updateAcc.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Book Confirmation */}
      <AlertDialog open={!!deleteBookId} onOpenChange={(open) => !open && setDeleteBookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this book and all its transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBookId && handleDelete(deleteBookId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Book
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

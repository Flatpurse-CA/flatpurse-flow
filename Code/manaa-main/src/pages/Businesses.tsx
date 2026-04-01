import { useState, useEffect } from "react";
import { useBusinesses, useCreateBusiness, useDeleteBusiness } from "@/hooks/useData";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Building2, Plus, ArrowRight, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import UpgradeModal from "@/components/UpgradeModal";

export default function BusinessesPage() {
  const { data: businesses, isLoading } = useBusinesses();
  const createBiz = useCreateBusiness();
  const deleteBiz = useDeleteBusiness();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open create dialog when navigated with ?new=true
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createBiz.mutateAsync({
        name: form.get("name") as string,
        description: form.get("description") as string,
      });
      setOpen(false);
      toast({ title: "Business created!" });
    } catch (err: any) {
      if (err.message?.includes("Upgrade to Pro")) {
        setUpgradeOpen(true);
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this workspace and all its data?")) return;
    try {
      await deleteBiz.mutateAsync(id);
      toast({ title: "Business deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Workspaces" subtitle="Manage your personal or business finances">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Create New Workspace</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Workspace Name</Label>
                <Input name="name" required placeholder="e.g. Business Name, Personal, Freelance Work" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description (optional)</Label>
                <Textarea name="description" placeholder="What is this workspace for?" className="min-h-[60px]" />
              </div>
              <DialogFooter>
                <Button type="submit" size="sm" disabled={createBiz.isPending}>
                  {createBiz.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="px-4 sm:px-6">

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : !businesses?.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
         <p className="text-sm font-medium mb-1">Create a workspace</p>
          <p className="text-muted-foreground text-xs mb-4">Manage your personal or business finances</p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Get started
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {businesses.map((biz) => (
            <Card key={biz.id} className="group hover:bg-secondary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <Link to={`/businesses/${biz.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-9 w-9 rounded-md flex-shrink-0">
                    <AvatarImage src={biz.logo_url || undefined} alt={biz.name} className="object-cover" />
                    <AvatarFallback className="rounded-md bg-secondary text-muted-foreground text-xs font-semibold">
                      {biz.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{biz.name}</p>
                    {biz.description && <p className="text-xs text-muted-foreground line-clamp-1">{biz.description}</p>}
                  </div>
                </Link>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(biz.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Link to={`/businesses/${biz.id}`}>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

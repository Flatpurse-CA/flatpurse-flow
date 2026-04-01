import { useState } from "react";
import { useStoreContext } from "./StoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, Building2, Trash2 } from "lucide-react";

export default function BranchesPage() {
  const { selectedBusinessId } = useStoreContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches", selectedBusinessId],
    queryFn: async () => {
      if (!selectedBusinessId) return [];
      const { data, error } = await supabase
        .from("branches")
        .select("*, warehouses(name)")
        .eq("business_id", selectedBusinessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBusinessId,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses-list", selectedBusinessId],
    queryFn: async () => {
      if (!selectedBusinessId) return [];
      const { data, error } = await supabase
        .from("warehouses")
        .select("id, name")
        .eq("business_id", selectedBusinessId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBusinessId,
  });

  const createBranch = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from("branches").insert({
        business_id: selectedBusinessId!,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        manager_name: formData.manager_name,
        warehouse_id: formData.warehouse_id === "none" ? null : formData.warehouse_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setCreateOpen(false);
      toast({ title: "Branch created!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("branches").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("branches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({ title: "Branch deleted" });
    },
  });

  if (!selectedBusinessId) return <p className="text-sm text-muted-foreground">Select a workspace first.</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Branches</h2>
          <p className="text-sm text-muted-foreground">{branches.length} location{branches.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Branch</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Branch</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createBranch.mutate(Object.fromEntries(fd));
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label className="text-xs">Branch Name</Label>
                <Input name="name" required className="h-9" placeholder="e.g. Lagos Island Branch" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input name="address" className="h-9" placeholder="123 Main St, Lagos" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input name="phone" className="h-9" placeholder="+234..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Manager Name</Label>
                <Input name="manager_name" className="h-9" placeholder="Branch manager" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Linked Warehouse</Label>
                <Select name="warehouse_id" defaultValue="none">
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {warehouses.map((w: any) => (
                      <SelectItem key={w.id} value={w.id} className="text-xs">{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createBranch.isPending}>
                {createBranch.isPending ? "Creating..." : "Create Branch"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <MapPin className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No branches yet</p>
          <p className="text-xs text-muted-foreground">Add your first branch location</p>
        </div>
      ) : (
        <div className="space-y-2">
          {branches.map((b: any) => (
            <Card key={b.id}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    <Badge variant="outline" className={`text-[10px] ${b.is_active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                      {b.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{b.address || "No address"}</p>
                  {b.manager_name && <p className="text-xs text-muted-foreground">Manager: {b.manager_name}</p>}
                  {b.warehouses?.name && <p className="text-[10px] text-muted-foreground">Warehouse: {b.warehouses.name}</p>}
                </div>
                <Switch
                  checked={b.is_active}
                  onCheckedChange={(v) => toggleActive.mutate({ id: b.id, is_active: v })}
                />
                <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => deleteBranch.mutate(b.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useStoreContext } from "./StoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, UserPlus, Users, Trash2, Shield, Eye, Edit3 } from "lucide-react";

const ROLES = [
  { value: "manager", label: "Manager", icon: Shield, description: "Full access to all features" },
  { value: "cashier", label: "Cashier", icon: Edit3, description: "Can create orders and sales" },
  { value: "viewer", label: "Viewer", icon: Eye, description: "View-only access" },
];

export default function TeamPage() {
  const { selectedBusinessId } = useStoreContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members", selectedBusinessId],
    queryFn: async () => {
      if (!selectedBusinessId) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("business_id", selectedBusinessId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBusinessId,
  });

  const inviteMember = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from("team_members").insert({
        business_id: selectedBusinessId!,
        email: formData.email,
        name: formData.name,
        role: formData.role,
        invited_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setInviteOpen(false);
      toast({ title: "Team member invited!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Member removed" });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase.from("team_members").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Role updated" });
    },
  });

  if (!selectedBusinessId) return <p className="text-sm text-muted-foreground">Select a workspace first.</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Team</h2>
          <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><UserPlus className="w-4 h-4 mr-1" /> Invite</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                inviteMember.mutate({ email: fd.get("email"), name: fd.get("name"), role: fd.get("role") || "viewer" });
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input name="name" required className="h-9" placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input name="email" type="email" required className="h-9" placeholder="john@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Select name="role" defaultValue="viewer">
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">{r.label} — {r.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={inviteMember.isPending}>
                {inviteMember.isPending ? "Inviting..." : "Send Invite"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Roles explanation */}
      <div className="grid grid-cols-3 gap-2">
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.value}>
              <CardContent className="py-3 text-center space-y-1">
                <Icon className="w-5 h-5 mx-auto text-muted-foreground" />
                <p className="text-xs font-semibold">{r.label}</p>
                <p className="text-[10px] text-muted-foreground">{r.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Members list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No team members yet</p>
          <p className="text-xs text-muted-foreground">Invite your first team member to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m: any) => (
            <Card key={m.id}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {(m.name || m.email || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${m.status === "invited" ? "bg-yellow-500/10 text-yellow-600" : "bg-green-500/10 text-green-600"}`}>
                  {m.status}
                </Badge>
                <Select value={m.role} onValueChange={(v) => updateRole.mutate({ id: m.id, role: v })}>
                  <SelectTrigger className="h-7 text-[10px] w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => removeMember.mutate(m.id)}>
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

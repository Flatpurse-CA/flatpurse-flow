import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateDeal, useDeleteDeal, useDealStages, useContacts } from "@/hooks/useData";
import { ArrowLeft, Edit, Trash2, Target, User, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Deal } from "@/hooks/useData";

function useDealById(dealId: string | undefined) {
  return useQuery({
    queryKey: ["deal", dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").eq("id", dealId!).single();
      if (error) throw error;
      return data as Deal;
    },
  });
}

export default function DealDetail() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const { data: deal, isLoading } = useDealById(dealId);
  const { data: stages } = useDealStages(deal?.business_id);
  const { data: contacts } = useContacts(deal?.business_id);
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();

  const fmt = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!deal) {
    return (
      <div className="text-center py-16">
        <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Deal not found</p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate("/crm/pipeline")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to pipeline
        </Button>
      </div>
    );
  }

  const stage = stages?.find((s) => s.id === deal.stage_id);
  const contact = contacts?.find((c) => c.id === deal.contact_id);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await updateDeal.mutateAsync({
        id: deal.id,
        title: form.get("title") as string,
        value: parseFloat(form.get("value") as string) || 0,
        description: form.get("description") as string,
        stage_id: form.get("stage_id") as string,
        contact_id: (form.get("contact_id") as string) || null,
        expected_close_date: (form.get("close_date") as string) || null,
      });
      setEditOpen(false);
      toast({ title: "Deal updated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeal.mutateAsync({ id: deal.id, businessId: deal.business_id });
      navigate("/crm/pipeline");
      toast({ title: "Deal deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const moveDeal = async (stageId: string) => {
    try {
      await updateDeal.mutateAsync({ id: deal.id, stage_id: stageId });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/crm/pipeline")} className="text-muted-foreground -ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Pipeline
      </Button>

      {/* Deal header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold">{deal.title}</h2>
          <div className="flex items-center gap-3 mt-1">
            {stage && (
              <Badge style={{ backgroundColor: stage.color, color: "white" }} className="text-xs">
                {stage.name}
              </Badge>
            )}
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(Number(deal.value))}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Edit className="w-3.5 h-3.5 mr-1.5" />Edit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Deal</DialogTitle></DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Deal Title</Label>
                  <Input name="title" defaultValue={deal.title} required className="h-9" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Value</Label>
                    <Input name="value" type="number" step="0.01" defaultValue={deal.value} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Stage</Label>
                    <Select name="stage_id" defaultValue={deal.stage_id}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {stages?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Contact</Label>
                  <Select name="contact_id" defaultValue={deal.contact_id || undefined}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select contact" /></SelectTrigger>
                    <SelectContent>
                      {contacts?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Expected Close Date</Label>
                  <Input name="close_date" type="date" defaultValue={deal.expected_close_date || ""} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea name="description" defaultValue={deal.description || ""} className="min-h-[60px]" />
                </div>
                <DialogFooter>
                  <Button type="submit" size="sm" disabled={updateDeal.isPending}>Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Value:</span>
              <span className="font-medium">{fmt(Number(deal.value))}</span>
            </div>
            {deal.expected_close_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expected close:</span>
                <span className="font-medium">{format(new Date(deal.expected_close_date), "MMM d, yyyy")}</span>
              </div>
            )}
            {contact && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Contact:</span>
                <Link to={`/crm/contacts/${contact.id}`} className="font-medium hover:underline">{contact.name}</Link>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{format(new Date(deal.created_at), "MMM d, yyyy")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Move Stage</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stages?.map((s) => (
                <Button
                  key={s.id}
                  variant={s.id === deal.stage_id ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  style={s.id === deal.stage_id ? { backgroundColor: s.color, borderColor: s.color } : {}}
                  onClick={() => moveDeal(s.id)}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {deal.description && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

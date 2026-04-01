import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  useDealStages, useCreateDealStage, useDeleteDealStage, useUpdateDealStage, useDeals, useCreateDeal, useUpdateDeal, useDeleteDeal, useContacts,
  useDealActivities, useCreateDealActivity,
} from "@/hooks/useData";
import type { Deal } from "@/hooks/useData";
import {
  Plus, Trash2, Target, AlertCircle, Calendar, ChevronRight, MoveRight,
  Phone, MessageCircle, MapPin, FileText, StickyNote, Flame, Thermometer, Snowflake, X, Zap, Pencil, GripVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

const PRIORITY_CONFIG = {
  hot: { label: "Hot", icon: Flame, color: "text-red-500", bg: "bg-red-500/10 text-red-600 border-red-200" },
  warm: { label: "Warm", icon: Thermometer, color: "text-amber-500", bg: "bg-amber-500/10 text-amber-600 border-amber-200" },
  cold: { label: "Cold", icon: Snowflake, color: "text-blue-400", bg: "bg-blue-400/10 text-blue-500 border-blue-200" },
};

const ACTIVITY_TYPES = [
  { value: "call", label: "Called", icon: Phone },
  { value: "whatsapp", label: "Sent WhatsApp", icon: MessageCircle },
  { value: "visit", label: "Visited", icon: MapPin },
  { value: "proposal", label: "Sent Proposal", icon: FileText },
  { value: "note", label: "Note", icon: StickyNote },
];

const LOST_REASONS = [
  "Too expensive",
  "Went to competitor",
  "No budget",
  "Ghosted / No response",
  "Bad timing",
  "Other",
];

export default function CRMPipeline() {
  const { businessId } = useOutletContext<{ businessId: string | undefined }>();
  const { data: stages } = useDealStages(businessId);
  const { data: deals } = useDeals(businessId);
  const { data: contacts } = useContacts(businessId);
  const createStage = useCreateDealStage();
  const deleteStage = useDeleteDealStage();
  const updateStage = useUpdateDealStage();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const createActivity = useCreateDealActivity();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stageOpen, setStageOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [moveDealId, setMoveDealId] = useState<string | null>(null);
  const [detailDeal, setDetailDeal] = useState<Deal | null>(null);
  const [lostReasonOpen, setLostReasonOpen] = useState(false);
  const [lostDealId, setLostDealId] = useState<string | null>(null);
  const [activityNote, setActivityNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ type: "stage" | "deal"; id: string; name: string } | null>(null);
  const [editStage, setEditStage] = useState<{ id: string; name: string; color: string } | null>(null);

  // Auto-select first stage
  useEffect(() => {
    if (stages?.length && !selectedStageId) {
      setSelectedStageId(stages[0].id);
    }
  }, [stages, selectedStageId]);

  // Realtime subscription for deals
  useEffect(() => {
    if (!businessId) return;
    const channel = supabase
      .channel(`deals-realtime-${businessId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deals", filter: `business_id=eq.${businessId}` },
        () => { queryClient.invalidateQueries({ queryKey: ["deals", businessId] }); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessId, queryClient]);

  const DEFAULT_STAGES = [
    { name: "New Lead", color: "#6366f1", position: 0 },
    { name: "Contacted", color: "#3b82f6", position: 1 },
    { name: "Qualified", color: "#f59e0b", position: 2 },
    { name: "Proposal Sent", color: "#8b5cf6", position: 3 },
    { name: "Negotiation", color: "#ec4899", position: 4 },
    { name: "Won", color: "#22c55e", position: 5 },
    { name: "Lost", color: "#ef4444", position: 6 },
  ];

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  if (!businessId) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Select a business first</p>
      </div>
    );
  }

  const seedDemoStages = async () => {
    setSeeding(true);
    try {
      for (const stage of DEFAULT_STAGES) {
        await createStage.mutateAsync({ business_id: businessId, name: stage.name, position: stage.position, color: stage.color });
      }
      toast({ title: "Pipeline stages created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSeeding(false); }
  };

  const handleCreateStage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createStage.mutateAsync({
        business_id: businessId,
        name: form.get("name") as string,
        position: stages?.length ?? 0,
        color: (form.get("color") as string) || "#6366f1",
      });
      setStageOpen(false);
      toast({ title: "Stage created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateDeal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createDeal.mutateAsync({
        business_id: businessId,
        stage_id: form.get("stage_id") as string,
        title: form.get("title") as string,
        value: parseFloat(form.get("value") as string) || 0,
        description: form.get("description") as string,
        contact_id: (form.get("contact_id") as string) || null,
        expected_close_date: (form.get("close_date") as string) || null,
        priority: (form.get("priority") as string) || "warm",
      });
      setDealOpen(false);
      toast({ title: "Deal created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleMoveDeal = async (dealId: string, newStageId: string) => {
    const lostStage = stages?.find((s) => s.name.toLowerCase() === "lost");
    if (lostStage && newStageId === lostStage.id) {
      setLostDealId(dealId);
      setLostReasonOpen(true);
      setMoveDealId(null);
      return;
    }
    try {
      await updateDeal.mutateAsync({ id: dealId, stage_id: newStageId });
      setMoveDealId(null);
      toast({ title: "Deal moved!" });
    } catch (err: any) {
      toast({ title: "Failed to move deal", description: err.message, variant: "destructive" });
    }
  };

  const handleLostDeal = async (reason: string) => {
    if (!lostDealId) return;
    const lostStage = stages?.find((s) => s.name.toLowerCase() === "lost");
    if (!lostStage) return;
    try {
      await updateDeal.mutateAsync({ id: lostDealId, stage_id: lostStage.id, lost_reason: reason } as any);
      await createActivity.mutateAsync({
        deal_id: lostDealId, business_id: businessId, type: "note",
        title: `Deal lost: ${reason}`,
      });
      setLostReasonOpen(false);
      setLostDealId(null);
      toast({ title: "Deal marked as lost" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleQuickActivity = async (dealId: string, type: string, label: string) => {
    try {
      await createActivity.mutateAsync({
        deal_id: dealId, business_id: businessId, type, title: label,
        description: activityNote || undefined,
      });
      setActivityNote("");
      toast({ title: `${label} logged!` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

   const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    // Stage reordering
    if (result.type === "STAGE") {
      if (result.source.index === result.destination.index) return;
      const reordered = Array.from(stages || []);
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, moved);
      // Update positions in DB
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].position !== i) {
          try {
            await updateStage.mutateAsync({ id: reordered[i].id, businessId: businessId!, position: i });
          } catch {}
        }
      }
      return;
    }

    // Deal moving between stages
    const dealId = result.draggableId;
    const newStageId = result.destination.droppableId;
    if (newStageId === result.source.droppableId) return;
    await handleMoveDeal(dealId, newStageId);
  };
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === "stage") {
        await deleteStage.mutateAsync({ id: confirmDelete.id, businessId: businessId! });
        if (selectedStageId === confirmDelete.id) {
          setSelectedStageId(stages?.find((s) => s.id !== confirmDelete.id)?.id || null);
        }
        toast({ title: "Stage deleted" });
      } else {
        await deleteDeal.mutateAsync({ id: confirmDelete.id, businessId: businessId! });
        toast({ title: "Deal deleted" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setConfirmDelete(null);
    }
  };
  const handleEditStage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editStage) return;
    const form = new FormData(e.currentTarget);
    try {
      await updateStage.mutateAsync({
        id: editStage.id,
        businessId: businessId!,
        name: form.get("name") as string,
        color: form.get("color") as string,
      });
      setEditStage(null);
      toast({ title: "Stage updated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handlePriorityChange = async (dealId: string, priority: string) => {
    try {
      await updateDeal.mutateAsync({ id: dealId, priority } as any);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (!stages?.length) {
    return (
      <div className="text-center py-12">
        <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium mb-1">Set up your sales pipeline</p>
        <p className="text-muted-foreground text-xs mb-6 max-w-xs mx-auto">
          Start with recommended stages or create your own.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" onClick={seedDemoStages} disabled={seeding}>
            {seeding ? "Creating..." : "Use Recommended Stages"}
          </Button>
          <Dialog open={stageOpen} onOpenChange={setStageOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> Custom Stage</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Pipeline Stage</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateStage} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Stage Name</Label>
                  <Input name="name" required placeholder="e.g. New Lead" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Color</Label>
                  <Input name="color" type="color" defaultValue="#6366f1" className="h-9 w-20" />
                </div>
                <DialogFooter>
                  <Button type="submit" size="sm" disabled={createStage.isPending}>Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  const totalDeals = deals?.length || 0;
  const totalValue = deals?.reduce((s, d) => s + Number(d.value), 0) || 0;
  const selectedStage = stages.find((s) => s.id === selectedStageId);
  const selectedDeals = deals?.filter((d) => d.stage_id === selectedStageId) || [];
  const selectedStageValue = selectedDeals.reduce((s, d) => s + Number(d.value), 0);

  return (
    <div className="space-y-4 overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{totalDeals}</span> deals · <span className="font-semibold text-foreground">{fmt(totalValue)}</span> total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={dealOpen} onOpenChange={setDealOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> New Deal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Deal</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateDeal} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Deal Title</Label>
                  <Input name="title" required placeholder="Website redesign" className="h-9" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Value (₦)</Label>
                    <Input name="value" type="number" step="0.01" placeholder="0.00" className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Priority</Label>
                    <Select name="priority" defaultValue="warm">
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">🔴 Hot</SelectItem>
                        <SelectItem value="warm">🟡 Warm</SelectItem>
                        <SelectItem value="cold">🔵 Cold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Stage</Label>
                    <Select name="stage_id" required defaultValue={selectedStageId || undefined}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select stage" /></SelectTrigger>
                      <SelectContent>
                        {stages.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Close Date</Label>
                    <Input name="close_date" type="date" className="h-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Contact (optional)</Label>
                  <Select name="contact_id">
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select contact" /></SelectTrigger>
                    <SelectContent>
                      {contacts?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea name="description" placeholder="Notes about this deal..." className="min-h-[40px]" />
                </div>
                <DialogFooter>
                  <Button type="submit" size="sm" disabled={createDeal.isPending}>Create Deal</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={stageOpen} onOpenChange={setStageOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> Add Stage</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Pipeline Stage</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateStage} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Stage Name</Label>
                  <Input name="name" required placeholder="e.g. Negotiation" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Color</Label>
                  <Input name="color" type="color" defaultValue="#6366f1" className="h-9 w-20" />
                </div>
                <DialogFooter>
                  <Button type="submit" size="sm" disabled={createStage.isPending}>Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={seedDemoStages} disabled={seeding}>
            <Zap className="w-4 h-4 mr-2" /> {seeding ? "Creating..." : "Recommended Stages"}
          </Button>
        </div>
      </div>

      {/* Split panel layout */}
      <DragDropContext onDragEnd={handleDragEnd}>

      {/* MOBILE: Horizontal scrollable stage pills */}
      <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 pb-3">
        <div className="flex gap-2 min-w-max">
          {stages.map((stage) => {
            const count = deals?.filter((d) => d.stage_id === stage.id).length || 0;
            const isActive = selectedStageId === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStageId(stage.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  isActive
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                }`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: isActive ? undefined : (stage.color || undefined) }} />
                {stage.name}
                <span className={`text-[10px] font-bold ${isActive ? "text-background/70" : "text-muted-foreground/60"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:min-h-[500px]">
        {/* LEFT: Stage list (desktop only) */}
        <div className="hidden md:block w-48 md:w-56 flex-shrink-0 border border-border rounded-xl bg-muted/30">
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stages</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-snug">Steps in your sales process (e.g. Lead → Won)</p>
          </div>
           <ScrollArea className="h-[460px]">
            <Droppable droppableId="stages-list" type="STAGE">
              {(stageListProvided) => (
                <div ref={stageListProvided.innerRef} {...stageListProvided.droppableProps} className="p-1.5 space-y-1.5">
                  {stages.map((stage, index) => {
                    const count = deals?.filter((d) => d.stage_id === stage.id).length || 0;
                    const isActive = selectedStageId === stage.id;
                    return (
                      <Draggable draggableId={`stage-${stage.id}`} index={index} key={stage.id}>
                        {(dragProvided, dragSnapshot) => (
                          <Droppable droppableId={stage.id} type="DEAL">
                            {(dropProvided, dropSnapshot) => (
                              <div
                                ref={(el) => { dragProvided.innerRef(el); dropProvided.innerRef(el); }}
                                {...dragProvided.draggableProps}
                                {...dropProvided.droppableProps}
                              >
                                <button
                                  onClick={() => setSelectedStageId(stage.id)}
                                  className={`w-full flex items-center gap-2 px-2 py-2.5 text-left transition-all rounded-lg border group ${
                                    isActive
                                      ? "bg-accent border-primary/30 shadow-sm text-foreground"
                                      : "bg-card border-border hover:border-primary/20 hover:shadow-sm text-muted-foreground"
                                  } ${dropSnapshot.isDraggingOver ? "ring-1 ring-primary/40 bg-primary/5" : ""}
                                  ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`}
                                >
                                  <div {...dragProvided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-0.5 -ml-0.5">
                                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
                                  </div>
                                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color || undefined }} />
                                  <span className="text-xs font-medium truncate flex-1">{stage.name}</span>
                                  <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold rounded-full flex-shrink-0">
                                    {count}
                                  </Badge>
                                </button>
                                <div className="hidden">{dropProvided.placeholder}</div>
                              </div>
                            )}
                          </Droppable>
                        )}
                      </Draggable>
                    );
                  })}
                  {stageListProvided.placeholder}
                </div>
              )}
            </Droppable>
          </ScrollArea>
        </div>

        {/* RIGHT: Deal cards for selected stage */}
        <div className="flex-1 flex flex-col bg-background border border-border rounded-xl overflow-hidden">
          {selectedStage ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selectedStage.color || undefined }} />
                <h2 className="text-sm font-bold text-foreground">{selectedStage.name}</h2>
                <Badge variant="secondary" className="text-[10px]">{selectedDeals.length} deals</Badge>
                {selectedStageValue > 0 && (
                  <span className="text-xs text-muted-foreground">{fmt(selectedStageValue)}</span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setEditStage({ id: selectedStage.id, name: selectedStage.name, color: selectedStage.color || "#6366f1" })}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmDelete({ type: "stage", id: selectedStage.id, name: selectedStage.name })}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <Droppable droppableId={selectedStageId || "none"} type="DEAL">
                  {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-4 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? "bg-accent/20" : ""}`}
                >
                  {selectedDeals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Target className="w-6 h-6 text-muted-foreground/40 mb-2" />
                      <p className="text-xs text-muted-foreground">No deals in this stage</p>
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => setDealOpen(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Deal
                      </Button>
                    </div>
                  ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedDeals.map((deal, index) => {
                      const contact = contacts?.find((c) => c.id === deal.contact_id);
                      const isMoving = moveDealId === deal.id;
                      const priority = PRIORITY_CONFIG[(deal.priority as keyof typeof PRIORITY_CONFIG) || "warm"];
                      const PriorityIcon = priority.icon;
                      return (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`group rounded-lg border border-border bg-card hover:shadow-md transition-all overflow-hidden cursor-grab ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-primary/30 rotate-1" : ""}`}
                          onClick={() => !dragSnapshot.isDragging && setDetailDeal(deal)}
                        >
                          <div className="h-[2px]" style={{ backgroundColor: selectedStage.color || "hsl(var(--primary))" }} />
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <PriorityIcon className={`w-3.5 h-3.5 flex-shrink-0 ${priority.color}`} />
                                  <span className="text-sm font-semibold text-foreground truncate">{deal.title}</span>
                                </div>
                                <p className="text-xs font-bold mt-0.5" style={{ color: selectedStage.color || undefined }}>
                                  {fmt(Number(deal.value))}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  title="Move to another stage"
                                  onClick={() => setMoveDealId(isMoving ? null : deal.id)}
                                >
                                  <MoveRight className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                  onClick={() => setConfirmDelete({ type: "deal", id: deal.id, name: deal.title })}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Move deal dropdown */}
                            {isMoving && (
                              <div className="mt-2 p-2 rounded-md border border-border bg-muted/50 space-y-1" onClick={(e) => e.stopPropagation()}>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Move to:</p>
                                {stages.filter((s) => s.id !== selectedStageId).map((s) => (
                                  <button
                                    key={s.id}
                                    onClick={() => handleMoveDeal(deal.id, s.id)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors text-left"
                                  >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color || undefined }} />
                                    {s.name}
                                  </button>
                                ))}
                              </div>
                            )}

                            {(contact || deal.expected_close_date || deal.description) && (
                              <div className="mt-2 space-y-1">
                                {deal.description && (
                                  <p className="text-[11px] text-muted-foreground line-clamp-2">{deal.description}</p>
                                )}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {contact && (
                                    <span className="text-[10px] bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 truncate max-w-[120px]">
                                      {contact.name}
                                    </span>
                                  )}
                                  {deal.expected_close_date && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      {format(new Date(deal.expected_close_date), "MMM d, yyyy")}
                                    </span>
                                  )}
                                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${priority.bg}`}>
                                    {priority.label}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                          )}
                        </Draggable>
                      );
                    })}
                  </div>
                  )}
                  {provided.placeholder}
                </div>
                  )}
                </Droppable>
              </ScrollArea>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              Select a stage to view deals
            </div>
          )}
        </div>
      </div>
      </DragDropContext>

      {/* Lost Reason Dialog */}
      <Dialog open={lostReasonOpen} onOpenChange={setLostReasonOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Why was this deal lost?</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {LOST_REASONS.map((reason) => (
              <Button
                key={reason}
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => handleLostDeal(reason)}
              >
                {reason}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Deal Detail Sheet */}
      <Sheet open={!!detailDeal} onOpenChange={(open) => { if (!open) setDetailDeal(null); }}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
          {detailDeal && (
            <DealDetailPanel
              deal={detailDeal}
              stages={stages}
              contacts={contacts || []}
              businessId={businessId}
              onClose={() => setDetailDeal(null)}
              onPriorityChange={handlePriorityChange}
              onQuickActivity={handleQuickActivity}
              activityNote={activityNote}
              setActivityNote={setActivityNote}
              fmt={fmt}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.type === "stage" ? "Stage" : "Deal"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{confirmDelete?.name}"? This action cannot be undone.
              {confirmDelete?.type === "stage" && " All deals in this stage will need to be moved first or they will be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Stage Dialog */}
      <Dialog open={!!editStage} onOpenChange={(open) => { if (!open) setEditStage(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stage</DialogTitle>
            <DialogDescription>Update the stage name and color.</DialogDescription>
          </DialogHeader>
          {editStage && (
            <form onSubmit={handleEditStage} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Stage Name</Label>
                <Input name="name" required defaultValue={editStage.name} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <Input name="color" type="color" defaultValue={editStage.color} className="h-9 w-20" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditStage(null)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={updateStage.isPending}>Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Deal Detail Panel ───────────────────────────────────────
function DealDetailPanel({
  deal, stages, contacts, businessId, onClose, onPriorityChange, onQuickActivity,
  activityNote, setActivityNote, fmt,
}: {
  deal: Deal;
  stages: any[];
  contacts: any[];
  businessId: string;
  onClose: () => void;
  onPriorityChange: (dealId: string, priority: string) => void;
  onQuickActivity: (dealId: string, type: string, label: string) => void;
  activityNote: string;
  setActivityNote: (v: string) => void;
  fmt: (n: number) => string;
}) {
  const { data: activities } = useDealActivities(deal.id);
  const contact = contacts.find((c: any) => c.id === deal.contact_id);
  const stage = stages.find((s: any) => s.id === deal.stage_id);
  const priority = PRIORITY_CONFIG[(deal.priority as keyof typeof PRIORITY_CONFIG) || "warm"];
  const PriorityIcon = priority.icon;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground truncate">{deal.title}</h2>
            <p className="text-lg font-bold mt-0.5" style={{ color: stage?.color || undefined }}>{fmt(Number(deal.value))}</p>
          </div>
        </div>

        {/* Priority + Stage badges */}
        <div className="flex items-center gap-2 mt-3">
          {stage && (
            <Badge variant="secondary" className="text-[10px]" style={{ borderColor: stage.color, color: stage.color }}>
              {stage.name}
            </Badge>
          )}
          <Select value={deal.priority || "warm"} onValueChange={(v) => onPriorityChange(deal.id, v)}>
            <SelectTrigger className="h-6 w-auto gap-1 border-0 bg-transparent px-1 text-xs">
              <PriorityIcon className={`w-3.5 h-3.5 ${priority.color}`} />
              <span className={priority.color}>{priority.label}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hot">🔴 Hot</SelectItem>
              <SelectItem value="warm">🟡 Warm</SelectItem>
              <SelectItem value="cold">🔵 Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info section */}
      <div className="px-5 py-3 border-b border-border space-y-2">
        {contact && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Contact</span>
            <span className="font-medium">{contact.name}</span>
          </div>
        )}
        {contact?.phone && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Phone</span>
            <a href={`tel:${contact.phone}`} className="font-medium text-primary hover:underline">{contact.phone}</a>
          </div>
        )}
        {deal.expected_close_date && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Expected Close</span>
            <span className="font-medium">{format(new Date(deal.expected_close_date), "MMM d, yyyy")}</span>
          </div>
        )}
        {deal.lost_reason && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Lost Reason</span>
            <Badge variant="destructive" className="text-[10px]">{deal.lost_reason}</Badge>
          </div>
        )}
        {deal.description && (
          <p className="text-xs text-muted-foreground pt-1">{deal.description}</p>
        )}
      </div>

      {/* Quick Activity Buttons */}
      <div className="px-5 py-3 border-b border-border">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Log Activity</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {ACTIVITY_TYPES.map((at) => {
            const Icon = at.icon;
            return (
              <Button
                key={at.value}
                variant="outline"
                size="sm"
                className="h-7 text-[11px] gap-1.5"
                onClick={() => onQuickActivity(deal.id, at.value, at.label)}
              >
                <Icon className="w-3 h-3" />
                {at.label}
              </Button>
            );
          })}
        </div>
        <Input
          placeholder="Add a note to this activity..."
          value={activityNote}
          onChange={(e) => setActivityNote(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* Activity Timeline */}
      <div className="flex-1 overflow-hidden">
        <div className="px-5 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Activity Timeline</p>
        </div>
        <ScrollArea className="h-[calc(100%-32px)]">
          <div className="px-5 pb-5">
            {!activities?.length ? (
              <p className="text-xs text-muted-foreground text-center py-6">No activities yet. Log your first one above.</p>
            ) : (
              <div className="relative space-y-0">
                {/* Timeline line */}
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                {activities.map((act, i) => {
                  const atConfig = ACTIVITY_TYPES.find((t) => t.value === act.type);
                  const Icon = atConfig?.icon || StickyNote;
                  return (
                    <div key={act.id} className="relative flex gap-3 py-2.5">
                      <div className="relative z-10 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                        <Icon className="w-2.5 h-2.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground">{act.title}</p>
                        {act.description && <p className="text-[11px] text-muted-foreground mt-0.5">{act.description}</p>}
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

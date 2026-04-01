import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateContact, useDeleteContact, useDealStages } from "@/hooks/useData";
import { ArrowLeft, Mail, Phone, Building2, Edit, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Contact, Deal, Reminder, DealStage } from "@/hooks/useData";

function useContactById(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contact", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").eq("id", contactId!).single();
      if (error) throw error;
      return data as Contact;
    },
  });
}

function useContactDeals(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contact-deals", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").eq("contact_id", contactId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
  });
}

function useContactReminders(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contact-reminders", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase.from("reminders").select("*").eq("contact_id", contactId!).order("due_date");
      if (error) throw error;
      return data as Reminder[];
    },
  });
}

export default function ContactDetail() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const { data: contact, isLoading } = useContactById(contactId);
  const { data: contactDeals } = useContactDeals(contactId);
  const { data: contactReminders } = useContactReminders(contactId);
  const { data: stages } = useDealStages(contact?.business_id);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const fmt = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!contact) {
    return (
      <div className="text-center py-16">
        <User className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Contact not found</p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate("/crm/contacts")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to contacts
        </Button>
      </div>
    );
  }

  const totalDealValue = (contactDeals || []).reduce((s, d) => s + Number(d.value), 0);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await updateContact.mutateAsync({
        id: contact.id,
        name: form.get("name") as string,
        email: form.get("email") as string,
        phone: form.get("phone") as string,
        company: form.get("company") as string,
        notes: form.get("notes") as string,
      });
      setEditOpen(false);
      toast({ title: "Contact updated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContact.mutateAsync({ id: contact.id, businessId: contact.business_id });
      navigate("/crm/contacts");
      toast({ title: "Contact deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/crm/contacts")} className="text-muted-foreground -ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Contacts
      </Button>

      {/* Contact header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-lg font-bold">{contact.name[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold">{contact.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
              {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
              {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
              {contact.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{contact.company}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Edit className="w-3.5 h-3.5 mr-1.5" />Edit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input name="name" defaultValue={contact.name} required className="h-9" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input name="email" type="email" defaultValue={contact.email || ""} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone</Label>
                    <Input name="phone" defaultValue={contact.phone || ""} className="h-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Company</Label>
                  <Input name="company" defaultValue={contact.company || ""} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Textarea name="notes" defaultValue={contact.notes || ""} className="min-h-[60px]" />
                </div>
                <DialogFooter>
                  <Button type="submit" size="sm" disabled={updateContact.isPending}>Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold">{contactDeals?.length || 0}</p>
            <p className="text-[11px] text-muted-foreground">Deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold">{fmt(totalDealValue)}</p>
            <p className="text-[11px] text-muted-foreground">Total Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold">{contactReminders?.length || 0}</p>
            <p className="text-[11px] text-muted-foreground">Tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {contact.notes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Deals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Deals ({contactDeals?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!contactDeals?.length ? (
            <p className="text-xs text-muted-foreground px-6 pb-4">No deals linked to this contact</p>
          ) : (
            <div className="divide-y divide-border">
              {contactDeals.map((deal) => {
                const stage = stages?.find((s) => s.id === deal.stage_id);
                return (
                  <Link key={deal.id} to={`/crm/deals/${deal.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{deal.title}</p>
                      {stage && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color || undefined }} />
                          {stage.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold">{fmt(Number(deal.value))}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      {(contactReminders?.length || 0) > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tasks ({contactReminders?.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {contactReminders!.map((r) => {
                const overdue = !r.is_completed && new Date(r.due_date) < new Date();
                return (
                  <div key={r.id} className="flex items-center justify-between px-6 py-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${r.is_completed ? "line-through opacity-50" : ""}`}>{r.title}</p>
                      <p className={`text-[10px] ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                        {format(new Date(r.due_date), "MMM d, h:mm a")}
                      </p>
                    </div>
                    {overdue && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Overdue</Badge>}
                    {r.is_completed && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Done</Badge>}
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

import { useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from "@/hooks/useData";
import { UserPlus, Plus, Trash2, Phone, Mail, Building2, Search, ArrowRight, UserCheck, AlertCircle, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LeadImport from "@/components/LeadImport";

export default function CRMLeads() {
  const { businessId } = useOutletContext<{ businessId: string | undefined }>();
  const { data: leads, isLoading } = useContacts(businessId, "lead");
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");

  if (!businessId) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Select a business first</p>
      </div>
    );
  }

  const filtered = leads?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createContact.mutateAsync({
        business_id: businessId,
        name: form.get("name") as string,
        email: form.get("email") as string,
        phone: form.get("phone") as string,
        company: form.get("company") as string,
        notes: form.get("notes") as string,
        status: "lead",
      });
      setOpen(false);
      toast({ title: "Lead added!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const convertToContact = async (id: string) => {
    try {
      await updateContact.mutateAsync({ id, status: "contact" });
      toast({ title: "Lead converted to contact!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1">
          <Upload className="w-4 h-4" /> Import
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input name="name" required placeholder="Jane Smith" className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input name="email" type="email" placeholder="jane@co.com" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input name="phone" placeholder="+234 xxx xxxx" className="h-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Company</Label>
                <Input name="company" placeholder="Acme Inc" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea name="notes" placeholder="How did you find this lead?" className="min-h-[40px]" />
              </div>
              <DialogFooter>
                <Button type="submit" size="sm" disabled={createContact.isPending}>Add Lead</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <LeadImport businessId={businessId} open={importOpen} onOpenChange={setImportOpen} />

      <p className="text-xs text-muted-foreground">{filtered.length} lead{filtered.length !== 1 ? "s" : ""}</p>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : !filtered.length ? (
        <div className="text-center py-16">
          <UserPlus className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{search ? "No leads match your search" : "No leads yet"}</p>
          <p className="text-muted-foreground text-xs mt-1">Add leads and convert them to contacts when qualified</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 group hover:bg-muted/30 transition-colors">
                  <Link to={`/crm/contacts/${c.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold">{c.name[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">Lead</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                        {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                        {c.company && <span className="flex items-center gap-1 hidden sm:flex"><Building2 className="w-3 h-3" />{c.company}</span>}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </Link>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] opacity-0 group-hover:opacity-100 gap-1"
                      onClick={() => convertToContact(c.id)}
                    >
                      <UserCheck className="w-3 h-3" /> Convert
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteContact.mutateAsync({ id: c.id, businessId: businessId })}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

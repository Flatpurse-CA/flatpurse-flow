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
import { useContacts, useCreateContact, useDeleteContact, useDeals } from "@/hooks/useData";
import { Users, Plus, Trash2, Phone, Mail, Building2, Search, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CRMContacts() {
  const { businessId } = useOutletContext<{ businessId: string | undefined }>();
  const { data: contacts, isLoading } = useContacts(businessId, "contact");
  const { data: deals } = useDeals(businessId);
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = contacts?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getContactDealCount = (contactId: string) =>
    deals?.filter((d) => d.contact_id === contactId).length || 0;

  const getContactDealValue = (contactId: string) =>
    deals?.filter((d) => d.contact_id === contactId).reduce((s, d) => s + Number(d.value), 0) || 0;

  const fmt = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createContact.mutateAsync({
        business_id: businessId!,
        name: form.get("name") as string,
        email: form.get("email") as string,
        phone: form.get("phone") as string,
        company: form.get("company") as string,
        notes: form.get("notes") as string,
        status: "contact",
      });
      setOpen(false);
      toast({ title: "Contact added!" });
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
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
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
                <Textarea name="notes" placeholder="Any notes..." className="min-h-[40px]" />
              </div>
              <DialogFooter>
                <Button type="submit" size="sm" disabled={createContact.isPending}>Add Contact</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} contact{filtered.length !== 1 ? "s" : ""}</p>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : !filtered.length ? (
        <div className="text-center py-16">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{search ? "No contacts match your search" : "No contacts yet"}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map((c) => {
                const dealCount = getContactDealCount(c.id);
                const dealValue = getContactDealValue(c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3 group hover:bg-muted/30 transition-colors">
                    <Link to={`/crm/contacts/${c.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold">{c.name[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          {dealCount > 0 && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{dealCount} deal{dealCount !== 1 ? "s" : ""}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                          {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                          {c.company && <span className="flex items-center gap-1 hidden sm:flex"><Building2 className="w-3 h-3" />{c.company}</span>}
                        </div>
                      </div>
                      {dealValue > 0 && (
                        <p className="text-xs font-medium text-muted-foreground hidden sm:block">{fmt(dealValue)}</p>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive ml-2"
                      onClick={() => deleteContact.mutateAsync({ id: c.id, businessId: businessId! })}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
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

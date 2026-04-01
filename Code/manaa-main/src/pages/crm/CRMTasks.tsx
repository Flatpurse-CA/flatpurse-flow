import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useReminders, useCreateReminder, useUpdateReminder, useDeleteReminder, useContacts, useDeals } from "@/hooks/useData";
import { Plus, Trash2, Clock, CheckSquare, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function CRMTasks() {
  const { businessId } = useOutletContext<{ businessId: string | undefined }>();
  const { data: reminders, isLoading } = useReminders(businessId);
  const { data: contacts } = useContacts(businessId);
  const { data: deals } = useDeals(businessId);
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  if (!businessId) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Select a business first</p>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createReminder.mutateAsync({
        business_id: businessId,
        title: form.get("title") as string,
        description: form.get("description") as string,
        due_date: new Date(form.get("due_date") as string).toISOString(),
        contact_id: (form.get("contact_id") as string) || null,
        deal_id: (form.get("deal_id") as string) || null,
      });
      setOpen(false);
      toast({ title: "Task created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleComplete = async (id: string, current: boolean) => {
    await updateReminder.mutateAsync({ id, is_completed: !current });
  };

  const pending = reminders?.filter((r) => !r.is_completed) || [];
  const completed = reminders?.filter((r) => r.is_completed) || [];
  const overdue = pending.filter((r) => new Date(r.due_date) < new Date());
  const upcoming = pending.filter((r) => new Date(r.due_date) >= new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">{pending.length} pending</p>
          {overdue.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">{overdue.length} overdue</Badge>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input name="title" required placeholder="Follow up with client" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Due Date</Label>
                <Input name="due_date" type="datetime-local" required className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Link to Contact</Label>
                  <Select name="contact_id">
                    <SelectTrigger className="h-9"><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {contacts?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Link to Deal</Label>
                  <Select name="deal_id">
                    <SelectTrigger className="h-9"><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {deals?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea name="description" placeholder="Notes..." className="min-h-[40px]" />
              </div>
              <DialogFooter>
                <Button type="submit" size="sm" disabled={createReminder.isPending}>Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : !reminders?.length ? (
        <div className="text-center py-16">
          <CheckSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overdue */}
          {overdue.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">Overdue ({overdue.length})</h3>
              <Card className="border-destructive/30">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {overdue.map((r) => (
                      <TaskRow
                        key={r.id}
                        reminder={r}
                        contacts={contacts}
                        deals={deals}
                        onToggle={() => toggleComplete(r.id, false)}
                        onDelete={() => deleteReminder.mutateAsync({ id: r.id, businessId: businessId! })}
                        isOverdue
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Upcoming ({upcoming.length})</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {upcoming.map((r) => (
                      <TaskRow
                        key={r.id}
                        reminder={r}
                        contacts={contacts}
                        deals={deals}
                        onToggle={() => toggleComplete(r.id, false)}
                        onDelete={() => deleteReminder.mutateAsync({ id: r.id, businessId: businessId! })}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completed ({completed.length})</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {completed.map((r) => (
                      <TaskRow
                        key={r.id}
                        reminder={r}
                        contacts={contacts}
                        deals={deals}
                        onToggle={() => toggleComplete(r.id, true)}
                        onDelete={() => deleteReminder.mutateAsync({ id: r.id, businessId: businessId! })}
                        isCompleted
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ reminder: r, contacts, deals, onToggle, onDelete, isOverdue, isCompleted }: {
  reminder: any;
  contacts: any[] | undefined;
  deals: any[] | undefined;
  onToggle: () => void;
  onDelete: () => void;
  isOverdue?: boolean;
  isCompleted?: boolean;
}) {
  const contact = contacts?.find((c) => c.id === r.contact_id);
  const deal = deals?.find((d) => d.id === r.deal_id);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 group ${isCompleted ? "opacity-50" : ""}`}>
      <Checkbox checked={!!isCompleted} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isCompleted ? "line-through" : ""}`}>{r.title}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
          <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
            <Clock className="w-3 h-3" />
            {format(new Date(r.due_date), "MMM d, h:mm a")}
          </span>
          {contact && <span>· {contact.name}</span>}
          {deal && <span>· {deal.title}</span>}
        </div>
        {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
      </div>
      {isOverdue && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Overdue</Badge>}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

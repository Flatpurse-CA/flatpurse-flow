import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Users, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AdminNotifications() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [target, setTarget] = useState<"all" | "specific">("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userIds, setUserIds] = useState("");

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Fill in title and message", variant: "destructive" });
      return;
    }
    if (target === "all" && !confirm("Send push notification to ALL subscribed users? This cannot be undone.")) return;

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const payload: Record<string, unknown> = { title: title.trim(), body: body.trim(), target };
      if (target === "specific") {
        payload.user_ids = userIds.split(",").map(id => id.trim()).filter(Boolean);
        if (!payload.user_ids || (payload.user_ids as string[]).length === 0) {
          toast({ title: "Enter at least one user ID", variant: "destructive" });
          setSending(false);
          return;
        }
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notifier?action=send-admin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      toast({
        title: "🔔 Notifications sent!",
        description: `${data.sent} delivered, ${data.failed || 0} failed out of ${data.total} subscriptions`,
      });
      setTitle("");
      setBody("");
      setUserIds("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const presets = [
    { label: "🎉 New Feature", title: "New Feature on Manaa!", body: "We just shipped something exciting. Open the app to check it out!" },
    { label: "🔧 Maintenance", title: "Scheduled Maintenance", body: "Manaa will be briefly unavailable for maintenance. We'll be back shortly!" },
    { label: "📊 Update", title: "App Update Available", body: "A new version of Manaa is available with improvements and bug fixes. Update now for the best experience!" },
    { label: "💡 Tip", title: "Did you know?", body: "You can record transactions faster by using the + button on your dashboard. Try it now!" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="w-6 h-6" /> Push Notifications
        </h1>
        <p className="text-sm text-muted-foreground">Send push notifications to users' devices</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> Compose Notification
          </CardTitle>
          <CardDescription>Send a push notification to subscribed users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick presets */}
          <div className="space-y-1.5">
            <Label className="text-xs">Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => { setTitle(p.title); setBody(p.body); }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Target Audience</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> All Subscribed Users</span>
                </SelectItem>
                <SelectItem value="specific">Specific Users (by ID)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {target === "specific" && (
            <div className="space-y-1.5">
              <Label className="text-xs">User IDs (comma-separated)</Label>
              <Input
                placeholder="uuid-1, uuid-2"
                value={userIds}
                onChange={(e) => setUserIds(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Notification Title</Label>
            <Input
              placeholder="e.g. 🎉 New Feature on Manaa!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-[10px] text-muted-foreground text-right">{title.length}/100</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Message Body</Label>
            <Textarea
              placeholder="Write your notification message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[100px]"
              maxLength={300}
            />
            <p className="text-[10px] text-muted-foreground text-right">{body.length}/300</p>
          </div>

          {/* Preview */}
          {(title || body) && (
            <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Preview</p>
              <div className="flex items-start gap-3 pt-1">
                <img src="/manaa-notification-icon.png" alt="Manaa" className="w-10 h-10 rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{title || "Notification Title"}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{body || "Notification message..."}</p>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()} className="w-full">
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Sending..." : `Send to ${target === "all" ? "All Users" : "Specific Users"}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Send, Users, User, Sparkles, Image, Eye, Bold, Italic, Link2, List, Heading2, Type, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LOGO_URL = "https://uyividpmlsefnfdpswub.supabase.co/storage/v1/object/public/email-assets/manaa-logo.png";

async function sendEmail(payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send");
  return data;
}

async function uploadEmailImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `email-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("email-assets").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("email-assets").getPublicUrl(path);
  return data.publicUrl;
}

function wrapInBrandedTemplate(innerHtml: string): string {
  return `<div style="background-color:#ffffff;font-family:'Cabinet Grotesk','Inter',Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px 30px;">
  <div style="margin-bottom:24px;">
    <img src="${LOGO_URL}" alt="Manaa" width="120" style="display:block;" />
  </div>
  ${innerHtml}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;">
    <p style="font-size:12px;color:#d4d4d4;margin:0;">© Manaa · Midda Innovation Ltd.</p>
  </div>
</div>`;
}

// ── Rich text toolbar helpers ──
function insertTag(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  setText: (s: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  const selected = val.substring(start, end) || "text";
  const newVal = val.substring(0, start) + before + selected + after + val.substring(end);
  setText(newVal);
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
  }, 0);
}

// ── Templates with Manaa branding ──
const EMAIL_TEMPLATES: Record<string, { label: string; emoji: string; subject: string; body: string }> = {
  welcome: {
    label: "Welcome / Onboarding",
    emoji: "🎉",
    subject: "Welcome to Manaa! 🎉",
    body: `<h2 style="color:#141414;font-size:22px;margin:0 0 12px;">Welcome aboard 👋</h2>
<p style="color:#737373;font-size:15px;line-height:1.6;">We're excited to have you on board. Manaa helps you manage your business finances with ease — track income, expenses, invoices, and more.</p>
<p style="color:#737373;font-size:15px;line-height:1.6;">Here's what you can do right away:</p>
<ul style="color:#737373;font-size:15px;line-height:2;">
  <li>📊 Create your first business and book</li>
  <li>💰 Record your daily transactions</li>
  <li>📄 Send professional invoices</li>
  <li>📈 View financial reports</li>
</ul>
<p style="color:#737373;font-size:15px;line-height:1.6;">Need help? Just reply to this email.</p>
<p style="color:#a3a3a3;font-size:13px;margin-top:24px;">— The Manaa Team</p>`,
  },
  subscription_reminder: {
    label: "Subscription Reminder",
    emoji: "⏰",
    subject: "Your Manaa Pro plan is expiring soon",
    body: `<h2 style="color:#141414;font-size:22px;margin:0 0 12px;">Your Pro plan is expiring soon ⏰</h2>
<p style="color:#737373;font-size:15px;line-height:1.6;">Your Manaa Pro subscription will expire shortly. Renew now to keep access to:</p>
<ul style="color:#737373;font-size:15px;line-height:2;">
  <li>🧲 CRM & Pipeline Management</li>
  <li>📦 Inventory & Sales Tracking</li>
  <li>💳 Debt Tracker</li>
  <li>🏪 Online Store</li>
</ul>
<p style="color:#737373;font-size:15px;line-height:1.6;">Don't lose your data — renew your subscription today.</p>
<p style="color:#a3a3a3;font-size:13px;margin-top:24px;">— The Manaa Team</p>`,
  },
  feature_update: {
    label: "Feature Update",
    emoji: "🚀",
    subject: "New on Manaa 🚀",
    body: `<h2 style="color:#141414;font-size:22px;margin:0 0 12px;">Something new just dropped 🚀</h2>
<p style="color:#737373;font-size:15px;line-height:1.6;">We've been building and we're excited to share what's new on Manaa:</p>
<p style="color:#737373;font-size:15px;line-height:1.6;"><strong style="color:#141414;">[Feature Name]</strong> — describe the feature here and how it helps users.</p>
<p style="color:#737373;font-size:15px;line-height:1.6;">Log in to try it out!</p>
<p style="color:#a3a3a3;font-size:13px;margin-top:24px;">— The Manaa Team</p>`,
  },
  maintenance: {
    label: "Maintenance Notice",
    emoji: "🔧",
    subject: "Scheduled Maintenance Notice",
    body: `<h2 style="color:#141414;font-size:22px;margin:0 0 12px;">Heads up — scheduled maintenance 🔧</h2>
<p style="color:#737373;font-size:15px;line-height:1.6;">We'll be performing scheduled maintenance on <strong style="color:#141414;">[Date & Time]</strong>. During this time, Manaa may be temporarily unavailable.</p>
<p style="color:#737373;font-size:15px;line-height:1.6;">We expect the downtime to last approximately <strong style="color:#141414;">[Duration]</strong>. We apologize for any inconvenience.</p>
<p style="color:#a3a3a3;font-size:13px;margin-top:24px;">— The Manaa Team</p>`,
  },
};

// ── Composer Component ──
function EmailComposer({
  subject,
  setSubject,
  body,
  setBody,
  onSend,
  sending,
  children,
}: {
  subject: string;
  setSubject: (s: string) => void;
  body: string;
  setBody: (s: string) => void;
  onSend: () => void;
  sending: boolean;
  children?: React.ReactNode;
}) {
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleImageUpload = useCallback(async (files: FileList | null) => {
    if (!files?.length || !textareaRef.current) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast({ title: "Only images allowed", variant: "destructive" });
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: "Image must be under 5MB", variant: "destructive" });
          continue;
        }
        const url = await uploadEmailImage(file);
        const imgTag = `\n<img src="${url}" alt="Email image" style="max-width:100%;height:auto;border-radius:8px;margin:16px 0;" />\n`;
        const ta = textareaRef.current!;
        const pos = ta.selectionStart;
        const val = ta.value;
        setBody(val.substring(0, pos) + imgTag + val.substring(pos));
        toast({ title: "Image uploaded ✓" });
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [setBody, toast]);

  const toolbarActions = [
    { icon: Bold, label: "Bold", action: () => textareaRef.current && insertTag(textareaRef.current, '<strong style="color:#141414;">', "</strong>", setBody) },
    { icon: Italic, label: "Italic", action: () => textareaRef.current && insertTag(textareaRef.current, "<em>", "</em>", setBody) },
    { icon: Heading2, label: "Heading", action: () => textareaRef.current && insertTag(textareaRef.current, '<h2 style="color:#141414;font-size:20px;margin:20px 0 8px;">', "</h2>", setBody) },
    { icon: Link2, label: "Link", action: () => textareaRef.current && insertTag(textareaRef.current, '<a href="https://" style="color:#141414;text-decoration:underline;">', "</a>", setBody) },
    { icon: List, label: "List", action: () => textareaRef.current && insertTag(textareaRef.current, '<ul style="color:#737373;font-size:15px;line-height:2;"><li>', "</li></ul>", setBody) },
    { icon: Type, label: "Paragraph", action: () => textareaRef.current && insertTag(textareaRef.current, '<p style="color:#737373;font-size:15px;line-height:1.6;">', "</p>", setBody) },
  ];

  const previewHtml = wrapInBrandedTemplate(body);

  return (
    <div className="space-y-4">
      {children}

      <div className="space-y-1.5">
        <Label className="text-xs">Subject</Label>
        <Input placeholder="Email subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Body (HTML)</Label>
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Eye className="w-3.5 h-3.5" /> Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle className="text-sm">Email Preview</DialogTitle>
              </DialogHeader>
              <div className="border rounded-lg overflow-hidden bg-white">
                <div className="p-2 bg-muted/50 border-b flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Subject:</span>
                  <span className="text-xs font-medium">{subject || "(no subject)"}</span>
                </div>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 border rounded-t-lg px-2 py-1.5 bg-muted/30 flex-wrap">
          {toolbarActions.map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title={label}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            title="Insert Image"
            disabled={uploading}
          >
            <Image className="w-3.5 h-3.5" />
            {uploading && <span className="text-[10px]">uploading...</span>}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files)}
          />
        </div>

        <Textarea
          ref={textareaRef}
          placeholder={'<p style="color:#737373;font-size:15px;line-height:1.6;">Write your email here...</p>'}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[200px] rounded-t-none border-t-0 font-mono text-xs"
          onDrop={(e) => {
            e.preventDefault();
            handleImageUpload(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
        />
        <p className="text-[10px] text-muted-foreground">
          Tip: Drag & drop images directly into the editor, or use the 📷 button. All emails include the Manaa logo header and footer automatically.
        </p>
      </div>

      <Button onClick={onSend} disabled={sending} className="w-full">
        <Send className="w-4 h-4 mr-2" />
        {sending ? "Sending..." : "Send Email"}
      </Button>
    </div>
  );
}

// ── Images Gallery ──
function ImageGallery({ onInsert }: { onInsert: (url: string) => void }) {
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from("email-assets").list("email-images", { limit: 50, sortBy: { column: "created_at", order: "desc" } });
    if (!error && data) {
      setImages(data.filter(f => f.name !== ".emptyFolderPlaceholder").map(f =>
        supabase.storage.from("email-assets").getPublicUrl(`email-images/${f.name}`).data.publicUrl
      ));
    }
    setLoading(false);
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setLoading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadEmailImage(file);
      }
      toast({ title: "Uploaded ✓" });
      await loadImages();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={loadImages}>
          <Image className="w-3.5 h-3.5" /> Image Library
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">Email Image Library</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => fileRef.current?.click()} disabled={loading}>
            <Upload className="w-3.5 h-3.5" /> Upload Images
          </Button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />

          {loading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : images.length === 0 ? (
            <p className="text-xs text-muted-foreground">No images yet. Upload some to get started.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-auto">
              {images.map((url) => (
                <button
                  key={url}
                  onClick={() => {
                    onInsert(url);
                    toast({ title: "Image tag copied to clipboard" });
                  }}
                  className="group relative aspect-square rounded-lg overflow-hidden border hover:ring-2 ring-primary transition-all"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] font-medium">Insert</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──
export default function AdminEmails() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  // Individual
  const [indEmail, setIndEmail] = useState("");
  const [indSubject, setIndSubject] = useState("");
  const [indBody, setIndBody] = useState("");

  // Broadcast
  const [bcTarget, setBcTarget] = useState<"all" | "pro" | "free">("all");
  const [bcSubject, setBcSubject] = useState("");
  const [bcBody, setBcBody] = useState("");

  // Template
  const [tplType, setTplType] = useState("welcome");
  const [tplEmails, setTplEmails] = useState("");
  const [tplSubject, setTplSubject] = useState(EMAIL_TEMPLATES.welcome.subject);
  const [tplBody, setTplBody] = useState(EMAIL_TEMPLATES.welcome.body);

  const handleSendIndividual = async () => {
    if (!indEmail || !indSubject || !indBody) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const emails = indEmail.split(",").map(e => e.trim()).filter(Boolean);
      const result = await sendEmail({
        type: "individual",
        to_emails: emails,
        subject: indSubject,
        html_body: wrapInBrandedTemplate(indBody),
      });
      toast({ title: `Email sent`, description: `${result.sent} delivered, ${result.failed} failed` });
      setIndEmail(""); setIndSubject(""); setIndBody("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!bcSubject || !bcBody) {
      toast({ title: "Fill subject and body", variant: "destructive" });
      return;
    }
    if (!confirm(`Send this email to ${bcTarget === "all" ? "ALL" : bcTarget.toUpperCase()} users? This cannot be undone.`)) return;
    setSending(true);
    try {
      const result = await sendEmail({
        type: "broadcast",
        target: bcTarget,
        subject: bcSubject,
        html_body: wrapInBrandedTemplate(bcBody),
      });
      toast({ title: `Broadcast sent`, description: `${result.sent} delivered, ${result.failed} failed` });
      setBcSubject(""); setBcBody("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!tplEmails) {
      toast({ title: "Enter at least one email", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const emails = tplEmails.split(",").map(e => e.trim()).filter(Boolean);
      const result = await sendEmail({
        type: tplType,
        to_emails: emails,
        subject: tplSubject,
        html_body: wrapInBrandedTemplate(tplBody),
      });
      toast({ title: `Template email sent`, description: `${result.sent} delivered, ${result.failed} failed` });
      setTplEmails("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleInsertFromLibrary = (url: string, setBody: (fn: (prev: string) => string) => void) => {
    const imgTag = `<img src="${url}" alt="Email image" style="max-width:100%;height:auto;border-radius:8px;margin:16px 0;" />`;
    setBody((prev: string) => prev + "\n" + imgTag + "\n");
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6" /> Email Center
          </h1>
          <p className="text-sm text-muted-foreground">Compose and send branded emails with images</p>
        </div>
        <ImageGallery onInsert={(url) => {
          navigator.clipboard.writeText(`<img src="${url}" alt="Email image" style="max-width:100%;height:auto;border-radius:8px;margin:16px 0;" />`);
          toast({ title: "Image HTML copied", description: "Paste it into any email body" });
        }} />
      </div>

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="individual" className="text-xs gap-1.5">
            <User className="w-3.5 h-3.5" /> Individual
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="text-xs gap-1.5">
            <Users className="w-3.5 h-3.5" /> Broadcast
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Send Individual Email</CardTitle>
              <CardDescription>Send a direct email to one or more specific users</CardDescription>
            </CardHeader>
            <CardContent>
              <EmailComposer
                subject={indSubject}
                setSubject={setIndSubject}
                body={indBody}
                setBody={setIndBody}
                onSend={handleSendIndividual}
                sending={sending}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">To (comma-separated emails)</Label>
                  <Input
                    placeholder="user@example.com, another@example.com"
                    value={indEmail}
                    onChange={(e) => setIndEmail(e.target.value)}
                  />
                </div>
              </EmailComposer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Broadcast Email</CardTitle>
              <CardDescription>Send an announcement to all users or a filtered group</CardDescription>
            </CardHeader>
            <CardContent>
              <EmailComposer
                subject={bcSubject}
                setSubject={setBcSubject}
                body={bcBody}
                setBody={setBcBody}
                onSend={handleSendBroadcast}
                sending={sending}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">Target Audience</Label>
                  <Select value={bcTarget} onValueChange={(v) => setBcTarget(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="pro">Pro Users Only</SelectItem>
                      <SelectItem value="free">Free Users Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </EmailComposer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Templates</CardTitle>
              <CardDescription>Start from a pre-built template, customise, then send</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Template</Label>
                <Select
                  value={tplType}
                  onValueChange={(v) => {
                    setTplType(v);
                    const t = EMAIL_TEMPLATES[v];
                    setTplSubject(t.subject);
                    setTplBody(t.body);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMAIL_TEMPLATES).map(([key, t]) => (
                      <SelectItem key={key} value={key}>{t.emoji} {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <EmailComposer
                subject={tplSubject}
                setSubject={setTplSubject}
                body={tplBody}
                setBody={setTplBody}
                onSend={handleSendTemplate}
                sending={sending}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">To (comma-separated emails)</Label>
                  <Input
                    placeholder="user@example.com"
                    value={tplEmails}
                    onChange={(e) => setTplEmails(e.target.value)}
                  />
                </div>
              </EmailComposer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

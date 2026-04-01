import { useState, useEffect } from "react";
import { useStoreContext } from "./StoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink, Globe, Palette, Phone, Instagram, Store } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function StorefrontPage() {
  const { selectedBusinessId } = useStoreContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["store-settings", selectedBusinessId],
    queryFn: async () => {
      if (!selectedBusinessId) return null;
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("business_id", selectedBusinessId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBusinessId,
  });

  const [form, setForm] = useState({
    store_name: "",
    store_description: "",
    slug: "",
    is_published: false,
    theme_color: "#C0D904",
    whatsapp_number: "",
    instagram_handle: "",
    delivery_note: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        store_name: settings.store_name || "",
        store_description: settings.store_description || "",
        slug: settings.slug || "",
        is_published: settings.is_published || false,
        theme_color: settings.theme_color || "#C0D904",
        whatsapp_number: settings.whatsapp_number || "",
        instagram_handle: settings.instagram_handle || "",
        delivery_note: settings.delivery_note || "",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBusinessId) throw new Error("No business selected");
      const payload = { ...form, business_id: selectedBusinessId };
      if (settings?.id) {
        const { error } = await supabase.from("store_settings").update(payload).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_settings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast({ title: "Store settings saved!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const storeUrl = form.slug ? `${window.location.origin}/s/${form.slug}` : "";

  if (!selectedBusinessId) {
    return <p className="text-sm text-muted-foreground">Select a workspace first.</p>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold">Online Storefront</h2>
        <p className="text-sm text-muted-foreground">Set up your public product catalog with a shareable link.</p>
      </div>

      {/* Publish toggle */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Publish Store</p>
              <p className="text-xs text-muted-foreground">Make your storefront visible to customers</p>
            </div>
          </div>
          <Switch
            checked={form.is_published}
            onCheckedChange={(v) => setForm({ ...form, is_published: v })}
          />
        </CardContent>
      </Card>

      {/* Store URL */}
      {form.slug && (
        <Card>
          <CardContent className="py-4 space-y-2">
            <Label className="text-xs text-muted-foreground">Store URL</Label>
            <div className="flex items-center gap-2">
              <Input value={storeUrl} readOnly className="h-9 text-xs bg-muted/50" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(storeUrl);
                  toast({ title: "Link copied!" });
                }}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Store details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Store className="w-4 h-4" /> Store Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Store Name</Label>
            <Input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} placeholder="My Awesome Store" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Store URL Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="my-store" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={form.store_description} onChange={(e) => setForm({ ...form, store_description: e.target.value })} placeholder="Tell customers about your business..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Delivery Note</Label>
            <Input value={form.delivery_note} onChange={(e) => setForm({ ...form, delivery_note: e.target.value })} placeholder="e.g. Free delivery within Lagos" className="h-9" />
          </div>
        </CardContent>
      </Card>

      {/* Contact & Social */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Phone className="w-4 h-4" /> Contact & Social</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">WhatsApp Number</Label>
            <Input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="+234..." className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Instagram Handle</Label>
            <Input value={form.instagram_handle} onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })} placeholder="@mystore" className="h-9" />
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Palette className="w-4 h-4" /> Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label className="text-xs">Brand Color</Label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
              <Input value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="h-9 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full md:w-auto">
        {saveMutation.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useBusinesses, useCategories, useCreateCategory, useDeleteCategory, useProfile, useUpdateProfile, uploadAvatar } from "@/hooks/useData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { User, Building2, Settings, Bell, Tag, Plus, Trash2, Sparkles, Camera, Lock, Mail, Gift } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_NIGERIAN_CATEGORIES, VAT_RATE } from "@/lib/currency";
import { useSearchParams } from "react-router-dom";
import ReferralTab from "@/components/ReferralTab";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: businesses } = useBusinesses();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your profile, businesses, and preferences" />

      <div className="px-4 sm:px-6">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 w-full grid grid-cols-4">
          <TabsTrigger value="profile" className="gap-1 text-[11px] px-2">
            <User className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-1 text-[11px] px-2">
            <Building2 className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Business</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-1 text-[11px] px-2">
            <Settings className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">General</span>
          </TabsTrigger>
          <TabsTrigger value="referral" className="gap-1 text-[11px] px-2">
            <Gift className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Referral</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab user={user} toast={toast} />
        </TabsContent>
        <TabsContent value="business">
          <BusinessTab businesses={businesses} toast={toast} />
        </TabsContent>
        <TabsContent value="general">
          <GeneralTab user={user} />
        </TabsContent>
        <TabsContent value="referral">
          <ReferralTab />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Real Estate", "Agriculture", "Media", "Logistics",
  "Food & Beverage", "Fashion", "Construction", "Consulting", "Other",
];

function ProfileTab({ user, toast }: { user: any; toast: any }) {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [industry, setIndustry] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Sync from profile data
  useState(() => {
    if (profile) {
      setFullName(profile.full_name || user?.user_metadata?.full_name || "");
      setPosition((profile as any).position || "");
      setIndustry((profile as any).industry || "");
    } else {
      setFullName(user?.user_metadata?.full_name || "");
    }
  });

  // Re-sync when profile loads
  const [synced, setSynced] = useState(false);
  if (profile && !synced) {
    setFullName(profile.full_name || user?.user_metadata?.full_name || "");
    setPosition((profile as any).position || "");
    setIndustry((profile as any).industry || "");
    setSynced(true);
  }

  const displayName = fullName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "U";
  const initials = displayName.slice(0, 2).toUpperCase();
  const currentAvatarUrl = avatarPreview || (profile as any)?.avatar_url;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      setAvatarPreview(URL.createObjectURL(file));
      const url = await uploadAvatar(file, user.id);
      await updateProfile.mutateAsync({ avatar_url: url });
      setAvatarPreview(url);
      toast({ title: "Photo updated!" });
    } catch (err: any) {
      toast({ title: "Error uploading photo", description: err.message, variant: "destructive" });
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (authError) throw authError;
      await updateProfile.mutateAsync({ full_name: fullName, position, industry });
      toast({ title: "Profile updated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password changed successfully!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16 border-2 border-border">
                <AvatarImage src={currentAvatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="text-lg font-bold bg-foreground text-background">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-primary hover:underline mt-1"
              >
                {uploadingAvatar ? "Uploading..." : "Change photo"}
              </button>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs">Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Position / Role</Label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. CEO, Manager, Accountant"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind} className="text-xs">{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lock className="w-4 h-4" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="h-9"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword}
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BusinessTab({ businesses, toast }: { businesses: any; toast: any }) {
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTin, setEditTin] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [editBankAccountNumber, setEditBankAccountNumber] = useState("");
  const [editBankAccountName, setEditBankAccountName] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedBizId, setSelectedBizId] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Categories
  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("expense");
  const [seeding, setSeeding] = useState(false);

  // Auto-select first business
  const currentBiz = businesses?.find((b: any) => b.id === selectedBizId) || businesses?.[0];
  
  // Sync form when business changes
  const [syncedId, setSyncedId] = useState<string | null>(null);
  if (currentBiz && currentBiz.id !== syncedId) {
    setEditName(currentBiz.name || "");
    setEditDesc(currentBiz.description || "");
    setEditTin(currentBiz.tin || "");
    setEditAddress(currentBiz.address || "");
    setEditPhone(currentBiz.phone || "");
    setEditEmail(currentBiz.official_email || "");
    setEditBankName((currentBiz as any).bank_name || "");
    setEditBankAccountNumber((currentBiz as any).bank_account_number || "");
    setEditBankAccountName((currentBiz as any).bank_account_name || "");
    setLogoPreview(currentBiz.logo_url || null);
    setSelectedBizId(currentBiz.id);
    setSyncedId(currentBiz.id);
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentBiz) return;
    setUploadingLogo(true);
    try {
      setLogoPreview(URL.createObjectURL(file));
      const ext = file.name.split(".").pop();
      const path = `${currentBiz.id}/logo.${ext}`;
      await supabase.storage.from("avatars").remove([path]);
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const logoUrl = urlData.publicUrl + "?t=" + Date.now();
      const { error } = await supabase
        .from("businesses")
        .update({ logo_url: logoUrl } as any)
        .eq("id", currentBiz.id);
      if (error) throw error;
      setLogoPreview(logoUrl);
      toast({ title: "Logo updated!" });
    } catch (err: any) {
      toast({ title: "Error uploading logo", description: err.message, variant: "destructive" });
      setLogoPreview(currentBiz.logo_url || null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!currentBiz) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          name: editName,
          description: editDesc,
          tin: editTin,
          address: editAddress,
          phone: editPhone,
          official_email: editEmail,
          bank_name: editBankName,
          bank_account_number: editBankAccountNumber,
          bank_account_name: editBankAccountName,
        } as any)
        .eq("id", currentBiz.id);
      if (error) throw error;
      toast({ title: "Business updated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await createCategory.mutateAsync({ name: newCatName.trim(), type: newCatType });
      setNewCatName("");
      toast({ title: "Category created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast({ title: "Category deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const seedNigerianCategories = async () => {
    setSeeding(true);
    try {
      for (const name of DEFAULT_NIGERIAN_CATEGORIES.income) {
        await createCategory.mutateAsync({ name, type: "income" });
      }
      for (const name of DEFAULT_NIGERIAN_CATEGORIES.expense) {
        await createCategory.mutateAsync({ name, type: "expense" });
      }
      toast({ title: "Nigerian categories added!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const incomeCategories = categories?.filter((c) => c.type === "income") || [];
  const expenseCategories = categories?.filter((c) => c.type === "expense") || [];

  if (!businesses?.length) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">No businesses yet. Create one from the sidebar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Business selector if multiple */}
      {businesses.length > 1 && (
        <Select value={currentBiz?.id || ""} onValueChange={(id) => { setSelectedBizId(id); setSyncedId(null); }}>
          <SelectTrigger className="h-9 w-full sm:w-[240px]">
            <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Select business" />
          </SelectTrigger>
          <SelectContent>
            {businesses.map((b: any) => (
              <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Business Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Business Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Business Logo */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16 rounded-lg border-2 border-border">
                <AvatarImage src={logoPreview || undefined} alt={editName} className="object-cover" />
                <AvatarFallback className="text-lg font-bold bg-foreground/5 text-muted-foreground rounded-lg">
                  <Building2 className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
            <div>
              <p className="text-sm font-medium">{editName || "Business Logo"}</p>
              <button
                onClick={() => logoInputRef.current?.click()}
                className="text-xs text-primary hover:underline mt-0.5"
              >
                {uploadingLogo ? "Uploading..." : logoPreview ? "Change logo" : "Add logo"}
              </button>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs">Workspace Name</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="What is this workspace for?" className="h-9" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">TIN (Tax ID Number)</Label>
              <Input value={editTin} onChange={(e) => setEditTin(e.target.value)} placeholder="e.g. 12345678-0001" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone Number</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="e.g. +234 801 234 5678" className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Official Email</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="e.g. info@mybusiness.com" className="h-9" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Business Address</Label>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="e.g. 12 Marina Road, Lagos" className="h-9" />
            </div>
          </div>
          <Separator />

          <div>
            <p className="text-xs font-medium mb-3 flex items-center gap-1.5">
              🏦 Bank Details <span className="text-muted-foreground font-normal">(shown on invoices)</span>
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Bank Name</Label>
                <Input value={editBankName} onChange={(e) => setEditBankName(e.target.value)} placeholder="e.g. Access Bank, GTBank" className="h-9" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Account Number</Label>
                  <Input value={editBankAccountNumber} onChange={(e) => setEditBankAccountNumber(e.target.value)} placeholder="e.g. 0123456789" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Account Name</Label>
                  <Input value={editBankAccountName} onChange={(e) => setEditBankAccountName(e.target.value)} placeholder="e.g. John Doe Enterprises" className="h-9" />
                </div>
              </div>
            </div>
          </div>

          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Tag className="w-4 h-4" /> Transaction Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!categories?.length && (
            <div className="rounded-lg border border-dashed border-border bg-secondary/50 p-4 text-center">
              <Sparkles className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-medium mb-1">Get started quickly</p>
              <p className="text-[11px] text-muted-foreground mb-3">
                Add Nigerian business categories like Diesel, POS, Logistics, and more.
              </p>
              <Button size="sm" onClick={seedNigerianCategories} disabled={seeding}>
                {seeding ? "Adding..." : "Use Nigerian Categories"}
              </Button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Category Name</Label>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Diesel, POS Charges, Logistics..."
                className="h-9"
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
            </div>
            <div className="w-28 space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={newCatType} onValueChange={setNewCatType}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income" className="text-xs">Income</SelectItem>
                  <SelectItem value="expense" className="text-xs">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="h-9" onClick={handleAddCategory} disabled={createCategory.isPending}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {incomeCategories.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Income</p>
              <div className="flex flex-wrap gap-1.5">
                {incomeCategories.map((c) => (
                  <Badge key={c.id} variant="secondary" className="text-xs gap-1 pr-1">
                    {c.name}
                    <button onClick={() => handleDeleteCategory(c.id)} className="ml-0.5 hover:text-destructive">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {expenseCategories.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Expense</p>
              <div className="flex flex-wrap gap-1.5">
                {expenseCategories.map((c) => (
                  <Badge key={c.id} variant="outline" className="text-xs gap-1 pr-1">
                    {c.name}
                    <button onClick={() => handleDeleteCategory(c.id)} className="ml-0.5 hover:text-destructive">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GeneralTab({ user }: { user: any }) {
  const { toast } = useToast();
  const { isSubscribed, isLoading: pushLoading, isSupported, subscribe, unsubscribe } = usePushNotifications();

  const handleTogglePush = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast({ title: "Daily reminders disabled" });
      } else {
        await subscribe();
        toast({ title: "Daily reminders enabled! 🍞", description: "You'll get nudges at 9am and 6pm" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Email */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" /> Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Account Email</Label>
            <Input value={user?.email || ""} disabled className="h-9 bg-secondary text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">This is the email associated with your account. Contact support to change it.</p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Push Notifications - Daily Reminders */}
          {isSupported && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Daily Reminders 🍞</p>
                  <p className="text-xs text-muted-foreground">
                    "Have you recorded your daily bread?" — 9am & 6pm
                  </p>
                </div>
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={handleTogglePush}
                  disabled={pushLoading}
                />
              </div>
              <Separator />
            </>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive email alerts for important updates</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Low Stock Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified when inventory is running low</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Invoice Reminders</p>
              <p className="text-xs text-muted-foreground">Reminders for overdue invoices</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" /> Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Currency</p>
              <p className="text-xs text-muted-foreground">Default currency for transactions</p>
            </div>
            <Badge className="text-xs">₦ NGN</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">VAT Rate</p>
              <p className="text-xs text-muted-foreground">Nigeria standard VAT</p>
            </div>
            <Badge className="text-xs">{VAT_RATE}%</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Date Format</p>
              <p className="text-xs text-muted-foreground">How dates are displayed across the app</p>
            </div>
            <Badge className="text-xs">DD MMM YYYY</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

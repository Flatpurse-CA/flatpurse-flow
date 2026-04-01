import { useState } from "react";
import { useAdminUsers, useAdminUserDetail, useToggleAdmin, useTogglePro, useUpdateUser, useDeleteUser } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Shield, ShieldOff, Crown, Search, Eye, Trash2, Save, X, Building2, BookOpen, ArrowRightLeft, FileText, ChevronLeft, ChevronRight, User, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminUsersPageProps {
  filter: "all" | "free" | "pro";
  title: string;
  description: string;
}

export default function AdminUsersPage({ filter, title, description }: AdminUsersPageProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading } = useAdminUsers(page, debouncedSearch, filter);
  const { data: userDetail, isLoading: detailLoading } = useAdminUserDetail(selectedUserId);
  const toggleAdmin = useToggleAdmin();
  const togglePro = useTogglePro();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSearch = (val: string) => {
    setSearch(val);
    setTimeout(() => setDebouncedSearch(val), 300);
  };

  const handleToggleAdmin = async (userId: string, email: string) => {
    try {
      const result = await toggleAdmin.mutateAsync(userId);
      toast({ title: result.admin ? `${email} is now admin` : `${email} admin removed` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleTogglePro = async (userId: string, email: string) => {
    try {
      const result = await togglePro.mutateAsync(userId);
      toast({ title: result.pro ? `${email} upgraded to Pro` : `${email} downgraded to Free` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleViewUser = (u: any) => {
    setSelectedUserId(u.id);
    setEditName(u.full_name || "");
    setEditEmail(u.email || "");
    setIsEditing(false);
  };

  const handleSaveUser = async () => {
    if (!selectedUserId) return;
    try {
      await updateUser.mutateAsync({ target_user_id: selectedUserId, full_name: editName, email: editEmail });
      toast({ title: "User updated" });
      setIsEditing(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      await deleteUser.mutateAsync(userId);
      toast({ title: `${email} deleted` });
      setSelectedUserId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const fmt = (n: number) => `₦${Number(n).toLocaleString()}`;

  const UseModeIndicator = ({ mode }: { mode?: string }) => {
    if (!mode) return null;
    const isPersonal = mode === "personal";
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
        isPersonal
          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
      )}>
        {isPersonal ? <User className="w-2.5 h-2.5" /> : <Briefcase className="w-2.5 h-2.5" />}
        {isPersonal ? "Personal" : "Business"}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title} ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Businesses</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Last Active</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.users?.map((u: any) => {
                    const isPro = u.subscription?.plan === "pro" && u.subscription?.status === "active";
                    return (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Avatar with use_mode banner */}
                            <div className="relative shrink-0">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground uppercase">
                                {(u.full_name || u.email || "?").charAt(0)}
                              </div>
                              {u.use_mode && (
                                <div className={cn(
                                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-card",
                                  u.use_mode === "personal"
                                    ? "bg-blue-500"
                                    : "bg-purple-500"
                                )} title={u.use_mode === "personal" ? "Personal" : "Business"}>
                                  {u.use_mode === "personal"
                                    ? <User className="w-2.5 h-2.5 text-white" />
                                    : <Briefcase className="w-2.5 h-2.5 text-white" />
                                  }
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-[13px]">{u.full_name || "—"}</p>
                              <p className="text-[11px] text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-[13px]">{u.business_count}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-[12px] text-muted-foreground">
                          {u.created_at ? format(new Date(u.created_at), "dd MMM yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-[12px] text-muted-foreground">
                          {u.last_sign_in_at ? format(new Date(u.last_sign_in_at), "dd MMM yyyy") : "Never"}
                        </td>
                        <td className="px-4 py-3">
                          {isPro ? (
                            <Badge className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20">
                              <Crown className="w-3 h-3 mr-1" /> Pro
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Free</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.roles?.includes("admin") ? (
                            <Badge variant="default" className="text-[10px]">Admin</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">User</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {u.id === user?.id && (
                              <Badge variant="outline" className="text-[9px] mr-1">You</Badge>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewUser(u)} title="View details">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleTogglePro(u.id, u.email)} disabled={togglePro.isPending} title={isPro ? "Remove Pro" : "Grant Pro"}>
                              <Crown className={`w-3.5 h-3.5 ${isPro ? "text-yellow-500" : "text-muted-foreground"}`} />
                            </Button>
                            {u.id !== user?.id && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleAdmin(u.id, u.email)} disabled={toggleAdmin.isPending} title={u.roles?.includes("admin") ? "Remove admin" : "Make admin"}>
                                {u.roles?.includes("admin") ? (
                                  <ShieldOff className="w-3.5 h-3.5 text-destructive" />
                                ) : (
                                  <Shield className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!debouncedSearch && data?.total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {page} of {Math.ceil((data?.total || 0) / 20)}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= Math.ceil((data?.total || 0) / 20)} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUserId} onOpenChange={(open) => { if (!open) setSelectedUserId(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">User Details</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              View and manage user information
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading user data...</div>
          ) : userDetail ? (
            <div className="space-y-5">
              {/* Identity */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identity</h3>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" className="h-9 text-sm" />
                    <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" className="h-9 text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveUser} disabled={updateUser.isPending} className="h-8 text-xs">
                        <Save className="w-3 h-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="h-8 text-xs">
                        <X className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{userDetail.profile?.full_name || "No name"}</p>
                        <p className="text-xs text-muted-foreground">{userDetail.email}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-7 text-[11px]">
                        Edit
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      {userDetail.email_confirmed && <Badge variant="outline" className="text-[10px] text-green-600">Email Verified</Badge>}
                      {userDetail.profile?.industry && <Badge variant="secondary" className="text-[10px]">{userDetail.profile.industry}</Badge>}
                      {userDetail.profile?.use_mode && <UseModeIndicator mode={userDetail.profile.use_mode} />}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Joined {userDetail.created_at ? format(new Date(userDetail.created_at), "dd MMM yyyy") : "—"}
                      {" · "}Last active {userDetail.last_sign_in_at ? format(new Date(userDetail.last_sign_in_at), "dd MMM yyyy") : "Never"}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-[11px] text-muted-foreground">Businesses</span>
                    </div>
                    <p className="text-lg font-bold">{userDetail.businesses?.length || 0}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[11px] text-muted-foreground">Books</span>
                    </div>
                    <p className="text-lg font-bold">{userDetail.stats?.book_count || 0}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-[11px] text-muted-foreground">Transactions</span>
                    </div>
                    <p className="text-lg font-bold">{userDetail.stats?.transaction_count || 0}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="text-[11px] text-muted-foreground">Invoices</span>
                    </div>
                    <p className="text-lg font-bold">{userDetail.stats?.invoice_count || 0}</p>
                  </div>
                </div>
                <div className="flex gap-2 text-[11px]">
                  <span className="text-green-600">In: {fmt(userDetail.stats?.total_cash_in || 0)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-red-500">Out: {fmt(userDetail.stats?.total_cash_out || 0)}</span>
                </div>
              </div>

              {/* Businesses list */}
              {userDetail.businesses?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Businesses</h3>
                  <div className="space-y-1">
                    {userDetail.businesses.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30 text-sm">
                        <span className="font-medium text-[13px]">{b.name}</span>
                        <span className="text-[11px] text-muted-foreground">{b.currency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subscription */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subscription</h3>
                {userDetail.subscription ? (
                  <div className="flex items-center gap-2">
                    <Badge className={userDetail.subscription.plan === "pro" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px]" : "text-[10px]"}>
                      {userDetail.subscription.plan === "pro" && <Crown className="w-3 h-3 mr-1" />}
                      {userDetail.subscription.plan.toUpperCase()}
                    </Badge>
                    <Badge variant={userDetail.subscription.status === "active" ? "default" : "secondary"} className="text-[10px]">
                      {userDetail.subscription.status}
                    </Badge>
                    {userDetail.subscription.billing_cycle && (
                      <span className="text-[11px] text-muted-foreground capitalize">{userDetail.subscription.billing_cycle === "admin_granted" ? "Admin Granted" : userDetail.subscription.billing_cycle}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No subscription record</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[11px]"
                    onClick={() => handleTogglePro(userDetail.id, userDetail.email)}
                    disabled={togglePro.isPending}
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    {userDetail.subscription?.plan === "pro" ? "Remove Pro" : "Grant Pro"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[11px]"
                    onClick={() => handleToggleAdmin(userDetail.id, userDetail.email)}
                    disabled={toggleAdmin.isPending}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {userDetail.roles?.includes("admin") ? "Remove Admin" : "Make Admin"}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" className="h-8 text-[11px]">
                        <Trash2 className="w-3 h-3 mr-1" /> Delete User
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete user permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete <strong>{userDetail.email}</strong> and ALL their data (businesses, transactions, invoices, etc.). This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(userDetail.id, userDetail.email)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

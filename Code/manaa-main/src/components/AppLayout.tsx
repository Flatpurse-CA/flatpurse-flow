import { ReactNode, useState, useEffect } from "react";
import manaaLogoFull from "@/assets/manaa-logo-full.png";
import { Plus, BookOpen, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Building2, LogOut, BarChart3, FileText, Users,
  ChevronDown, ChevronRight, Settings, BellDot, Check, Zap, User,
  Target, CheckSquare, TrendingUp, UserPlus, Crown, Lock, Package,
  ShoppingCart, Clock, Shield, Wallet, Store, MapPin, UserCheck,
} from "lucide-react";
import { useSubscription, FREE_LIMITS } from "@/hooks/useSubscription";
import UpgradeModal from "@/components/UpgradeModal";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AppHeader from "@/components/AppHeader";
import NotificationDrawer from "@/components/NotificationDrawer";
import { useUnreadNotificationCount, useCreateAccount, useCreateBusiness, useProfile } from "@/hooks/useData";
import BottomNav from "@/components/BottomNav";
import CashModal from "@/components/CashModal";
import { useBusinesses } from "@/hooks/useData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getNavItems = (selectedBusinessId: string | null) => [
  { to: "/home", icon: LayoutDashboard, label: "Home" },
  { to: selectedBusinessId ? `/businesses/${selectedBusinessId}` : "/businesses", icon: BookOpen, label: "Books" },
  
  // Wallet hidden for now – kept in codebase for future use
  // { to: "/wallet", icon: Wallet, label: "Wallet" },
  { to: "/reporting", icon: BarChart3, label: "Reports" },
];

const crmSubItems = [
  { to: "/crm", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/crm/leads", icon: UserPlus, label: "Leads" },
  { to: "/crm/contacts", icon: Users, label: "Contacts" },
  { to: "/crm/pipeline", icon: Target, label: "Pipeline" },
  { to: "/crm/forms", icon: FileText, label: "Forms" },
  { to: "/crm/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/crm/insights", icon: TrendingUp, label: "Insights" },
];

const inventorySubItems = [
  { to: "/inventory", icon: Package, label: "Products", end: true },
  { to: "/inventory/sales", icon: ShoppingCart, label: "Sales" },
  { to: "/inventory/unpaid", icon: Clock, label: "Unpaid" },
  { to: "/inventory/batches", icon: Package, label: "Batches" },
  { to: "/inventory/warehouses", icon: Building2, label: "Warehouses" },
  { to: "/inventory/purchase-orders", icon: FileText, label: "Purchase Orders" },
];

const storeSubItems = [
  { to: "/store", icon: Store, label: "Storefront", end: true },
  { to: "/store/products", icon: Package, label: "Products" },
  { to: "/store/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/store/team", icon: UserCheck, label: "Team" },
  { to: "/store/branches", icon: MapPin, label: "Branches" },
];

const invoicingSubItems = [
  { to: "/invoicing", icon: FileText, label: "All Invoices", end: true },
  { to: "/invoicing/drafts", icon: Clock, label: "Drafts & Overdue" },
  { to: "/invoicing/clients", icon: Users, label: "Clients" },
  { to: "/invoicing/revenue", icon: TrendingUp, label: "Revenue" },
];

interface AppLayoutProps {
  children: ReactNode;
  selectedBusinessId: string | null;
  onSelectBusiness: (id: string) => void;
}

export default function AppLayout({ children, selectedBusinessId, onSelectBusiness }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: businesses } = useBusinesses();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashModalType, setCashModalType] = useState<"cash_in" | "cash_out">("cash_in");
  const [businessDrawerOpen, setBusinessDrawerOpen] = useState(false);
  const [quickActionDrawerOpen, setQuickActionDrawerOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [newBookBizId, setNewBookBizId] = useState<string>("");
  
  const [addBusinessOpen, setAddBusinessOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const unreadCount = useUnreadNotificationCount();
  const { data: profile } = useProfile();
  const createAcc = useCreateAccount();
  const createBiz = useCreateBusiness();
  const { toast } = useToast();
  const { isPro, isBusiness } = useSubscription();

  const handleCreateBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    try {
      await createAcc.mutateAsync({
        business_id: newBookBizId,
        name: name,
        initial_balance: parseFloat(form.get("balance") as string) || 0,
      });
      setAddBookOpen(false);
      setBusinessDrawerOpen(false);
      toast({ title: "Book created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isPro && businesses && businesses.length >= FREE_LIMITS.maxBusinesses) {
      toast({ title: "Upgrade Required", description: `Free plan allows ${FREE_LIMITS.maxBusinesses} workspace. Upgrade to Pro for unlimited.`, variant: "destructive" });
      setAddBusinessOpen(false);
      setUpgradeOpen(true);
      return;
    }
    const form = new FormData(e.currentTarget);
    const name = (form.get("biz_name") as string).trim();
    const description = (form.get("biz_description") as string || "").trim();
    if (!name) return;
    try {
      const newBiz = await createBiz.mutateAsync({ name, description });
      setAddBusinessOpen(false);
      setBusinessDrawerOpen(false);
      onSelectBusiness(newBiz.id);
      toast({ title: "Business created!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const selectedBusiness = businesses?.find((b) => b.id === selectedBusinessId);


  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const isCrmActive = location.pathname.startsWith("/crm");
  const isInventoryActive = location.pathname.startsWith("/inventory");
  const isInvoicingActive = location.pathname.startsWith("/invoicing");
  const isStoreActive = location.pathname.startsWith("/store");
  const [crmOpen, setCrmOpen] = useState(isCrmActive);
  const [inventoryOpen, setInventoryOpen] = useState(isInventoryActive);
  const [invoicingOpen, setInvoicingOpen] = useState(isInvoicingActive);
  const [storeOpen, setStoreOpen] = useState(isStoreActive);

  useEffect(() => {
    if (isCrmActive) setCrmOpen(true);
  }, [isCrmActive]);

  useEffect(() => {
    if (isInventoryActive) setInventoryOpen(true);
  }, [isInventoryActive]);

  useEffect(() => {
    if (isInvoicingActive) setInvoicingOpen(true);
  }, [isInvoicingActive]);

  useEffect(() => {
    if (isStoreActive) setStoreOpen(true);
  }, [isStoreActive]);

  const isCrmSubActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const isInventorySubActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const isSubActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const renderNav = () => (
    <nav className="flex-1 px-3 py-2 flex flex-col overflow-y-auto">
      {/* Main nav items */}
      <div className="space-y-0.5">
        {getNavItems(selectedBusinessId).map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                active ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
       </div>

        {/* Invoicing — free, collapsible */}
        <div className="mt-1 space-y-0.5">
          <button
            onClick={() => setInvoicingOpen(!invoicingOpen)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors w-full",
              isInvoicingActive ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <FileText className="w-4 h-4" />
            <span className="flex-1 text-left">Invoicing</span>
            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", invoicingOpen && "rotate-90")} />
          </button>
          {invoicingOpen && (
            <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mt-0.5 mb-1">
              {invoicingSubItems.map((sub) => {
                const subActive = isSubActive(sub.to, sub.end);
                const SubIcon = sub.icon;
                return (
                  <Link
                    key={sub.to}
                    to={sub.to}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                      subActive ? "text-white bg-white/10" : "text-white/50 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <SubIcon className="w-3.5 h-3.5" />
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Pro features — only visible to Pro users */}
        {isPro && (
        <div className="mt-1 space-y-0.5">
          {/* CRM */}
          <button
            onClick={() => setCrmOpen(!crmOpen)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors w-full",
              isCrmActive ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <Users className="w-4 h-4" />
            <span className="flex-1 text-left">CRM</span>
            <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Pro</span>
            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", crmOpen && "rotate-90")} />
          </button>
          {crmOpen && (
            <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mt-0.5 mb-1">
              {crmSubItems.map((sub) => {
                const subActive = isCrmSubActive(sub.to, sub.end);
                const SubIcon = sub.icon;
                return (
                  <Link
                    key={sub.to}
                    to={sub.to}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                      subActive ? "text-white bg-white/10" : "text-white/50 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <SubIcon className="w-3.5 h-3.5" />
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Inventory */}
          <button
            onClick={() => setInventoryOpen(!inventoryOpen)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors w-full",
              isInventoryActive ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <Package className="w-4 h-4" />
            <span className="flex-1 text-left">Inventory</span>
            <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Pro</span>
            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", inventoryOpen && "rotate-90")} />
          </button>
          {inventoryOpen && (
            <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mt-0.5 mb-1">
              {inventorySubItems.map((sub) => {
                const subActive = isInventorySubActive(sub.to, sub.end);
                const SubIcon = sub.icon;
                return (
                  <Link
                    key={sub.to}
                    to={sub.to}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                      subActive ? "text-white bg-white/10" : "text-white/50 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <SubIcon className="w-3.5 h-3.5" />
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* Store — Business tier only */}
        {isBusiness && (
        <div className="mt-1 space-y-0.5">
          <button
            onClick={() => setStoreOpen(!storeOpen)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors w-full",
              isStoreActive ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <Store className="w-4 h-4" />
            <span className="flex-1 text-left">Store</span>
            <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/20">Biz</span>
            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", storeOpen && "rotate-90")} />
          </button>
          {storeOpen && (
            <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mt-0.5 mb-1">
              {storeSubItems.map((sub) => {
                const subActive = isSubActive(sub.to, sub.end);
                const SubIcon = sub.icon;
                return (
                  <Link
                    key={sub.to}
                    to={sub.to}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                      subActive ? "text-white bg-white/10" : "text-white/50 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <SubIcon className="w-3.5 h-3.5" />
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom: Upgrade (free users) + Settings */}
        <div className="space-y-0.5 pb-1">
          {!isPro && (
            <button
              onClick={() => setUpgradeOpen(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors w-full border"
              style={{ backgroundColor: 'hsl(75 80% 50% / 0.15)', color: 'hsl(75 80% 50%)', borderColor: 'hsl(75 80% 50% / 0.2)' }}
            >
              <Crown className="w-4 h-4" />
              <span className="flex-1 text-left">Upgrade to Pro</span>
            </button>
          )}

        {/* Settings */}
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
            isActive("/settings") ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/10"
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-background overflow-x-hidden max-w-[100vw]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-black text-white fixed inset-y-0 left-0 z-30">
        <div className="px-5 py-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <img src={manaaLogoFull} alt="Manaa" className="h-6" />
          </Link>
        </div>

        {renderNav()}

        <div className="p-3 border-t border-white/10 mt-auto space-y-1">
          <a
            href="https://t.me/+KNQaejimSkFmMWY0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-lg bg-[#C0D904] hover:bg-[#C0D904]/90 text-black text-[13px] font-semibold transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Join Community
          </a>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-[13px] text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar – business selector + avatar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-2.5 flex items-center justify-between">
        {/* Business selector */}
        <button
          onClick={() => setBusinessDrawerOpen(true)}
          className="flex items-center gap-2 min-w-0"
        >
          {selectedBusiness?.logo_url ? (
            <Avatar className="h-8 w-8 rounded-lg border border-border shrink-0">
              <AvatarImage src={selectedBusiness.logo_url} alt={selectedBusiness.name} className="object-cover" />
              <AvatarFallback className="text-[10px] font-bold bg-foreground/5 text-muted-foreground rounded-lg">
                {(selectedBusiness.name || "B").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-border flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 text-left">
            <p className="text-[13px] font-semibold truncate leading-tight">
              {selectedBusiness?.name || "Select Business"}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {businesses?.length || 0} business{(businesses?.length || 0) !== 1 ? "es" : ""}
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </button>

        {/* Right: quick action + notification + avatar */}
        <div className="flex items-center gap-0.5">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 block dark:hidden" />
          </button>

          {/* Quick Actions – opens bottom drawer */}
          <button
            onClick={() => setQuickActionDrawerOpen(true)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Zap className="w-4 h-4" />
          </button>

          {/* Notification */}
          <button
            onClick={() => setNotificationDrawerOpen(true)}
            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <BellDot className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-0.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar – opens bottom drawer */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-0.5">
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarImage src={(profile as any)?.avatar_url || undefined} alt={displayName} />
                  <AvatarFallback className="text-[10px] font-bold bg-foreground text-background">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background z-[60]">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-[12px] font-medium truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => navigate("/settings?tab=profile")}>
                <User className="w-3.5 h-3.5" /> Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => navigate("/settings?tab=business")}>
                <Building2 className="w-3.5 h-3.5" /> Business Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => navigate("/settings?tab=general")}>
                <Settings className="w-3.5 h-3.5" /> General Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs gap-2 cursor-pointer text-destructive" onClick={() => signOut()}>
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Business selection bottom drawer (mobile) */}
      <Drawer open={businessDrawerOpen} onOpenChange={setBusinessDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-sm">Switch Business</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-1">
            {businesses?.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  onSelectBusiness(b.id);
                  setBusinessDrawerOpen(false);
                  navigate(`/businesses/${b.id}`);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-colors",
                  b.id === selectedBusinessId
                    ? "bg-foreground/5 border border-border"
                    : "hover:bg-secondary/60"
                )}
              >
                {(b as any).logo_url ? (
                  <Avatar className="h-9 w-9 rounded-lg border border-border/60 shrink-0">
                    <AvatarImage src={(b as any).logo_url} alt={b.name} className="object-cover" />
                    <AvatarFallback className="text-[10px] font-bold bg-foreground/5 text-muted-foreground rounded-lg">
                      {b.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-foreground/5 border border-border/60 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium truncate">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(b as any).currency || "Business"}</p>
                </div>
                {b.id === selectedBusinessId && (
                  <Check className="w-4 h-4 text-foreground shrink-0" />
                )}
              </button>
            ))}
            <button
              onClick={() => setAddBusinessOpen(true)}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-colors hover:bg-secondary/60 border border-dashed border-border/60 mt-2"
            >
              <div className="w-9 h-9 rounded-lg bg-foreground/5 border border-border/60 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-[13px] font-medium text-muted-foreground">Add Business</p>
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add Book bottom drawer */}
      <Drawer open={addBookOpen} onOpenChange={setAddBookOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-4 pt-2">
            <DrawerTitle className="text-sm">Create New Book</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto overscroll-contain">
            <form onSubmit={handleCreateBook} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Business</Label>
                <Select value={newBookBizId} onValueChange={setNewBookBizId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select business" /></SelectTrigger>
                  <SelectContent>
                    {businesses?.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Book Name</Label>
                <Input name="name" required placeholder="e.g. Main Cash" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Opening Balance (₦)</Label>
                <Input name="balance" type="number" step="0.01" defaultValue="0" className="h-9" />
              </div>
              <div className="pt-2">
                <Button type="submit" size="sm" className="w-full" disabled={createAcc.isPending || !newBookBizId}>
                  {createAcc.isPending ? "Creating..." : "Create Book"}
                </Button>
              </div>
            </form>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add Business bottom drawer */}
      <Drawer open={addBusinessOpen} onOpenChange={setAddBusinessOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-4 pt-2">
            <DrawerTitle className="text-sm">Create New Workspace</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto overscroll-contain">
            <form onSubmit={handleCreateBusiness} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Workspace Name</Label>
                <Input name="biz_name" required placeholder="e.g. My Store, Personal Budget" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description (optional)</Label>
                <Input name="biz_description" placeholder="What is this workspace for?" className="h-9" />
              </div>
              <div className="pt-2">
                <Button type="submit" size="sm" className="w-full" disabled={createBiz.isPending}>
                  {createBiz.isPending ? "Creating..." : "Create Business"}
                </Button>
              </div>
            </form>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Quick Actions bottom drawer (mobile) */}
      <Drawer open={quickActionDrawerOpen} onOpenChange={setQuickActionDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="pb-2 pt-2">
            <DrawerTitle className="text-sm">Quick Actions</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-5 grid grid-cols-2 gap-2">
            {[
              { icon: Building2, label: "Businesses", to: "/businesses", pro: false, biz: false },
              { icon: BarChart3, label: "Reports", to: "/reporting", pro: false, biz: false },
              { icon: FileText, label: "Invoices", to: "/invoicing", pro: false, biz: false },
              { icon: Users, label: "CRM", to: "/crm", pro: true, biz: false },
              { icon: Package, label: "Inventory", to: "/inventory", pro: true, biz: false },
              { icon: Store, label: "Store", to: "/store", pro: false, biz: true },
            ].filter((item) => !item.biz || isBusiness).map((item) => (
              <button
                key={item.to}
                onClick={() => {
                  setQuickActionDrawerOpen(false);
                  if (item.pro && !isPro) {
                    setUpgradeOpen(true);
                  } else {
                    navigate(item.to);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors text-left relative",
                  item.pro && !isPro
                    ? "border-border/40 opacity-60"
                    : "border-border/60 hover:bg-secondary/60"
                )}
              >
                <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-[13px] font-medium">{item.label}</span>
                {item.pro && !isPro && (
                  <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-full border border-yellow-500/20">
                    <Crown className="w-2.5 h-2.5" /> Pro
                  </span>
                )}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen min-w-0">
        <div className="hidden md:block">
          <AppHeader selectedBusinessId={selectedBusinessId} onSelectBusiness={onSelectBusiness} />
        </div>
        <main className="flex-1 pt-14 md:pt-0 pb-20 md:pb-0 overflow-x-hidden overflow-y-auto min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Telegram FAB */}
      <a
        href="https://t.me/+KNQaejimSkFmMWY0"
        target="_blank"
        rel="noopener noreferrer"
        className="md:hidden fixed bottom-20 right-4 z-[65] w-11 h-11 rounded-full bg-[#C0D904] hover:bg-[#C0D904]/90 text-black flex items-center justify-center shadow-lg active:scale-90 transition-all duration-200"
        aria-label="Join Telegram Community"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      </a>

      {/* Mobile Bottom Nav */}
      <BottomNav onPlusClick={() => { setCashModalType("cash_in"); setCashModalOpen(true); }} selectedBusinessId={selectedBusinessId} />

      {/* Cash Modal */}
      <CashModal open={cashModalOpen} onOpenChange={setCashModalOpen} defaultType={cashModalType} selectedBusinessId={selectedBusinessId} />

      {/* Notification Drawer */}
      <NotificationDrawer open={notificationDrawerOpen} onOpenChange={setNotificationDrawerOpen} />

      {/* Upgrade Modal */}
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Building2, Settings, ArrowLeft, Shield, Crown, Sun, Moon, Wallet, ChevronDown, ChevronRight, CreditCard, BarChart3, FileText, Mail, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

type NavItem = {
  to: string;
  icon: any;
  label: string;
  children?: { to: string; icon: any; label: string }[];
};

const adminNav: NavItem[] = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  {
    to: "/admin/users",
    icon: Users,
    label: "Users",
    children: [
      { to: "/admin/users", icon: Users, label: "All Users" },
      { to: "/admin/users/free", icon: Users, label: "Free Users" },
      { to: "/admin/users/pro", icon: Crown, label: "Pro Users" },
    ],
  },
  { to: "/admin/businesses", icon: Building2, label: "Businesses" },
  {
    to: "/admin/finance",
    icon: Wallet,
    label: "Finance",
    children: [
      { to: "/admin/finance", icon: BarChart3, label: "Overview" },
      { to: "/admin/finance/payments", icon: CreditCard, label: "Payments" },
      { to: "/admin/finance/subscriptions", icon: Crown, label: "Subscriptions" },
      { to: "/admin/finance/reports", icon: FileText, label: "Reports" },
    ],
  },
  { to: "/admin/emails", icon: Mail, label: "Emails" },
  { to: "/admin/notifications", icon: Bell, label: "Push Alerts" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => ({
    "/admin/finance": location.pathname.startsWith("/admin/finance"),
    "/admin/users": location.pathname.startsWith("/admin/users"),
  }));

  const toggleSection = (path: string) => setExpandedSections(prev => ({ ...prev, [path]: !prev[path] }));

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname === path;

  const isInSection = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card fixed inset-y-0 left-0 z-30">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {adminNav.map((item) => {
            const Icon = item.icon;

            if (item.children) {
              const sectionActive = isInSection(item.to);
              return (
                <div key={item.to}>
                  <button
                    onClick={() => toggleSection(item.to)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                      sectionActive ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                    {expandedSections[item.to] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedSections[item.to] && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(child.to);
                        return (
                          <Link
                            key={child.to}
                            to={child.to}
                            className={cn(
                              "flex items-center gap-3 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                              childActive ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                          >
                            <ChildIcon className="w-3.5 h-3.5" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                  active ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border mt-auto space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-[13px] text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 block dark:hidden" />
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-bold">Admin</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 block dark:hidden" />
          </Button>
          <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex">
        {adminNav.map((item) => {
          const active = item.children ? isInSection(item.to) : isActive(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px]",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}

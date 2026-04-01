import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBusinesses, useProfile, useUnreadNotificationCount } from "@/hooks/useData";
import { Bell, MessageSquare, Settings, Building2, User, LogOut, Sun, Moon, ChevronDown, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import NotificationDrawer from "@/components/NotificationDrawer";

interface AppHeaderProps {
  selectedBusinessId: string | null;
  onSelectBusiness: (id: string) => void;
}

export default function AppHeader({ selectedBusinessId, onSelectBusiness }: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const { data: businesses } = useBusinesses();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const unreadCount = useUnreadNotificationCount();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  

  return (
    <header className="border-b border-border bg-background flex items-center justify-between px-4 sm:px-6 py-4 shrink-0">
      {/* Left – Greeting */}
      <div className="flex flex-col justify-center min-w-0">
        <p className="text-sm sm:text-[15px] font-semibold tracking-tight truncate" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.03em" }}>
          Welcome back, {displayName} 👋
        </p>
      </div>

      {/* Center – Business switcher */}
      <div className="hidden sm:flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1.5 min-w-[160px] max-w-[260px] h-8 px-3 text-[13px] border border-border bg-secondary/50 rounded-md hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {(() => {
                const selectedBiz = businesses?.find(b => b.id === selectedBusinessId);
                return selectedBiz?.logo_url ? (
                  <Avatar className="h-4 w-4 shrink-0">
                    <AvatarImage src={selectedBiz.logo_url} alt={selectedBiz.name} />
                    <AvatarFallback className="text-[6px] bg-secondary">{selectedBiz.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                );
              })()}
              <span className="truncate flex-1 text-left">
                {businesses?.find(b => b.id === selectedBusinessId)?.name || "Select business"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[220px] bg-background z-50">
            {businesses?.map((b) => (
              <DropdownMenuItem
                key={b.id}
                className={`text-[13px] gap-2 cursor-pointer ${b.id === selectedBusinessId ? "bg-accent" : ""}`}
                onClick={() => { onSelectBusiness(b.id); navigate(`/businesses/${b.id}`); }}
              >
                {b.logo_url ? (
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarImage src={b.logo_url} alt={b.name} />
                    <AvatarFallback className="text-[8px] bg-secondary">{b.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                <span className="truncate">{b.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[13px] gap-2 cursor-pointer text-primary font-medium"
              onClick={() => navigate("/businesses?new=true")}
            >
              <Plus className="w-4 h-4" />
              Create New Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right – Actions & Avatar */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle theme"
        >
          <Sun className="w-4 h-4 hidden dark:block" />
          <Moon className="w-4 h-4 block dark:hidden" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MessageSquare className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
          onClick={() => setNotificationOpen(true)}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 ml-1 sm:ml-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={(profile as any)?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="text-[11px] font-bold bg-foreground text-background">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[13px] font-medium truncate">{displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem className="text-[13px] gap-2 cursor-pointer" onClick={() => navigate("/settings")}>
              <User className="w-3.5 h-3.5" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[13px] gap-2 cursor-pointer" onClick={() => navigate("/settings?tab=business")}>
              <Building2 className="w-3.5 h-3.5" />
              Business Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[13px] gap-2 cursor-pointer" onClick={() => navigate("/settings?tab=general")}>
              <Settings className="w-3.5 h-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[13px] gap-2 cursor-pointer text-destructive" onClick={() => signOut()}>
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <NotificationDrawer open={notificationOpen} onOpenChange={setNotificationOpen} />
    </header>
  );
}


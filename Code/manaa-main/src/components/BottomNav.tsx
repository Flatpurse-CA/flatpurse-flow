import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, BookOpen, BarChart3, User, Plus } from "lucide-react";

interface BottomNavProps {
  onPlusClick: () => void;
  selectedBusinessId?: string | null;
}

const getTabs = (bizId?: string | null) => [
  { to: "/home", icon: Home, label: "Home" },
  { to: bizId ? `/businesses/${bizId}` : "/businesses", icon: BookOpen, label: "Books" },
  { to: "__plus__", icon: Plus, label: "" },
  { to: "/reporting", icon: BarChart3, label: "Reports" },
  { to: "/settings?tab=profile", icon: User, label: "Profile" },
];

export default function BottomNav({ onPlusClick, selectedBusinessId }: BottomNavProps) {
  const location = useLocation();
  const tabs = getTabs(selectedBusinessId);

  const isActive = (path: string) => {
    if (path === "__plus__") return false;
    if (path === "/home") return location.pathname === "/home";
    return location.pathname.startsWith(path.split("?")[0]);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60]">
      {/* Frosted glass bar */}
      <div className="bg-background/80 backdrop-blur-xl border-t border-border/30 shadow-[0_-1px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-end justify-around h-16 px-2 pb-1 max-w-md mx-auto relative">
          {tabs.map((tab) => {
            if (tab.to === "__plus__") {
              return (
                <button
                  key="plus"
                  onClick={onPlusClick}
                  className="flex flex-col items-center justify-center gap-1 w-16 py-2"
                  aria-label="Quick action"
                >
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg shadow-foreground/20 active:scale-90 transition-all duration-200">
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                </button>
              );
            }

            const active = isActive(tab.to);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 py-2 transition-all duration-200 relative",
                  active ? "text-foreground" : "text-muted-foreground/60"
                )}
              >
                {active && (
                  <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-foreground" />
                )}
                <Icon
                  className={cn(
                    "transition-all duration-200",
                    active ? "w-[22px] h-[22px]" : "w-5 h-5"
                  )}
                  strokeWidth={active ? 2.2 : 1.5}
                />
                <span className={cn(
                  "text-[10px] leading-none transition-all duration-200",
                  active ? "font-semibold" : "font-normal"
                )}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  );
}

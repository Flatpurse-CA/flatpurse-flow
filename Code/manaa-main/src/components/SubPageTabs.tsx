import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Tab {
  to: string;
  label: string;
}

interface SubPageTabsProps {
  tabs: Tab[];
}

export default function SubPageTabs({ tabs }: SubPageTabsProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6">
      <div className="flex gap-1 min-w-max pb-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "." || !tab.to.includes("/")}
            className={({ isActive }) =>
              cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

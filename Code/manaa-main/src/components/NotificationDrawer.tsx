import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useData";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { CheckCheck, Circle, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface NotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NotificationDrawer({ open, onOpenChange }: NotificationDrawerProps) {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  const handleClick = (n: any) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.reference_id) {
      onOpenChange(false);
      navigate(`/transaction/${n.reference_id}`);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="flex items-center justify-between pr-4">
          <DrawerTitle className="text-sm">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full font-medium">
                {unreadCount}
              </span>
            )}
          </DrawerTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] gap-1.5 text-muted-foreground"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
        </DrawerHeader>

        <div className="px-4 pb-6 max-h-[60vh] overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : !notifications?.length ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                They'll appear here when you record transactions
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "flex items-start gap-3 w-full px-3 py-3 rounded-xl text-left transition-colors",
                  n.is_read
                    ? "opacity-60 hover:bg-secondary/40"
                    : "bg-foreground/[0.03] border border-border/60 hover:bg-secondary/60"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    n.title.includes("Cash In")
                      ? "bg-[hsl(142,71%,90%)] text-[hsl(142,71%,30%)]"
                      : "bg-[hsl(0,72%,93%)] text-[hsl(0,72%,40%)]"
                  )}
                >
                  {n.title.includes("Cash In") ? (
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {!n.is_read && (
                      <Circle className="w-2 h-2 fill-primary text-primary shrink-0" />
                    )}
                    <p className="text-[13px] font-medium truncate">{n.title}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

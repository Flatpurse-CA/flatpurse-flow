import { useAdminSubscriptions } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Crown } from "lucide-react";

export default function AdminSubscriptions() {
  const { data, isLoading } = useAdminSubscriptions();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Manage Pro subscriptions and revenue</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">All Subscriptions ({data?.subscriptions?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : !data?.subscriptions?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No subscriptions yet. Users will appear here when they upgrade to Pro.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cycle</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Expires</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subscriptions.map((s: any) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium">{s.user_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {s.plan === "pro" ? (
                          <Badge className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Free</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-[12px] capitalize">
                        {s.billing_cycle === "admin_granted" ? (
                          <Badge variant="outline" className="text-[10px]">Admin Granted</Badge>
                        ) : (
                          s.billing_cycle || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge
                          variant={s.status === "active" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-[12px] text-muted-foreground">
                        {s.current_period_end
                          ? new Date(s.current_period_end).getFullYear() >= 2099
                            ? "Never"
                            : format(new Date(s.current_period_end), "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-[12px] text-muted-foreground">
                        {format(new Date(s.created_at), "dd MMM yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

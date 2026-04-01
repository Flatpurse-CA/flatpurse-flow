import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminFinancePayments } from "@/hooks/useAdmin";

export default function AdminFinancePayments() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const { data, isLoading } = useAdminFinancePayments(page, filter);

  const fmt = (n: number) => `₦${Number(n).toLocaleString()}`;
  const totalPages = data ? Math.ceil((data.total || 0) / (data.perPage || 30)) : 1;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">All subscription payments and transactions</p>
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Records</SelectItem>
            <SelectItem value="active">Active Pro</SelectItem>
            <SelectItem value="paid">Paid (Non-Admin)</SelectItem>
            <SelectItem value="admin_granted">Admin Granted</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment Records ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : !data?.payments?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No payment records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cycle</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Reference</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p: any) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium truncate max-w-[180px]">{p.user_email}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[13px]">
                        {p.amount > 0 ? fmt(p.amount) : <span className="text-muted-foreground">Free</span>}
                      </td>
                      <td className="px-4 py-3">
                        {p.plan === "pro" ? (
                          <Badge className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                            <Crown className="w-3 h-3 mr-1" />Pro
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Free</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-[12px] capitalize">
                        {p.billing_cycle === "admin_granted" ? (
                          <Badge variant="outline" className="text-[10px]">Admin</Badge>
                        ) : p.billing_cycle || "—"}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-[11px] text-muted-foreground font-mono truncate max-w-[120px]">
                        {p.paystack_reference || "—"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-[12px] text-muted-foreground">
                        {format(new Date(p.created_at), "dd MMM yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

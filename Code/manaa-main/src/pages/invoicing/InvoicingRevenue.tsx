import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useInvoices } from "@/hooks/useData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, DollarSign } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { format } from "date-fns";

export default function InvoicingRevenue() {
  const { businessId } = useOutletContext<{ businessId: string | undefined }>();
  const { data: invoices, isLoading } = useInvoices(businessId);

  const stats = useMemo(() => {
    if (!invoices?.length) return null;

    const totalBilled = invoices.reduce((s, i) => s + Number(i.total), 0);
    const paid = invoices.filter(i => i.status === "paid");
    const totalPaid = paid.reduce((s, i) => s + Number(i.total), 0);
    const pending = invoices.filter(i => i.status !== "paid" && i.status !== "cancelled");
    const totalPending = pending.reduce((s, i) => s + Number(i.total), 0);
    const cancelled = invoices.filter(i => i.status === "cancelled");
    const totalCancelled = cancelled.reduce((s, i) => s + Number(i.total), 0);

    // Monthly revenue (last 6 months)
    const now = new Date();
    const monthly: { month: string; billed: number; paid: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const label = format(d, "MMM yy");
      const monthInvs = invoices.filter(inv => {
        const id = new Date(inv.issue_date);
        return id >= d && id <= monthEnd;
      });
      const billed = monthInvs.reduce((s, inv) => s + Number(inv.total), 0);
      const paidAmt = monthInvs.filter(inv => inv.status === "paid").reduce((s, inv) => s + Number(inv.total), 0);
      monthly.push({ month: label, billed, paid: paidAmt });
    }

    // Top clients
    const clientMap: Record<string, number> = {};
    invoices.forEach(inv => {
      const key = inv.customer_name;
      clientMap[key] = (clientMap[key] || 0) + Number(inv.total);
    });
    const topClients = Object.entries(clientMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    // Status distribution
    const statusData = [
      { name: "Paid", value: totalPaid, color: "hsl(142, 71%, 45%)" },
      { name: "Pending", value: totalPending, color: "hsl(38, 92%, 50%)" },
      { name: "Cancelled", value: totalCancelled, color: "hsl(0, 84%, 60%)" },
    ].filter(d => d.value > 0);

    return { totalBilled, totalPaid, totalPending, totalCancelled, monthly, topClients, statusData, invoiceCount: invoices.length, paidCount: paid.length };
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <TrendingUp className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">Create invoices to see revenue insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total Billed</p>
            <p className="text-lg font-semibold">{formatNaira(stats.totalBilled)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-cash-in-light">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Collected</p>
            <p className="text-lg font-semibold text-cash-in">{formatNaira(stats.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-cash-out-light">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Outstanding</p>
            <p className="text-lg font-semibold text-cash-out">{formatNaira(stats.totalPending)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Collection Rate</p>
            <p className="text-lg font-semibold">
              {stats.totalBilled > 0 ? `${Math.round((stats.totalPaid / stats.totalBilled) * 100)}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Monthly Invoice Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatNaira(v)} contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="billed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Billed" />
                <Bar dataKey="paid" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Paid" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Pie */}
        {stats.statusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {stats.statusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatNaira(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Clients</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {stats.topClients.map((c, idx) => (
                <div key={c.name} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                    <p className="text-sm font-medium truncate">{c.name}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatNaira(c.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

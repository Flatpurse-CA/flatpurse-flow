import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, ArrowDownLeft, ArrowUpRight, Crown, FileText, Users, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAdminFinanceOverview } from "@/hooks/useAdmin";

export default function AdminFinanceOverview() {
  const { data, isLoading } = useAdminFinanceOverview();
  const fmt = (n: number) => `₦${Number(n).toLocaleString()}`;

  const cards = [
    { label: "MRR", value: data?.revenue?.mrr ? fmt(data.revenue.mrr) : "—", icon: TrendingUp, color: "text-green-500" },
    { label: "ARR", value: data?.revenue?.arr ? fmt(data.revenue.arr) : "—", icon: BarChart3, color: "text-blue-500" },
    { label: "Total Revenue", value: data?.revenue?.total_revenue ? fmt(data.revenue.total_revenue) : "—", icon: DollarSign, color: "text-emerald-500" },
    { label: "Active Subs", value: data?.subscription_summary?.total_active ?? "—", icon: Crown, color: "text-yellow-500" },
    { label: "Monthly Subs", value: data?.subscription_summary?.monthly ?? "—", icon: Users, color: "text-indigo-500" },
    { label: "Annual Subs", value: data?.subscription_summary?.annual ?? "—", icon: Users, color: "text-purple-500" },
    { label: "Platform Cash In", value: data?.platform_volume?.total_cash_in ? fmt(data.platform_volume.total_cash_in) : "—", icon: ArrowDownLeft, color: "text-green-600" },
    { label: "Platform Cash Out", value: data?.platform_volume?.total_cash_out ? fmt(data.platform_volume.total_cash_out) : "—", icon: ArrowUpRight, color: "text-red-500" },
    { label: "Invoiced Total", value: data?.invoicing?.total_invoiced ? fmt(data.invoicing.total_invoiced) : "—", icon: FileText, color: "text-cyan-500" },
    { label: "Paid Invoices", value: data?.invoicing?.total_paid ? fmt(data.invoicing.total_paid) : "—", icon: FileText, color: "text-green-500" },
    { label: "Unpaid Invoices", value: data?.invoicing?.total_unpaid ? fmt(data.invoicing.total_unpaid) : "—", icon: FileText, color: "text-orange-500" },
    { label: "Cancelled Subs", value: data?.subscription_summary?.cancelled ?? "—", icon: Crown, color: "text-muted-foreground" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Overview</h1>
        <p className="text-sm text-muted-foreground">Revenue, subscriptions & platform financial health</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">{c.label}</CardTitle>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold truncate">
                  {isLoading ? <span className="w-16 h-5 bg-muted animate-pulse rounded inline-block" /> : c.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Trend Chart */}
      {data?.monthly_trend && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="new_subs" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} name="New Subs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useAdminStats } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, ArrowRightLeft, FileText, Crown, TrendingUp, BookOpen, DollarSign, ArrowDownLeft, ArrowUpRight, Package, UserCheck } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  const fmt = (n: number) => `₦${Number(n).toLocaleString()}`;

  const cards = [
    { label: "Total Users", value: stats?.total_users ?? "—", icon: Users, color: "text-blue-500" },
    { label: "Pro Users", value: stats?.active_pro_users ?? "—", icon: Crown, color: "text-yellow-500" },
    { label: "Est. MRR", value: stats?.estimated_mrr ? fmt(stats.estimated_mrr) : "—", icon: TrendingUp, color: "text-green-500" },
    { label: "Businesses", value: stats?.total_businesses ?? "—", icon: Building2, color: "text-purple-500" },
    { label: "Total Books", value: stats?.total_books ?? "—", icon: BookOpen, color: "text-indigo-500" },
    { label: "Transactions", value: stats?.total_transactions ?? "—", icon: ArrowRightLeft, color: "text-orange-500" },
    { label: "Total Tracked", value: stats?.total_tracked ? fmt(stats.total_tracked) : "—", icon: DollarSign, color: "text-emerald-500", subtitle: "All money recorded" },
    { label: "Total Cash In", value: stats?.total_cash_in ? fmt(stats.total_cash_in) : "—", icon: ArrowDownLeft, color: "text-green-600" },
    { label: "Total Cash Out", value: stats?.total_cash_out ? fmt(stats.total_cash_out) : "—", icon: ArrowUpRight, color: "text-red-500" },
    { label: "Invoices", value: stats?.total_invoices ?? "—", icon: FileText, color: "text-cyan-500" },
    { label: "Inventory Items", value: stats?.total_inventory_items ?? "—", icon: Package, color: "text-amber-500" },
    { label: "CRM Contacts", value: stats?.total_contacts ?? "—", icon: UserCheck, color: "text-pink-500" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview and statistics</p>
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
                <p className="text-xl font-bold truncate">
                  {isLoading ? <span className="w-16 h-6 bg-muted animate-pulse rounded inline-block" /> : c.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

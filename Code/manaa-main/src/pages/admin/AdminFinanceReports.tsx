import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { useAdminFinanceReports } from "@/hooks/useAdmin";

export default function AdminFinanceReports() {
  const { data, isLoading } = useAdminFinanceReports();
  const fmt = (n: number) => `₦${Number(n).toLocaleString()}`;

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Financial Reports</h1>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-sm text-muted-foreground">Platform-wide cash flow, categories & transaction volume</p>
      </div>

      {/* Monthly Volume Chart */}
      {data?.monthly_volume && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Transaction Volume (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthly_volume}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12 }} />
                  <Legend />
                  <Line type="monotone" dataKey="cash_in" stroke="hsl(142, 71%, 45%)" strokeWidth={2} name="Cash In" dot={false} />
                  <Line type="monotone" dataKey="cash_out" stroke="hsl(0, 84%, 60%)" strokeWidth={2} name="Cash Out" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {data?.category_breakdown && data.category_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Categories by Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.category_breakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={120} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="income" fill="hsl(142, 71%, 45%)" name="Income" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="expense" fill="hsl(0, 84%, 60%)" name="Expense" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Count Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{data?.total_transactions?.toLocaleString() ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Total Transactions</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.monthly_volume?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Months Tracked</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.category_breakdown?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Active Categories</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

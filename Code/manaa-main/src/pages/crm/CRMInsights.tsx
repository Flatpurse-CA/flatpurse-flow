import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContacts, useDeals, useDealStages, useBusinessTransactions } from "@/hooks/useData";
import { TrendingUp, Users, Target, BarChart3, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CRMInsights() {
  const { businessId } = useOutletContext<{ businessId: string | undefined }>();
  const { data: contacts } = useContacts(businessId);
  const { data: deals } = useDeals(businessId);
  const { data: stages } = useDealStages(businessId);
  const { data: transactions } = useBusinessTransactions(businessId);

  const fmt = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  if (!businessId) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Select a business first</p>
      </div>
    );
  }

  // Pipeline analysis
  const wonStage = stages?.find((s) => s.name === "Won");
  const lostStage = stages?.find((s) => s.name === "Lost");
  const wonDeals = deals?.filter((d) => d.stage_id === wonStage?.id) || [];
  const lostDeals = deals?.filter((d) => d.stage_id === lostStage?.id) || [];
  const activeDeals = deals?.filter((d) => d.stage_id !== wonStage?.id && d.stage_id !== lostStage?.id) || [];
  const totalDeals = deals?.length || 0;
  const winRate = totalDeals > 0 ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length || 1)) * 100) : 0;
  const avgDealValue = activeDeals.length > 0
    ? activeDeals.reduce((s, d) => s + Number(d.value), 0) / activeDeals.length
    : 0;

  // Top contacts by deal value
  const contactDealValues = (contacts || []).map((c) => {
    const cDeals = deals?.filter((d) => d.contact_id === c.id) || [];
    const totalValue = cDeals.reduce((s, d) => s + Number(d.value), 0);
    const wonValue = cDeals.filter((d) => d.stage_id === wonStage?.id).reduce((s, d) => s + Number(d.value), 0);
    return { ...c, totalValue, wonValue, dealCount: cDeals.length };
  }).filter((c) => c.dealCount > 0).sort((a, b) => b.totalValue - a.totalValue);

  // Revenue from transactions linked to customer names that match contacts
  const topClientsByRevenue = (contacts || []).map((c) => {
    const clientTxs = transactions?.filter((t) =>
      t.type === "cash_in" &&
      t.customer_name?.toLowerCase() === c.name.toLowerCase()
    ) || [];
    const revenue = clientTxs.reduce((s, t) => s + Number(t.amount), 0);
    return { ...c, revenue, txCount: clientTxs.length };
  }).filter((c) => c.revenue > 0).sort((a, b) => b.revenue - a.revenue);

  // Stage distribution
  const stageDistribution = (stages || []).map((s) => ({
    ...s,
    count: deals?.filter((d) => d.stage_id === s.id).length || 0,
    value: deals?.filter((d) => d.stage_id === s.id).reduce((sum, d) => sum + Number(d.value), 0) || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground mb-1">Win Rate</p>
            <p className="text-2xl font-bold">{winRate}%</p>
            <p className="text-[10px] text-muted-foreground">{wonDeals.length}W / {lostDeals.length}L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground mb-1">Avg Deal Value</p>
            <p className="text-2xl font-bold">{fmt(avgDealValue)}</p>
            <p className="text-[10px] text-muted-foreground">{activeDeals.length} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground mb-1">Won Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(wonDeals.reduce((s, d) => s + Number(d.value), 0))}</p>
            <p className="text-[10px] text-muted-foreground">{wonDeals.length} deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground mb-1">Total Contacts</p>
            <p className="text-2xl font-bold">{contacts?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">{contactDealValues.length} with deals</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stage breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4" /> Pipeline Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!stageDistribution.length ? (
              <p className="text-xs text-muted-foreground px-6 pb-4">No pipeline stages set up</p>
            ) : (
              <div className="divide-y divide-border">
                {stageDistribution.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color || undefined }} />
                      <span className="text-sm">{s.name}</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{s.count}</Badge>
                    </div>
                    <span className="text-xs font-medium">{fmt(s.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top contacts by deal value */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" /> Top Clients by Deal Value
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!contactDealValues.length ? (
              <p className="text-xs text-muted-foreground px-6 pb-4">No client deals yet</p>
            ) : (
              <div className="divide-y divide-border">
                {contactDealValues.slice(0, 8).map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.dealCount} deal{c.dealCount !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{fmt(c.totalValue)}</p>
                      {c.wonValue > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{fmt(c.wonValue)} won</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top clients by actual revenue (transactions) */}
      {topClientsByRevenue.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Top Clients by Revenue (Transactions)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {topClientsByRevenue.slice(0, 10).map((c, i) => (
                <div key={c.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.txCount} transaction{c.txCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{fmt(c.revenue)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

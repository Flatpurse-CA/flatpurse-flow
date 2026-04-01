import { useOutletContext, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContacts, useDeals, useDealStages, useReminders } from "@/hooks/useData";
import { Users, Target, Clock, TrendingUp, ArrowRight, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function CRMOverview() {
  const { businessId } = useOutletContext<{ businessId: string | undefined }>();
  const { data: contacts } = useContacts(businessId);
  const { data: deals } = useDeals(businessId);
  const { data: stages } = useDealStages(businessId);
  const { data: reminders } = useReminders(businessId);

  const totalContacts = contacts?.length || 0;
  const activeDeals = deals?.filter((d) => {
    const stage = stages?.find((s) => s.id === d.stage_id);
    return stage && !["Won", "Lost"].includes(stage.name);
  }) || [];
  const pipelineValue = activeDeals.reduce((s, d) => s + Number(d.value), 0);
  const wonDeals = deals?.filter((d) => {
    const stage = stages?.find((s) => s.id === d.stage_id);
    return stage?.name === "Won";
  }) || [];
  const wonValue = wonDeals.reduce((s, d) => s + Number(d.value), 0);
  const pendingReminders = reminders?.filter((r) => !r.is_completed) || [];
  const overdueReminders = pendingReminders.filter((r) => new Date(r.due_date) < new Date());

  const fmt = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  if (!businessId) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Select or create a business to use CRM</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/crm/contacts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{totalContacts}</p>
              <p className="text-[11px] text-muted-foreground">Total Contacts</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/crm/pipeline">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{activeDeals.length}</p>
              <p className="text-[11px] text-muted-foreground">Active Deals</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{fmt(pipelineValue)}</p>
            <p className="text-[11px] text-muted-foreground">Pipeline Value</p>
          </CardContent>
        </Card>

        <Link to="/crm/tasks">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {overdueReminders.length > 0 && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0">{overdueReminders.length} overdue</Badge>
                )}
              </div>
              <p className="text-2xl font-bold">{pendingReminders.length}</p>
              <p className="text-[11px] text-muted-foreground">Pending Tasks</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent activity rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent deals */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Recent Deals</CardTitle>
              <Link to="/crm/pipeline" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!deals?.length ? (
              <p className="text-xs text-muted-foreground px-6 pb-4">No deals yet</p>
            ) : (
              <div className="divide-y divide-border">
                {deals.slice(0, 5).map((deal) => {
                  const stage = stages?.find((s) => s.id === deal.stage_id);
                  return (
                    <Link key={deal.id} to={`/crm/deals/${deal.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{deal.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {stage && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color || undefined }} />
                              {stage.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-foreground">{fmt(Number(deal.value))}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Upcoming Tasks</CardTitle>
              <Link to="/crm/tasks" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!pendingReminders.length ? (
              <p className="text-xs text-muted-foreground px-6 pb-4">No pending tasks</p>
            ) : (
              <div className="divide-y divide-border">
                {pendingReminders.slice(0, 5).map((r) => {
                  const overdue = new Date(r.due_date) < new Date();
                  return (
                    <div key={r.id} className="flex items-center justify-between px-6 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className={`text-[10px] ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                          {format(new Date(r.due_date), "MMM d, h:mm a")}
                        </p>
                      </div>
                      {overdue && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Overdue</Badge>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Won revenue */}
      {wonValue > 0 && (
        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{fmt(wonValue)}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Total won revenue · {wonDeals.length} deal{wonDeals.length !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from "react";
import { useAdminBusinesses } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function AdminBusinesses() {
  const [page] = useState(1);
  const { data, isLoading } = useAdminBusinesses(page);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Businesses</h1>
        <p className="text-sm text-muted-foreground">All businesses across the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">All Businesses ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Owner</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Currency</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Books</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.businesses?.map((b: any) => (
                    <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[13px]">{b.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{b.description || "—"}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-[12px] text-muted-foreground">{b.owner_email}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-[13px]">{b.currency}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-[13px]">{b.account_count}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-[12px] text-muted-foreground">
                        {format(new Date(b.created_at), "dd MMM yyyy")}
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

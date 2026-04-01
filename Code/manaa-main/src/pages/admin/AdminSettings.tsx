import { useAdminCategories } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminSettings() {
  const { data, isLoading } = useAdminCategories();

  const incomeCategories = data?.categories?.filter((c: any) => c.type === "income") || [];
  const expenseCategories = data?.categories?.filter((c: any) => c.type === "expense") || [];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">App Settings</h1>
        <p className="text-sm text-muted-foreground">Global configuration and defaults</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Default Income Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {incomeCategories.map((c: any) => (
                  <Badge key={c.name} variant="secondary" className="text-xs">{c.name}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Default Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {expenseCategories.map((c: any) => (
                  <Badge key={c.name} variant="secondary" className="text-xs">{c.name}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

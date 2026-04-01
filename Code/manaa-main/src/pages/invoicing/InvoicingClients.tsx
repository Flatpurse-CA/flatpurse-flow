import { useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { useInvoices } from "@/hooks/useData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, MapPin, FileText } from "lucide-react";
import { formatNaira } from "@/lib/currency";

interface ClientSummary {
  name: string;
  email: string;
  address: string;
  invoiceCount: number;
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
}

export default function InvoicingClients() {
  const { businessId } = useOutletContext<{ businessId: string | undefined }>();
  const { data: invoices, isLoading } = useInvoices(businessId);

  const clients = useMemo(() => {
    if (!invoices?.length) return [];
    const map: Record<string, ClientSummary> = {};
    invoices.forEach(inv => {
      const key = inv.customer_name.toLowerCase().trim();
      if (!map[key]) {
        map[key] = {
          name: inv.customer_name,
          email: inv.customer_email || "",
          address: inv.customer_address || "",
          invoiceCount: 0,
          totalBilled: 0,
          totalPaid: 0,
          totalPending: 0,
        };
      }
      map[key].invoiceCount++;
      map[key].totalBilled += Number(inv.total);
      if (inv.status === "paid") map[key].totalPaid += Number(inv.total);
      else map[key].totalPending += Number(inv.total);
      // Keep most recent email/address
      if (inv.customer_email) map[key].email = inv.customer_email;
      if (inv.customer_address) map[key].address = inv.customer_address;
    });
    return Object.values(map).sort((a, b) => b.totalBilled - a.totalBilled);
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
      </div>
    );
  }

  if (!clients.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <User className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">No clients yet — create an invoice to see clients here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-none bg-secondary">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total Clients</p>
            <p className="text-lg font-semibold">{clients.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-cash-in-light">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total Billed</p>
            <p className="text-lg font-semibold text-cash-in">{formatNaira(clients.reduce((s, c) => s + c.totalBilled, 0))}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-cash-out-light">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground">Total Pending</p>
            <p className="text-lg font-semibold text-cash-out">{formatNaira(clients.reduce((s, c) => s + c.totalPending, 0))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Client list */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <div key={client.name} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold">{client.name[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{client.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {client.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3" /> {client.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {client.invoiceCount} invoice{client.invoiceCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatNaira(client.totalBilled)}</p>
                    {client.totalPending > 0 && (
                      <p className="text-[11px] text-cash-out">{formatNaira(client.totalPending)} pending</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

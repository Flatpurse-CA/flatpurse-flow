import { useState } from "react";
import { useWallet, useWalletTransactions, useCreateDVA } from "@/hooks/useWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/currency";
import {
  Wallet, Copy, ArrowDownLeft, ArrowUpRight, Building2, RefreshCw,
  CheckCircle, Clock, AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function WalletPage() {
  const { data: wallet, isLoading: walletLoading, refetch } = useWallet();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions();
  const createDVA = useCreateDVA();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState("");

  const copyAccountNumber = () => {
    if (!wallet?.virtual_account_number) return;
    navigator.clipboard.writeText(wallet.virtual_account_number);
    setCopied(true);
    toast({ title: "Copied!", description: "Account number copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateDVA = async () => {
    if (!phone.trim()) {
      toast({ title: "Phone required", description: "Enter your phone number to create a virtual account", variant: "destructive" });
      return;
    }
    try {
      await createDVA.mutateAsync(phone.trim());
      toast({ title: "Virtual account created!", description: "You can now receive transfers" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <PageHeader title="Wallet" subtitle="Receive payments via bank transfer" />

      {/* Wallet Balance Card */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          {walletLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-40" />
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Available Balance</p>
              <p className="text-3xl font-bold text-foreground">{formatNaira(wallet?.balance || 0)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Virtual Account Card */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Virtual Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {walletLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : wallet?.virtual_account_number ? (
            <div className="space-y-4">
              <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Bank</p>
                    <p className="text-sm font-medium">{wallet.virtual_account_bank}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600 dark:text-green-400">Active</Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Account Number</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-lg font-bold font-mono tracking-wider">{wallet.virtual_account_number}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyAccountNumber}>
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Account Name</p>
                  <p className="text-sm font-medium">{wallet.virtual_account_name}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Transfer money to this account number and it will automatically reflect in your wallet balance.
              </p>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <Wallet className="w-10 h-10 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No virtual account yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your phone number and create a virtual account to receive payments via bank transfer.
                </p>
              </div>
              <div className="max-w-xs mx-auto space-y-2">
                <Input
                  placeholder="e.g. 08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                />
                <Button onClick={handleCreateDVA} disabled={createDVA.isPending} size="sm" className="w-full">
                  {createDVA.isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-3.5 h-3.5 mr-1.5" />
                      Create Virtual Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-sm">Transaction History</CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !transactions?.length ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {transactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/40 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === "credit"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}>
                    {tx.type === "credit" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{tx.description || tx.source}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      tx.type === "credit" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      {tx.type === "credit" ? "+" : "-"}{formatNaira(tx.amount)}
                    </p>
                    {tx.status !== "completed" && (
                      <Badge variant="outline" className="text-[9px]">
                        {tx.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useReferral } from "@/hooks/useReferral";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Share2, Users, Wallet, Gift, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ReferralTab() {
  const { toast } = useToast();
  const {
    referralCode, referralLink, referrals, earnings,
    totalEarnings, pendingEarnings, totalReferrals, convertedReferrals, isLoading,
  } = useReferral();
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Manaa",
          text: `Use my referral code ${referralCode} to sign up on Manaa and manage your finances like a pro!`,
          url: referralLink,
        });
      } catch {}
    } else {
      handleCopy(referralLink);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Referral Code Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gift className="w-4 h-4" /> Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Share your code and earn <strong>10%</strong> of the first Pro payment and <strong>5%</strong> on every renewal!
          </p>

          {/* Code display */}
          <div className="flex items-center gap-2">
            <Input
              value={referralCode}
              readOnly
              className="h-10 font-mono font-bold text-center text-lg tracking-widest bg-secondary"
            />
            <Button size="sm" variant="outline" className="h-10 px-3" onClick={() => handleCopy(referralCode)}>
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* Link */}
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Referral Link</p>
            <div className="flex items-center gap-2">
              <Input
                value={referralLink}
                readOnly
                className="h-9 text-xs bg-secondary truncate"
              />
              <Button size="sm" variant="outline" className="h-9 px-3 shrink-0" onClick={() => handleCopy(referralLink)}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <Button onClick={handleShare} className="w-full" size="sm">
            <Share2 className="w-4 h-4 mr-2" /> Share Referral Link
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground uppercase">Referrals</p>
            </div>
            <p className="text-2xl font-bold">{totalReferrals}</p>
            <p className="text-[11px] text-muted-foreground">{convertedReferrals} converted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground uppercase">Earnings</p>
            </div>
            <p className="text-2xl font-bold">₦{totalEarnings.toLocaleString()}</p>
            {pendingEarnings > 0 && (
              <p className="text-[11px] text-muted-foreground">₦{pendingEarnings.toLocaleString()} pending</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">1</div>
            <div>
              <p className="text-sm font-medium">Share your link</p>
              <p className="text-xs text-muted-foreground">Send your unique referral link to friends</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">2</div>
            <div>
              <p className="text-sm font-medium">They sign up & go Pro</p>
              <p className="text-xs text-muted-foreground">When they upgrade to Pro, you earn 10% of their payment</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">3</div>
            <div>
              <p className="text-sm font-medium">Keep earning</p>
              <p className="text-xs text-muted-foreground">Earn 5% on every renewal they make after that</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings history */}
      {earnings && earnings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Earnings History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {earnings.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">₦{e.amount.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {e.earning_type === "first" ? "First payment (10%)" : "Renewal (5%)"} • {format(new Date(e.created_at), "dd MMM yyyy")}
                  </p>
                </div>
                <Badge variant={e.credited ? "default" : "secondary"} className="text-[10px]">
                  {e.credited ? "Credited" : "Pending"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

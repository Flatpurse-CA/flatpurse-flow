import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Check, Crown, Building2, Loader2, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTier?: "pro" | "business";
}

type BillingCycle = "monthly" | "biannual" | "annual";

const PRICING = {
  pro: {
    monthly: { amount: "₦4,500", label: "/ month", save: null },
    biannual: { amount: "₦25,000", label: "/ 6 months", save: "Save ₦2,000 vs monthly" },
    annual: { amount: "₦50,000", label: "/ year", save: "Save ₦4,000 vs monthly" },
  },
  business: {
    monthly: { amount: "₦7,500", label: "/ month", save: null },
    biannual: { amount: "₦40,000", label: "/ 6 months", save: "Save ₦5,000 vs monthly" },
    annual: { amount: "₦85,000", label: "/ year", save: "Save ₦5,000 vs monthly" },
  },
};

const PRO_FEATURES = [
  "Unlimited businesses",
  "Unlimited books per business",
  "Full CRM (contacts, leads, pipeline)",
  "Inventory management",
  "Debt tracker",
  "Tax reporting",
  "WhatsApp message drafting",
];

const BUSINESS_FEATURES = [
  "Everything in Pro",
  "Online Storefront with public link",
  "Order management & tracking",
  "Team & staff access (roles)",
  "Multi-branch support",
  "Branch-level inventory",
  "Priority support",
];

export default function UpgradeModal({ open, onOpenChange, defaultTier = "pro" }: UpgradeModalProps) {
  const [tier, setTier] = useState<"pro" | "business">(defaultTier);
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [loading, setLoading] = useState(false);
  const { initializeCheckout, isPro } = useSubscription();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // If user is already Pro and opens modal, default to business tab
  const effectiveTier = isPro && tier === "pro" ? "business" : tier;

  const pricing = PRICING[effectiveTier][cycle];
  const features = effectiveTier === "pro" ? PRO_FEATURES : BUSINESS_FEATURES;
  const planKey = `${effectiveTier}_${cycle}` as const;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { authorization_url } = await initializeCheckout(planKey as any);
      window.location.href = authorization_url;
    } catch (err: any) {
      toast({ title: "Payment error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const gradientClass = effectiveTier === "pro"
    ? "from-accent-green/80 via-accent-green/40 to-accent-green/10"
    : "from-blue-500/80 via-blue-500/40 to-blue-500/10";
  
  const accentColor = effectiveTier === "pro" ? "text-accent-green" : "text-blue-500";
  const accentBg = effectiveTier === "pro" ? "bg-accent-green text-accent-green-foreground" : "bg-blue-600 text-white";
  const inactiveBg = "bg-foreground/10 text-muted-foreground hover:bg-foreground/15";

  const content = (
    <div className="flex flex-col bg-card">
      {/* Tier tabs */}
      <div className="flex border-b border-border">
        {!isPro && (
          <button
            onClick={() => setTier("pro")}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              effectiveTier === "pro"
                ? "text-accent-green border-b-2 border-accent-green"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Crown className="w-4 h-4" /> Pro
          </button>
        )}
        <button
          onClick={() => setTier("business")}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            effectiveTier === "business"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" /> Business
        </button>
      </div>

      {/* Gradient hero */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/40 to-transparent" />
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>
        <div className="relative px-6 pt-8 pb-5">
          <p className={`text-sm font-bold tracking-wide ${accentColor}`}>
            {effectiveTier === "pro" ? "Pro" : "Business"}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-foreground">{pricing.amount}</span>
            <span className="text-sm text-muted-foreground">{pricing.label}</span>
          </div>
          {pricing.save && (
            <p className={`text-xs font-medium mt-1 ${accentColor}`}>{pricing.save}</p>
          )}

          {/* Billing cycle toggle */}
          <div className="flex gap-2 mt-4">
            {(["monthly", "biannual", "annual"] as BillingCycle[]).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  cycle === c ? accentBg : inactiveBg
                }`}
              >
                {c === "monthly" ? "Monthly" : c === "biannual" ? "Bi-annual" : "Annual"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-6 pt-4">
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold text-sm ${accentBg} hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            `Upgrade to ${effectiveTier === "pro" ? "Pro" : "Business"}`
          )}
        </button>
      </div>

      {/* Features */}
      <div className="px-6 py-5 space-y-3">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-3 text-[13px]">
            <Check className={`w-4 h-4 shrink-0 ${accentColor}`} />
            <span className="text-foreground">{f}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center pb-5 px-6">
        Payments processed securely via Paystack · Cancel anytime
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] p-0 rounded-t-2xl">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-2xl [&>button]:hidden">
        {content}
      </DialogContent>
    </Dialog>
  );
}

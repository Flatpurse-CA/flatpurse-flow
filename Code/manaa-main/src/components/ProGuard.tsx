import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useData";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/UpgradeModal";

interface ProGuardProps {
  children: React.ReactNode;
}

export default function ProGuard({ children }: ProGuardProps) {
  const { isPro, isLoading } = useSubscription();
  const { data: profile } = useProfile();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is Pro, render children normally
  if (isPro) {
    return <>{children}</>;
  }

  // For business users who had Pro but lapsed — show renewal overlay
  // For personal users or users who never had Pro — also show overlay instead of redirecting
  const isLapsedBusiness = profile?.use_mode === "business";

  return (
    <div className="relative min-h-[60vh]">
      {/* Blurred content underneath — render actual children but blur them */}
      <div className="pointer-events-none select-none filter blur-sm opacity-40" aria-hidden="true">
        {children}
      </div>

      {/* Renewal overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 max-w-sm w-full mx-4 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
            {isLapsedBusiness ? (
              <Crown className="w-6 h-6 text-yellow-500" />
            ) : (
              <Lock className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              {isLapsedBusiness ? "Your Pro subscription has expired" : "Pro Feature"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isLapsedBusiness
                ? "Your data is safe and intact. Renew your subscription to continue using CRM, Inventory, and other Pro features."
                : "This feature is available on the Pro plan. Upgrade to unlock CRM, Inventory, and more."}
            </p>
          </div>

          <Button
            onClick={() => setShowUpgrade(true)}
            className="w-full bg-accent-green text-accent-green-foreground hover:opacity-90"
          >
            <Crown className="w-4 h-4 mr-2" />
            {isLapsedBusiness ? "Renew Subscription" : "Upgrade to Pro"}
          </Button>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}

import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Building2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/UpgradeModal";

interface BusinessGuardProps {
  children: React.ReactNode;
}

export default function BusinessGuard({ children }: BusinessGuardProps) {
  const { isBusiness, isPro, isLoading } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isBusiness) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[60vh]">
      <div className="pointer-events-none select-none filter blur-sm opacity-40" aria-hidden="true">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 max-w-sm w-full mx-4 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-500" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Business Feature</h3>
            <p className="text-sm text-muted-foreground">
              {isPro
                ? "This feature is available on the Business plan. Upgrade to unlock Storefront, Orders, Team Access, and Multi-branch support."
                : "This feature requires the Business plan. Upgrade to unlock all Pro features plus Storefront, Orders, Team Access, and more."}
            </p>
          </div>

          <Button
            onClick={() => setShowUpgrade(true)}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Upgrade to Business
          </Button>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}

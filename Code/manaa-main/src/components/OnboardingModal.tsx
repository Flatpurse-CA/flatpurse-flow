import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateProfile } from "@/hooks/useData";
import { useToast } from "@/hooks/use-toast";
import UpgradeModal from "@/components/UpgradeModal";
import logoLight from "@/assets/manaa-logo-lightmode.svg";
import logoDark from "@/assets/manaa-logo-darkmode.svg";

interface OnboardingModalProps {
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [selected, setSelected] = useState<"personal" | "business" | null>(null);
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const handleContinue = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ use_mode: selected });
      if (selected === "business") {
        // Save mode then show upgrade prompt
        setSaving(false);
        setShowUpgrade(true);
      } else {
        onComplete();
      }
    } catch {
      toast({ title: "Error", description: "Could not save preference. Please try again.", variant: "destructive" });
      setSaving(false);
    }
  };

  const options = [
    {
      value: "personal" as const,
      icon: User,
      title: "Personal Use",
      description: "Track personal finances, budgets, and everyday spending",
    },
    {
      value: "business" as const,
      icon: Briefcase,
      title: "Business Use",
      description: "Manage business finances, invoicing, inventory, and CRM",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md mx-4 text-center"
        >
          {/* Logo */}
          <div className="mb-8">
            <img src={logoLight} alt="Manaa" className="h-8 mx-auto dark:hidden" />
            <img src={logoDark} alt="Manaa" className="h-8 mx-auto hidden dark:block" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome to Manaa 👋
          </h1>
          <p className="text-muted-foreground mb-8">
            What will you be using Manaa for?
          </p>

          {/* Options */}
          <div className="grid gap-3 mb-8">
            {options.map((opt) => {
              const isSelected = selected === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelected(opt.value)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-lg shrink-0 ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{opt.title}</p>
                    <p className="text-sm text-muted-foreground">{opt.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* CTA */}
          <Button
            onClick={handleContinue}
            disabled={!selected || saving}
            className="w-full h-12 text-base font-medium"
          >
            {saving ? "Saving…" : "Continue"}
            {!saving && <ArrowRight className="ml-2 w-4 h-4" />}
          </Button>
        </motion.div>
      </motion.div>

      {/* Upgrade modal for business users */}
      <UpgradeModal
        open={showUpgrade}
        onOpenChange={(open) => {
          if (!open) onComplete();
          setShowUpgrade(open);
        }}
      />
    </AnimatePresence>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronRight, ChevronLeft, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TourStep {
  /** CSS selector or data-tour attribute value for the target element */
  target: string;
  title: string;
  description: string;
  /** Optional action label for the CTA button */
  actionLabel?: string;
  onAction?: () => void;
}

interface GuidedTourProps {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
  /** localStorage key to persist "seen" state */
  storageKey?: string;
}

export default function GuidedTour({ steps, open, onClose, storageKey = "manaa_tour_seen" }: GuidedTourProps) {
  const [current, setCurrent] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[current];

  const updatePosition = useCallback(() => {
    if (!step) return;
    const selector = step.target.startsWith("[") ? step.target : `[data-tour="${step.target}"]`;
    const el = document.querySelector(selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPosition({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    } else {
      setPosition(null);
    }
  }, [step]);

  useEffect(() => {
    if (!open) return;
    setCurrent(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handle = () => updatePosition();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [open, current, updatePosition]);

  const finish = useCallback(() => {
    if (storageKey) localStorage.setItem(storageKey, "true");
    onClose();
  }, [storageKey, onClose]);

  const next = () => {
    if (current < steps.length - 1) setCurrent((c) => c + 1);
    else finish();
  };
  const prev = () => setCurrent((c) => Math.max(0, c - 1));

  if (!open || !step) return null;

  // Calculate card position
  const padding = 12;
  const cardStyle: React.CSSProperties = {};
  if (position) {
    const spaceBelow = window.innerHeight - (position.top + position.height);
    const spaceAbove = position.top;

    if (spaceBelow > 220) {
      cardStyle.top = position.top + position.height + padding;
    } else if (spaceAbove > 220) {
      cardStyle.bottom = window.innerHeight - position.top + padding;
    } else {
      cardStyle.top = Math.max(padding, position.top);
    }

    // Horizontal: center on target, clamp to viewport
    const centerX = position.left + position.width / 2;
    const cardWidth = 340;
    let left = centerX - cardWidth / 2;
    left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding));
    cardStyle.left = left;
  } else {
    // Fallback: center
    cardStyle.top = "50%";
    cardStyle.left = "50%";
    cardStyle.transform = "translate(-50%, -50%)";
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998]" onClick={finish}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {position && (
                <rect
                  x={position.left - 6}
                  y={position.top - 6}
                  width={position.width + 12}
                  height={position.height + 12}
                  rx={12}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#tour-mask)"
          />
        </svg>
      </div>

      {/* Spotlight ring */}
      {position && (
        <div
          className="fixed z-[9999] rounded-xl border-2 border-accent-green pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: position.top - 6,
            left: position.left - 6,
            width: position.width + 12,
            height: position.height + 12,
            boxShadow: "0 0 0 4px hsl(var(--accent-green) / 0.25)",
          }}
        />
      )}

      {/* Floating card */}
      <div
        ref={cardRef}
        className="fixed z-[10000] w-[340px] max-w-[calc(100vw-24px)] bg-card border border-border rounded-2xl shadow-2xl p-5 transition-all duration-300 ease-out"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent-green text-accent-green-foreground text-xs font-bold shrink-0">
              {current + 1}
            </span>
            <h3 className="text-sm font-semibold text-foreground leading-tight">{step.title}</h3>
          </div>
          <button
            onClick={finish}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 pl-[38px]">
          {step.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pl-[38px]">
          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  i === current ? "bg-accent-green" : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5">
            {current > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={prev}>
                <ChevronLeft className="w-3 h-3 mr-0.5" /> Back
              </Button>
            )}
            {current === 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-muted-foreground" onClick={finish}>
                <SkipForward className="w-3 h-3 mr-0.5" /> Skip
              </Button>
            )}
            {step.actionLabel && step.onAction ? (
              <Button size="sm" className="h-7 px-3 text-[11px] bg-accent-green text-accent-green-foreground hover:bg-accent-green/90" onClick={() => { step.onAction?.(); next(); }}>
                {step.actionLabel}
              </Button>
            ) : (
              <Button size="sm" className="h-7 px-3 text-[11px] bg-accent-green text-accent-green-foreground hover:bg-accent-green/90" onClick={next}>
                {current < steps.length - 1 ? (
                  <>Next <ChevronRight className="w-3 h-3 ml-0.5" /></>
                ) : (
                  "Got it!"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

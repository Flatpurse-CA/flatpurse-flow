import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, BarChart3, Receipt, ArrowRight,
  Layers, Settings2, Users, Menu, X, Sun, Moon,
  Download, Share, Smartphone, Monitor, MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import manaaLogoDark from "@/assets/manaa-logo-darkmode.svg";
import manaaLogoLight from "@/assets/manaa-logo-lightmode.svg";
import dashboardImg from "@/assets/landing4-dashboard.png";

const LEMON = "#C0D904";
const LEMON_DARK = "#8A9B00";

/* ── Platform detection ── */
function getPlatform(): "ios" | "android" | "desktop" {
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

/* ── Install Modal ── */
function InstallModal({ open, onClose, accent, isDark }: { open: boolean; onClose: () => void; accent: string; isDark: boolean }) {
  const platform = getPlatform();

  if (!open) return null;

  const steps: { icon: React.ReactNode; text: string }[] =
    platform === "ios"
      ? [
          { icon: <Share className="w-5 h-5" style={{ color: accent }} />, text: "Tap the Share button at the bottom of Safari" },
          { icon: <Download className="w-5 h-5" style={{ color: accent }} />, text: 'Scroll down and tap "Add to Home Screen"' },
          { icon: <Smartphone className="w-5 h-5" style={{ color: accent }} />, text: 'Tap "Add" — Manaa will appear as an app on your home screen' },
        ]
      : platform === "android"
      ? [
          { icon: <MoreVertical className="w-5 h-5" style={{ color: accent }} />, text: "Tap the ⋮ menu in Chrome (top right)" },
          { icon: <Download className="w-5 h-5" style={{ color: accent }} />, text: 'Tap "Install app" or "Add to Home screen"' },
          { icon: <Smartphone className="w-5 h-5" style={{ color: accent }} />, text: "Manaa will install and appear in your app drawer" },
        ]
      : [
          { icon: <Monitor className="w-5 h-5" style={{ color: accent }} />, text: "Look for the install icon (⊕) in your browser's address bar" },
          { icon: <Download className="w-5 h-5" style={{ color: accent }} />, text: 'Click "Install" when prompted' },
          { icon: <Smartphone className="w-5 h-5" style={{ color: accent }} />, text: "Manaa will open as a standalone desktop app" },
        ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed z-[70] inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-md rounded-2xl border border-border bg-card p-6 md:p-8 shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: isDark ? 'rgba(192,217,4,0.12)' : 'rgba(138,155,0,0.1)' }}>
                <Download className="w-5 h-5" style={{ color: accent }} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Install Manaa</h3>
                <p className="text-xs text-muted-foreground">
                  {platform === "ios" ? "iPhone / iPad" : platform === "android" ? "Android" : "Desktop"}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Step {i + 1}</p>
                    <p className="text-sm text-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div id="pwa-native-install" />

            <p className="text-[11px] text-center text-muted-foreground">
              Manaa works offline and loads instantly — just like a native app.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const rotatingWords = ["money", "business", "inventory", "products", "customers"];

function TypingWord() {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const word = rotatingWords[index];
    const speed = isDeleting ? 50 : 100;
    if (!isDeleting && displayed === word) {
      const pause = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(pause);
    }
    if (isDeleting && displayed === "") {
      setIsDeleting(false);
      setIndex((i) => (i + 1) % rotatingWords.length);
      return;
    }
    const timer = setTimeout(() => {
      setDisplayed(
        isDeleting ? word.slice(0, displayed.length - 1) : word.slice(0, displayed.length + 1)
      );
    }, speed);
    return () => clearTimeout(timer);
  }, [displayed, isDeleting, index]);

  return (
    <span style={{ color: isDark ? LEMON : LEMON_DARK }}>
      {displayed}
      <span
        className="inline-block w-[2px] h-[0.8em] ml-0.5 align-baseline animate-pulse"
        style={{ backgroundColor: isDark ? LEMON : LEMON_DARK }}
      />
    </span>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-full border border-border bg-card hover:bg-muted transition-colors"
      aria-label="Toggle theme"
    >
      {isDark
        ? <Sun className="w-4 h-4 text-yellow-400" />
        : <Moon className="w-4 h-4 text-foreground" />}
    </button>
  );
}

export default function LandingPage4() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -1, y: -1 });
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { setTheme } = useTheme();
  const isDark = true;
  const accent = LEMON;

  // Force dark mode on mount
  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  // Capture the native beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = useCallback(() => {
    // If already installed as standalone, just tell the user
    if (isStandalone()) {
      return; // already installed
    }
    // If we have the native prompt (Chrome/Edge on Android & desktop), use it
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
      return;
    }
    // Otherwise show the instruction modal (iOS, or browsers without prompt)
    setInstallModalOpen(true);
  }, [deferredPrompt]);

  return (
    <div className="min-h-screen font-sans overflow-x-hidden bg-background text-foreground">
      <InstallModal open={installModalOpen} onClose={() => setInstallModalOpen(false)} accent={accent} isDark={isDark} />

      {/* ══════ NAV ══════ */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto relative">
        <img src={manaaLogoLight} alt="Manaa" className="h-5 md:h-7 dark:hidden" />
        <img src={manaaLogoDark} alt="Manaa" className="h-5 md:h-7 hidden dark:block" />

        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#why" className="hover:text-foreground transition">Why Manaa</a>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] md:text-xs font-medium transition-colors"
            style={{ background: accent, color: "#0A0A0A" }}>
            <Download className="w-3 h-3" /> Install
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMenuOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute right-6 top-16 z-50 rounded-2xl px-6 py-4 flex flex-col gap-1 text-base shadow-xl border bg-card text-card-foreground border-border">
            <a href="#features" onClick={() => setMenuOpen(false)} className="py-3 border-b border-border">Features</a>
            <a href="#why" onClick={() => setMenuOpen(false)} className="py-3 border-b border-border">Why Manaa</a>
            <Link to="/auth" onClick={() => setMenuOpen(false)} className="py-3 font-medium" style={{ color: accent }}>Sign In →</Link>
          </motion.div>
        </>
      )}

      {/* ══════ HERO ══════ */}
      <section
        className="text-center pt-16 md:pt-24 pb-8 px-6 relative overflow-hidden"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseLeave={() => setMousePos({ x: -1, y: -1 })}
      >
        {/* Ambient background — light mode: warm cream tint / dark mode: subtle glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(192,217,4,0.04) 0%, transparent 70%)'
                : 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(192,217,4,0.08) 0%, rgba(255,248,230,0.3) 50%, transparent 80%)',
            }}
          />
        </div>

        {/* Mouse glow — subtle */}
        {mousePos.x >= 0 && (
          <div
            className="pointer-events-none absolute z-0 rounded-full"
            style={{
              width: 400,
              height: 400,
              left: mousePos.x - 200,
              top: mousePos.y - 200,
              background: `radial-gradient(circle, ${isDark ? 'rgba(192,217,4,0.07)' : 'rgba(192,217,4,0.1)'} 0%, transparent 60%)`,
              filter: 'blur(50px)',
              transition: 'left 0.3s ease-out, top 0.3s ease-out',
            }}
          />
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl lg:text-6xl leading-[1.15] tracking-tight font-bold relative z-10 text-foreground/70">
          The easiest way to
          <br />
          manage your{" "}
          <TypingWord />
          <span className="text-foreground/70">.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-5 text-sm md:text-base max-w-lg mx-auto relative z-10 text-muted-foreground">
          Manage your business finances, inventory, and customers in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-7 relative z-10">
          <Link to="/auth">
            <Button
              size="lg"
              className="rounded-full px-8 gap-2 text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
              style={{ background: accent, color: isDark ? "#0A0A0A" : "#FFFFFF" }}>
              Get started <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Dashboard Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-12 mx-auto max-w-4xl px-4">
          <div className="rounded-xl overflow-hidden shadow-lg dark:shadow-2xl border border-border bg-card">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
            </div>
            <img
              src={dashboardImg}
              alt="Manaa dashboard showing cash books, transactions and balance overview"
              className="w-full object-cover object-top"
            />
          </div>
        </motion.div>
      </section>

      {/* ══════ FEATURES ══════ */}
      <section id="features" className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[11px] uppercase tracking-[0.25em] mb-3 text-center font-medium"
            style={{ color: accent }}>
            Everything you need
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl leading-tight font-bold mb-4 text-center text-foreground">
            One app. <span className="text-muted-foreground">Complete control.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm md:text-base max-w-xl mx-auto mb-12 text-muted-foreground">
            Manaa replaces notebooks, spreadsheets, and scattered tools with one powerful platform — no accountant required.
          </motion.p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: BookOpen, title: "Cash Tracking", desc: "Record every naira in and out. Know exactly where your money goes, in real time." },
              { icon: Receipt, title: "Invoicing", desc: "Create professional invoices in seconds. Share via WhatsApp. Get paid faster." },
              { icon: BarChart3, title: "Reports & Insights", desc: "Profit & loss, cash flow trends, and category breakdowns — all at a glance." },
              { icon: Layers, title: "Inventory", desc: "Track stock levels, costs, and movements. Never run out of your best sellers." },
              { icon: Users, title: "CRM", desc: "Manage contacts, deals, and follow-ups. Turn leads into loyal customers." },
              { icon: Settings2, title: "Multi-Business", desc: "Run multiple ventures from one account. Each with its own books and reports." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl p-6 border border-border bg-card hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: isDark ? 'rgba(192,217,4,0.1)' : 'rgba(138,155,0,0.08)' }}>
                  <f.icon className="w-[18px] h-[18px]" style={{ color: accent }} />
                </div>
                <h3 className="font-semibold text-sm mb-1.5 text-foreground">{f.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ WHY MANAA ══════ */}
      <section
        id="why"
        className="py-16 md:py-24 px-6"
        style={{
          background: isDark
            ? 'hsl(0 0% 6%)'
            : 'linear-gradient(180deg, hsl(68 40% 96%) 0%, hsl(0 0% 100%) 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-[11px] uppercase tracking-[0.25em] mb-3 font-medium"
              style={{ color: accent }}>
              Why Manaa?
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-4xl font-bold leading-tight mb-5 text-foreground">
              Built by Africans,{" "}
              <span style={{ color: accent }}>for African</span> businesses.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm md:text-base leading-relaxed mb-3 text-muted-foreground">
              Most financial tools weren't designed for the way business works in Africa — cash-heavy, fast-moving, and relationship-driven. Manaa was.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs md:text-sm leading-relaxed text-muted-foreground">
              POS receipts, market-day sales, supplier payments — track it all without friction. No complex setup. No jargon. Open the app and watch your business picture come into focus.
            </motion.p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "30s", label: "to record a transaction" },
              { value: "1 min", label: "to create & share an invoice" },
              { value: "∞", label: "businesses per account" },
              { value: "Free", label: "to get started today" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card p-5 text-center">
                <p className="text-2xl md:text-3xl font-bold mb-1" style={{ color: accent }}>
                  {stat.value}
                </p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section className="py-16 md:py-24 px-6">
        <div
          className="max-w-3xl mx-auto rounded-2xl p-10 md:p-14 text-center border border-border relative overflow-hidden"
          style={{
            background: isDark
              ? 'hsl(100 30% 8%)'
              : `linear-gradient(135deg, hsl(68 50% 95%) 0%, hsl(68 30% 98%) 100%)`,
          }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-bold leading-tight mb-3 text-foreground">
            Your money deserves{" "}
            <span style={{ color: accent }}>better visibility.</span>
          </motion.h2>
          <p className="mb-7 text-sm max-w-md mx-auto text-muted-foreground">
            Join African entrepreneurs using Manaa to take control of their finances — free to start.
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              className="rounded-full px-10 gap-2 text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
              style={{ background: accent, color: isDark ? "#0A0A0A" : "#FFFFFF" }}>
              Get started <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-border px-6 py-10">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <img src={manaaLogoLight} alt="Manaa" className="h-5 mb-3 dark:hidden" />
            <img src={manaaLogoDark} alt="Manaa" className="h-5 mb-3 hidden dark:block" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Manaa helps businesses across Africa track their finances, send invoices, and grow with confidence.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-xs mb-2 text-foreground">Products</h4>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <span>Cash Books</span>
              <span>Invoicing</span>
              <span>Inventory</span>
              <span>CRM</span>
              <span>Reports</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-xs mb-2 text-foreground">Company</h4>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <Link to="/privacy-policy" className="hover:text-foreground transition">Privacy Policy</Link>
              <Link to="/product-document" className="hover:text-foreground transition">Product Info</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-xs mb-2 text-foreground">Get Started</h4>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <Link to="/auth" className="hover:text-foreground transition">Sign Up</Link>
              <Link to="/auth" className="hover:text-foreground transition">Log In</Link>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-5 border-t border-border text-[11px] text-center text-muted-foreground">
          © {new Date().getFullYear()} Manaa. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import heroImage from "@/assets/landing3-hero.jpg";
import logoIcon from "@/assets/manaa-logo-icon.svg";
import { ArrowRight, BarChart3, FileText, Wallet, Users, Package, TrendingUp, Download, Share, Smartphone, Monitor, MoreVertical, X } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Cash Tracking",
    desc: "Record every naira in and out. Know exactly where your money goes, in real time.",
  },
  {
    icon: FileText,
    title: "Invoicing",
    desc: "Create professional invoices in seconds. Share via WhatsApp. Get paid faster.",
  },
  {
    icon: BarChart3,
    title: "Reports & Insights",
    desc: "Profit & loss, cash flow trends, and category breakdowns, all at a glance.",
  },
  {
    icon: Package,
    title: "Inventory",
    desc: "Track stock levels, costs, and movements. Never run out of your best sellers.",
  },
  {
    icon: Users,
    title: "CRM",
    desc: "Manage contacts, deals, and follow-ups. Turn leads into loyal customers.",
  },
  {
    icon: TrendingUp,
    title: "Multi-Business",
    desc: "Run multiple ventures from one account. Each with its own books and reports.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

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
function InstallModal({ open, onClose, deferredPrompt, onPromptUsed }: { open: boolean; onClose: () => void; deferredPrompt: any; onPromptUsed: () => void }) {
  const platform = getPlatform();
  const accent = "hsl(var(--accent-green))";
  const hasNativePrompt = !!deferredPrompt;

  if (!open) return null;

  const handleNativeInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        onPromptUsed();
        onClose();
      });
    }
  };

  const iosSteps = [
    { icon: <Share className="w-5 h-5" style={{ color: accent }} />, text: "Tap the Share button at the bottom of Safari" },
    { icon: <Download className="w-5 h-5" style={{ color: accent }} />, text: 'Scroll down and tap "Add to Home Screen"' },
    { icon: <Smartphone className="w-5 h-5" style={{ color: accent }} />, text: 'Tap "Add", Manaa will appear on your home screen' },
  ];

  const androidSteps = [
    { icon: <MoreVertical className="w-5 h-5" style={{ color: accent }} />, text: "Tap the ⋮ menu button in your browser" },
    { icon: <Download className="w-5 h-5" style={{ color: accent }} />, text: 'Tap "Install app" or "Add to Home screen"' },
    { icon: <Smartphone className="w-5 h-5" style={{ color: accent }} />, text: 'Tap "Install" — Manaa will appear on your home screen' },
  ];

  const desktopSteps = [
    { icon: <Monitor className="w-5 h-5" style={{ color: accent }} />, text: "Click the install icon (⊕) in your browser's address bar" },
    { icon: <Download className="w-5 h-5" style={{ color: accent }} />, text: 'Or open browser menu → "Install Manaa"' },
    { icon: <Smartphone className="w-5 h-5" style={{ color: accent }} />, text: "Manaa will open as a standalone app on your desktop" },
  ];

  const manualSteps = platform === "ios" ? iosSteps : platform === "android" ? androidSteps : desktopSteps;

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
            className="fixed z-[70] inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-md rounded-2xl border border-[hsl(0,0%,15%)] bg-[hsl(0,0%,8%)] p-6 md:p-8 shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-[hsl(0,0%,40%)] hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--accent-green) / 0.12)' }}>
                <Download className="w-5 h-5" style={{ color: accent }} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Install Manaa</h3>
                <p className="text-xs text-[hsl(0,0%,50%)]">
                  {platform === "ios" ? "iPhone / iPad" : platform === "android" ? "Android" : "Desktop"}
                </p>
              </div>
            </div>

            {/* Native install available (Android / Desktop Chrome) */}
            {hasNativePrompt ? (
              <div className="space-y-4">
                <p className="text-sm text-[hsl(0,0%,60%)]">
                  Install Manaa as an app on your {platform === "android" ? "device" : "computer"}. It works offline and loads instantly.
                </p>
                <button
                  onClick={handleNativeInstall}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                  style={{ backgroundColor: "hsl(var(--accent-green))", color: "hsl(var(--accent-green-foreground))" }}
                >
                  <Download className="w-4 h-4" /> Install Now
                </button>
                <p className="text-[11px] text-center text-[hsl(0,0%,40%)]">
                  No app store needed. Installs in seconds.
                </p>
              </div>
            ) : (
              /* Fallback — show platform-specific manual steps */
              <>
                <div className="space-y-4 mb-6">
                  {manualSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[hsl(0,0%,12%)]">
                        {step.icon}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[hsl(0,0%,45%)] mb-0.5">Step {i + 1}</p>
                        <p className="text-sm text-white">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-center text-[hsl(0,0%,40%)]">
                  Manaa works offline and loads instantly, just like a native app.
                </p>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const LandingPage3 = () => {
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = useCallback(() => {
    if (isStandalone()) return;
    // Always show the modal — it handles both native prompt and manual instructions
    setInstallModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen w-screen bg-[hsl(0,0%,4%)] text-[hsl(0,0%,95%)] overflow-x-hidden">
      <InstallModal open={installModalOpen} onClose={() => setInstallModalOpen(false)} deferredPrompt={deferredPrompt} onPromptUsed={() => setDeferredPrompt(null)} />

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-[hsl(0,0%,4%)]/80 backdrop-blur-md border-b border-[hsl(0,0%,10%)]">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoIcon} alt="Manaa" className="h-7 w-7" />
            <span className="text-lg font-bold tracking-tight">Manaa</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-[13px] text-[hsl(0,0%,50%)]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </div>
        </div>
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 text-[13px] px-5 py-2 rounded-full font-semibold transition-all hover:brightness-110"
          style={{ backgroundColor: "hsl(var(--accent-green))", color: "hsl(var(--accent-green-foreground))" }}
        >
          <Download className="w-3.5 h-3.5" /> Install App
        </button>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-[72px]">
        <div className="relative h-[82vh] md:h-[88vh] mx-4 md:mx-6 mt-3 rounded-2xl overflow-hidden border border-[hsl(0,0%,12%)]">
          {/* B&W image */}
          <img
            src={heroImage}
            alt="African marketplace"
            className="w-full h-full object-cover grayscale"
          />
          {/* Dark scrim */}
          <div className="absolute inset-0 bg-black/55 z-10" />
          {/* Top fade */}
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[hsl(0,0%,4%)] to-transparent z-20" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[hsl(0,0%,4%)] to-transparent z-20" />

          {/* Split layout — left copy, right dashboard cards */}
          <div className="absolute inset-0 z-30 flex items-center px-8 md:px-16">
            {/* Left — copy */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="max-w-xl"
              >
                <p
                  className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-5"
                  style={{ color: "hsl(var(--accent-green))" }}
                >
                  Financial clarity for Africa
                </p>

                <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[0.92] tracking-tight mb-7 whitespace-nowrap">
                  Run your
                  <br />
                  business with
                  <br />
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: "linear-gradient(135deg, hsl(var(--accent-green)), hsl(75,90%,68%))",
                    }}
                  >
                    confidence
                  </span>
                </h1>

                <p className="text-[hsl(0,0%,60%)] text-base md:text-lg leading-relaxed max-w-lg mb-10">
                  Manage your business finances, inventory, and customers in one place.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link
                    to="/auth"
                    className="group inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-7 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold transition-all hover:brightness-110"
                    style={{ backgroundColor: "hsl(var(--accent-green))", color: "hsl(var(--accent-green-foreground))" }}
                  >
                    Start for free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center gap-1 px-6 py-3 sm:px-7 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium text-[hsl(0,0%,70%)] border border-[hsl(0,0%,25%)] hover:bg-white/5 transition-colors"
                  >
                    See features
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Right — dashboard card composition */}
            <div className="hidden lg:flex flex-1 items-center justify-center relative">
              {/* Ambient glow behind cards */}
              <div
                className="absolute w-96 h-96 rounded-full opacity-25 blur-[120px]"
                style={{ backgroundColor: "hsl(var(--accent-green))" }}
              />

              <div className="relative w-[400px] h-[560px]">

                {/* Main dashboard card — largest, back layer */}
                <motion.div
                  initial={{ opacity: 0, y: 60, rotateZ: 2 }}
                  animate={{ opacity: 1, y: 0, rotateZ: 2 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute inset-x-0 top-0 h-[380px] rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(var(--accent-green))" }} />
                      <span className="text-[11px] font-semibold text-white/80">Dashboard Overview</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                    </div>
                  </div>
                  {/* Mini chart bars */}
                  <div className="px-5 pt-4">
                    <p className="text-[9px] uppercase tracking-wider text-white/30 mb-3">Revenue this week</p>
                    <div className="flex items-end gap-1.5 h-20">
                      {[40, 65, 45, 80, 60, 90, 70].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.9 + i * 0.08, duration: 0.6, ease: "easeOut" }}
                          className="flex-1 rounded-sm"
                          style={{ backgroundColor: i === 5 ? "hsl(var(--accent-green))" : "hsl(var(--accent-green) / 0.25)" }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-3">
                      <span className="text-[9px] text-white/25">Mon</span>
                      <span className="text-[9px] text-white/25">Sun</span>
                    </div>
                  </div>
                  {/* Stat row */}
                  <div className="flex gap-3 px-5 mt-4">
                    {[
                      { label: "Income", value: "₦2.4M" },
                      { label: "Expenses", value: "₦890K" },
                    ].map((s) => (
                      <div key={s.label} className="flex-1 bg-white/[0.04] rounded-lg p-3">
                        <p className="text-[8px] uppercase tracking-wider text-white/30">{s.label}</p>
                        <p className="text-sm font-bold text-white mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Invoice card — overlapping, mid layer */}
                <motion.div
                  initial={{ opacity: 0, x: 40, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="absolute -left-8 bottom-[90px] w-[220px] rounded-2xl border border-white/[0.1] bg-[hsl(0,0%,8%)]/90 backdrop-blur-xl p-5 shadow-2xl cursor-default"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(var(--accent-green) / 0.15)" }}>
                      <FileText className="w-3.5 h-3.5" style={{ color: "hsl(var(--accent-green))" }} />
                    </div>
                    <span className="text-[10px] font-semibold text-white/80">Latest Invoice</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[9px] text-white/30">INV-0047</span>
                      <span className="text-[9px] font-semibold" style={{ color: "hsl(var(--accent-green))" }}>Paid</span>
                    </div>
                    <div className="h-px bg-white/[0.06]" />
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] text-white/30">Total</span>
                      <span className="text-base font-bold text-white">₦185,000</span>
                    </div>
                  </div>
                </motion.div>

                {/* Feature list card — overlapping, front layer */}
                <motion.div
                  initial={{ opacity: 0, y: 40, rotateZ: -1 }}
                  animate={{ opacity: 1, y: 0, rotateZ: -1 }}
                  transition={{ delay: 0.85, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="absolute right-[-16px] bottom-0 w-[240px] rounded-2xl border border-white/[0.1] bg-[hsl(0,0%,7%)]/90 backdrop-blur-xl p-5 shadow-2xl cursor-default"
                >
                  <p className="text-[9px] uppercase tracking-wider text-white/30 mb-3">All-in-one platform</p>
                  <div className="space-y-2">
                    {[
                      { icon: Wallet, label: "Cash Tracking" },
                      { icon: FileText, label: "Invoicing" },
                      { icon: BarChart3, label: "Reports" },
                      { icon: Package, label: "Inventory" },
                      { icon: Users, label: "CRM" },
                      { icon: TrendingUp, label: "Multi-Business" },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.0 + i * 0.08, duration: 0.4 }}
                          className="flex items-center gap-2.5 group"
                        >
                          <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "hsl(var(--accent-green))" }} />
                          <Icon className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" />
                          <span className="text-[11px] text-white/50 group-hover:text-white/80 transition-colors">{item.label}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Floating notification bubble */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4, duration: 0.5, ease: "backOut" }}
                  className="absolute -right-4 top-14 flex items-center gap-2 bg-[hsl(0,0%,10%)]/95 backdrop-blur-xl border border-white/[0.1] rounded-full px-3 py-2 shadow-xl"
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--accent-green) / 0.2)" }}>
                    <TrendingUp className="w-2.5 h-2.5" style={{ color: "hsl(var(--accent-green))" }} />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-white/80">+23% revenue</p>
                    <p className="text-[7px] text-white/30">vs last month</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="px-6 md:px-14 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
          >
            <div>
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: "hsl(var(--accent-green))" }}>
                Everything you need
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                One app.
                <br />
                Complete control.
              </h2>
            </div>
            <p className="text-[hsl(0,0%,40%)] max-w-sm text-sm leading-relaxed md:text-right">
              Manaa replaces notebooks, spreadsheets, and scattered tools with one powerful platform, no accountant required.
            </p>
          </motion.div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  variants={fadeUp}
                  className="group p-6 rounded-2xl border border-[hsl(0,0%,10%)] bg-[hsl(0,0%,6%)] hover:border-[hsl(0,0%,16%)] hover:bg-[hsl(0,0%,7%)] transition-all duration-300 cursor-default"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-5"
                    style={{ backgroundColor: "hsl(var(--accent-green) / 0.12)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "hsl(var(--accent-green))" }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
                  <p className="text-[hsl(0,0%,42%)] text-[13px] leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" className="px-6 md:px-14 py-20 md:py-28 border-t border-[hsl(0,0%,9%)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">

            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex-1"
            >
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: "hsl(var(--accent-green))" }}>
                Why Manaa?
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-8">
                Built by Africans,
                <br />
                for African
                <br />
                businesses.
              </h2>
              <div className="space-y-5 text-[hsl(0,0%,48%)] text-sm md:text-[15px] leading-relaxed border-l-2 border-[hsl(0,0%,12%)] pl-6">
                <p>
                  Most financial tools weren't designed for the way business works in Africa,
                  cash-heavy, fast-moving, and relationship-driven. Manaa was.
                </p>
                <p>
                  POS receipts, market-day sales, supplier payments, track it all without friction.
                  Every feature works the way you already do business.
                </p>
                <p>
                  No complex setup. No jargon. Open the app, record transactions,
                  send invoices, and watch your business picture come into focus.
                </p>
              </div>
            </motion.div>

            {/* Right — stat grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex-1 grid grid-cols-2 gap-3 content-start"
            >
              {[
                { number: "30s", label: "to record a transaction" },
                { number: "1 min", label: "to create & share an invoice" },
                { number: "∞", label: "businesses per account" },
                { number: "Free", label: "to get started today" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="aspect-square p-6 rounded-2xl border border-[hsl(0,0%,10%)] bg-[hsl(0,0%,6%)] flex flex-col justify-between"
                >
                  <p className="text-3xl md:text-4xl font-extrabold" style={{ color: "hsl(var(--accent-green))" }}>
                    {stat.number}
                  </p>
                  <p className="text-[hsl(0,0%,40%)] text-xs leading-relaxed">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="px-6 md:px-14 py-24 md:py-32 border-t border-[hsl(0,0%,9%)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-4" style={{ color: "hsl(var(--accent-green))" }}>
            Get started today
          </p>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-5">
            Your money deserves
            <br />
            <span style={{ color: "hsl(var(--accent-green))" }}>better visibility.</span>
          </h2>
          <p className="text-[hsl(0,0%,42%)] text-sm md:text-base mb-10 max-w-sm mx-auto">
            Join African entrepreneurs using Manaa to take control of their finances, free to start.
          </p>
          <Link
            to="/auth"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
            style={{ backgroundColor: "hsl(var(--accent-green))", color: "hsl(var(--accent-green-foreground))" }}
          >
            Get Started, It's Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="px-6 md:px-14 py-8 border-t border-[hsl(0,0%,9%)] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[hsl(0,0%,30%)]">
        <div className="flex items-center gap-2">
          <img src={logoIcon} alt="Manaa" className="h-5 w-5 opacity-40" />
          <span>© {new Date().getFullYear()} Manaa. All rights reserved.</span>
        </div>
        <div className="flex gap-6">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <Link to="/auth" className="hover:text-white transition-colors">Sign In</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage3;

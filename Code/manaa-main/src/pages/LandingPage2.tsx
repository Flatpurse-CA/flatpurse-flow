import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  BarChart3,
  FileText,
  Users,
  Shield,
  Zap,
  Star,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import heroPerson from "@/assets/landing2-hero-person.jpg";
import manaaLogoFull from "@/assets/manaa-logo-full.png";
import phoneMockup from "@/assets/landing2-phone-mockup.jpg";
import testimonial1 from "@/assets/landing2-testimonial-1.jpg";
import testimonial2 from "@/assets/landing2-testimonial-2.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0, 0, 0.2, 1] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7 } },
};

export default function LandingPage2() {
  return (
    <div className="min-h-screen bg-foreground text-background overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-foreground/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
           <img src={manaaLogoFull} alt="Manaa" className="h-8" />
          <div className="hidden md:flex items-center gap-8 text-sm text-background/50 font-medium">
            <a href="#features" className="hover:text-background transition-colors">What You Get</a>
            <a href="#how-it-works" className="hover:text-background transition-colors">How It Works</a>
            <a href="#stories" className="hover:text-background transition-colors">Stories</a>
          </div>
          <Link to="/auth">
            <Button
              className="rounded-full px-6 h-9 text-sm font-bold border-0"
              style={{
                backgroundColor: "hsl(var(--accent-green))",
                color: "hsl(var(--accent-green-foreground))",
              }}
            >
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Left person image - absolutely positioned */}
        <motion.div
          className="absolute bottom-0 left-0 w-[35%] max-w-md hidden lg:block"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.3 }}
        >
          <img
            src={heroPerson}
            alt="African entrepreneur"
            className="w-full h-auto object-cover"
            style={{ maxHeight: "85vh" }}
          />
        </motion.div>

        {/* Right phone mockup - absolutely positioned */}
        <motion.div
          className="absolute bottom-0 right-0 w-[30%] max-w-sm hidden lg:block"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
        >
          <img
            src={phoneMockup}
            alt="Manaa app on phone"
            className="w-full h-auto object-cover"
            style={{ maxHeight: "80vh" }}
          />
        </motion.div>

        {/* Center content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-40 w-full">
          <motion.div
            className="text-center mx-auto max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-bold uppercase tracking-[0.3em] mb-6 text-background/40"
            >
              Basic is a choice
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl md:text-8xl font-black leading-[0.95] tracking-tighter mb-8"
            >
              <span className="text-background">YOUR MONEY</span>
              <br />
              <span className="text-background">DESERVES</span>
              <br />
              <span style={{ color: "hsl(var(--accent-green))" }}>PREMIUM</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-background/50 mb-10 max-w-xl mx-auto leading-relaxed"
            >
              The other tools aren't cutting it? We know. That's why you found us. Your business finances deserve better, period.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
              <Link to="/auth">
                <Button
                  className="rounded-full h-14 px-10 text-base font-bold border-0 gap-2"
                  style={{
                    backgroundColor: "hsl(var(--accent-green))",
                    color: "hsl(var(--accent-green-foreground))",
                  }}
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  variant="outline"
                  className="rounded-full h-14 px-10 text-base font-bold border-background/20 text-background hover:bg-background/10 hover:text-background"
                >
                  See How It Works
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section
        className="relative z-10"
        style={{ backgroundColor: "hsl(var(--accent-green))" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {[
            "🇳🇬 Nigeria",
            "🇬🇭 Ghana",
            "🇰🇪 Kenya",
            "🇿🇦 South Africa",
            "🇹🇿 Tanzania",
            "🇺🇬 Uganda",
            "🇷🇼 Rwanda",
          ].map((country) => (
            <span
              key={country}
              className="text-sm font-bold whitespace-nowrap"
              style={{ color: "hsl(var(--accent-green-foreground))" }}
            >
              {country}
            </span>
          ))}
        </div>
      </section>

      {/* ── INTRO STATEMENT ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: "hsl(var(--accent-green))" }}
            >
              Why Manaa?
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-5xl font-black tracking-tight text-background leading-tight mb-6"
            >
              Manaa takes the headache out of managing your business finances.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-background/40 max-w-2xl mx-auto">
              You know you're curious. Just sign up and see what you're missing.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURE SHOWCASES (Misan-style stacked cards) ── */}
      <section id="features" className="pb-12">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          {/* Feature 1 */}
          <motion.div
            className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-background/10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <div className="p-10 md:p-14 flex flex-col justify-center">
              <p
                className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
                style={{ color: "hsl(var(--accent-green))" }}
              >
                Cash Flow Tracking
              </p>
              <h3 className="text-2xl md:text-4xl font-black text-background tracking-tight leading-tight mb-4">
                TRACK EVERY SHILLING IN AND OUT.{" "}
                <span style={{ color: "hsl(var(--accent-green))" }}>IN REAL TIME.</span>
              </h3>
              <p className="text-background/40 text-base leading-relaxed">
                Fast, reliable, and actually transparent cash flow management for your business. No more spreadsheet nightmares.
              </p>
            </div>
            <div
              className="aspect-square md:aspect-auto flex items-center justify-center p-10"
              style={{ backgroundColor: "hsl(var(--accent-green) / 0.08)" }}
            >
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-2xl">
                <img src={phoneMockup} alt="Cash flow tracking" className="w-full h-full object-cover" />
              </div>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-background/10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <div
              className="aspect-square md:aspect-auto flex items-center justify-center p-10 order-2 md:order-1"
              style={{ backgroundColor: "hsl(var(--accent-green) / 0.08)" }}
            >
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-2xl">
                <img src={heroPerson} alt="Invoicing" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="p-10 md:p-14 flex flex-col justify-center order-1 md:order-2">
              <p
                className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
                style={{ color: "hsl(var(--accent-green))" }}
              >
                Professional Invoicing
              </p>
              <h3 className="text-2xl md:text-4xl font-black text-background tracking-tight leading-tight mb-4">
                TRYING TO GET PAID?{" "}
                <span style={{ color: "hsl(var(--accent-green))" }}>CONSIDER IT DONE.</span>
              </h3>
              <p className="text-background/40 text-base leading-relaxed">
                Create and send professional invoices in seconds. Track payment status automatically. No more chasing.
              </p>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-background/10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <div className="p-10 md:p-14 flex flex-col justify-center">
              <p
                className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
                style={{ color: "hsl(var(--accent-green))" }}
              >
                CRM & Pipeline
              </p>
              <h3 className="text-2xl md:text-4xl font-black text-background tracking-tight leading-tight mb-4">
                IT'S YOUR BUSINESS,{" "}
                <span style={{ color: "hsl(var(--accent-green))" }}>GROW IT.</span>
              </h3>
              <p className="text-background/40 text-base leading-relaxed">
                From leads to deals, manage your entire customer relationship pipeline. Track contacts, close deals, and scale smarter.
              </p>
            </div>
            <div
              className="aspect-square md:aspect-auto flex items-center justify-center p-10"
              style={{ backgroundColor: "hsl(var(--accent-green) / 0.08)" }}
            >
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Users, label: "Contacts" },
                  { icon: BarChart3, label: "Pipeline" },
                  { icon: FileText, label: "Deals" },
                  { icon: Zap, label: "Tasks" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="w-28 h-28 md:w-32 md:h-32 rounded-2xl flex flex-col items-center justify-center gap-2 border border-background/10"
                    style={{ backgroundColor: "hsl(var(--foreground))" }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: "hsl(var(--accent-green))" }} />
                    <span className="text-xs font-bold text-background/60">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── WHAT YOU GET (grid) ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: "hsl(var(--accent-green))" }}
            >
              What You Get
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-5xl font-black text-background tracking-tight"
            >
              Don't Sleep on This.
              <br className="hidden md:block" />
              It's everything you need.
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              {
                icon: BookOpen,
                title: "Track Without the Drama",
                desc: "Every transaction, categorized and tracked. Real-time balances that actually make sense. Zero guesswork.",
              },
              {
                icon: FileText,
                title: "Invoice Like a Pro",
                desc: "Professional invoices in seconds. Automated reminders. Get paid faster — because your time is money.",
              },
              {
                icon: Users,
                title: "A CRM That Slaps",
                desc: "Manage leads, contacts, and deals. Your pipeline, your rules. Close more, stress less.",
              },
              {
                icon: Shield,
                title: "Security That's Got Your Back",
                desc: "Your data is safer than your best-kept secret. Bank-level encryption, because some things you don't mess with.",
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="p-8 md:p-10 rounded-2xl border border-background/10 hover:border-background/20 transition-all duration-300 group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: "hsl(var(--accent-green) / 0.15)" }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: "hsl(var(--accent-green))" }} />
                </div>
                <h3 className="text-xl font-black text-background mb-3">{feature.title}</h3>
                <p className="text-background/40 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 md:py-32 border-y border-background/10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: "hsl(var(--accent-green))" }}
            >
              How It Works
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black text-background tracking-tight">
              No Tutorial Needed.
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              {
                step: "01",
                title: "SIGN UP IN A SNAP",
                desc: "Create your account. We made onboarding so smooth, you'll think it's a glitch.",
                icon: Zap,
              },
              {
                step: "02",
                title: "SET UP, GO LIVE",
                desc: "Add your business and accounts. This is where your finances get the structure they need.",
                icon: BookOpen,
              },
              {
                step: "03",
                title: "TRACK, INVOICE, GROW",
                desc: "Managing business finances is now so easy. We knew you had it in you.",
                icon: BarChart3,
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="relative p-8 md:p-10 rounded-2xl border border-background/10"
              >
                <div
                  className="text-7xl font-black absolute top-6 right-6"
                  style={{ color: "hsl(var(--accent-green) / 0.08)" }}
                >
                  {item.step}
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: "hsl(var(--accent-green) / 0.15)" }}
                >
                  <item.icon className="w-6 h-6" style={{ color: "hsl(var(--accent-green))" }} />
                </div>
                <h3 className="text-lg font-black text-background mb-3">{item.title}</h3>
                <p className="text-background/40 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="stories" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: "hsl(var(--accent-green))" }}
            >
              Testimonials
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black text-background tracking-tight">
              REAL PEOPLE,
              <br />
              <span style={{ color: "hsl(var(--accent-green))" }}>REAL TALK</span>
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                img: testimonial1,
                name: "Adesuwa",
                quote:
                  "I tried a couple of other finance tools, and they were either too complex or didn't fit my workflow. Manaa? Super quick and straightforward. Tracking my business now takes minutes, not ages. Finally, a tool that just works.",
              },
              {
                img: testimonial2,
                name: "Kwame",
                quote:
                  "With some other tools, you never really know what's happening with your money until it's too late. Manaa shows you everything in real-time, and the reports actually make sense. My business decisions are smarter now.",
              },
            ].map((t) => (
              <motion.div
                key={t.name}
                className="rounded-3xl overflow-hidden border border-background/10"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
              >
                <div className="aspect-video overflow-hidden">
                  <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-8 md:p-10">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-current"
                        style={{ color: "hsl(var(--accent-green))" }}
                      />
                    ))}
                  </div>
                  <p className="font-bold text-background text-lg mb-2">{t.name}</p>
                  <p className="text-background/50 text-sm leading-relaxed italic">"{t.quote}"</p>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 mt-6 text-sm font-bold transition-colors"
                    style={{ color: "hsl(var(--accent-green))" }}
                  >
                    Get Started <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="relative rounded-3xl overflow-hidden p-12 md:p-20 text-center"
            style={{ backgroundColor: "hsl(var(--accent-green))" }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.3em] mb-6"
              style={{ color: "hsl(var(--accent-green-foreground) / 0.6)" }}
            >
              Get Started
            </p>
            <h2
              className="text-3xl md:text-6xl font-black tracking-tight mb-6 leading-tight"
              style={{ color: "hsl(var(--accent-green-foreground))" }}
            >
              Join the Manaa crew.
              <br />
              It's time to upgrade your
              <br />
              business game.
            </h2>
            <p
              className="text-base mb-10 max-w-lg mx-auto"
              style={{ color: "hsl(var(--accent-green-foreground) / 0.7)" }}
            >
              Seriously, what are you waiting for? The credits to roll?
            </p>
            <Link to="/auth">
              <Button
                className="rounded-full h-14 px-10 text-base font-bold gap-2 border-0"
                style={{
                  backgroundColor: "hsl(var(--accent-green-foreground))",
                  color: "hsl(var(--accent-green))",
                }}
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-background/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="mb-4">
                <img src={manaaLogoFull} alt="Manaa" className="h-8" />
              </div>
              <p className="text-background/30 text-sm max-w-sm leading-relaxed">
                Smart bookkeeping for Africa. Track your cash flow, send invoices, manage customers, and make better decisions with real data.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-background text-sm mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-background/30">
                <li><a href="#features" className="hover:text-background transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-background transition-colors">How It Works</a></li>
                <li><a href="#stories" className="hover:text-background transition-colors">Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-background text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-background/30">
                <li><a href="#" className="hover:text-background transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-background/20">
              © {new Date().getFullYear()} Manaa. All rights reserved.
            </p>
            <p className="text-xs text-background/20">
              Built with ❤️ for African entrepreneurs
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

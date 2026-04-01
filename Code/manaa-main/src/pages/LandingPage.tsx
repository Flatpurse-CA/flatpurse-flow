import { Link } from "react-router-dom";
import manaaLogoFull from "@/assets/manaa-logo-full.png";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  BookOpen,
  BarChart3,
  FileText,
  Users,
  Shield,
  Zap,
  ChevronRight,
  Sun,
  Moon,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import landingHero from "@/assets/landing-hero.jpg";
import landingFeature1 from "@/assets/landing-feature-1.jpg";
import landingFeature2 from "@/assets/landing-feature-2.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function LandingPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-foreground text-background overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-foreground/80 border-b border-background/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <img src={manaaLogoFull} alt="Manaa" className="h-8" />
          <div className="hidden md:flex items-center gap-8 text-sm text-background/60">
            <a href="#features" className="hover:text-background transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-background transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-background transition-colors">Stories</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-background/50 hover:text-background transition-colors"
            >
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 block dark:hidden" />
            </button>
            <Link to="/auth">
              <Button
                className="rounded-full px-6 h-9 text-sm font-semibold border-0"
                style={{
                  backgroundColor: "hsl(var(--accent-green))",
                  color: "hsl(var(--accent-green-foreground))",
                }}
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={landingHero} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
          <motion.div
            className="max-w-2xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: "hsl(var(--accent-green))" }}
            >
              Smart Bookkeeping for Africa
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-background mb-6"
            >
              YOUR BUSINESS FINANCES,{" "}
              <span style={{ color: "hsl(var(--accent-green))" }}>
                FINALLY UNDER CONTROL
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-background/60 mb-10 max-w-lg"
            >
              The all-in-one bookkeeping platform built for African entrepreneurs. Track cash flow, send invoices, and grow smarter — all from your phone.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button
                  className="rounded-full h-14 px-8 text-base font-semibold border-0 gap-2"
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
                  className="rounded-full h-14 px-8 text-base font-semibold border-background/20 text-background hover:bg-background/10 hover:text-background"
                >
                  See How It Works
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="relative z-10 border-y border-background/10" style={{ backgroundColor: "hsl(var(--accent-green))" }}>
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+", label: "Businesses" },
            { value: "50K+", label: "Transactions Tracked" },
            { value: "10K+", label: "Invoices Sent" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-extrabold" style={{ color: "hsl(var(--accent-green-foreground))" }}>
                {stat.value}
              </div>
              <div className="text-sm font-medium mt-1" style={{ color: "hsl(var(--accent-green-foreground) / 0.7)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: "hsl(var(--accent-green))" }}
            >
              What You Get
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-background tracking-tight">
              EVERYTHING YOUR BUSINESS NEEDS.
              <br className="hidden md:block" /> NOTHING IT DOESN'T.
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: BookOpen,
                title: "Cash Flow Tracking",
                desc: "See every shilling in and out. Real-time balances, categorized transactions, zero guesswork.",
              },
              {
                icon: FileText,
                title: "Professional Invoicing",
                desc: "Create and send beautiful invoices in seconds. Get paid faster with automated reminders.",
              },
              {
                icon: Users,
                title: "CRM & Contacts",
                desc: "Manage leads, deals, and customer relationships. Your pipeline, your rules.",
              },
              {
                icon: BarChart3,
                title: "Reports & Insights",
                desc: "Visual reports that actually make sense. Smarter decisions, backed by real data.",
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="group p-8 rounded-2xl border border-background/10 hover:border-background/20 transition-all duration-300"
                style={{ backgroundColor: "hsl(var(--foreground))" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: "hsl(var(--accent-green) / 0.15)" }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: "hsl(var(--accent-green))" }} />
                </div>
                <h3 className="text-xl font-bold text-background mb-3">{feature.title}</h3>
                <p className="text-background/50 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SHOWCASE SECTION ── */}
      <section className="py-24 md:py-32 border-y border-background/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.p
                variants={fadeUp}
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: "hsl(var(--accent-green))" }}
              >
                Mobile-First
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-background tracking-tight mb-6">
                DESIGNED FOR BUSINESSES ON THE GO
              </motion.h2>
              <motion.p variants={fadeUp} className="text-background/50 text-lg mb-8 leading-relaxed">
                Whether you're at the shop or in the field, Manaa works beautifully on any device. Track expenses, record sales, and manage your books — all from your pocket.
              </motion.p>
              <motion.div variants={fadeUp} className="space-y-4">
                {[
                  "Record cash-in and cash-out in seconds",
                  "Snap receipts and attach to transactions",
                  "View real-time account balances anywhere",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "hsl(var(--accent-green))" }}
                    >
                      <ChevronRight className="w-3.5 h-3.5" style={{ color: "hsl(var(--accent-green-foreground))" }} />
                    </div>
                    <span className="text-background/70 text-sm">{item}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="rounded-2xl overflow-hidden">
                <img
                  src={landingFeature1}
                  alt="African businessman managing finances"
                  className="w-full object-cover aspect-square"
                />
              </div>
              <div
                className="absolute -bottom-6 -left-6 w-32 h-32 rounded-2xl -z-10"
                style={{ backgroundColor: "hsl(var(--accent-green) / 0.3)" }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: "hsl(var(--accent-green))" }}
            >
              How It Works
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-background tracking-tight">
              UP AND RUNNING IN MINUTES
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                step: "01",
                title: "SIGN UP IN A SNAP",
                desc: "Create your account in under 2 minutes. We made onboarding so smooth, you'll think it's a glitch.",
                icon: Zap,
              },
              {
                step: "02",
                title: "ADD YOUR BUSINESS",
                desc: "Set up your business profile, accounts, and categories. Your financial command center awaits.",
                icon: BookOpen,
              },
              {
                step: "03",
                title: "TRACK, INVOICE, GROW",
                desc: "Start recording transactions, sending invoices, and watching your business insights unfold.",
                icon: BarChart3,
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="relative p-8 rounded-2xl border border-background/10"
              >
                <div
                  className="text-6xl font-extrabold absolute top-6 right-6"
                  style={{ color: "hsl(var(--accent-green) / 0.1)" }}
                >
                  {item.step}
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: "hsl(var(--accent-green) / 0.15)" }}
                >
                  <item.icon className="w-6 h-6" style={{ color: "hsl(var(--accent-green))" }} />
                </div>
                <h3 className="text-lg font-bold text-background mb-3">{item.title}</h3>
                <p className="text-background/50 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 md:py-32 border-y border-background/10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: "hsl(var(--accent-green))" }}
            >
              Testimonials
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-background tracking-tight">
              REAL PEOPLE, REAL TALK
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                name: "Amina Okafor",
                role: "Fashion Boutique Owner, Lagos",
                quote: "Before Manaa, I was tracking everything in a notebook. Now I know exactly where every naira goes. My accountant is actually impressed with my records now.",
              },
              {
                name: "Kwame Mensah",
                role: "Restaurant Owner, Accra",
                quote: "The invoicing feature alone saved me hours every week. I send professional invoices right from my phone and get paid faster. It just works.",
              },
              {
                name: "Wanjiku Njeri",
                role: "Freelance Consultant, Nairobi",
                quote: "I tried a couple of other finance apps, and they were either too complex or too basic. Manaa hits the sweet spot. Simple, powerful, and actually designed for how I work.",
              },
            ].map((testimonial) => (
              <motion.div
                key={testimonial.name}
                variants={fadeUp}
                className="p-8 rounded-2xl border border-background/10"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-current"
                      style={{ color: "hsl(var(--accent-green))" }}
                    />
                  ))}
                </div>
                <p className="text-background/70 text-sm leading-relaxed mb-8 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="font-semibold text-background">{testimonial.name}</div>
                  <div className="text-xs text-background/40 mt-0.5">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECURITY BANNER ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="rounded-2xl overflow-hidden">
                <img
                  src={landingFeature2}
                  alt="African woman business owner"
                  className="w-full object-cover aspect-square"
                />
              </div>
              <div
                className="absolute -top-6 -right-6 w-32 h-32 rounded-2xl -z-10"
                style={{ backgroundColor: "hsl(var(--accent-green) / 0.3)" }}
              />
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.p
                variants={fadeUp}
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: "hsl(var(--accent-green))" }}
              >
                Security
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-background tracking-tight mb-6">
                YOUR DATA IS SAFER THAN YOUR DIARY
              </motion.h2>
              <motion.p variants={fadeUp} className="text-background/50 text-lg mb-8 leading-relaxed">
                Bank-level encryption, secure cloud storage, and role-based access. Your business data stays yours — always.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                {[
                  { icon: Shield, label: "End-to-end encryption" },
                  { icon: Zap, label: "99.9% uptime" },
                  { icon: Users, label: "Role-based access" },
                ].map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-background/10"
                  >
                    <badge.icon className="w-4 h-4" style={{ color: "hsl(var(--accent-green))" }} />
                    <span className="text-xs font-medium text-background/70">{badge.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
              style={{ color: "hsl(var(--accent-green))" }}
            >
              START FREE. SCALE WHEN YOU'RE READY.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-background/50 text-lg mb-10 max-w-xl mx-auto">
              No credit card required. Get started in under 2 minutes. Join hundreds of African businesses already using Manaa.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link to="/auth">
                <Button
                  className="rounded-full h-16 px-12 text-lg font-bold border-0 gap-3"
                  style={{
                    backgroundColor: "hsl(var(--accent-green))",
                    color: "hsl(var(--accent-green-foreground))",
                  }}
                >
                  Create Your Account
                  <ArrowRight className="w-6 h-6" />
                </Button>
              </Link>
            </motion.div>
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
              <p className="text-background/40 text-sm max-w-sm leading-relaxed">
                Smart bookkeeping for Africa. Track your cash flow, send invoices, manage customers, and make better decisions with real data.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-background text-sm mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-background/40">
                <li><a href="#features" className="hover:text-background transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-background transition-colors">How It Works</a></li>
                <li><a href="#testimonials" className="hover:text-background transition-colors">Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-background text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-background/40">
                <li><a href="#" className="hover:text-background transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-background transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-background/30">
              © {new Date().getFullYear()} Manaa. All rights reserved.
            </p>
            <p className="text-xs text-background/30">
              Built with ❤️ for African entrepreneurs
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

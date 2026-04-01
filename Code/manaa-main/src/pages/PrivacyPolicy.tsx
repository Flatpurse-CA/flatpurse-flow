import { Link } from "react-router-dom";
import manaaLogo from "@/assets/manaa-logo-full.png";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <img src={manaaLogo} alt="Manaa" className="h-7 object-contain" />
          </Link>
          <span className="text-xs text-muted-foreground">Privacy Policy</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: February 19, 2026</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section>
            <p className="text-muted-foreground leading-relaxed">
              Manaa is a product of <strong className="text-foreground">Midda Innovation Ltd.</strong> ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform — Manaa.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Please read this policy carefully. If you disagree with its terms, please discontinue use of our services.
            </p>
          </section>

          <Divider />

          <Section title="1. Who We Are">
            <p>
              Manaa is operated by <strong className="text-foreground">Midda Innovation Ltd.</strong>, a company registered in Nigeria. We provide business management tools including bookkeeping, invoicing, CRM, inventory management, and reporting features to small and medium-sized businesses.
            </p>
            <p className="mt-3">
              If you have any questions about this policy, contact us at: <a href="mailto:privacy@manaa.app" className="text-foreground underline underline-offset-2">privacy@manaa.app</a>
            </p>
          </Section>

          <Divider />

          <Section title="2. Information We Collect">
            <p>We collect information you provide directly to us, including:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-muted-foreground">
              <li><strong className="text-foreground">Account Information:</strong> Your name, email address, and password when you register.</li>
              <li><strong className="text-foreground">Business Information:</strong> Business name, address, phone number, TIN, and official email.</li>
              <li><strong className="text-foreground">Financial Data:</strong> Transaction records, account balances, and invoice details you enter into the platform.</li>
              <li><strong className="text-foreground">Contact & CRM Data:</strong> Names, phone numbers, emails, and notes about your customers and leads.</li>
              <li><strong className="text-foreground">Inventory Data:</strong> Product names, SKUs, pricing, and stock levels you manage.</li>
              <li><strong className="text-foreground">Usage Data:</strong> How you interact with our platform, features you use, and time spent.</li>
              <li><strong className="text-foreground">Device Information:</strong> IP address, browser type, operating system, and device identifiers.</li>
            </ul>
          </Section>

          <Divider />

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-muted-foreground">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and manage your account</li>
              <li>Send you service-related notifications (e.g. invoices, reminders, alerts)</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Monitor and analyse usage patterns to improve the product</li>
              <li>Detect and prevent fraudulent, unauthorised, or illegal activity</li>
              <li>Comply with legal obligations applicable to us</li>
            </ul>
            <p className="mt-3">
              We do <strong className="text-foreground">not</strong> sell your personal data to third parties.
            </p>
          </Section>

          <Divider />

          <Section title="4. Data Sharing & Disclosure">
            <p>We may share your information with:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-muted-foreground">
              <li><strong className="text-foreground">Service Providers:</strong> Trusted third-party vendors who assist us in operating the platform (e.g. cloud infrastructure, payment processing, email delivery). They are bound by confidentiality obligations.</li>
              <li><strong className="text-foreground">Legal Authorities:</strong> Where required by law, court order, or government request.</li>
              <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your data may be transferred with appropriate notice to you.</li>
            </ul>
          </Section>

          <Divider />

          <Section title="5. Data Retention">
            <p>
              We retain your personal data for as long as your account is active or as needed to provide services. If you close your account, we will delete or anonymise your data within <strong className="text-foreground">90 days</strong>, unless we are required to retain it for legal or regulatory purposes.
            </p>
            <p className="mt-3">
              Financial transaction data may be retained for up to <strong className="text-foreground">7 years</strong> in accordance with Nigerian financial regulations.
            </p>
          </Section>

          <Divider />

          <Section title="6. Data Security">
            <p>
              We implement industry-standard security measures including encryption in transit (TLS), encrypted storage, access controls, and regular security reviews to protect your data from unauthorised access, loss, or disclosure.
            </p>
            <p className="mt-3">
              However, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password and to keep your login credentials confidential.
            </p>
          </Section>

          <Divider />

          <Section title="7. Your Rights">
            <p>As a user, you have the right to:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-muted-foreground">
              <li><strong className="text-foreground">Access</strong> your personal data we hold</li>
              <li><strong className="text-foreground">Correct</strong> inaccurate or incomplete information</li>
              <li><strong className="text-foreground">Delete</strong> your account and associated data</li>
              <li><strong className="text-foreground">Export</strong> your business data (where technically feasible)</li>
              <li><strong className="text-foreground">Withdraw consent</strong> for optional data processing at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at <a href="mailto:privacy@manaa.app" className="text-foreground underline underline-offset-2">privacy@manaa.app</a>.
            </p>
          </Section>

          <Divider />

          <Section title="8. Cookies">
            <p>
              We use essential cookies to keep you logged in and maintain your session. We may also use analytics cookies to understand how our platform is used. You can control cookie preferences through your browser settings.
            </p>
          </Section>

          <Divider />

          <Section title="9. Children's Privacy">
            <p>
              Manaa is not intended for use by individuals under the age of <strong className="text-foreground">18</strong>. We do not knowingly collect personal information from minors. If you believe a minor has provided us with their data, please contact us immediately.
            </p>
          </Section>

          <Divider />

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page and notify you via email or an in-app notification for material changes. Continued use of Manaa after changes constitutes your acceptance of the revised policy.
            </p>
          </Section>

          <Divider />

          <Section title="11. Contact Us">
            <p>If you have questions, concerns, or requests regarding this Privacy Policy, please contact:</p>
            <div className="mt-4 bg-muted rounded-lg p-4 text-sm space-y-1">
              <p className="font-semibold text-foreground">Midda Innovation Ltd.</p>
              <p className="text-muted-foreground">Product: Manaa</p>
              <p className="text-muted-foreground">Email: <a href="mailto:privacy@manaa.app" className="text-foreground underline underline-offset-2">privacy@manaa.app</a></p>
              <p className="text-muted-foreground">Nigeria</p>
            </div>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Midda Innovation Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold tracking-tight mb-3">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function Divider() {
  return <hr className="border-border" />;
}

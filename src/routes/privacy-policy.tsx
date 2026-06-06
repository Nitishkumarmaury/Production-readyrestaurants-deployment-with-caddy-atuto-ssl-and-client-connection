import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Shield, Mail, MapPin, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Ready Deliveries" },
      { name: "description", content: "Privacy Policy for Ready Deliveries Technologies Pvt. Ltd." },
    ],
  }),
  component: PrivacyPolicy,
});

function SC({ n, t, children }: { n: string; t: string; children: React.ReactNode }) {
  return (
    <section className="group relative rounded-2xl border border-border/50 bg-surface/30 p-6 sm:p-8 transition-all duration-300 hover:border-primary/20 hover:bg-surface/50">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{n}</span>
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">{t}</h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{children}</div>
    </section>
  );
}

function PrivacyPolicy() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="blob absolute -top-40 left-1/4 h-80 w-80 bg-primary/20" />
        <div className="blob absolute -top-20 right-1/4 h-60 w-60 bg-[oklch(0.55_0.22_280/0.15)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/10">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Privacy <span className="text-gradient">Policy</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            This Privacy Policy describes how Ready Deliveries Technologies Pvt. Ltd. collects, uses, stores, and protects your personal information.
          </p>
          <p className="mt-3 text-xs text-muted-foreground/60">Last Updated: June 2026</p>
        </div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 pb-24">
        <div className="space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              By using Ready Deliveries, you agree to the practices described below. If you disagree, please discontinue use of the Platform.
            </p>
          </div>

          <SC n="1" t="Purpose of This Policy">
            <p>Your privacy matters to us. Ready Deliveries is committed to maintaining the confidentiality, integrity, and security of any personal information we collect.</p>
            <p>This document explains:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>What information we collect</li>
              <li>How we use and share it</li>
              <li>The rights you have regarding your data</li>
              <li>How we secure and store your information</li>
            </ul>
          </SC>

          <SC n="2" t="Information We Collect">
            <p>We collect data to provide seamless ordering, improve delivery efficiency, and enhance user experience.</p>
            <h3 className="mt-4 text-sm font-semibold text-foreground">(a) Information You Provide Directly</h3>
            <p>When you sign up, order food, or contact support, we may collect:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Full Name</li><li>Email Address</li><li>Mobile Number</li>
              <li>Delivery Address and location details</li>
              <li>Payment method and billing information</li>
              <li>Feedback, ratings, and reviews</li>
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-foreground">(b) Information Collected Automatically</h3>
            <p>When you use the Platform, we automatically gather:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Device type, IP address, and browser details</li>
              <li>App usage statistics, click patterns, and session duration</li>
              <li>GPS location (for delivery tracking and restaurant suggestions)</li>
              <li>Cookies and similar technologies for personalization</li>
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-foreground">(c) Information from Third Parties</h3>
            <p>We may obtain additional details from:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Restaurant partners</li><li>Payment gateways</li>
              <li>Delivery partners</li><li>Advertising or analytics providers</li>
            </ul>
            <p>We ensure such third-party data is used only for legitimate service purposes and handled securely.</p>
          </SC>

          <SC n="3" t="How We Use Your Information">
            <p>We process your data to:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Facilitate orders between you and partner restaurants</li>
              <li>Process payments securely</li>
              <li>Deliver orders efficiently through riders or third-party logistics partners</li>
              <li>Provide customer support and resolve issues</li>
              <li>Send notifications about order status, offers, and new features</li>
              <li>Improve our Platform, user interface, and delivery algorithms</li>
              <li>Ensure security and detect fraudulent transactions</li>
              <li>Comply with legal obligations under Indian law</li>
            </ul>
            <p className="mt-2 font-medium text-foreground">We do not sell your personal information to marketers.</p>
          </SC>

          <SC n="4" t="Cookies and Tracking">
            <p>Ready Deliveries uses cookies, pixels, and analytics tools (like Google Analytics and Firebase) to:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Remember login sessions</li>
              <li>Analyze traffic patterns</li>
              <li>Personalize restaurant listings and offers</li>
            </ul>
            <p>You can disable cookies in your browser or phone settings; however, some features may not function properly.</p>
          </SC>

          <SC n="5" t="Sharing of Information">
            <p>We share your information only as necessary to operate Ready Deliveries:</p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-border/50 bg-surface/50">
                  <th className="px-4 py-3 font-semibold text-foreground">Shared With</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Purpose</th>
                </tr></thead>
                <tbody className="divide-y divide-border/30">
                  <tr><td className="px-4 py-3">Partner Restaurants</td><td className="px-4 py-3">To confirm and prepare your orders</td></tr>
                  <tr><td className="px-4 py-3">Delivery Partners</td><td className="px-4 py-3">For accurate pickup and drop-off</td></tr>
                  <tr><td className="px-4 py-3">Payment Gateways</td><td className="px-4 py-3">To process secure transactions</td></tr>
                  <tr><td className="px-4 py-3">Service Providers</td><td className="px-4 py-3">Cloud hosting, SMS/email communication, analytics</td></tr>
                  <tr><td className="px-4 py-3">Law Enforcement Agencies</td><td className="px-4 py-3">When required under applicable law</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">All partners are bound by confidentiality and data-protection agreements.</p>
          </SC>

          <SC n="6" t="Data Storage and Retention">
            <ul className="ml-5 list-disc space-y-2">
              <li>Your data is stored securely on cloud servers located within India or in jurisdictions that meet data-protection standards.</li>
              <li>We retain personal data only as long as necessary for service provision, dispute resolution, or legal compliance.</li>
              <li>Upon account deletion, most personal data is deleted within 30 days, except data retained under statutory requirements (e.g., payment records).</li>
            </ul>
          </SC>

          <SC n="7" t="Security Measures">
            <p>We employ:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>128-bit SSL encryption for transactions</li>
              <li>Firewalls and secure cloud storage</li>
              <li>Regular security audits and access controls</li>
            </ul>
            <p>While we follow industry-best practices, no method of transmission over the Internet is 100% secure. You acknowledge this inherent risk.</p>
          </SC>

          <SC n="8" t="Your Rights">
            <p>You have the right to:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Access and update your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Withdraw consent for marketing communications</li>
              <li>Request deletion of your account and personal data</li>
              <li>Lodge complaints with data protection authorities (if applicable in India)</li>
            </ul>
            <p>To exercise these rights, email <a href="mailto:support@readydeliveries.com" className="text-primary hover:underline">support@readydeliveries.com</a>.</p>
          </SC>

          <SC n="9" t="Children's Privacy">
            <p>Ready Deliveries is not intended for children under 18. We do not knowingly collect information from minors. If we learn that we have unintentionally collected such data, we will promptly delete it.</p>
          </SC>

          <SC n="10" t="Communication and Marketing">
            <p>By signing up, you consent to receive order updates, promotional messages, and push notifications.</p>
            <p>You can opt-out anytime using the unsubscribe option in emails or app settings.</p>
          </SC>

          <SC n="11" t="Third-Party Links and Services">
            <p>Our Platform may contain links to external sites such as restaurant websites, payment pages, or social-media channels.</p>
            <p>We are not responsible for the privacy practices of those sites. Please review their policies separately.</p>
          </SC>

          <SC n="12" t="International Data Transfers">
            <p>If any data is transferred outside India (for hosting or analytics), we ensure it is protected under lawful safeguards and standard contractual clauses.</p>
          </SC>

          <SC n="13" t="Updates to This Policy">
            <p>We may update this Privacy Policy from time to time. Revised versions will be posted with an updated "Last Updated" date.</p>
            <p>Continued use of Ready Deliveries after such updates signifies your acceptance.</p>
          </SC>

          <SC n="14" t="Contact Us">
            <p>For questions, complaints, or feedback regarding this Privacy Policy:</p>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                <a href="mailto:support@readydeliveries.com" className="text-primary hover:underline">support@readydeliveries.com</a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                <span>Ready Deliveries Technologies Pvt. Ltd. — India</span>
              </div>
            </div>
          </SC>

          <SC n="15" t="Consent">
            <p>By using Ready Deliveries, you consent to the collection and use of information as described in this Privacy Policy.</p>
          </SC>

          <div className="pt-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-surface/50 px-5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-surface hover:text-foreground">
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

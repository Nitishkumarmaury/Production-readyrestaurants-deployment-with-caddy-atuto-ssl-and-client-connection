import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { FileText, Mail, MapPin, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — Ready Deliveries" },
      { name: "description", content: "Terms and Conditions for Ready Deliveries Technologies Pvt. Ltd." },
    ],
  }),
  component: TermsAndConditions,
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

function TermsAndConditions() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="blob absolute -top-40 left-1/4 h-80 w-80 bg-primary/20" />
        <div className="blob absolute -top-20 right-1/4 h-60 w-60 bg-[oklch(0.55_0.22_280/0.15)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/10">
            <FileText size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Terms &amp; <span className="text-gradient">Conditions</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            These Terms and Conditions govern your access to and use of our website, mobile application, and related services.
          </p>
          <p className="mt-3 text-xs text-muted-foreground/60">Last Updated: June 2026</p>
        </div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 pb-24">
        <div className="space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Welcome to Ready Deliveries, operated by Ready Deliveries Technologies Pvt. Ltd. By accessing or using Ready Deliveries, you agree to be bound by these Terms. If you do not agree, please do not use our Platform. These Terms constitute a legally binding agreement between you and Ready Deliveries Technologies Pvt. Ltd.
            </p>
          </div>

          <SC n="1" t="Introduction">
            <p>Ready Deliveries is an online food ordering and delivery platform that connects customers with restaurants, cloud kitchens, and food vendors ("Partner Restaurants") for ordering meals, beverages, and related items.</p>
            <p>Ready Deliveries acts as a facilitator between users and restaurants — we do not cook, prepare, or own the food items listed on the app. Our role is to provide a convenient platform for discovering, ordering, and tracking food delivery.</p>
            <p>By using our Platform, you acknowledge and agree that Ready Deliveries:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Does not guarantee food quality, preparation time, or packaging beyond what is committed by the restaurant partner.</li>
              <li>Is not responsible for delays, unavailability, or quality issues caused by third-party partners.</li>
            </ul>
          </SC>

          <SC n="2" t="Eligibility">
            <p>You must be at least 18 years old to use Ready Deliveries. By accessing or using our Platform, you confirm that:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>You are legally capable of entering into a binding contract under Indian law.</li>
              <li>You are not prohibited by any law from using such services.</li>
              <li>You will use the Platform for personal and lawful purposes only.</li>
            </ul>
          </SC>

          <SC n="3" t="Account Registration">
            <p>To place orders on Ready Deliveries, users must create an account by providing accurate information such as:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Name, contact number, delivery address, and valid payment details.</li>
            </ul>
            <p>You are responsible for:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Maintaining the confidentiality of your login credentials.</li>
              <li>Ensuring your account activity complies with these Terms.</li>
              <li>Immediately notifying us of any unauthorized use of your account.</li>
            </ul>
            <p>Ready Deliveries reserves the right to suspend or terminate your account if we suspect fraudulent or abusive activity.</p>
          </SC>

          <SC n="4" t="Use of Platform">
            <p>You agree to use Ready Deliveries only for lawful purposes and in accordance with these Terms. You must not:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Use the Platform for any fraudulent or commercial purpose without authorization.</li>
              <li>Interfere with or disrupt the operation of the app or its servers.</li>
              <li>Post, upload, or share harmful, offensive, or misleading content.</li>
              <li>Attempt to reverse engineer, copy, or resell any part of the Platform.</li>
            </ul>
            <p>Violation of these restrictions may lead to suspension or permanent termination of your account.</p>
          </SC>

          <SC n="5" t="Orders and Payments">
            <h3 className="text-sm font-semibold text-foreground">(a) Placing Orders</h3>
            <p>When you place an order through Ready Deliveries:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>You make an offer to purchase food items from the selected restaurant.</li>
              <li>The restaurant reserves the right to accept or reject your order at its discretion.</li>
              <li>Once accepted, you will receive an in-app or email confirmation.</li>
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-foreground">(b) Pricing and Taxes</h3>
            <p>All prices displayed on Ready Deliveries include applicable taxes unless stated otherwise. However, restaurants may update prices at any time, and the final bill may reflect packaging charges, service fees, or delivery charges.</p>
            <h3 className="mt-4 text-sm font-semibold text-foreground">(c) Payment Methods</h3>
            <p>Ready Deliveries supports secure payment through:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Credit/Debit cards</li>
              <li>UPI, wallets, or net banking</li>
              <li>Cash on Delivery (where available)</li>
            </ul>
            <p>All digital transactions are processed via secure payment gateways. You agree that Ready Deliveries is not liable for any technical errors, delays, or failed transactions caused by third-party payment providers.</p>
          </SC>

          <SC n="6" t="Delivery">
            <p>Delivery timelines displayed on Ready Deliveries are estimates and may vary depending on restaurant preparation time, distance, weather, and traffic.</p>
            <p>Our delivery partners ("Riders") strive to deliver your order in the best possible time and condition.</p>
            <p>In case of delivery failure due to incorrect address or unavailability of the customer, the order amount may be non-refundable.</p>
          </SC>

          <SC n="7" t="Cancellation and Refunds">
            <p>You may cancel an order before the restaurant accepts it. Once accepted, cancellations may not be possible.</p>
            <p>Refunds (if applicable) are governed by our Refund &amp; Cancellation Policy, available separately on our website/app. In brief:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Orders cancelled before acceptance: full refund.</li>
              <li>Orders cancelled after acceptance: refund not guaranteed.</li>
              <li>Failed or incorrect deliveries: eligible for partial or full refund after review.</li>
            </ul>
            <p>Refunds are credited to the original payment method within 5–7 business days.</p>
          </SC>

          <SC n="8" t="Restaurant Partner Responsibilities">
            <p>Partner Restaurants are solely responsible for:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Food preparation, hygiene, quality, and compliance with local food safety laws.</li>
              <li>Accurate display of menu, pricing, and availability.</li>
              <li>Proper packaging to ensure safe delivery.</li>
            </ul>
            <p>Ready Deliveries does not guarantee or endorse the food quality, taste, or quantity.</p>
            <p>Any issues regarding food items must first be raised with the restaurant partner via our support channels.</p>
          </SC>

          <SC n="9" t="Intellectual Property">
            <p>All trademarks, logos, software, designs, text, images, and content on Ready Deliveries are owned by or licensed to Ready Deliveries Technologies Pvt. Ltd.</p>
            <p>You may not copy, modify, reproduce, distribute, or create derivative works without prior written consent.</p>
            <p>The Ready Deliveries brand, including its name, logo, and user interface design, are protected under applicable copyright and trademark laws.</p>
          </SC>

          <SC n="10" t="Ratings and Reviews">
            <p>Users may leave reviews, feedback, or ratings about restaurants or deliveries.</p>
            <p>By posting content, you grant Ready Deliveries a non-exclusive, royalty-free, worldwide license to use, display, and share your feedback for promotional purposes.</p>
            <p>You agree that:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Reviews must be genuine and not defamatory or abusive.</li>
              <li>Ready Deliveries reserves the right to moderate, edit, or remove reviews that violate these Terms.</li>
            </ul>
          </SC>

          <SC n="11" t="Promotions and Offers">
            <p>Ready Deliveries may offer promotional codes, coupons, or discounts. All such offers are subject to specific conditions and may expire or be withdrawn at any time.</p>
            <p>Ready Deliveries reserves the right to deny benefits of a promotion in cases of misuse, fraud, or policy violations.</p>
          </SC>

          <SC n="12" t="Limitation of Liability">
            <p>To the maximum extent permitted by law:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Ready Deliveries is not liable for any loss, damage, or injury arising from food quality, late delivery, payment failure, or third-party actions.</li>
              <li>Our total liability, if any, shall not exceed the amount paid by the user for the order in question.</li>
              <li>We are not responsible for indirect, incidental, or consequential damages.</li>
            </ul>
            <p className="mt-2 font-medium text-foreground">Your use of Ready Deliveries is entirely at your own risk.</p>
          </SC>

          <SC n="13" t="Indemnification">
            <p>You agree to indemnify and hold harmless Ready Deliveries, its affiliates, employees, and partners from any claims, damages, or expenses arising from:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Your misuse of the Platform,</li>
              <li>Violation of these Terms, or</li>
              <li>Infringement of any third-party rights.</li>
            </ul>
          </SC>

          <SC n="14" t="Termination">
            <p>Ready Deliveries may suspend or terminate your account without prior notice if:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>You breach these Terms,</li>
              <li>Engage in fraudulent or abusive activity, or</li>
              <li>Cause harm to the Platform's reputation or operations.</li>
            </ul>
            <p>Upon termination, you lose all access to your account, wallet credits, and related services.</p>
          </SC>

          <SC n="15" t="Changes to Terms">
            <p>We may update these Terms from time to time. Any revisions will be posted on the website/app with the updated "Last Updated" date.</p>
            <p>Your continued use of Ready Deliveries after such changes constitutes acceptance of the revised Terms.</p>
          </SC>

          <SC n="16" t="Third-Party Links">
            <p>Our Platform may contain links to third-party websites or services. Ready Deliveries is not responsible for their content, policies, or practices.</p>
            <p>We encourage you to review the terms and privacy policies of any third-party sites you visit.</p>
          </SC>

          <SC n="17" t="Governing Law and Jurisdiction">
            <p>These Terms shall be governed by and interpreted under the laws of India.</p>
            <p>Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in India.</p>
          </SC>

          <SC n="18" t="Contact Us">
            <p>If you have any questions or concerns regarding these Terms, please contact us at:</p>
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

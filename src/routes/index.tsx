import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustedBy } from "@/components/landing/TrustedBy";
import { IndustrySegments } from "@/components/landing/IndustrySegments";
import { Features } from "@/components/landing/Features";
import { Showcase } from "@/components/landing/Showcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
// import { CaseStudies } from "@/components/landing/CaseStudies";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTASection } from "@/components/landing/CTASection";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ready Deliveries — The All-in-One OS for Modern Restaurants" },
      { name: "description", content: "Launch branded ordering apps, manage delivery, and scale your restaurant or cloud kitchen with Ready Deliveries's all-in-one platform. Trusted by 4,500+ food brands." },
      { property: "og:title", content: "Ready Deliveries — The All-in-One OS for Modern Restaurants" },
      { property: "og:description", content: "Branded apps, QR ordering, POS, delivery, loyalty and more — for restaurants, cloud kitchens and grocery brands." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <TrustedBy />
      <IndustrySegments />
      <Features />
      <Showcase />
      <HowItWorks />
      <Pricing />
      {/* <CaseStudies /> */}
      <Testimonials />
      <CTASection />
      <FAQ />
      <Footer />
    </main>
  );
}

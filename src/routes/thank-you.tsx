import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "Thank You — Ready Deliveries" },
      { name: "description", content: "Thank you for reaching out. Our team will contact you shortly." },
    ],
  }),
  component: ThankYou,
});

function ThankYou() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      
      <main className="relative flex min-h-[80vh] items-center justify-center py-24 md:py-32">
        {/* Background Blobs */}
        <div className="blob left-1/2 top-1/2 h-96 w-[40rem] -translate-x-1/2 -translate-y-1/2 bg-primary/20 opacity-50" />
        
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="glass mx-auto max-w-2xl rounded-[2.5rem] p-8 md:p-16">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 size={48} className="animate-in zoom-in duration-500 fill-primary/20" />
            </div>
            
            <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
              Thank you for your <span className="text-gradient">interest!</span>
            </h1>
            
            <p className="mt-6 text-base text-muted-foreground">
              We've received your request. One of our experts will reach out to you within the next 24 hours to discuss how we can help grow your business.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/"
                className="btn-glow flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
              >
                <Home size={18} />
                Back to Home
              </Link>
              
              <Link
                to="/"
                hash="features"
                className="glass flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5"
              >
                Explore Features
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          
          <div className="mt-12 text-sm text-muted-foreground">
            Want to speak with us immediately? <a href="mailto:support@readydeliveries.com" className="text-primary hover:underline">Email us here</a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

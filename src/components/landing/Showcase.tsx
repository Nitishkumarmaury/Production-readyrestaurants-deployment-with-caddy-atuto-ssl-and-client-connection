import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { IMAGES } from "@/lib/images";

const tabs = [
  {
    id: "customer",
    label: "Customer Portal",
    desc: "A portal from where your customer can view products, place orders, and track delivery in real-time.",
    image: IMAGES.customerPanel,
    features: ["Effortless Browsing & Ordering", "Real-Time Order Tracking", "Personalized Experience", "Built-in Wallet and Loyalty Points"]
  },
  {
    id: "admin",
    label: "Admin Panel",
    desc: "Designed for administrators to supervise orders, vendors, drivers, and clients through a simplified panel.",
    image: IMAGES.adminDashboard,
    features: ["​Dynamic sales heatmaps & analytics", "Sales data for individual divisions", "Automated commission calculations and payments", "Thorough staff and driver administration"]
  },
  {
    id: "delivery",
    label: "Driver App",
    desc: "Drivers can track earnings, reviews, and payout history. Also, include in-app navigation for efficient delivery.",
    image: IMAGES.driverApp,
    features: ["AI-powered route optimization", "Contactless proof of delivery", "Instant earnings and trip history", "Live location sync with customers"]
  },
  {
    id: "vendor",
    label: "Vendor Portal",
    desc: "A fully managed dashboard for vendors to oversee their shop with ordering, product management, and more.",
    image: IMAGES.vendorPanel,
    features: ["Advanced menu and combo management", "Real-time order fulfillment pipeline", "Detailed business and payout reports", "Integrated marketing and banner ads"]
  },
  {
    id: "pos",
    label: "POS System",
    desc: "Designed for staff members to assist with in-store sales,  billing, and more.",
    image: IMAGES.pos,
    features: ["Table management and QR ordering", "Split billing and multi-payment support", "Offline-first reliability", "Direct kitchen display (KDS) sync"]
  },
];

export function Showcase() {
  const [active, setActive] = useState(tabs[0].id);
  const cur = tabs.find((t) => t.id === active)!;

  return (
    <section id="showcase" className="relative bg-surface/40 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Product showcase</span>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Modules of our Platform​.</h2>
          <p className="mt-4 text-muted-foreground">Discover the apps that power your daily business operations and customer experiences.</p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${active === t.id
                ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-glow"
                : "glass text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <motion.div
          key={cur.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 grid items-center gap-10 lg:grid-cols-2"
        >
          <div>
            <h3 className="font-display text-3xl font-bold md:text-4xl">{cur.label}</h3>
            <p className="mt-4 text-lg text-muted-foreground">{cur.desc}</p>
            <ul className="mt-6 space-y-3 text-sm">
              {(cur as any).features.map((x: string) => (
                <li key={x} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />{x}
                </li>
              ))}
            </ul>
          </div>

          {/* Mock device / Image */}
          <div className="relative">
            <div className="relative mx-auto aspect-[4/3] max-w-lg overflow-hidden rounded-3xl">
              <AnimatePresence mode="wait">
                {cur.image ? (
                  <motion.div
                    key={`${cur.id}-image`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full w-full"
                  >
                    <img
                      src={cur.image}
                      alt={cur.label}
                      className="h-full w-full object-contain"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass h-full w-full p-6"
                  >
                    <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-primary/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.85_0.22_155)]/80" />
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div className="h-3 w-1/3 rounded-full bg-foreground/20" />
                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="rounded-xl bg-foreground/5 p-3">
                            <div className="h-12 rounded-lg bg-[image:var(--gradient-primary)] opacity-60" />
                            <div className="mt-2 h-2 w-2/3 rounded-full bg-foreground/20" />
                            <div className="mt-1 h-2 w-1/2 rounded-full bg-foreground/10" />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="rounded-xl bg-foreground/5 p-4">
                            <div className="h-2 w-1/3 rounded-full bg-foreground/20" />
                            <div className="mt-2 h-6 w-2/3 rounded-full bg-primary/40" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="blob absolute -inset-10 -z-10 bg-primary/30" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

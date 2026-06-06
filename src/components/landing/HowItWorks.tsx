import { motion } from "framer-motion";
import { UserPlus, Settings2, Rocket, ShoppingBag } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Register Your Business", desc: "Set up your multi-branch organization and configure your SaaS account in a few steps." },
  { icon: Settings2, title: "Set Up Your Operations", desc: "Set up your menus or product catalogs, define delivery zones, and assign administrative roles." },
  { icon: Rocket, title: "Launch Your Branded Apps", desc: "Launch your white-label customer, vendor, and delivery apps across both platforms." },
  { icon: ShoppingBag, title: "Grow & Scale Effortlessly", desc: "Monitor real-time heatmaps, manage payouts, and grow your digital presence." },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How it works</span>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Get started quickly and go live with your first order in just a day.</h2>
        </div>

        <div className="relative mt-16 grid gap-8 md:grid-cols-4">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center"
            >
              <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-glow">
                <s.icon size={22} />
                <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-background text-xs font-bold text-primary ring-1 ring-primary/40">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { Quote, PlayCircle } from "lucide-react";

const items = [
  { quote: "Ready Deliveries replaced 4 different tools we were duct-taping together. Our team is finally on one platform.", name: "Aarav Mehta", role: "Founder, Spice Route", color: "from-orange-500 to-rose-500" },
  { quote: "The branded apps shipped in two weeks. Our repeat order rate jumped from 18% to 41%.", name: "Sneha Kapoor", role: "CEO, Urban Bowl", color: "from-fuchsia-500 to-indigo-500" },
  { quote: "We saved nearly ₹3 lakh a month in aggregator commissions in the first quarter alone.", name: "James Wong", role: "COO, Crust & Co.", color: "from-emerald-500 to-cyan-500" },
];

export function Testimonials() {
  return (
    <section className="relative bg-surface/40 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Loved by operators</span>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Don't take our word for it</h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass relative flex flex-col rounded-3xl p-7"
            >
              <Quote className="text-primary/60" size={28} />
              <blockquote className="mt-3 flex-1 text-base leading-relaxed">"{t.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border/50 pt-5">
                <div className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${t.color} font-semibold text-white`}>
                  {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <PlayCircle size={20} className="text-primary" />
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

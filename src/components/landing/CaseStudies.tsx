import { motion } from "framer-motion";
import { ExternalLink, TrendingUp } from "lucide-react";

const cases = [
  { name: "Spice Route Bistro", industry: "Multi-cuisine chain", result: "+187% online orders in 90 days", color: "from-[oklch(0.72_0.20_50)] to-[oklch(0.62_0.22_25)]" },
  { name: "Urban Bowl Co.", industry: "Cloud kitchen", result: "Scaled to 12 outlets in 6 months", color: "from-[oklch(0.55_0.22_280)] to-[oklch(0.65_0.20_310)]" },
  { name: "Mango Lane Grocers", industry: "Grocery delivery", result: "₹2.4Cr GMV in first year", color: "from-[oklch(0.85_0.22_155)] to-[oklch(0.65_0.20_180)]" },
  { name: "Crust & Co.", industry: "Pizzeria chain", result: "Cut commission costs by 64%", color: "from-[oklch(0.72_0.20_50)] to-[oklch(0.55_0.22_280)]" },
];

export function CaseStudies() {
  return (
    <section id="case-studies" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Case studies</span>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Real brands. Real growth.</h2>
          </div>
          <p className="max-w-md text-muted-foreground">Hundreds of restaurants and food brands have transformed their operations with Ready Deliveries.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {cases.map((c, i) => (
            <motion.article
              key={c.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass group overflow-hidden rounded-3xl"
            >
              <div className={`relative aspect-[16/9] bg-gradient-to-br ${c.color}`}>
                <div className="absolute inset-0 grid place-items-center">
                  <span className="font-display text-3xl font-bold text-white/95 drop-shadow-lg">{c.name}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="flex items-center justify-between p-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.industry}</p>
                  <p className="mt-2 flex items-center gap-2 font-display text-lg font-semibold">
                    <TrendingUp size={18} className="text-primary" /> {c.result}
                  </p>
                </div>
                <a href="#" className="glass inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-white/10">
                  Visit site <ExternalLink size={12} />
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

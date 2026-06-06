import { motion } from "framer-motion";
import { Globe, QrCode, CreditCard, Truck, Gift, MessageCircle, Smartphone, Boxes, BarChart3, Repeat } from "lucide-react";

const features = [
  { icon: Globe, title: "Multi-Category Support", desc: "Unified system for food, grocery, pharmacy, and retail businesses with category-specific workflows, streamlined operations, and centralized management for seamless order handling across multiple business types." },
  { icon: BarChart3, title: "Heatmaps & Analytics", desc: "Our platform enables businesses to track their sales performance, customer behavior, and growth through heatmaps. Real-time insights empower businesses to make smarter operational and marketing decisions." },
  { icon: CreditCard, title: "Multi-Vendor Support", desc: "Businesses can list multiple vendors and manage orders and inventories. Ready Deliveries is for you if you are a franchisee business, have a restaurant chain, any retail chain at multiple locations, or are in a marketplace." },
  { icon: Truck, title: "Cloud-Based POS", desc: "Our advanced cloud-powered POS system with offline synchronization, billing support, and thermal printing helps business owners simplify daily operations and assists in-store management." },
  { icon: Gift, title: "Logistics Dashboard", desc: "All-in-one logistics management system covering driver tracking, commission automation, payout management, delivery monitoring, and operational control with the ease of dispatch workflows." },
  { icon: Smartphone, title: "Loyalty & Wallet", desc: "​Integrated digital wallets, referral programs, loyalty points, and cashback help boost customer retention. These tools are designed to increase repeat purchases and drive long-term engagement." },
  { icon: Boxes, title: "Native White-Label Apps", desc: "Launch fully branded iOS and Android applications for customers, vendors, and delivery partners. The app comes with fully customizable interfaces that are tailored to your business requirements." },
  { icon: Repeat, title: "SaaS Management", desc: "You can manage multiple branches, service zones, taxes, commissions, subscriptions, and your overall business operations from a centralized control with the administrator dashboard." },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Everything in one place</span>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
            Designed to Power Every Aspect of Your Delivery Ecosystem
          </h2>
          <p className="mt-4 text-muted-foreground">
            We know what delivery businesses require, and therefore build a platform that gives amazing experiences to users with features such as real-time tracking, smart automation, etc.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 4) * 0.05 }}
              className="glass group relative overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-glow">
                <f.icon size={20} />
              </div>
              <h3 className="relative mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="relative mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

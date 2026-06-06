import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, TrendingUp, ShoppingBag, Star } from "lucide-react";
import { IMAGES } from "@/lib/images";
import { useEffect, useState } from "react";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min((t - start) / 1400, 1);
      setN(Math.floor(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span>{n.toLocaleString()}{suffix}</span>;
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">


      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs"
          >
            <Sparkles size={14} className="text-primary" />
            <span className="text-muted-foreground">Trusted by 1,500+ restaurants worldwide</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 font-display text-5xl font-bold leading-[1.05] md:text-7xl"
          >
            Run Your Delivery Business <span className="text-gradient">Smarter, Not Harder</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            Launch your own app for your restaurant delivery business, clothing business, grocery store, pharmacy, and more, and easily manage your orders, deliveries, and operations.

          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <a href="#contact" className="btn-glow inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3.5 text-sm font-semibold text-primary-foreground">
              Book Demo <ArrowRight size={16} />
            </a>
            <a href="#pricing" className="glass inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5">
              <PlayCircle size={18} /> Start Free Trial
            </a>
          </motion.div>

          <div className="mt-6 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Star size={12} className="fill-primary text-primary" />
            <Star size={12} className="fill-primary text-primary" />
            <Star size={12} className="fill-primary text-primary" />
            <Star size={12} className="fill-primary text-primary" />
            <Star size={12} className="fill-primary text-primary" />
            <span className="ml-2">4.9/5 from 1,200+ reviews</span>
          </div>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative mx-auto mt-16 max-w-6xl"
        >
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src={IMAGES.dashboardHero1}
              alt="Restaurant SaaS dashboard preview"
              width={1920}
              height={1080}
              className="w-full"
            />
          </div>

          {/* Floating Rating */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 1, 0]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -right-4 -top-8 w-32 md:w-48 lg:w-56"
          >
            <div className="glass flex items-center gap-3 rounded-xl border border-white/10 px-4 py-2.5 shadow-xl transition-transform hover:scale-105">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              <span className="whitespace-nowrap text-sm font-semibold">5.0/5 on Capterra</span>
            </div>
          </motion.div>

          {/* Floating Sales Figures */}
          <motion.div
            animate={{
              y: [0, 10, 0],
              x: [0, 5, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute -left-6 bottom-12 w-40 md:w-60 lg:w-72"
          >
            <div className="glass flex flex-col gap-1 rounded-2xl border border-white/10 p-4 shadow-xl transition-transform hover:scale-105">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sales Figures</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-bold">$4,686.82</span>
                <span className="flex items-center text-[10px] font-medium text-emerald-400">
                  <TrendingUp size={10} className="mr-0.5" /> +12.5%
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">Marketing Sales</span>
              <div className="mt-4 flex h-12 items-end gap-1.5">
                {[30, 45, 100, 55, 70, 85, 60].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                    className={`flex-1 rounded-t-[2px] ${h === 100 ? "bg-primary" : "bg-primary/30"}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Animated metrics row */}
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { v: 4500, s: "+", l: "Restaurants" },
            { v: 18, s: "M+", l: "Orders/year" },
            { v: 32, s: "+", l: "Countries" },
            { v: 99, s: "%", l: "Uptime SLA" },
          ].map((m) => (
            <div key={m.l} className="text-center">
              <p className="font-display text-3xl font-bold text-gradient">
                <Counter to={m.v} suffix={m.s} />
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{m.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

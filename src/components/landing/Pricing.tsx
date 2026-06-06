import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, X, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import apis from "../../api";
import { useAuth } from "../../context/AuthContext";


type Plan = {
  name: string;
  tagline: string;
  price: string;
  setup: string;
  features: string[];
  featured?: boolean;
  cta: string;
  isActive?: boolean;
};

const AddonCards = ({ region }: { region: "india" | "outside" }) => {
  const isIndia = region === "india";
  const currency = isIndia ? "₹" : "$";
  const price = isIndia ? "30,000" : "600";
  const bundlePrice = isIndia ? "60,000" : "1,200";
  const savings = isIndia ? "30,000" : "600";

  return (
    <div className="mt-12 grid gap-6 md:grid-cols-2 items-start">
      {/* Mobile Apps Card */}
      <div className="glass rounded-3xl p-7 sm:p-10">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          Mobile Apps (Optional Add-ons)
        </h3>
        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-1">
            <p className="text-lg font-bold text-white sm:text-xl">
              Customer Mobile App – {currency}
              {price}
            </p>
            <p className="text-xs text-muted-foreground">one-time payment</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-bold text-white sm:text-xl">
              Restaurant Mobile App – {currency}
              {price}
            </p>
            <p className="text-xs text-muted-foreground">one-time payment</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-bold text-white sm:text-xl">
              Driver Mobile App – {currency}
              {price}
            </p>
            <p className="text-xs text-muted-foreground">one-time payment</p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-primary/5 p-6 border border-primary/10 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Bundle Offer:
          </p>
          <p className="mt-2 text-xl font-bold text-white sm:text-2xl">
            Customer + Restaurant + Driver Apps – {currency}
            {bundlePrice}
          </p>
          <p className="mt-1 text-sm font-medium text-green-400">
            (Save {currency}
            {savings})
          </p>
        </div>

        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
          Upgrade to native mobile applications for enhanced user experience and
          app store presence.
        </p>

        <ul className="mt-8 space-y-3">
          {[
            "Fully white-labeled with your branding",
            "App Store & Play Store deployment support",
            "High performance, scalable architecture",
          ].map((f) => (
            <li
              key={f}
              className="flex items-center gap-3 text-sm text-white/80"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                <Check size={12} className="text-green-500" />
              </div>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Additional Information Card */}
      <div className="flex flex-col rounded-3xl border border-green-500/20 bg-green-500/5 backdrop-blur-md p-7 sm:p-10 h-fit">
        <h3 className="text-xl font-bold text-white sm:text-2xl">
          Additional Information
        </h3>
        <div className="mt-8 space-y-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10">
              <Check size={12} className="text-green-500" />
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              <span className="font-bold text-white">One-Time Setup Fee:</span>{" "}
              Applicable on Mobile Apps
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10">
              <Check size={12} className="text-green-500" />
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              <span className="font-bold text-white">Third-Party Costs:</span>{" "}
              Payment gateway, SMS, and push notification charges are not
              included
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10">
              <Check size={12} className="text-green-500" />
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              <span className="font-bold text-white">Support:</span> Included in
              all plans (priority support in higher tiers)
            </p>
          </div>
          {isIndia && (
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                <Check size={12} className="text-green-500" />
              </div>
              <p className="text-sm text-white/90 leading-relaxed">
                <span className="font-bold text-white">GST:</span> 18% GST will
                be applicable on all transactions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function Pricing() {
  const [region, setRegion] = useState<"india" | "outside-india">("india");
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["subscriptionPlans", region],
    queryFn: () => apis.owner.getSubscriptionPlans(region),
  });

  useEffect(() => {
    if (response) {
    }
  }, [response]);

  const plans: Plan[] =
    response?.data?.map((plan: any) => ({
      name: plan.plan_name,
      tagline: plan.description,
      price: `${plan.currency === "INR" ? "₹" : plan.currency === "USD" ? "$" : plan.currency}${plan.total_plan_price.toLocaleString()}`,
      setup: "", // Setup fee not provided in API
      features: plan.features,
      featured: plan.is_popular,
      cta: plan.plan_name.toLowerCase().includes("enterprise")
        ? "Talk to sales"
        : "Start free trial",
      isActive: plan.is_active,
    })) || [];

  const handlePlanAction = (p: Plan) => {
    if (p.cta === "Talk to sales") {
      const contactElement = document.getElementById("contact");
      if (contactElement) {
        contactElement.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = "#contact";
      }
      return;
    }

    if (!user) {
      setShowLoginModal(true);
    } else {
      // Redirect to a checkout or dashboard page with the selected plan ID
      const selectedPlanId =
        response?.data?.find((pl: any) => pl.plan_name === p.name)?._id || "";
      window.location.href = `/register-business?planId=${selectedPlanId}`;
    }
  };

  return (
    <section id="pricing" className="relative bg-surface/40 py-24 md:py-32">
      <div className="blob right-0 top-0 h-72 w-72 bg-primary/30" />
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Pricing
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
            Simple pricing, built to scale
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pick a plan tailored to your region. Switch or cancel any time.
          </p>
        </div>

        <div className="mx-auto mt-8 inline-flex w-full justify-center">
          <div className="glass inline-flex rounded-full p-1">
            {[
              { id: "india", label: "🇮🇳 India" },
              { id: "outside-india", label: "🌍 International" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRegion(r.id as "india" | "outside-india")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${region === r.id
                  ? "bg-[image:var(--gradient-primary)] text-primary-foreground"
                  : "text-muted-foreground"
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {isLoading ? (
            <div className="col-span-3 flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            plans.map((p, i) => {
              const price = p.price;
              const setup = p.setup;
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative rounded-3xl p-7 transition-all ${p.isActive
                    ? "border-2 border-green-500/50 bg-gradient-to-b from-green-500/10 to-green-500/5 shadow-[0_0_30px_rgba(34,197,94,0.2)] text-white backdrop-blur-md"
                    : p.featured
                      ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-glow"
                      : "glass"
                    }`}
                >
                  {p.featured && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-background px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/40">
                      <Sparkles size={12} /> Most popular
                    </span>
                  )}
                  <div className="flex w-full items-center justify-between">
                    <h3 className="font-display text-2xl font-bold">{p.name}</h3>
                    {p.isActive && (
                      <span className="rounded-full bg-green-500/20 border border-green-500/30 px-2.5 py-0.5 text-[9px] font-bold text-green-400 flex items-center gap-1.5 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-450 bg-green-400 animate-pulse" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1 text-sm ${p.isActive ? "text-white/80" : p.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    {p.tagline}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-display text-5xl font-bold">
                      {price}
                    </span>
                    {price !== "Custom" && (
                      <span
                        className={`text-sm ${p.isActive ? "text-white/80" : p.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                      >
                        /month
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1 text-xs ${p.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                  >
                    {setup}
                  </p>

                  <button
                    onClick={() => handlePlanAction(p)}
                    disabled={p.isActive}
                    className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all ${p.isActive
                      ? "bg-green-500/10 text-green-400 border border-green-500/25 cursor-not-allowed w-full"
                      : p.featured
                        ? "bg-background text-foreground hover:bg-background/90"
                        : "bg-[image:var(--gradient-primary)] text-primary-foreground btn-glow"
                      }`}
                  >
                    {p.isActive ? "Current Active Plan" : p.cta}
                  </button>

                  <ul className="mt-7 space-y-3 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          size={16}
                          className={`mt-0.5 shrink-0 ${p.isActive ? "text-green-450 text-green-400" : p.featured ? "text-primary-foreground" : "text-primary"}`}
                        />
                        <span
                          className={
                            p.featured ? "text-primary-foreground/95" : ""
                          }
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })
          )}
        </div>

        <AddonCards region={region === "india" ? "india" : "outside"} />
      </div>

      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass relative w-full max-w-md overflow-hidden rounded-3xl p-8 shadow-2xl"
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X size={20} />
              </button>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <LogIn size={32} />
                </div>
                <h3 className="font-display text-2xl font-bold">
                  Login Required
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Please sign in to your account to start your free trial and
                  access all features.
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  <a
                    href="/signup?mode=signin"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90"
                  >
                    Go to Login
                  </a>
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-all hover:bg-surface/80"
                  >
                    Cancel
                  </button>
                </div>

                <p className="mt-6 text-xs text-muted-foreground">
                  Don't have an account?{" "}
                  <a
                    href="/signup?mode=signup"
                    className="font-semibold text-primary hover:underline"
                  >
                    Create one for free
                  </a>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

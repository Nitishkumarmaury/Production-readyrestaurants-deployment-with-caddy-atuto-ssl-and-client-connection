import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { ExternalLink, Globe2, ShieldCheck, ShoppingCart, Truck } from "lucide-react";

export const Route = createFileRoute("/user-links")({
  head: () => ({
    meta: [
      { title: "Your Links — Ready Deliveries" },
      { name: "description", content: "Access your admin, vendor, and customer dashboards from one place." },
    ],
  }),
  component: UserLinksPage,
});

function UserLinksPage() {
  const { user } = useAuth();
  const urls = user?.url;

  const links = [
    {
      id: "admin",
      label: "Admin Dashboard",
      url: urls?.adminUrl,
      icon: ShieldCheck,
      description: "Manage your entire business, settings, and team from the powerful admin panel.",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
    },
    {
      id: "vendor",
      label: "Vendor Panel",
      url: urls?.vendorUrl,
      icon: Truck,
      description: "Manage orders, inventory, and kitchen operations with ease.",
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      border: "border-orange-400/20",
    },
    {
      id: "customer",
      label: "Customer Panel",
      url: urls?.customerUrl,
      icon: ShoppingCart,
      description: "View your branded ordering experience as your customers see it.",
      color: "text-green-400",
      bg: "bg-green-400/10",
      border: "border-green-400/20",
    },
  ].filter((l) => l.url);

  return (
    <main className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] animate-[float-blob_12s_ease-in-out_infinite]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[100px] animate-[float-blob_15s_ease-in-out_infinite_reverse]" />
      </div>

      <Navbar />

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-32 sm:pt-40">
        <div className="mb-12 flex flex-col gap-5 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Your <span className="text-primary">Business Links</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
          >
            Quick access to your dashboards and platforms. Click any card to open it in a new tab.
          </motion.p>
          </div>
          <Link
            to="/connect-domain"
            className="btn-glow inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-black transition hover:opacity-95"
          >
            <Globe2 size={17} />
            Connect domain
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {links.length > 0 ? (
            links.map((link, index) => (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className={`group relative overflow-hidden rounded-3xl border ${link.border} bg-[#1a1a1b]/40 p-8 transition-all hover:bg-[#1a1a1b]/60 hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98]`}
              >
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${link.bg} ${link.color} shadow-lg transition-transform group-hover:scale-110`}>
                  <link.icon size={28} />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-white group-hover:text-primary transition-colors">
                  {link.label}
                </h3>
                <p className="mb-8 text-[0.95rem] leading-relaxed text-muted-foreground/80">
                  {link.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  Open Dashboard <ExternalLink size={16} />
                </div>

                {/* Decorative element */}
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />
              </motion.a>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-xl text-muted-foreground">No links available yet. Complete your business registration to see them here.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

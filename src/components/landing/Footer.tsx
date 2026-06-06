import { AtSign, Camera, Video } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { IMAGES } from "../../lib/images";

export function Footer() {
  const cols = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Showcase", href: "#showcase" },
        { name: "Pricing", href: "#pricing" },
        // { name: "Case Studies", href: "#case-studies" },
        { name: "FAQ", href: "#faq" }
      ]
    },
    // {
    //   title: "Solutions",
    //   links: [
    //     { name: "Restaurants", href: "#solutions" },
    //     { name: "Cloud Kitchens", href: "#solutions" },
    //     { name: "Grocery", href: "#solutions" },
    //     { name: "Multi-store Chains", href: "#solutions" },
    //     { name: "Delivery", href: "#solutions" }
    //   ]
    // },
  ];
  return (
    <footer className="relative border-t border-border/50 bg-surface/30 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <img src={IMAGES.logo} alt="Logo" className="h-10 w-auto object-contain" />
            </div>
            <p className="mt-6 max-w-sm text-base text-muted-foreground leading-relaxed">
              The all-in-one operating system for modern restaurants, cloud kitchens, and multi-store food brands.
            </p>
            <div className="mt-10 flex gap-4">
              {[
                { Icon: AtSign, href: "https://x.com/readydeliveries" },
                { Icon: Camera, href: "https://www.instagram.com/ready.deliveries/" },
                { Icon: Video, href: "https://www.youtube.com/@ReadyDeliveries" }
              ].map(({ Icon, href }, i) => (
                <a 
                  key={i} 
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass grid h-10 w-10 place-items-center rounded-xl transition-all hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 shadow-sm"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
          
          {cols.map((c) => (
            <div key={c.title} className="lg:col-start-4">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-[0.15em]">{c.title}</h4>
              <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l.name}>
                    <a href={l.href} className="transition-colors hover:text-primary">
                      {l.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-24 flex flex-wrap items-center justify-between gap-6 border-t border-border/50 pt-10 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Ready Deliveries Technologies. All rights reserved.</p>
          <div className="flex gap-8">
            <Link to="/terms-and-conditions" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

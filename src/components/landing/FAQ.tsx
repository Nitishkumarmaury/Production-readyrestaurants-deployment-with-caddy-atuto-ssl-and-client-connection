import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

const faqs = [
  { q: "What is Ready Deliveries?", a: "Ready Deliveries is a SaaS-based platform that helps businesses digitize their delivery operations with their own app, website, and POS." },
  { q: "Will I get a refund if I decide to terminate?", a: "No. We have a no-refund policy." },
  { q: "Do I need to be technical to use Ready Deliveries?", a: "No. You don’t need to have any coding knowledge to use Ready Deliveries. We have designed the platform for businesses, not for developers." },
  { q: "Do you also provide a domain?", a: "No, we do not provide a domain." },
  { q: "Can I upgrade or downgrade my plan?", a: "Yes, you can upgrade or downgrade, except for one-time payment plans." },
  { q: "Can I change the app name or logo after it is published?", a: "After the app is published, you can change the logo up to two times. Any logo changes after that will be paid." },
  { q: "How to upload the brand logo?", a: "To upload your brand logo, go to the dashboard, click on Panel Color, then navigate to Branding Assets, and upload your logo." },
  { q: "Is there any need to sign a contract?", a: "No, our platform is SaaS-based, which means you don’t need to sign any contract. Just sign up and get started." },
  { q: "Is my data safe?", a: "Yes. No one can access your data except you." },
  { q: "How many times can I change my logo?", a: "You can change the brand logo 2 times for free. After that, changes are chargeable. Keep in mind that the first time you upload the logo will be counted as one. So, upload the final copy.  However, note that this policy does not apply to the website. Logo changes on the website are free." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">FAQ</span>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Frequently asked questions</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
          {faqs.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass overflow-hidden rounded-2xl"
            >
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between p-5 text-left">
                <span className="font-display font-semibold">{f.q}</span>
                <Plus size={18} className={`shrink-0 text-primary transition-transform ${open === i ? "rotate-45" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

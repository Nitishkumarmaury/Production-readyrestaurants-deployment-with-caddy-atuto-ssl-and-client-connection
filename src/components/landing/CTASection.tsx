import { useState, useRef, useEffect } from "react";
import { countries } from "@/lib/constants";
import { ChevronDown, Calendar, CreditCard, Mail, Phone, Building2, User } from "lucide-react";

export function CTASection() {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [mobile, setMobile] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [returnUrl, setReturnUrl] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUrl(window.location.href);
    setReturnUrl(window.location.origin + "/thank-you");
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <section id="contact" className="relative py-24 md:py-32">
      <div className="blob left-1/2 top-1/2 h-96 w-[40rem] -translate-x-1/2 -translate-y-1/2 bg-primary/30" />
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="glass overflow-hidden rounded-[2rem] p-8 md:p-14">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Get started</span>
              <h2 className="mt-3 font-display text-4xl font-bold leading-tight md:text-5xl">
                Are You Ready To Grow Your <span className="text-gradient">Delivery Business?</span>
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Start your 3-day free trial of Ready Deliveries and take the first step toward scaling your operations.
              </p>

              <div className="mt-8 space-y-3">
                <a href="#" className="glass flex items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-white/5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-primary"><Calendar size={18} /></div>
                  <div className="flex-1">
                    <p className="font-semibold">Book a 30-min demo</p>
                    <p className="text-xs text-muted-foreground">Pick a slot via Calendly</p>
                  </div>
                </a>
                <a href="#" className="glass flex items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-white/5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.85_0.22_155)]/20 text-[oklch(0.85_0.22_155)]"><CreditCard size={18} /></div>
                  <div className="flex-1">
                    <p className="font-semibold">Pay & onboard now</p>
                    <p className="text-xs text-muted-foreground">Secure checkout via Razorpay & Stripe</p>
                  </div>
                </a>
              </div>
            </div>

            <form
              id="webform4761993000034010004"
              acceptCharset="UTF-8"
              action="https://crm.zoho.com/crm/WebToLeadForm"
              method="POST"
              name="WebToLeads4761993000034010004"
              className="glass space-y-4 rounded-2xl p-6"
            >
              {/* Zoho CRM Hidden Fields */}
              <input type="hidden" name="zc_gad" id="zc_gad" value="" />
              <input type="hidden" name="xmIwtLD" value="ee449400906fc7d0384e0df841747cd66cc1641c5b2be52d35b3972e8a0f92f3d86f75d62c25f38bcaaacbf731b88ecc" />
              <input type="hidden" name="actionType" value="TGVhZHM=" />
              <input type="hidden" name="xnQsjsdp" value="88e825815a43cb29443841160089f6cc3a01c98b1a4e06e60de9fa92e4772379" />
              <input type="hidden" name="returnURL" value={returnUrl} />
              <input type="hidden" id="LEADCF3" name="LEADCF3" value={currentUrl} />
              <input type="hidden" id="LEADCF4" name="LEADCF4" value="Asia/Kolkata" />
              <input type="hidden" id="LEADCF5" name="LEADCF5" value="India" />
              <input type="hidden" name="Phone" value={`${selectedCountry.code}${mobile}`} />
              <input type="hidden" name="Mobile" value="" />

              <h3 className="font-display text-xl font-bold">Talk to our team</h3>

              <Field
                icon={<User size={16} />}
                label="Full Name"
                placeholder="John Doe"
                name="Last Name"
                required
              />

              <Field
                icon={<Building2 size={16} />}
                label="Business name"
                placeholder="Spice Route Bistro"
                name="Company"
              />

              <Field
                icon={<Mail size={16} />}
                label="Work email"
                type="email"
                placeholder="you@restaurant.com"
                name="Email"
                required
              />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex h-[42px] w-full items-center justify-between gap-1 rounded-xl border border-border bg-background/40 px-2.5 text-sm outline-none transition focus:border-primary"
                    >
                      <span className="text-base">{selectedCountry.flag}</span>
                      <span className="text-[10px] text-muted-foreground">{selectedCountry.code}</span>
                      <ChevronDown size={12} className={`shrink-0 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                    </button>
                    {showDropdown && (
                      <ul className="absolute top-[calc(100%+4px)] left-0 z-50 m-0 max-h-[200px] w-[180px] list-none overflow-y-auto rounded-xl border border-border bg-[#1a1a1b] p-1 shadow-2xl">
                        {countries.map((c) => (
                          <li key={c.name}>
                            <button
                              type="button"
                              onClick={() => { setSelectedCountry(c); setShowDropdown(false); }}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition hover:bg-white/5"
                            >
                              <span>{c.flag}</span>
                              <span className="truncate">{c.name}</span>
                              <span className="ml-auto text-[10px] text-muted-foreground">{c.code}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex h-[42px] items-center gap-2 rounded-xl border border-border bg-background/40 px-3.5 focus-within:border-primary">
                    <Phone size={14} className="text-muted-foreground" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, (selectedCountry as any).length))}
                      maxLength={(selectedCountry as any).length}
                      placeholder={`Enter ${selectedCountry.length} digits`}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">What do you need?</label>
                <textarea
                  rows={3}
                  name="Description"
                  placeholder="Tell us about your business..."
                  className="mt-1.5 w-full rounded-xl border border-border bg-background/40 px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                id="formsubmit"
                className="btn-glow w-full rounded-xl bg-[image:var(--gradient-primary)] py-3 text-sm font-semibold text-primary-foreground"
              >
                Request demo
              </button>

              <p className="text-center text-[10px] text-muted-foreground">By submitting you agree to our Terms & Privacy Policy.</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ icon, label, ...rest }: { icon: React.ReactNode; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3.5 py-2.5 focus-within:border-primary">
        <span className="text-muted-foreground">{icon}</span>
        <input {...rest} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
      </div>
    </div>
  );
}

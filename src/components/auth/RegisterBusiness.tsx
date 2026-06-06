import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import {
  X,
  ArrowRight,
  ChevronDown,
  Check,
  X as XIcon,
  Loader2,
} from "lucide-react";
import { businessCategories } from "@/lib/constants";
import {
  registrationSteps as steps,
  planCountries,
  plansData,
} from "@/lib/registration-data";
import apis from "../../api";
import { GoogleAddressInput } from "../common/GoogleAddressInput";
import { useAuth } from "../../context/AuthContext";

/* ── Sub-components ── */

const StepIndicator = ({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) => (
  <div className="mx-auto flex w-full max-w-4xl items-center gap-0">
    {steps.map((step, i) => (
      <div key={step.number} className="flex flex-1 items-center">
        <button
          onClick={() => step.number < currentStep && onStepClick(step.number)}
          className={`flex w-full items-center gap-1.5 rounded-xl px-2 py-2 text-left transition sm:gap-3 sm:px-4 sm:py-3 ${step.number === currentStep
            ? "bg-primary text-black shadow-glow"
            : step.number < currentStep
              ? "cursor-pointer bg-green-500/10 text-green-400"
              : "bg-white/5 text-muted-foreground"
            }`}
          disabled={step.number > currentStep}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold sm:h-8 sm:w-8 sm:text-sm ${step.number === currentStep
              ? "bg-black/20 text-black"
              : step.number < currentStep
                ? "bg-green-500 text-white"
                : "bg-white/10 text-muted-foreground"
              }`}
          >
            {step.number < currentStep ? (
              <Check size={12} />
            ) : (
              `${step.number}.`
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold leading-tight sm:text-sm">
              {step.title}
            </p>
            <p
              className={`mt-0.5 hidden truncate text-[0.65rem] sm:block ${step.number === currentStep ? "text-black/60" : "text-muted-foreground/60"}`}
            >
              {step.subtitle}
            </p>
          </div>
        </button>
        {i < steps.length - 1 && (
          <div
            className={`mx-1 hidden h-px w-6 shrink-0 min-[400px]:block sm:mx-2 sm:w-8 ${i < currentStep - 1 ? "bg-green-500/30" : "bg-white/5"}`}
          />
        )}
      </div>
    ))}
  </div>
);

const PlanCard = ({
  plan,
  isSelected,
  onClick,
  isPopular,
}: {
  plan: any;
  isSelected: boolean;
  onClick: () => void;
  isPopular?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex flex-col rounded-2xl border-2 p-6 text-left transition ${
      plan?.is_active
        ? isSelected
          ? "border-green-500 bg-green-500/10 shadow-[0_0_25px_rgba(34,197,94,0.25)]"
          : "border-green-500/30 bg-green-500/5 hover:border-green-500/50"
        : isSelected
          ? "border-primary bg-white/5 shadow-card"
          : "border-white/5 bg-[#1a1a1b]/40 hover:border-white/10"
    }`}
  >
    {isPopular && (
      <div className="absolute -top-2.5 left-6 rounded-full bg-[#00D261] px-3 py-0.5 text-[10px] font-bold text-white shadow-lg">
        POPULAR
      </div>
    )}
    <div className="flex w-full items-center justify-between">
      <h3 className="text-base font-bold text-white">{plan?.name}</h3>
      {plan?.is_active && (
        <span className="rounded-full bg-green-500/20 border border-green-500/30 px-2.5 py-0.5 text-[9px] font-bold text-green-400 flex items-center gap-1.5 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          ACTIVE PLAN
        </span>
      )}
    </div>
    <div className="mt-2 flex items-baseline gap-1">
      <span className="text-3xl font-bold text-white">{plan?.price}</span>
      <span className="text-sm text-muted-foreground">{plan?.period}</span>
    </div>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
      {plan?.description}
    </p>
    <ul className="mt-5 flex flex-col gap-2">
      {plan?.features.map((f: string) => (
        <li
          key={f}
          className="flex items-start gap-2 text-[0.8rem] leading-snug text-white/80"
        >
          <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
          {f}
        </li>
      ))}
    </ul>
    {isSelected && (
      <div className={`absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full ${plan?.is_active ? "bg-green-500 text-white" : "bg-primary text-black"}`}>
        <Check size={14} />
      </div>
    )}
  </button>
);

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

const PREDEFINED_EXTENSIONS = [
  ".com",
  ".in",
  ".co.in",
  ".co",
  ".net",
  ".org",
  ".io",
  ".ai",
  ".app",
  ".store",
  ".online",
];

export function RegisterBusiness() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  /* Step 1 state */
  const [businessName, setBusinessName] = useState("");
  const [subdomainSlug, setSubdomainSlug] = useState("");
  const [domainExtension, setDomainExtension] = useState(".com");
  const [isCustomExtension, setIsCustomExtension] = useState(false);
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  /* Step 2 state */
  const [planRegion, setPlanRegion] = useState<"india" | "outside">("india");
  const [selectedPlanCountry, setSelectedPlanCountry] = useState(
    planCountries[0],
  );
  const [selectedPlan, setSelectedPlan] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [fetchingPlans, setFetchingPlans] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get("planId");
    if (planId) {
      setSelectedPlan(planId);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const u = user as any;
      if (u.companyName) setBusinessName(u.companyName);
      // Only pre-fill domain if user has a real custom domain (not auto-generated like "hf-XXXXXXX")
      const isAutoGenerated = u.subdomain_slug && /^hf-/i.test(u.subdomain_slug);
      if (u.subdomain_slug && !isAutoGenerated) {
        setSubdomainSlug(u.subdomain_slug);
      }
      if (u.original_domain && !isAutoGenerated) {
        const cleanDomain = u.original_domain.replace(/^https?:\/\//, "");
        const dotIndex = cleanDomain.indexOf(".");
        if (dotIndex !== -1) {
          const ext = cleanDomain.substring(dotIndex);
          setDomainExtension(ext);
          if (!PREDEFINED_EXTENSIONS.includes(ext)) {
            setIsCustomExtension(true);
          }
        }
      }
      if (u.location) setAddress(u.location);
      if (u.gst_no) setGstin(u.gst_no);
      if (u.modules_available && u.modules_available.length > 0) {
        let cat = u.modules_available[0];
        // Normalize back from API format (e.g. "CLOTHING" -> "Cloth")
        if (cat === "CLOTHING") {
          cat = "Cloth";
        } else {
          // Convert to Title Case: "FOOD" -> "Food"
          cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
        }
        // Only set if it's one of our known categories
        if (businessCategories.includes(cat)) {
          setSelectedCategory(cat);
        }
      }

      // If they have business info, skip to step 2
      if (u.companyName) {
        setCurrentStep(2);
      }
    }
  }, [user]);

  const fetchPlans = async (region: string) => {
    setFetchingPlans(true);
    try {
      const loc = region === "india" ? "india" : "outside-india";
      const res = await apis.owner.getSubscriptionPlans(loc);
      if (res.success && res.data) {
        setPlans(res.data);
        // If a planId was passed in URL, keep it selected. Otherwise select the first one.
        const urlParams = new URLSearchParams(window.location.search);
        const urlPlanId = urlParams.get("planId");
        if (!urlPlanId && res.data.length > 0) {
          setSelectedPlan(res.data[0]._id);
        } else if (urlPlanId) {
          setSelectedPlan(urlPlanId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    } finally {
      setFetchingPlans(false);
    }
  };

  useEffect(() => {
    fetchPlans(planRegion);
  }, [planRegion]);

  const isStep1Valid =
    businessName.trim().length > 0 &&
    address.trim().length > 0 &&
    selectedCategory.length > 0 &&
    (subdomainSlug.trim().length === 0 ||
      (domainExtension.startsWith(".") && domainExtension.trim().length >= 2));
  const isStep2Valid =
    selectedPlan.length > 0 && !!selectedPlanCountry;
  const canContinue = currentStep === 1 ? isStep1Valid : isStep2Valid;

  const handleContinue = async () => {
    if (currentStep === 1) {
      setLoading(true);
      setError("");
      try {
        const response = await apis.owner.addBusiness({
          companyName: businessName,
          subdomain_slug: subdomainSlug.trim() || "",
          original_domain: subdomainSlug.trim()
            ? `https://${subdomainSlug.trim()}${domainExtension}`
            : "",
          location: address,
          gst_no: gstin,
          modules_available: [
            selectedCategory.toUpperCase().replace("CLOTH", "CLOTHING"),
          ],
        });
        const ownerData =
          (response as any)?.data?.owner || (response as any)?.data || (response as any)?.owner;
        if (ownerData) {
          setUser(ownerData);
          const adminUrl = (ownerData as any)?.url?.adminUrl;
          if (adminUrl) {
            window.open(adminUrl, "_blank");
          }
        }
        setShowSuccessModal(true);
      } catch (err: any) {
        setError(
          err?.message ||
          "Failed to save business information. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      setError("");
      try {
        const response: any = await apis.owner.makePayment({
          planId: selectedPlan,
        });
        if (response?.data?.invoice_url) {
          window.open(response.data.invoice_url, "_blank");
        }
        navigate({ to: "/user-links" });
      } catch (err: any) {
        setError(err?.message || "Payment failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () =>
    currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate({ to: "/" });

  const currentSelectedPlanData = plans.find((p) => p._id === selectedPlan);

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[5%] -top-[5%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] animate-[float-blob_12s_ease-in-out_infinite]" />
        <div className="absolute -bottom-[5%] -right-[5%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[100px] animate-[float-blob_15s_ease-in-out_infinite_reverse]" />
      </div>

      <header className="relative z-10 flex flex-col gap-4 border-b border-white/5 bg-background/50 px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/" })}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-foreground/80 transition hover:bg-white/10 sm:h-10 sm:w-10"
          >
            <X size={18} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white sm:text-lg md:text-xl">
              Register new business
            </h1>
            <p className="text-[0.65rem] text-muted-foreground sm:text-xs md:text-sm">
              Enter basic details, pick a plan and continue
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 text-xs sm:flex md:text-sm text-muted-foreground">
          Need help?{" "}
          <a
            href="/#contact"
            className="font-semibold text-primary hover:underline"
          >
            Schedule Demo
          </a>{" "}
          or{" "}
          <a
            href="/#contact"
            className="font-semibold text-primary hover:underline"
          >
            Contact Us
          </a>
        </div>
      </header>

      <div className="relative z-10 border-b border-white/5 bg-background/30 px-4 py-4 backdrop-blur-sm sm:px-6 md:px-10 md:py-5">
        <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />
      </div>

      <div className="relative z-10 flex-1 px-4 py-8 sm:px-6 md:px-10 md:py-10 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
              >
                <XIcon size={16} /> {error}
              </motion.div>
            )}

            {currentStep === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="grid gap-8 md:grid-cols-2"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/90">
                    What's your business (registered or legal) name?
                  </label>
                  <input
                    type="text"
                    placeholder="Enter here..."
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="h-[50px] rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10"
                  />
                  <p className="text-xs text-muted-foreground/60">
                    Eg: Growcify India Private Limited
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/90">
                    Enter your domain (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1.5 border-r border-white/10 pr-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        https://
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="my-business"
                      value={subdomainSlug}
                      onChange={(e) =>
                        setSubdomainSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, ""),
                        )
                      }
                      className="h-[50px] w-full rounded-lg border border-white/10 bg-white/5 pl-[68px] pr-[95px] text-sm text-white outline-none transition focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10"
                    />
                    {isCustomExtension ? (
                      <div className="absolute right-3 flex items-center border-l border-white/10 pl-3 gap-1">
                        <input
                          type="text"
                          placeholder=".com"
                          value={domainExtension}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val && !val.startsWith(".")) {
                              val = "." + val;
                            }
                            setDomainExtension(val.toLowerCase().replace(/[^a-z0-9.-]/g, ""));
                          }}
                          className="bg-transparent text-sm font-medium text-white outline-none w-[65px] placeholder-muted-foreground/50"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomExtension(false);
                            setDomainExtension(".com");
                          }}
                          className="text-muted-foreground hover:text-white transition p-0.5"
                        >
                          <X size={14} className="shrink-0" />
                        </button>
                      </div>
                    ) : (
                      <div className="absolute right-3 flex items-center border-l border-white/10 pl-3">
                        <select
                          value={domainExtension}
                          onChange={(e) => {
                            if (e.target.value === "custom") {
                              setIsCustomExtension(true);
                              setDomainExtension(".");
                            } else {
                              setDomainExtension(e.target.value);
                            }
                          }}
                          className="bg-transparent text-sm font-medium text-muted-foreground outline-none cursor-pointer pr-5 appearance-none focus:text-white"
                        >
                          <option value=".com" className="bg-[#1a1a1b] text-white">.com</option>
                          <option value=".in" className="bg-[#1a1a1b] text-white">.in</option>
                          <option value=".co.in" className="bg-[#1a1a1b] text-white">.co.in</option>
                          <option value=".co" className="bg-[#1a1a1b] text-white">.co</option>
                          <option value=".net" className="bg-[#1a1a1b] text-white">.net</option>
                          <option value=".org" className="bg-[#1a1a1b] text-white">.org</option>
                          <option value=".io" className="bg-[#1a1a1b] text-white">.io</option>
                          <option value=".ai" className="bg-[#1a1a1b] text-white">.ai</option>
                          <option value=".app" className="bg-[#1a1a1b] text-white">.app</option>
                          <option value=".store" className="bg-[#1a1a1b] text-white">.store</option>
                          <option value=".online" className="bg-[#1a1a1b] text-white">.online</option>
                          <option value="custom" className="bg-[#1a1a1b] text-primary font-semibold">Other...</option>
                        </select>
                        <ChevronDown size={12} className="pointer-events-none -ml-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/60">
                    This will be your unique store URL
                  </p>
                </div>

                <div className="relative flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/90">
                    What's your business category?
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowCategoryDropdown(!showCategoryDropdown)
                    }
                    className="flex min-h-[50px] w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-left text-sm outline-none transition focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10"
                  >
                    <span
                      className={
                        selectedCategory
                          ? "text-white"
                          : "text-muted-foreground"
                      }
                    >
                      {selectedCategory || "Select a category"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-muted-foreground transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <motion.ul
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-[calc(100%+2px)] left-0 right-0 z-50 m-0 max-h-[220px] list-none overflow-y-auto rounded-lg border border-white/10 bg-[#1a1a1b] p-1 shadow-2xl"
                      >
                        {businessCategories.map((cat) => (
                          <li key={cat}>
                            <button
                              type="button"
                              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition hover:bg-white/5 ${selectedCategory === cat ? "bg-primary/10 font-medium text-primary" : "text-white/70"}`}
                              onClick={() => {
                                setSelectedCategory(cat);
                                setShowCategoryDropdown(false);
                              }}
                            >
                              {cat}{" "}
                              {selectedCategory === cat && (
                                <Check size={14} className="ml-auto" />
                              )}
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                <GoogleAddressInput
                  label="What's your business address?"
                  placeholder="Enter here..."
                  value={address}
                  onChange={setAddress}
                />

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white/90">
                    What's your GSTIN / Tax Code?
                  </label>
                  <input
                    type="text"
                    placeholder="Enter here..."
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="h-[50px] rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10"
                  />
                  <p className="text-xs text-muted-foreground/60">
                    GSTIN is mandatory for eCommerce businesses in India
                  </p>
                </div>

                <div className="mt-4 md:col-span-2 rounded-[2rem] border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 flex items-start gap-4 backdrop-blur-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 border border-primary/30 shadow-[0_0_15px_rgba(255,116,0,0.2)]">
                    <Check size={16} className="text-primary" />
                  </div>
                  <p className="text-[13px] leading-relaxed text-white/70">
                    <span className="font-bold text-primary">Domain Information:</span> Kindly allow 2–3 business days for domain generation. The domain purchase will be managed from your end, and the temporary credentials will be shared via email upon completion.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Plan Info Summary */}
                {currentSelectedPlanData && (
                  <div className="mb-8 rounded-2xl bg-primary/10 p-5 border border-primary/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Selected Plan
                      </p>
                      <h4 className="text-lg font-bold text-white mt-1">
                        {currentSelectedPlanData.plan_name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {planRegion === "india" ? "₹" : "$"}
                        {currentSelectedPlanData.basic_subscription_amount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        /{currentSelectedPlanData.billing_cycle || "month"}
                      </p>
                    </div>
                  </div>
                )}



                <div className="mb-8 flex justify-center">
                  <div className="inline-flex w-full max-w-[360px] items-center gap-1 rounded-full bg-white/5 p-1 backdrop-blur-sm sm:w-auto">
                    {planCountries.map((c) => (
                      <button
                        key={c.region}
                        type="button"
                        onClick={() => {
                          setPlanRegion(c.region as any);
                          setSelectedPlanCountry(c);
                        }}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold transition-all sm:text-sm ${planRegion === c.region
                          ? "bg-[#00D261] text-white shadow-lg shadow-green-500/20"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                          }`}
                      >
                        <span className="text-base">{c.flag}</span>
                        <span className="whitespace-nowrap">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  {fetchingPlans ? (
                    <div className="col-span-full flex h-[200px] items-center justify-center">
                      <Loader2
                        size={32}
                        className="animate-spin text-primary"
                      />
                    </div>
                  ) : plans.length > 0 ? (
                    plans.map((plan) => (
                      <PlanCard
                        key={plan._id}
                        plan={{
                          id: plan._id,
                          name: plan.plan_name,
                          price: `${planRegion === "india" ? "₹" : "$"}${plan.basic_subscription_amount?.toLocaleString()}`,
                          period: `/${plan.billing_cycle || "month"}`,
                          description: plan.description,
                          features: plan.features || [],
                          is_active: plan.is_active,
                        }}
                        isSelected={selectedPlan === plan._id}
                        isPopular={plan.is_popular}
                        onClick={() => setSelectedPlan(plan._id)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center text-muted-foreground">
                      No plans available for this region.
                    </div>
                  )}
                </div>

                <AddonCards region={planRegion} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="relative z-10 flex flex-col gap-3 border-t border-white/5 bg-background/50 px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:px-6 md:px-10">
        <button
          type="button"
          onClick={handleCancel}
          className="w-full px-4 py-2 text-sm font-semibold text-red-400 transition hover:text-red-300 sm:w-auto sm:px-6 sm:py-2.5"
        >
          {currentStep > 1 ? "Previous" : "Cancel"}
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || loading}
          className="btn-glow flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-7 py-2.5 text-sm font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              {currentStep === 2 ? "Finish" : "Continue"}{" "}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </footer>

      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowSuccessModal(false);
                setCurrentStep(2);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#141415]/90 p-8 text-center shadow-glow backdrop-blur-xl"
            >
              {/* Decorative top gradient */}
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-orange-500 to-yellow-500" />
              
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-[0_0_30px_rgba(255,116,0,0.15)] ring-1 ring-primary/20 animate-pulse">
                <Check size={40} className="stroke-[2.5]" />
              </div>

              <h3 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Registration Successful! 🎉
              </h3>
              
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground/90">
                Thank you for registering <strong className="text-white">{businessName}</strong>. 
                Your store configuration is complete!
              </p>

              <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-green-500/10 p-1 text-green-400">
                    <Check size={14} />
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Your temporary login credentials, admin link, and portal setup instructions have been sent to your registered email address.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setCurrentStep(2);
                  }}
                  className="btn-glow flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-black transition hover:opacity-95"
                >
                  Proceed to Subscription Plans <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

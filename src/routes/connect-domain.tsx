import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Globe2,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import apis from "@/api";
import type { DnsRecord, VerifyDomainData } from "@/api/types";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/connect-domain")({
  head: () => ({
    meta: [
      { title: "Connect Domain - Ready Deliveries" },
      {
        name: "description",
        content: "Connect your own client domain to your Ready Deliveries subdomain.",
      },
    ],
  }),
  component: ConnectDomainPage,
});

const VERIFY_SECONDS = 90;
const VERIFY_INTERVAL_SECONDS = 10;

function cleanDomain(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function getHost(url?: string) {
  if (!url) return "";
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  }
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white transition hover:bg-white/10"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function RecordRow({ record }: { record: DnsRecord }) {
  return (
    <div className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-4 md:grid-cols-[90px_1fr_1fr_auto] md:items-center">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Type
        </p>
        <p className="mt-1 font-bold text-primary">{record.type}</p>
      </div>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Name / Host
        </p>
        <p className="mt-1 break-all text-sm text-white">{record.name}</p>
      </div>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Value / Target
        </p>
        <p className="mt-1 break-all text-sm text-white">{record.value}</p>
      </div>
      <CopyButton value={record.value} />
    </div>
  );
}

function ConnectDomainPage() {
  const { user, setUser } = useAuth();
  const [domain, setDomain] = useState("");
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "pending" | "active" | "failed">("idle");
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const tenantHost = useMemo(() => {
    const u = user as any;
    return (
      getHost(u?.url?.customerUrl) ||
      getHost(u?.url?.adminUrl) ||
      (u?.subdomain_slug ? `${u.subdomain_slug}.readydeliveries.com` : "")
    );
  }, [user]);

  useEffect(() => {
    const savedDomain = (user as any)?.custom_domain || (user as any)?.original_domain || "";
    if (savedDomain && !domain) {
      setDomain(cleanDomain(savedDomain));
    }
  }, [domain, user]);

  const currentDomain = cleanDomain(domain || (user as any)?.custom_domain || "");
  const isValidDomain = /^[a-z0-9.-]+\.[a-z]{2,}$/.test(currentDomain);

  const fallbackRecords = (domainName: string, token?: string, target?: string): DnsRecord[] => [
    {
      type: "TXT",
      name: `_readydeliveries.${domainName}`,
      value: token || `readydeliveries-domain-verification=${(user as any)?._id || "owner-id"}`,
    },
    {
      type: "CNAME",
      name: domainName,
      value: target || tenantHost || "your-subdomain.readydeliveries.com",
    },
  ];

  const handleConnect = async () => {
    if (!isValidDomain) {
      setError("Enter a valid domain, for example orders.yourdomain.com or yourdomain.com.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await apis.owner.connectDomain({ domain: currentDomain });
      const data = res.data || {};
      const apiRecords = (data.records ||
        [data.txtRecord, data.cnameRecord].filter(Boolean)) as DnsRecord[];
      const nextRecords = apiRecords.length
        ? apiRecords
        : fallbackRecords(currentDomain, data.verification_token, data.target);

      setRecords(nextRecords);
      setStatus(data.ssl_status === "active" || data.status === "verified" ? "active" : "pending");
      setMessage("DNS records generated. Add both records in your DNS provider, then verify.");
    } catch (err: any) {
      setError(err?.message || "Could not generate DNS records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyVerificationResult = (data: VerifyDomainData) => {
    const active = data.verified || data.sslActive || data.ssl_status === "active" || data.status === "verified";
    if (data.records?.length) setRecords(data.records);
    if (active) {
      setStatus("active");
      setMessage(data.message || "Domain verified. SSL is active.");
      setUser({ ...(user as any), custom_domain: currentDomain, domain_status: "verified", ssl_status: "active" });
      return true;
    }
    setStatus(data.status === "failed" || data.ssl_status === "failed" ? "failed" : "pending");
    setMessage(data.message || "DNS or SSL is not ready yet. You can try again in a few minutes.");
    return false;
  };

  const handleVerify = async () => {
    if (!isValidDomain) {
      setError("Enter a valid domain before verification.");
      return;
    }

    setVerifying(true);
    setError("");
    setMessage("Checking DNS and SSL. This can take a little time after DNS changes.");
    setStatus("pending");

    const waitWithTimer = async (seconds: number) => {
      for (let left = seconds; left > 0; left -= 1) {
        setTimer(left);
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
    };

    const attempts = Math.ceil(VERIFY_SECONDS / VERIFY_INTERVAL_SECONDS);
    for (let i = 0; i < attempts; i += 1) {
      setTimer(VERIFY_SECONDS - i * VERIFY_INTERVAL_SECONDS);
      try {
        const res = await apis.owner.verifyDomain({ domain: currentDomain });
        if (applyVerificationResult(res.data)) {
          setTimer(0);
          setVerifying(false);
          return;
        }
      } catch (err: any) {
        setStatus("failed");
        setMessage(err?.message || "Verification failed. Please confirm the DNS records and try again.");
      }

      if (i < attempts - 1) {
        await waitWithTimer(VERIFY_INTERVAL_SECONDS);
      }
    }

    setTimer(0);
    setVerifying(false);
    setStatus((prev) => (prev === "active" ? "active" : "failed"));
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[560px] w-[560px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[460px] w-[460px] rounded-full bg-green-500/10 blur-[110px]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-background/70 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            to="/user-links"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to links
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white">
            <span className={`h-2 w-2 rounded-full ${status === "active" ? "bg-green-400" : status === "failed" ? "bg-red-400" : "bg-yellow-400"}`} />
            {status === "active" ? "Active SSL" : status === "failed" ? "Not verified" : "Pending verification"}
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 max-w-3xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Globe2 size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Connect your client domain
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
              Point your own domain to your Ready Deliveries subdomain. Add the TXT record for ownership
              verification and the CNAME record for traffic routing. SSL may take a few minutes after DNS updates.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border border-white/10 bg-[#141415]/80 p-5 shadow-card sm:p-7">
              <label className="text-sm font-semibold text-white">Your domain</label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={domain}
                  onChange={(e) => setDomain(cleanDomain(e.target.value))}
                  placeholder="orders.yourdomain.com"
                  className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={loading || !isValidDomain}
                  className="btn-glow inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Globe2 size={16} />}
                  Get DNS records
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Recommended: use a subdomain like `orders.yourdomain.com` and create a CNAME for it.
              </p>

              {tenantHost && (
                <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current Ready Deliveries subdomain
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-white">{tenantHost}</p>
                </div>
              )}

              {records.length > 0 && (
                <div className="mt-7">
                  <h2 className="text-lg font-bold text-white">DNS records to add</h2>
                  <div className="mt-4 space-y-3">
                    {records.map((record) => (
                      <RecordRow key={`${record.type}-${record.name}`} record={record} />
                    ))}
                  </div>
                </div>
              )}

              {message && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                  {message}
                </div>
              )}

              {error && (
                <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                  <XCircle size={16} />
                  {error}
                </div>
              )}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying || records.length === 0}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-5 text-sm font-bold text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifying ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {verifying ? `Verifying${timer ? ` (${timer}s)` : ""}` : "Verify DNS and SSL"}
                </button>
                <p className="text-xs text-muted-foreground">
                  Keep this page open while we check. You can click verify again later.
                </p>
              </div>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-[#141415]/80 p-5 shadow-card sm:p-6">
              <h2 className="text-lg font-bold text-white">Verification status</h2>
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                {status === "active" ? (
                  <CheckCircle2 className="text-green-400" size={28} />
                ) : status === "failed" ? (
                  <XCircle className="text-red-400" size={28} />
                ) : (
                  <Loader2 className={verifying ? "animate-spin text-yellow-400" : "text-yellow-400"} size={28} />
                )}
                <div>
                  <p className="font-bold text-white">
                    {status === "active" ? "Active SSL" : status === "failed" ? "Not verified" : "Waiting for DNS"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {status === "active"
                      ? "Your custom domain is connected."
                      : status === "failed"
                        ? "Check TXT and CNAME, then try again."
                        : "DNS propagation can take a few minutes."}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                <p>
                  On your DNS provider, add both records exactly as shown. For EC2 + Caddy, Caddy will
                  request and renew SSL automatically after the domain points to the server.
                </p>
                <p>
                  If using Cloudflare, keep the record DNS-only during first verification if SSL issuance is slow.
                </p>
              </div>
            </aside>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

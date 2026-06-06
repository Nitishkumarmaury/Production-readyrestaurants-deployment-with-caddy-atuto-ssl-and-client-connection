import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { setCookie, destroyCookie, parseCookies } from "nookies";
import { Link, useNavigate, getRouteApi } from "@tanstack/react-router";
import { ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { countries } from "@/lib/constants";
import apis from "../../api";
import { useAuth } from "../../context/AuthContext";

const routeApi = getRouteApi("/signup");


const OTP_LENGTH = 4;
const OTP_TIMER = 30;

export function SignUp() {
  const { setUser } = useAuth();
  const { mode } = routeApi.useSearch();
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(mode === "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [showDropdown, setShowDropdown] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") {
      return parseCookies()["cookies_user_access_token_temp"] || "";
    }
    return "";
  });
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-trigger OTP screen if token exists
  useEffect(() => {
    if (token && !otpSent) {
      setOtpSent(true);
      setTimer(OTP_TIMER);
    }
  }, [token, otpSent]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const canSendOtp = isSignIn
    ? mobile.trim().length === (selectedCountry as any).length
    : name.trim() &&
    email.trim() &&
    mobile.trim().length === (selectedCountry as any).length;
  const otpValue = otp.join("");
  const canVerify = otpValue.length === OTP_LENGTH;

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!paste) return;
    const next = [...otp];
    paste.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setOtp(next);
    otpRefs.current[Math.min(paste.length, OTP_LENGTH - 1)]?.focus();
  };

  const sendOtp = useCallback(async () => {
    if (!canSendOtp) return;
    setError("");
    setLoading(true);
    try {
      const response = isSignIn
        ? await apis.owner.login({
          country_code: selectedCountry.code,
          phone_number: mobile,
        })
        : await apis.owner.register({
          full_name: name,
          email: email,
          country_code: selectedCountry.code,
          phone_number: mobile,
        });
      const regToken = response.data.token;
      setToken(regToken);
      setCookie(null, "cookies_user_access_token_temp", regToken, {
        maxAge: 30 * 60, // 30 minutes
        path: "/",
      });
      setOtpSent(true);
      setTimer(OTP_TIMER);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [canSendOtp, name, email, selectedCountry.code, mobile]);

  const resendOtp = useCallback(async () => {
    if (timer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setError("");
    setLoading(true);
    try {
      const response = isSignIn
        ? await apis.owner.login({
          country_code: selectedCountry.code,
          phone_number: mobile,
        })
        : await apis.owner.register({
          full_name: name,
          email: email,
          country_code: selectedCountry.code,
          phone_number: mobile,
        });
      const regToken = response.data.token;
      setToken(regToken);
      setCookie(null, "cookies_user_access_token_temp", regToken, {
        maxAge: 30 * 60,
        path: "/",
      });
      setTimer(OTP_TIMER);
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  }, [timer, name, email, selectedCountry.code, mobile]);

  const verify = useCallback(async () => {
    if (!canVerify) return;
    setError("");
    setLoading(true);
    try {
      const response = await apis.owner.verifyOtp({
        token: token,
        otp: otpValue,
      });

      if (response.data.access_token) {
        setCookie(
          null,
          "cookies_user_access_token",
          response.data.access_token,
          {
            maxAge: 30 * 24 * 60 * 60,
            path: "/",
          },
        );

        if (response.data.owner) {
          setUser(response.data.owner);
        }

        // Clear temp registration token
        destroyCookie(null, "cookies_user_access_token_temp", { path: "/" });
      }

      navigate({ to: "/register-business" });
    } catch (err: any) {
      setError(err?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [canVerify, token, otpValue, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 bg-background">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -left-[5%] -top-[5%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] animate-[float-blob_10s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -bottom-[5%] -right-[5%] h-[400px] w-[400px] rounded-full bg-purple-500/15 blur-[100px] animate-[float-blob_12s_ease-in-out_infinite_reverse]" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass relative z-10 w-full max-w-[440px] rounded-3xl px-8 py-10 shadow-card"
      >
        {/* Header */}
        <div className="mb-7 text-center">
          <Link to="/" className="mb-3 inline-flex">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-[#ff7400] to-[#ff9a44] text-lg font-bold text-white shadow-[0_4px_14px_rgba(255,116,0,0.35)]">
              R
            </div>
          </Link>
          <h1 className="font-display text-[1.75rem] font-bold tracking-tight text-white">
            {isSignIn ? "Sign in" : "Sign up"}
          </h1>
          <p className="mt-1 text-[0.9rem] text-muted-foreground">
            {isSignIn
              ? "Welcome back! Enter details to continue"
              : "Get started in 2 minutes"}
          </p>
        </div>

        {
          <div className="flex flex-col gap-[1.1rem]">
            {!isSignIn && (
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="signup-name"
                  className="text-[0.775rem] font-medium text-muted-foreground"
                >
                  Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))
                  }
                  className="h-[46px] rounded-xl border border-white/10 bg-white/5 px-3.5 text-[0.925rem] text-white outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={otpSent}
                  autoComplete="name"
                />
              </div>
            )}

            {!isSignIn && (
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="signup-email"
                  className="text-[0.775rem] font-medium text-muted-foreground"
                >
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[46px] rounded-xl border border-white/10 bg-white/5 px-3.5 text-[0.925rem] text-white outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={otpSent}
                  autoComplete="email"
                />
              </div>
            )}

            {/* Country + Mobile */}
            <div className="grid grid-cols-[110px_1fr] gap-3 max-[420px]:grid-cols-1">
              {/* Country */}
              <div className="relative flex flex-col gap-1" ref={dropdownRef}>
                <label className="text-[0.775rem] font-medium text-muted-foreground">
                  Country
                </label>
                <button
                  type="button"
                  className="flex h-[46px] w-full items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 text-[0.85rem] text-white transition hover:border-white/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => !otpSent && setShowDropdown(!showDropdown)}
                  disabled={otpSent}
                >
                  <span className="text-lg leading-none">
                    {selectedCountry.flag}
                  </span>
                  <span className="whitespace-nowrap text-[0.825rem] text-muted-foreground">
                    ({selectedCountry.code})
                  </span>
                  <ChevronDown
                    size={14}
                    className={`ml-auto shrink-0 text-[#9ca3af] transition-transform ${showDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.ul
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 m-0 min-w-[240px] max-h-[260px] list-none overflow-y-auto rounded-[14px] border border-white/10 bg-[#1a1a1b] p-1.5 shadow-2xl [scrollbar-width:thin]"
                    >
                      {countries.map((c) => (
                        <li key={c.name}>
                          <button
                            type="button"
                            className={`flex w-full items-center gap-2 rounded-[10px] border-none bg-transparent px-2.5 py-2 text-[0.85rem] text-white/80 transition hover:bg-white/5 ${c.name === selectedCountry.name ? "bg-primary/10 font-medium text-primary" : ""}`}
                            onClick={() => {
                              setSelectedCountry(c);
                              setShowDropdown(false);
                            }}
                          >
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                            <span className="ml-auto text-[0.8rem] text-[#9ca3af]">
                              {c.code}
                            </span>
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="signup-mobile"
                  className="text-[0.775rem] font-medium text-muted-foreground"
                >
                  Mobile Number
                </label>
                <input
                  id="signup-mobile"
                  type="tel"
                  placeholder={`Enter ${selectedCountry.length}-digit mobile number`}
                  value={mobile}
                  onChange={(e) =>
                    setMobile(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, (selectedCountry as any).length),
                    )
                  }
                  className="h-[46px] rounded-xl border border-white/10 bg-white/5 px-3.5 text-[0.925rem] text-white outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                  maxLength={(selectedCountry as any).length}
                  disabled={otpSent}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* OTP Section */}
            <AnimatePresence>
              {otpSent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-2 overflow-hidden"
                >
                  <label className="text-[0.775rem] font-medium text-muted-foreground">
                    Enter OTP
                  </label>
                  <div
                    className="flex justify-center gap-2"
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="h-[52px] w-[46px] rounded-xl border border-white/10 bg-white/5 text-center text-xl font-semibold text-white caret-primary outline-none transition focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <button
                      type="button"
                      className="border-none bg-transparent p-0 text-[0.8rem] font-medium text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
                      disabled={timer > 0 || loading}
                      onClick={resendOtp}
                    >
                      Resend OTP
                    </button>
                    <span className="text-[0.85rem] font-semibold tabular-nums text-red-400">
                      {formatTime(timer)}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 rounded-[10px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.825rem] text-red-600"
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Button */}
            <button
              type="button"
              className="btn-glow flex h-12 items-center justify-center rounded-xl border-none bg-primary text-[0.9rem] font-bold tracking-wider text-black transition disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading || (otpSent ? !canVerify : !canSendOtp)}
              onClick={otpSent ? verify : sendOtp}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : otpSent ? (
                "VERIFY & CONTINUE"
              ) : (
                "SEND OTP"
              )}
            </button>

            <p className="text-center text-[0.85rem] text-muted-foreground">
              {isSignIn ? "Don't have an account? " : "Have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsSignIn(!isSignIn);
                  setOtpSent(false);
                  setOtp(Array(OTP_LENGTH).fill(""));
                  setError("");
                  setToken("");
                  destroyCookie(null, "cookies_user_access_token_temp", { path: "/" });
                }}
                className="font-semibold text-primary border-none bg-transparent p-0 transition hover:text-primary/80 hover:underline cursor-pointer"
              >
                {isSignIn ? "Sign up" : "Sign in"}
              </button>
            </p>

            <p className="text-center text-[0.725rem] leading-relaxed text-muted-foreground/60">
              Protected by reCAPTCHA. By continuing, you agree to{" "}
              <a
                href="/privacy"
                className="text-muted-foreground underline underline-offset-2 transition hover:text-primary"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="/terms"
                className="text-muted-foreground underline underline-offset-2 transition hover:text-primary"
              >
                Terms & Conditions
              </a>
              .
            </p>
          </div>
        }
      </motion.div>
    </div>
  );
}

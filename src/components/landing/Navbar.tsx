import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, AlertTriangle, LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../../context/AuthContext";

import { IMAGES } from "../../lib/images";

const links = [
  { label: "Features", href: "#features" },
  { label: "Showcase", href: "#showcase" },
  { label: "Pricing", href: "#pricing" },
  // { label: "Case Studies", href: "#case-studies" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? "py-2" : "py-4"
        }`}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className={`glass flex items-center justify-between rounded-2xl px-5 py-3 transition-all ${scrolled ? "shadow-card" : ""}`}>
          <Link to="/" className="flex items-center gap-2">
            <img src={IMAGES.logo} alt="Logo" className="h-9 w-auto object-contain" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                to="/"
                hash={l.href.replace("#", "")}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            {user?.url && (user.url.adminUrl || user.url.customerUrl || user.url.vendorUrl) && (
              <Link
                to="/user-links"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-primary font-semibold" }}
              >
                Links
              </Link>
            )}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {!user ? (
              <>
                <Link to="/signup" search={{ mode: "signin" }} className="text-sm text-muted-foreground transition-colors hover:text-foreground">Sign in</Link>
                <Link to="/signup" search={{ mode: "signup" }} className="btn-glow rounded-xl bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground">
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="text-sm font-medium text-red-400 transition-colors hover:text-red-300"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 md:hidden">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mt-2 rounded-2xl p-4 md:hidden"
          >
            <div className="flex flex-col gap-3">
              {links.map((l) => (
                <Link
                  key={l.href}
                  to="/"
                  hash={l.href.replace("#", "")}
                  onClick={() => setOpen(false)}
                  className="text-sm text-muted-foreground"
                >
                  {l.label}
                </Link>
              ))}
              {user?.url && (user.url.adminUrl || user.url.customerUrl || user.url.vendorUrl) && (
                <Link
                  to="/user-links"
                  onClick={() => setOpen(false)}
                  className="text-sm text-muted-foreground"
                  activeProps={{ className: "text-primary font-semibold" }}
                >
                  Links
                </Link>
              )}
              {user ? (
                <button
                  onClick={() => { setShowLogoutConfirm(true); setOpen(false); }}
                  className="flex w-full items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-sm font-semibold text-red-400"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/signup"
                    search={{ mode: "signin" }}
                    onClick={() => setOpen(false)}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    search={{ mode: "signup" }}
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-xl bg-[image:var(--gradient-primary)] px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[360px] overflow-hidden rounded-3xl border border-white/10 bg-[#1a1a1b]/80 p-6 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-white">Sign Out?</h3>
                <p className="mb-8 text-[0.85rem] leading-relaxed text-muted-foreground/80">
                  Are you sure you want to log out? You'll need to sign in again to access your dashboard.
                </p>
                <div className="grid w-full grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex h-11 items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"
                  >
                    Stay
                  </button>
                  <button
                    onClick={logout}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-600 active:scale-95"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

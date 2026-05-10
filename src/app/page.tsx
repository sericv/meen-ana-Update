"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";

// Arc radius in px — buttons radiate from the center at this distance
const R = 138;

// Three satellite buttons placed in a lower-hemisphere arc (angles in degrees,
// standard math: 0°=right, 90°=down, 180°=left).
// 130° → lower-left  |  90° → straight down  |  50° → lower-right
const ARC = [
  { label: "إنشاء غرفة", href: "/play/new", angle: 128 },
  { label: "دخول برمز", href: "/join", angle: 52 },
] as const;

// Half-sizes of the satellite button (w-[104px] h-[44px])
const HALF_W = 52;
const HALF_H = 22;

function arcStyle(angleDeg: number): React.CSSProperties {
  const rad = (angleDeg * Math.PI) / 180;
  const x = Math.round(Math.cos(rad) * R);
  const y = Math.round(Math.sin(rad) * R);
  return {
    position: "absolute",
    // Offset from the 50%/50% anchor so the button is centered on its arc point
    top:  `calc(50% + ${y - HALF_H}px)`,
    left: `calc(50% + ${x - HALF_W}px)`,
    boxShadow: "0 8px 0 #e8a558, 0 14px 28px rgba(232,165,88,0.38)",
  };
}

export default function HomePage() {
  const router = useRouter();
  const { user, loading, signInGoogle, signInGuest, logout, setDisplayName } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameErr, setNameErr] = useState<string | null>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  const displayName = user
    ? (user.displayName || (user.isAnonymous ? "زائر" : (user.email?.split("@")[0] ?? "لاعب")))
    : null;

  /** Navigate, redirecting to login first if not signed in. */
  function navTo(href: string) {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(href)}`);
    } else {
      router.push(href);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-x-hidden select-none">

      {/* ── Animated background blobs ─────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ y: [0, -28, 0], x: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#ffd0a0]/65 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 22, 0], x: [0, -12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -left-28 top-[25%] h-96 w-96 rounded-full bg-[#ffbe7a]/45 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute bottom-20 right-[8%] h-56 w-56 rounded-full bg-[#ffc47e]/45 blur-3xl"
        />
        {/* Subtle dot pattern overlay */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.045]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#c07020" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className="relative z-20 flex w-full max-w-sm items-center justify-between px-5 pb-2 pt-8">
        {/* Tiny brand mark */}
        <span className="text-2xl font-black text-[#8d3f15]/25 tracking-tight select-none">مأ</span>

        {/* Profile / login pill */}
        <div className="relative" ref={menuRef}>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-2xl border-2 border-[#f4be84] bg-white/90 px-4 py-2 text-sm font-bold text-[#8a3f16] shadow-sm backdrop-blur-sm"
          >
            {loading ? "..." : (displayName ?? "سجّل دخولك")}
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{ duration: 0.16 }}
                className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[172px] rounded-2xl border border-[#f4c48d] bg-white p-2 shadow-[0_16px_40px_rgba(200,120,40,0.24)]"
              >
                {displayName ? (
                  <>
                    <p className="truncate px-3 py-1 text-xs text-[#c48652]">{displayName}</p>
                    <hr className="my-1 border-[#f4d4b0]" />
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(displayName);
                        setNameErr(null);
                        setMenuOpen(false);
                        setNameModalOpen(true);
                      }}
                      className="w-full rounded-xl px-3 py-2 text-right text-sm font-semibold text-[#8a3f16] transition-colors hover:bg-[#fff4e4]"
                    >
                      تغيير الاسم الظاهر
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); router.push("/login"); }}
                      className="mt-1 w-full rounded-xl px-3 py-2 text-right text-sm font-semibold text-[#8a3f16] transition-colors hover:bg-[#fff4e4]"
                    >
                      تبديل الحساب
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        void logout().then(() => router.replace("/"));
                      }}
                      className="mt-1 w-full rounded-xl px-3 py-2 text-right text-sm font-semibold text-[#b45309] transition-colors hover:bg-[#fff0dd]"
                    >
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); void signInGoogle(); }}
                      className="w-full rounded-xl px-3 py-2 text-right text-sm font-semibold text-[#8a3f16] transition-colors hover:bg-[#fff4e4]"
                    >
                      دخول بـ Google
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); void signInGuest(); }}
                      className="mt-1 w-full rounded-xl px-3 py-2 text-right text-sm font-semibold text-[#8a3f16] transition-colors hover:bg-[#fff4e4]"
                    >
                      دخول كزائر
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Hero title ────────────────────────────────────────────── */}
      <section className="relative z-10 mt-5 px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52 }}
          className="font-black leading-none tracking-tight text-[#8d3f15] [font-size:clamp(3rem,14vw,6.5rem)]"
        >
          مين أنا؟
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.14 }}
          className="mt-3 text-xl font-semibold text-[#b87241]"
        >
          اسأل · خمّن · انتصر
        </motion.p>
      </section>

      {/* ── Arc stage ─────────────────────────────────────────────── */}
      {/* Container is 320 wide × 360 tall.
          Center = (160, 180).  Arc radius = 138px.
          Bottom-most button (90°) top-edge = 180 + 138 - 22 = 296 → bottom = 340 < 360 ✓
          Right-most button (50°) right-edge ≈ 160 + 89 + 52 = 301 < 320 ✓          */}
      <section className="relative z-10 mt-8 flex flex-col items-center">
        <div className="relative" style={{ width: 320, height: 360 }}>

          {/* Slowly-spinning dashed ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              width: 264, height: 264,
              top: "50%", left: "50%",
              marginTop: -132, marginLeft: -132,
              borderRadius: "50%",
              border: "3px dashed rgba(244,184,110,0.50)",
            }}
          />

          {/* Soft glow behind center button */}
          <div style={{
            position: "absolute",
            width: 180, height: 180,
            top: "50%", left: "50%",
            marginTop: -90, marginLeft: -90,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,185,90,0.55) 0%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }} />

          {/* ── Main CTA — "العب عشوائي" ── */}
          <motion.button
            type="button"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.14, type: "spring", stiffness: 200, damping: 16 }}
            whileHover={{ y: -7, scale: 1.07 }}
            whileTap={{ y: 4, scale: 0.95 }}
            onClick={() => navTo("/play/random")}
            className="absolute flex flex-col items-center justify-center rounded-full font-black text-white"
            style={{
              width: 126, height: 126,
              top: "50%", left: "50%",
              marginTop: -63, marginLeft: -63,
              background: "linear-gradient(175deg, #ffbe66 0%, #f47118 100%)",
              boxShadow: "0 14px 0 #c85f0a, 0 22px 52px rgba(240,120,30,0.60)",
            }}
          >
            <span className="text-[22px] leading-tight">العب</span>
            <span className="text-[15px] leading-tight opacity-85">عشوائي</span>
          </motion.button>

          {/* ── Arc satellite buttons ── */}
          {ARC.map(({ label, href, angle }, i) => (
            <motion.button
              key={label}
              type="button"
              initial={{ opacity: 0, scale: 0.55 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.30 + i * 0.10, type: "spring", stiffness: 175, damping: 16 }}
              whileHover={{ scale: 1.13, y: -6 }}
              whileTap={{ scale: 0.92, y: 3 }}
              onClick={() => navTo(href)}
              className="w-[104px] rounded-[20px] border-2 border-[#f4be84] bg-white text-center text-sm font-black text-[#8a3f16]"
              style={{
                ...arcStyle(angle),
                paddingTop: 10,
                paddingBottom: 10,
              }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-10 mt-auto pb-8 pt-6 text-center text-sm text-[#c48652]">
        لعبة تخمين اجتماعية · متعدد اللاعبين
      </footer>

      <AnimatePresence>
        {nameModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#6a3f1b]/45 px-4 backdrop-blur-sm"
            onClick={() => !nameBusy && setNameModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <Panel className="text-center">
                <h2 className="text-xl font-black text-[#8a3f16]">الاسم الظاهر</h2>
                <p className="mt-2 text-sm text-[#a16231]">يظهر للخصوم في الدردشة والغرف.</p>
                <div className="mt-4 text-right">
                  <Input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="اسمك"
                    maxLength={40}
                    className="min-h-[48px] text-center"
                    disabled={nameBusy}
                  />
                  {nameErr ? <p className="mt-2 text-sm text-[#c74d3d]">{nameErr}</p> : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="min-h-[48px] flex-1"
                    disabled={nameBusy || !nameDraft.trim()}
                    onClick={() => {
                      setNameBusy(true);
                      setNameErr(null);
                      void setDisplayName(nameDraft)
                        .then(() => setNameModalOpen(false))
                        .catch((e) => setNameErr(e instanceof Error ? e.message : "تعذر الحفظ"))
                        .finally(() => setNameBusy(false));
                    }}
                  >
                    حفظ
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-[48px] flex-1"
                    disabled={nameBusy}
                    onClick={() => setNameModalOpen(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_OUT, WHILE_TAP } from "@/lib/motion";

type GameplayGuessDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guess: string) => Promise<{ correct: boolean }>;
  remainingAttempts: number;
  categoryId: string | null;
};

// Vector icons
function TargetIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

// Sparkle particle component for success explosion
function SparkleParticle({ angle, distance }: { angle: number; distance: number }) {
  const rad = (angle * Math.PI) / 180;
  const targetX = Math.cos(rad) * distance;
  const targetY = Math.sin(rad) * distance;
  return (
    <motion.span
      initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
      animate={{
        x: targetX,
        y: targetY,
        scale: [0, 1.2, 0.8, 0],
        opacity: [1, 1, 0.6, 0],
        rotate: [0, 90, 180, 270],
      }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="absolute text-amber-400 text-base pointer-events-none select-none z-20"
      style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
    >
      ✦
    </motion.span>
  );
}

// Sparkle float decals in dialog background
function FloatDecal({ className, delay }: { className: string; delay: number }) {
  return (
    <motion.span
      animate={{
        y: [0, -6, 0],
        opacity: [0.15, 0.35, 0.15],
        scale: [0.9, 1.1, 0.9],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={`absolute text-slate-300 pointer-events-none select-none text-xs ${className}`}
    >
      ✦
    </motion.span>
  );
}

export function GameplayGuessDialog({
  isOpen,
  onClose,
  onSubmit,
  remainingAttempts,
}: GameplayGuessDialogProps) {
  const [guess, setGuess] = useState("");
  const [busy, setBusy] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<"idle" | "success" | "wrong">("idle");
  const [showParticles, setShowParticles] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setGuess("");
      setValidationError(null);
      setFeedbackState("idle");
      setShowParticles(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (feedbackState !== "idle" || busy) return;
    if (e.key === "Enter" && !busy) {
      e.preventDefault();
      void handleConfirmSubmit();
    }
  };

  const handleConfirmSubmit = async () => {
    if (busy || feedbackState !== "idle") return;
    const trimmed = guess.trim();
    if (!trimmed) {
      setValidationError("يرجى كتابة التخمين أولاً");
      setFeedbackState("wrong");
      setTimeout(() => setFeedbackState("idle"), 1000);
      return;
    }

    setBusy(true);
    setValidationError(null);
    try {
      const res = await onSubmit(trimmed);
      if (res.correct) {
        setFeedbackState("success");
        setShowParticles(true);
        // Play correct animation, then exit
        setTimeout(() => {
          onClose();
        }, 1600);
      } else {
        setFeedbackState("wrong");
        setValidationError("تخمين خاطئ! تم استهلاك محاولة.");
        setTimeout(() => {
          setFeedbackState("idle");
        }, 3000);
      }
    } catch (err: any) {
      setValidationError(err?.message || "تعذر إرسال التخمين");
      setFeedbackState("wrong");
      setTimeout(() => setFeedbackState("idle"), 3000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" dir="rtl">
          
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={feedbackState === "idle" ? onClose : undefined}
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-[3px]"
          />

          {/* Floating dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              x: feedbackState === "wrong" ? [0, -10, 10, -10, 10, -5, 5, 0] : 0,
            }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 26,
              x: { duration: 0.4 },
            }}
            className="game-card-outer w-full max-w-[340px] shadow-2xl relative z-10"
          >
            <div className="game-card-inner p-6 bg-white border border-slate-100 rounded-[28px] flex flex-col gap-4 relative overflow-hidden">
              
              {/* Sparkle Float Decals */}
              <FloatDecal className="right-[8%] top-[10%]" delay={0.2} />
              <FloatDecal className="left-[10%] top-[35%]" delay={1.2} />
              <FloatDecal className="right-[15%] bottom-[18%]" delay={2.2} />

              {/* Sparkle burst explosion for success */}
              {showParticles && (
                <div className="absolute inset-0 pointer-events-none select-none overflow-visible">
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <SparkleParticle
                      key={idx}
                      angle={(360 / 12) * idx}
                      distance={70 + Math.random() * 30}
                    />
                  ))}
                </div>
              )}

              {/* Close button */}
              {feedbackState === "idle" && (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 left-4 grid h-7 w-7 place-items-center rounded-full bg-slate-50 border border-slate-200/40 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors active:scale-90"
                  style={{ cursor: "pointer" }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}

              {/* Header section */}
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shadow-inner">
                  <TargetIcon />
                </div>
                <h3 className="h-display text-base font-black text-slate-800 mt-3.5">
                  من أنا؟ خمن
                </h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1 max-w-[200px]">
                  اكتب الاسم الذي تعتقد أنه بطاقتك.
                </p>
              </div>

              {/* Attempts tokens section */}
              <div className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100/60 shadow-inner">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  المحاولات المتبقية
                </span>
                <div className="flex gap-2 mt-0.5">
                  {Array.from({ length: 3 }).map((_, idx) => {
                    const active = idx < remainingAttempts;
                    return (
                      <motion.div
                        key={idx}
                        animate={{
                          scale: active ? [1, 1.06, 1] : 0.8,
                          opacity: active ? 1 : 0.3,
                          y: active ? [0, -2, 0] : 0,
                        }}
                        transition={{
                          scale: active ? { duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 } : { duration: 0.3 },
                          y: active ? { duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 } : { duration: 0.3 }
                        }}
                        className={`relative w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                          active
                            ? "bg-gradient-to-br from-purple-100 to-purple-50 border-purple-200 text-[#7C3AED] shadow-sm shadow-purple-200/50"
                            : "bg-slate-50 border-slate-200/50 text-slate-300"
                        }`}
                      >
                        {active && (
                          <span className="absolute inset-0.5 rounded-full border border-purple-200/40 animate-pulse pointer-events-none" />
                        )}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l2.4 5.8 6.2.5-4.7 4 1.4 6.1L12 15.8 7.7 18.4l1.4-6.1-4.7-4 6.2-.5L12 2z" />
                        </svg>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Input field */}
              <div className="relative">
                <div className="game-card-outer w-full">
                  <div className={`game-card-inner bg-slate-50 border rounded-2xl px-4 py-3.5 transition-all duration-300 flex items-center gap-2 ${
                    validationError ? "border-rose-300 shadow-sm shadow-rose-50" : "border-slate-100 focus-within:border-purple-300 focus-within:bg-white focus-within:shadow-md focus-within:shadow-purple-100/50"
                  }`}>
                    
                    <input
                      ref={inputRef}
                      type="text"
                      value={guess}
                      onChange={(e) => {
                        setGuess(e.target.value);
                        setValidationError(null);
                      }}
                      onKeyDown={handleKeyDown}
                      disabled={busy || feedbackState !== "idle"}
                      placeholder="اكتب تخمينك..."
                      className="w-full border-0 bg-transparent text-center text-sm font-black outline-none text-slate-800 placeholder-slate-400 font-sans"
                    />

                  </div>
                </div>

                {/* Inline validation error details */}
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-right text-[10px] font-black text-rose-500 mt-1.5 mr-1"
                  >
                    {validationError}
                  </motion.div>
                )}
              </div>

              {/* Action Buttons deck */}
              <div className="flex gap-2.5 mt-2">
                {feedbackState === "idle" && (
                  <>
                    <motion.button
                      type="button"
                      disabled={busy}
                      onClick={onClose}
                      whileHover={{ scale: 1.01 }}
                      whileTap={WHILE_TAP}
                      className="flex-1 py-3 rounded-2xl text-xs font-black text-slate-700 bg-slate-50 border border-slate-200/50 shadow-sm transition-transform"
                      style={{ cursor: "pointer" }}
                    >
                      تراجع
                    </motion.button>

                    <motion.button
                      type="button"
                      disabled={busy || !guess.trim()}
                      onClick={handleConfirmSubmit}
                      whileHover={{ scale: 1.015 }}
                      whileTap={WHILE_TAP}
                      className="flex-1 py-3 rounded-2xl text-xs font-black text-white shadow-md shadow-purple-200/40 bg-gradient-to-r from-[#7C3AED] to-[#9F7AEA] border border-[#6D28D9] transition-all flex items-center justify-center gap-1.5"
                      style={{
                        opacity: busy || !guess.trim() ? 0.65 : 1,
                        cursor: busy || !guess.trim() ? "not-allowed" : "pointer",
                      }}
                    >
                      {busy ? (
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      ) : (
                        "تأكيد"
                      )}
                    </motion.button>
                  </>
                )}

                {/* Success feedback button morph */}
                {feedbackState === "success" && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full py-3 rounded-2xl text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>تخمين صحيح! فوز مستحق 🎉</span>
                  </motion.div>
                )}

                {/* Temporary failure feedback button morph */}
                {feedbackState === "wrong" && !validationError && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full py-3 rounded-2xl text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-shake">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    <span>تخمين خاطئ... حاول مجدداً</span>
                  </motion.div>
                )}
              </div>

            </div>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}

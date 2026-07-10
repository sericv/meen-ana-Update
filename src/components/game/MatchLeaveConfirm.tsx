"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  busy?: boolean;
  onStay: () => void;
  onLeave: () => void;
};

const SPRING = { type: "spring", stiffness: 420, damping: 28 } as const;

export function MatchLeaveConfirm({ open, busy = false, onStay, onLeave }: Props) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={onStay}
        >
          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={SPRING}
            className="w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="game-card-outer w-full">
              <div className="game-card-inner p-5 bg-white rounded-[22px] border border-slate-100 shadow-xl text-center flex flex-col gap-4 text-right">
                
                {/* Warning Icon Container */}
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>

                <div className="text-center flex flex-col gap-1 pr-1">
                  <h3 className="h-display text-sm font-black text-slate-800">هل أنت متأكد من المغادرة؟</h3>
                  <p className="text-[10px] text-slate-400 font-bold leading-tight">
                    مغادرة المباراة أثناء اللعب ستعتبر انسحاباً وهزيمة فورية وسيتم خصم نقاط الخبرة الخاصة بك.
                  </p>
                </div>

                {/* Divider */}
                <div className="h-[1px] bg-slate-100 my-1" />

                {/* Actions */}
                <div className="flex flex-col gap-2.5">
                  {/* البقاء — primary */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={onStay}
                    disabled={busy}
                    className="w-full py-3.5 rounded-2xl text-xs font-black text-white shadow-md active:scale-95 transition-transform flex items-center justify-center border border-purple-800"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
                      cursor: "pointer",
                    }}
                  >
                    مواصلة التحدي والبقاء
                  </motion.button>

                  {/* الانسحاب — danger */}
                  <motion.button
                    type="button"
                    disabled={busy}
                    whileTap={{ scale: 0.96 }}
                    onClick={onLeave}
                    className="w-full py-3 rounded-2xl text-xs font-black text-rose-700 bg-rose-50 border border-rose-100 shadow-sm active:scale-95 transition-transform flex items-center justify-center hover:bg-rose-100/50"
                    style={{
                      cursor: busy ? "not-allowed" : "pointer",
                    }}
                  >
                    {busy ? "جاري الانسحاب..." : "الانسحاب والهزيمة"}
                  </motion.button>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

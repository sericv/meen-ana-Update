"use client";

import { motion } from "framer-motion";
import { IconSend } from "@/components/game/play/icons";
import { GP } from "@/components/game/play/tokens";

type Props = {
  myTurn: boolean;
  phase: string;
  draft: string;
  busy: boolean;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onGuess: () => void;
  onComposerFocus: (el: HTMLInputElement) => void;
  onComposerBlur: (el: HTMLInputElement) => void;
  keyboardOverlapPx?: number;
};

/** شريط سفلي: إدخال | خمّن فقط — التلميحات من بطاقتي */
export function GameplayChatActionBar({
  myTurn,
  phase,
  draft,
  busy,
  onDraftChange,
  onSend,
  onGuess,
  onComposerFocus,
  onComposerBlur,
  keyboardOverlapPx = 0,
}: Props) {
  const canSend = myTurn && draft.trim().length > 0 && !busy;
  const placeholder = myTurn
    ? phase === "answer"
      ? "أجب بـ نعم أو لا…"
      : "اطرح سؤالًا بـ نعم/لا…"
    : "في انتظار الخصم…";

  return (
    <div
      className="mt-auto shrink-0 px-2 pb-0 pt-1"
      style={{
        paddingBottom: `calc(max(env(safe-area-inset-bottom, 0px), 6px) + ${keyboardOverlapPx}px)`,
      }}
    >
      <motion.div className="flex flex-row items-center gap-2" dir="ltr">
        <div
          className="flex min-w-0 flex-1 items-center rounded-full px-3.5 py-0.5"
          dir="rtl"
          style={{
            minHeight: 46,
            opacity: myTurn ? 1 : 0.6,
            background: "rgba(255,255,255,0.92)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.95), 0 4px 14px rgba(180,100,30,0.1)",
            transition: "opacity 0.25s",
          }}
        >
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={placeholder}
            disabled={!myTurn || busy}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSend) onSend();
            }}
            dir="rtl"
            inputMode="text"
            enterKeyHint="send"
            autoComplete="off"
            spellCheck={false}
            className="min-h-[38px] min-w-0 flex-1 border-0 bg-transparent py-2 font-semibold outline-none"
            style={{ fontSize: 16, color: GP.ink }}
            onFocus={(e) => onComposerFocus(e.currentTarget)}
            onBlur={(e) => onComposerBlur(e.currentTarget)}
          />
          <motion.button
            type="button"
            disabled={!canSend}
            whileTap={{ scale: 0.9 }}
            onClick={onSend}
            aria-label="إرسال"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 disabled:opacity-50"
            style={{
              background: canSend
                ? `linear-gradient(180deg, ${GP.gold} 0%, ${GP.goldDeep} 100%)`
                : "#E8D4BC",
              color: canSend ? GP.ink : GP.inkSoft,
            }}
          >
            <IconSend color="currentColor" />
          </motion.button>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={onGuess}
          className="shrink-0 rounded-[14px] border-0 px-4 py-2.5 text-sm font-bold text-white"
          style={{
            background: `linear-gradient(180deg, ${GP.orange} 0%, ${GP.orangeDeep} 100%)`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 14px -4px rgba(224,102,10,0.55)",
          }}
        >
          خمّن
        </motion.button>
      </motion.div>
    </div>
  );
}

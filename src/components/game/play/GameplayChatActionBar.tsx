"use client";

/**
 * GameplayChatActionBar
 *
 * Layout (LTR physical order, inside dir="rtl" parent):
 *   [ إرسال (send) ]  [ ──── input ──── ]  [ خمّن (guess) ]
 *
 * • Send button: LEFT physical side
 * • Guess button: RIGHT physical side
 * • Player messages align LEFT in the chat viewport
 * • Opponent messages align RIGHT in the chat viewport
 */

import { motion } from "framer-motion";
import { IconSend } from "@/components/game/play/icons";
import { GP } from "@/components/game/play/tokens";

type Props = {
  myTurn: boolean;
  phase: string;
  draft: string;
  busy: boolean;
  guessRemaining?: number;
  /**
   * When true, extra-question tool is active and the player still has their
   * second question to ask this turn (questionsThisTurn < questionQuota).
   */
  extraQuestionPending?: boolean;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onGuess: () => void;
  onComposerFocus: (el: HTMLInputElement) => void;
  onComposerBlur: (el: HTMLInputElement) => void;
  keyboardOverlapPx?: number;
};

/** شريط سفلي: إرسال (يسار) | إدخال | خمّن (يمين) */
export function GameplayChatActionBar({
  myTurn,
  phase,
  draft,
  busy,
  guessRemaining = 3,
  extraQuestionPending = false,
  onDraftChange,
  onSend,
  onGuess,
  onComposerFocus,
  onComposerBlur,
  keyboardOverlapPx = 0,
}: Props) {
  const canSend = myTurn && draft.trim().length > 0 && !busy;
  const canGuess = myTurn && phase === "question" && guessRemaining > 0 && !busy && !extraQuestionPending;
  const placeholder = myTurn
    ? phase === "answer"
      ? "أجب بـ نعم أو لا…"
      : extraQuestionPending
        ? "سؤالك الثاني — اطرحه الآن…"
        : "اطرح سؤالًا بـ نعم/لا…"
    : "في انتظار الخصم…";

  return (
    <div
      className="mt-auto shrink-0 px-2 pb-0 pt-1"
      style={{
        paddingBottom: `calc(max(env(safe-area-inset-bottom, 0px), 6px) + ${keyboardOverlapPx}px)`,
      }}
    >
      {/* Extra question indicator — appears above the input bar */}
      {extraQuestionPending && myTurn && phase === "question" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            marginBottom: 6,
            padding: "5px 14px",
            borderRadius: 20,
            background: "linear-gradient(135deg, oklch(0.62 0.18 148 / .15), oklch(0.52 0.16 144 / .12))",
            border: "1px solid oklch(0.62 0.16 148 / .45)",
            color: "oklch(0.36 0.14 148)",
            fontFamily: "var(--display)",
            fontWeight: 800,
            fontSize: 11.5,
            textAlign: "center",
            letterSpacing: "-0.01em",
          }}
        >
          سؤال إضافي — اطرح سؤالك الثاني
        </motion.div>
      )}
      {/*
       * dir="ltr" so physical left = first flex child = send button,
       * physical right = last flex child = guess button.
       * Input is RTL internally via dir="rtl" on the input itself.
       */}
      <div className="flex flex-row items-center gap-2" dir="ltr">

        {/* ── SEND (LEFT) ── */}
        <motion.button
          type="button"
          disabled={!canSend}
          whileTap={{ scale: canSend ? 0.88 : 1 }}
          onClick={onSend}
          aria-label="إرسال"
          className="flex shrink-0 items-center justify-center rounded-full border-0 disabled:opacity-50"
          style={{
            width: 46,
            height: 46,
            background: canSend
              ? `linear-gradient(180deg, ${GP.gold} 0%, ${GP.goldDeep} 100%)`
              : "#E8D4BC",
            color: canSend ? GP.ink : GP.inkSoft,
            boxShadow: canSend
              ? "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 12px -4px rgba(210,148,30,0.5)"
              : "none",
            transition: "background 0.18s, box-shadow 0.18s",
          }}
        >
          <IconSend color="currentColor" />
        </motion.button>

        {/* ── INPUT (CENTER) ── */}
        <div
          className="flex min-w-0 flex-1 items-center rounded-full px-3.5"
          dir="rtl"
          style={{
            minHeight: 46,
            opacity: myTurn ? 1 : 0.6,
            background: "rgba(255,255,255,0.92)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.95), 0 4px 14px rgba(180,100,30,0.08)",
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
        </div>

        {/* ── GUESS (RIGHT) ── */}
        <motion.button
          type="button"
          whileTap={{ scale: canGuess ? 0.94 : 1 }}
          onClick={onGuess}
          disabled={!canGuess}
          className="shrink-0 rounded-[14px] border-0 px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed"
          style={{
            background: canGuess
              ? `linear-gradient(180deg, ${GP.orange} 0%, ${GP.orangeDeep} 100%)`
              : "#C8B8A8",
            color: canGuess ? "white" : "#7A6A58",
            boxShadow: canGuess
              ? "inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 14px -4px rgba(224,102,10,0.55)"
              : "inset 0 1px 0 rgba(255,255,255,0.25)",
            opacity: canGuess ? 1 : 0.55,
            transition: "background 0.18s, opacity 0.18s, box-shadow 0.18s",
          }}
        >
          خمّن {guessRemaining > 0 ? `(${guessRemaining})` : ""}
        </motion.button>
      </div>
    </div>
  );
}

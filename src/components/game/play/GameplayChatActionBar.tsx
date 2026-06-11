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

import { memo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSend } from "@/components/game/play/icons";
import { GP } from "@/components/game/play/tokens";
import { EASE_OUT, SPRING_UI } from "@/lib/motion";

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
export const GameplayChatActionBar = memo(function GameplayChatActionBar({
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
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      <AnimatePresence>
        {extraQuestionPending && myTurn && phase === "question" && (
          <motion.div
            initial={{ opacity: 0, y: 6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 4, height: 0 }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
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
      </AnimatePresence>

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
          whileTap={canSend ? { scale: 0.88 } : {}}
          transition={SPRING_UI}
          onClick={onSend}
          aria-label="إرسال"
          className="flex shrink-0 items-center justify-center rounded-full border-0"
          style={{
            width: 46,
            height: 46,
            background: canSend
              ? `linear-gradient(160deg, ${GP.gold} 0%, ${GP.goldDeep} 100%)`
              : "#E8D4BC",
            color: canSend ? GP.ink : GP.inkSoft,
            opacity: canSend ? 1 : 0.5,
            boxShadow: canSend
              ? `inset 0 1.5px 0 rgba(255,255,255,0.55), 0 1px 1px rgba(0,0,0,0.06), 0 4px 12px -2px rgba(210,148,30,0.55), 0 0 0 1.5px ${GP.gold}22`
              : "none",
            transition: "background 0.22s cubic-bezier(0.23,1,0.32,1), box-shadow 0.22s cubic-bezier(0.23,1,0.32,1), opacity 0.22s",
            willChange: "transform",
          }}
        >
          {/* Glow ring for active state */}
          <AnimatePresence>
            {canSend && (
              <motion.span
                key="send-glow"
                aria-hidden
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.06, 1] }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${GP.gold}44 0%, transparent 70%)`,
                  filter: "blur(4px)",
                  pointerEvents: "none",
                }}
              />
            )}
          </AnimatePresence>
          <span style={{ position: "relative", zIndex: 1 }}>
            <IconSend color="currentColor" />
          </span>
        </motion.button>

        {/* ── INPUT (CENTER) ── */}
        <motion.div
          className="flex min-w-0 flex-1 items-center rounded-full px-3.5"
          dir="rtl"
          animate={{
            boxShadow: focused
              ? `inset 0 0 0 1.5px ${GP.gold}66, 0 0 0 3px ${GP.gold}18, 0 4px 14px rgba(180,100,30,0.10)`
              : "inset 0 0 0 1px rgba(255,255,255,0.95), 0 4px 14px rgba(180,100,30,0.07)",
          }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          style={{
            minHeight: 46,
            opacity: myTurn ? 1 : 0.6,
            background: "rgba(255,255,255,0.93)",
            transition: "opacity 0.25s",
          }}
        >
          <input
            ref={inputRef}
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
            onFocus={(e) => {
              setFocused(true);
              onComposerFocus(e.currentTarget);
            }}
            onBlur={(e) => {
              setFocused(false);
              onComposerBlur(e.currentTarget);
            }}
          />
        </motion.div>

        {/* ── GUESS (RIGHT) ── */}
        <motion.button
          type="button"
          whileTap={canGuess ? { scale: 0.92 } : {}}
          transition={SPRING_UI}
          onClick={onGuess}
          disabled={!canGuess}
          className="shrink-0 rounded-[14px] border-0 px-4 py-2.5 text-sm font-extrabold disabled:cursor-not-allowed"
          style={{
            position: "relative",
            overflow: "hidden",
            background: canGuess
              ? `linear-gradient(160deg, ${GP.orange} 0%, ${GP.orangeDeep} 100%)`
              : "#C8B8A8",
            color: canGuess ? "white" : "#7A6A58",
            opacity: canGuess ? 1 : 0.52,
            boxShadow: canGuess
              ? `inset 0 1.5px 0 rgba(255,255,255,0.45), inset 0 -1.5px 0 rgba(0,0,0,0.08), 0 1px 1px rgba(0,0,0,0.08), 0 6px 16px -4px rgba(224,102,10,0.6), 0 0 0 1.5px ${GP.orange}22`
              : "inset 0 1px 0 rgba(255,255,255,0.25)",
            transition: "background 0.22s cubic-bezier(0.23,1,0.32,1), box-shadow 0.22s cubic-bezier(0.23,1,0.32,1), opacity 0.22s",
            willChange: "transform",
          }}
        >
          {/* Inner gloss */}
          {canGuess && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "45%",
                borderRadius: "14px 14px 0 0",
                background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            />
          )}
          <span style={{ position: "relative", zIndex: 1 }}>
            خمّن {guessRemaining > 0 ? `(${guessRemaining})` : ""}
          </span>
        </motion.button>
      </div>
    </div>
  );
});

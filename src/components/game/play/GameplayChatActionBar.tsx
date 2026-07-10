"use client";

import { memo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSend } from "@/components/game/play/icons";
import { SPRING_UI } from "@/lib/motion";

type Props = {
  myTurn: boolean;
  phase: string;
  draft: string;
  busy: boolean;
  guessRemaining?: number;
  extraQuestionPending?: boolean;
  onDraftChange: (v: string) => void;
  onSend: (customText?: string) => void;
  onGuess: () => void;
  onComposerFocus: (el: HTMLInputElement) => void;
  onComposerBlur: (el: HTMLInputElement) => void;
  keyboardOverlapPx?: number;
};

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
  const [showCustomAnswerInput, setShowCustomAnswerInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset custom answer state on phase / turn changes
  useEffect(() => {
    if (phase !== "answer" || !myTurn) {
      setShowCustomAnswerInput(false);
    }
  }, [phase, myTurn]);

  // Autofocus input when custom answer input is chosen
  useEffect(() => {
    if (showCustomAnswerInput) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [showCustomAnswerInput]);

  const canSend = (myTurn || showCustomAnswerInput) && draft.trim().length > 0 && !busy;
  const canGuess = myTurn && phase === "question" && guessRemaining > 0 && !busy && !extraQuestionPending;

  const placeholder = myTurn
    ? phase === "answer"
      ? "أجب بـ نعم أو لا…"
      : extraQuestionPending
        ? "سؤالك الثاني — اطرحه الآن…"
        : "اطرح سؤالًا بـ نعم/لا…"
    : "في انتظار الخصم…";

  const handleCustomSend = () => {
    if (!draft.trim()) return;
    onSend();
    setShowCustomAnswerInput(false);
    inputRef.current?.blur();
  };

  const showQuickReplies = myTurn && phase === "answer" && !showCustomAnswerInput;

  return (
    <div
      className="mt-auto shrink-0 px-3 pb-2 pt-1.5 bg-gradient-to-t from-white/90 to-transparent relative z-20"
      style={{
        paddingBottom: `calc(max(env(safe-area-inset-bottom, 0px), 8px) + ${keyboardOverlapPx}px)`,
      }}
    >
      <AnimatePresence mode="wait">
        {showQuickReplies ? (
          <motion.div
            key="quick-replies"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="flex flex-col items-center w-full"
          >
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-[420px] mx-auto py-1">
              {["نعم", "لا", "ربما", "إجابة أخرى"].map((option) => (
                <motion.button
                  key={option}
                  type="button"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (option === "إجابة أخرى") {
                      setShowCustomAnswerInput(true);
                    } else {
                      onSend(option);
                    }
                  }}
                  className="game-card-outer w-full shadow-sm"
                  style={{ cursor: "pointer" }}
                >
                  <div className="game-card-inner bg-[#FAFAF8] hover:bg-[#F3E8FF] border border-slate-200/50 hover:border-purple-300 py-3.5 px-4 text-center rounded-2xl transition-colors duration-200 flex items-center justify-center min-h-[48px]">
                    <span className="text-xs font-black text-slate-800 hover:text-[#7C3AED] font-sans">
                      {option}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="normal-input"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {/* Extra question indicator */}
            <AnimatePresence>
              {extraQuestionPending && myTurn && phase === "question" && (
                <motion.div
                  initial={{ opacity: 0, y: 6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: 4, height: 0 }}
                  className="mb-2 p-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-black text-[10px] text-center"
                >
                  سؤال إضافي — اطرح سؤالك الثاني
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2" dir="ltr">
              
              {/* Send / Ask Button */}
              <motion.button
                type="button"
                disabled={!canSend}
                whileTap={canSend ? { scale: 0.93 } : {}}
                transition={SPRING_UI}
                onClick={() => {
                  if (showCustomAnswerInput) {
                    handleCustomSend();
                  } else {
                    onSend();
                  }
                }}
                aria-label="إرسال"
                className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                  canSend 
                    ? "text-white border-purple-800 shadow-md" 
                    : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                }`}
                style={{
                  background: canSend 
                    ? "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)" 
                    : undefined,
                  cursor: canSend ? "pointer" : "not-allowed",
                }}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <IconSend color="currentColor" />
                </span>
              </motion.button>

              {/* Question/Answer Input Field (Center) */}
              <div className="flex-1 min-w-0" dir="rtl">
                <div className="game-card-outer w-full">
                  <div 
                    className={`game-card-inner px-3 bg-white border rounded-xl flex items-center transition-all ${
                      focused ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/10" : "border-slate-200"
                    }`}
                    style={{ minHeight: 44 }}
                  >
                    <input
                      ref={inputRef}
                      value={draft}
                      onChange={(e) => onDraftChange(e.target.value)}
                      placeholder={placeholder}
                      disabled={(!myTurn && !showCustomAnswerInput) || busy}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && canSend) {
                          if (showCustomAnswerInput) {
                            handleCustomSend();
                          } else {
                            onSend();
                          }
                        }
                      }}
                      dir="rtl"
                      inputMode="text"
                      enterKeyHint="send"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full bg-transparent py-2 text-xs font-black text-slate-800 outline-none placeholder-slate-400 font-sans"
                      onFocus={(e) => {
                        setFocused(true);
                        onComposerFocus(e.currentTarget);
                      }}
                      onBlur={(e) => {
                        setFocused(false);
                        onComposerBlur(e.currentTarget);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Cancel Custom Answer Button */}
              {showCustomAnswerInput && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.93 }}
                  onClick={() => {
                    setShowCustomAnswerInput(false);
                    onDraftChange("");
                  }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center border border-slate-200 bg-slate-50 text-slate-400 active:scale-95 transition-transform"
                  style={{ cursor: "pointer" }}
                  aria-label="تراجع"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </motion.button>
              )}

              {/* Guess Button (Right physical side) */}
              {!showCustomAnswerInput && (
                <motion.button
                  type="button"
                  disabled={!canGuess}
                  whileTap={canGuess ? { scale: 0.93 } : {}}
                  transition={SPRING_UI}
                  onClick={onGuess}
                  className={`px-4 h-11 rounded-xl text-xs font-black border transition-all ${
                    canGuess 
                      ? "text-white border-rose-800 shadow-md" 
                      : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                  style={{
                    background: canGuess 
                      ? "linear-gradient(135deg, #E11D48 0%, #FDA4AF 100%)" 
                      : undefined,
                    cursor: canGuess ? "pointer" : "not-allowed",
                  }}
                >
                  خمّن {guessRemaining > 0 ? `(${guessRemaining})` : ""}
                </motion.button>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

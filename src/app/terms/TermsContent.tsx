"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { staggerContainer, staggerItem, EASE_OUT, WHILE_TAP } from "@/lib/motion";
import { LegalSectionCard } from "@/components/shell/lobby/LegalSectionCard";

/* ─── SVG sub-components ───────────────────────────────────────── */

function ScrollIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M8 5v22l4-3 4 3 4-3 4 3V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M12 12h8m-8 4h6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M26 26V9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={28} cy={6} r={2} fill="currentColor" opacity={0.3} />
      <circle cx={4} cy={14} r={1.5} fill="currentColor" opacity={0.2} />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.6} />
      <path d="M10 8v8l6-4-6-4z" fill="currentColor" />
    </svg>
  );
}

function BanIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.6} />
      <path d="M8 8l8 8" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function ShieldUserIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3L4 7v5c0 5.2 3.2 9.5 8 11 4.8-1.5 8-5.8 8-11V7l-8-4z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={12} cy={11} r={3} stroke="currentColor" strokeWidth={1.6} />
      <path d="M7 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3L2 20h20L12 3z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M12 11v4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={12} cy={17} r={0.8} fill="currentColor" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M3 6h18" stroke="currentColor" strokeWidth={1.6} />
      <path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.4-6" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M21 3v5h-5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.6} />
      <path d="M3 12h18" stroke="currentColor" strokeWidth={1.6} />
      <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

function CopyrightIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.6} />
      <path d="M14.5 9.5a4 4 0 1 0 0 5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.6} />
      <rect x={9} y={9} width={6} height={6} rx={1} fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.6} />
      <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Section data ──────────────────────────────────────────────── */

const prohibited = [
  "الغش أو استغلال الثغرات",
  "التلاعب بالعملات أو النتائج",
  "استخدام أدوات غير مصرح بها",
  "الإساءة أو التحرش باللاعبين",
  "انتحال الشخصيات",
  "تخريب تجربة اللعب",
  "محاولة اختراق أو تعطيل الخدمة",
];

const penalties = ["التحذير", "التقييد المؤقت", "كتم المحادثة", "إيقاف الحساب مؤقتًا", "الحظر الدائم"];

const updates = ["أنظمة اللعب", "الأسعار", "التوازن", "الأدوات", "المحتوى"];

const SECTIONS = [
  {
    id: "service-use",
    icon: <PlayIcon />,
    title: "استخدام الخدمة",
    content: (
      <p>
        يجب استخدام اللعبة بشكل قانوني وأخلاقي وعدم الإساءة إلى اللاعبين أو استغلال الأنظمة.
      </p>
    ),
  },
  {
    id: "prohibited",
    icon: <BanIcon />,
    title: "يمنع داخل اللعبة",
    content: (
      <ul className="space-y-1 pr-5">
        {prohibited.map((item) => (
          <li key={item} className="list-disc marker:text-[#C4B5FD]">{item}</li>
        ))}
      </ul>
    ),
  },
  {
    id: "accounts",
    icon: <ShieldUserIcon />,
    title: "الحسابات",
    content: (
      <p>
        المستخدم مسؤول عن حماية حسابه وعدم مشاركة بيانات تسجيل الدخول مع الآخرين.
      </p>
    ),
  },
  {
    id: "penalties",
    icon: <WarningIcon />,
    title: "العقوبات",
    content: (
      <>
        <p>يحق لإدارة اللعبة اتخاذ الإجراءات المناسبة ضد أي حساب مخالف، وتشمل:</p>
        <ul className="space-y-1 pr-5">
          {penalties.map((item) => (
            <li key={item} className="list-disc marker:text-[#C4B5FD]">{item}</li>
          ))}
        </ul>
        <p>وذلك بحسب نوع المخالفة وتكرارها.</p>
      </>
    ),
  },
  {
    id: "purchases",
    icon: <CartIcon />,
    title: "المشتريات والعناصر الرقمية",
    content: (
      <p>
        جميع العملات والعناصر داخل اللعبة تعتبر عناصر رقمية مخصصة للاستخدام داخل اللعبة فقط. لا يحق
        للمستخدم المطالبة بقيمتها المالية خارج إطار اللعبة.
      </p>
    ),
  },
  {
    id: "updates",
    icon: <RefreshIcon />,
    title: "التحديثات والتغييرات",
    content: (
      <>
        <p>قد يتم تعديل ما يلي في أي وقت بهدف تحسين التجربة العامة:</p>
        <ul className="space-y-1 pr-5">
          {updates.map((item) => (
            <li key={item} className="list-disc marker:text-[#C4B5FD]">{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "service-availability",
    icon: <GlobeIcon />,
    title: "توفر الخدمة",
    content: (
      <p>
        نسعى لتوفير تجربة مستقرة، لكن لا نضمن عمل الخدمة دون انقطاع دائم أو خلوها الكامل من الأخطاء
        التقنية.
      </p>
    ),
  },
  {
    id: "copyright",
    icon: <CopyrightIcon />,
    title: "حقوق الملكية",
    content: (
      <p>
        جميع التصاميم والأنظمة والمحتوى والعلامات الخاصة باللعبة تعتبر ملكًا لإدارة اللعبة ولا يجوز
        نسخها أو إعادة استخدامها دون إذن.
      </p>
    ),
  },
  {
    id: "termination",
    icon: <StopIcon />,
    title: "إنهاء الخدمة",
    content: (
      <p>
        يحق لإدارة اللعبة تعليق أو إيقاف أي حساب يخالف القوانين أو يهدد سلامة المجتمع أو الأنظمة.
      </p>
    ),
  },
  {
    id: "consent",
    icon: <CheckIcon />,
    title: "الموافقة",
    content: (
      <p>
        باستخدامك للعبة فإنك تقر بموافقتك الكاملة على هذه الشروط والأحكام.
      </p>
    ),
  },
] as const;

/* ─── Component ─────────────────────────────────────────────────── */

export function TermsContent() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement | null>>(new Map());

  const sectionIds = useMemo(() => SECTIONS.map((s) => s.id), []);

  useEffect(() => {
    const map = sectionRefs.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) {
        map.set(id, el);
        observer.observe(el);
      }
    }
    return () => {
      for (const el of map.values()) {
        if (el) observer.unobserve(el);
      }
    };
  }, [sectionIds]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main
      dir="rtl"
      className="app-page w-full"
      style={{
        background: "#FDFBF7",
        position: "relative",
      }}
    >
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 select-none">
        <div
          className="absolute -inset-40 opacity-[0.035]"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, #8B5CF6 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #FF9F0A 0%, transparent 50%)",
          }}
        />
        <span className="absolute right-[5%] top-[8%] text-5xl text-[#8B5CF6] opacity-[0.04]">✦</span>
        <span className="absolute left-[8%] top-[25%] text-3xl text-[#8B5CF6] opacity-[0.03]">✦</span>
        <span className="absolute right-[12%] bottom-[15%] text-4xl text-[#8B5CF6] opacity-[0.035]">✦</span>
        <span className="absolute left-[5%] bottom-[30%] text-2xl text-[#FF9F0A] opacity-[0.025]">✦</span>
      </div>

      <div className="app-scroll-y px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <motion.div
            variants={staggerContainer(0.06, 0.1)}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            {/* ═══ HEADER ════════════════════════════════════════ */}
            <motion.div variants={staggerItem} className="mb-2">
              <div className="game-card-outer" style={{ background: "rgba(255,255,255,0.6)", borderColor: "rgba(139, 92, 246, 0.06)" }}>
                <div
                  className="game-card-inner relative overflow-hidden"
                  style={{
                    padding: "28px 24px 26px",
                    background: "linear-gradient(170deg, #FAFAFF 0%, #FFFFFF 60%, #F5F3FF 100%)",
                  }}
                >
                  {/* Subtle header decoration */}
                  <div aria-hidden className="pointer-events-none absolute -left-6 -top-6 h-32 w-32 rounded-full bg-[#8B5CF6] opacity-[0.04]" />
                  <div aria-hidden className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-[#FF9F0A] opacity-[0.03]" />

                  <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-start">
                    {/* Scroll illustration */}
                    <div
                      aria-hidden
                      className="flex shrink-0 items-center justify-center"
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 20,
                        background: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
                        boxShadow: "0 6px 20px rgba(139, 92, 246, 0.25)",
                        color: "#FFFFFF",
                      }}
                    >
                      <ScrollIcon />
                    </div>
                    <div className="min-w-0">
                      <span
                        className="mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black tracking-wider"
                        style={{
                          background: "#F5F3FF",
                          color: "#6D28D9",
                          border: "1px solid rgba(139, 92, 246, 0.12)",
                          fontFamily: "var(--display)",
                        }}
                      >
                        <svg width={8} height={8} viewBox="0 0 24 24" fill="none" aria-hidden>
                          <circle cx={12} cy={12} r={10} stroke="#8B5CF6" strokeWidth={2} />
                          <circle cx={12} cy={12} r={3} fill="#8B5CF6" />
                        </svg>
                        آخر تحديث: 2026
                      </span>
                      <h1
                        className="text-[28px] font-black leading-tight tracking-tight sm:text-[34px]"
                        style={{ fontFamily: "var(--display)", color: "#1e1b4b" }}
                      >
                        الشروط والأحكام
                      </h1>
                      <p
                        className="mt-1.5 text-sm font-bold leading-relaxed"
                        style={{ color: "#6D28D9" }}
                      >
                        القواعد التي تحافظ على تجربة لعب عادلة للجميع.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ═══ TABLE OF CONTENTS ════════════════════════════ */}
            <motion.div
              variants={staggerItem}
              className="sticky -top-2 z-10 py-2"
              style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #FDFBF7 85%, transparent 100%)" }}
            >
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollToSection(s.id)}
                    className="whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-black transition-all duration-200"
                    style={{
                      background: activeId === s.id ? "#8B5CF6" : "#F5F3FF",
                      color: activeId === s.id ? "#FFFFFF" : "#6D28D9",
                      border: activeId === s.id
                        ? "1px solid transparent"
                        : "1px solid rgba(139, 92, 246, 0.1)",
                      fontFamily: "var(--display)",
                    }}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* ═══ SECTIONS ════════════════════════════════════ */}
            {SECTIONS.map((s) => (
              <LegalSectionCard key={s.id} id={s.id} icon={s.icon} title={s.title}>
                {s.content}
              </LegalSectionCard>
            ))}

            {/* ═══ FOOTER ═══════════════════════════════════════ */}
            <motion.div variants={staggerItem}>
              <div className="game-card-outer" style={{ background: "rgba(255,255,255,0.6)", borderColor: "rgba(139, 92, 246, 0.06)" }}>
                <div
                  className="game-card-inner"
                  style={{
                    padding: "24px",
                    background: "linear-gradient(170deg, #F5F3FF 0%, #FFFFFF 100%)",
                  }}
                >
                  <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-start">
                    <div>
                      <p className="text-xs font-bold" style={{ color: "#8B5CF6" }}>
                        آخر تحديث للشروط والأحكام: 2026
                      </p>
                      <h3
                        className="mt-1 text-lg font-black"
                        style={{ fontFamily: "var(--display)", color: "#1e1b4b" }}
                      >
                        هل لديك سؤال؟
                      </h3>
                      <p className="mt-0.5 text-sm font-semibold" style={{ color: "#6D28D9" }}>
                        نحن هنا لمساعدتك
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Link
                        href="/"
                        className="rounded-2xl px-5 py-2.5 text-sm font-black transition-all duration-200"
                        style={{
                          background: "#F5F3FF",
                          color: "#6D28D9",
                          border: "1px solid rgba(139, 92, 246, 0.12)",
                        }}
                      >
                        الرئيسية
                      </Link>
                      <Link
                        href="/support"
                        className="rounded-2xl px-5 py-2.5 text-sm font-black text-white transition-all duration-200"
                        style={{
                          background: "linear-gradient(180deg, #8B5CF6 0%, #7C3AED 100%)",
                          boxShadow: "0 4px 14px rgba(139, 92, 246, 0.25)",
                        }}
                      >
                        التواصل
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

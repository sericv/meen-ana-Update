"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { staggerContainer, staggerItem, EASE_OUT, WHILE_TAP } from "@/lib/motion";
import { LegalSectionCard } from "@/components/shell/lobby/LegalSectionCard";

/* ─── SVG sub-components ───────────────────────────────────────── */

function ShieldIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M16 4L6 9v6c0 7 4 12.5 10 14 6-1.5 10-7 10-14V9l-10-5z" fill="currentColor" opacity={0.2} />
      <path d="M16 4L6 9v6c0 7 4 12.5 10 14 6-1.5 10-7 10-14V9l-10-5z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M12 17l3 3 5-6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={26} cy={6} r={2} fill="currentColor" opacity={0.3} />
      <circle cx={6} cy={10} r={1.5} fill="currentColor" opacity={0.2} />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx={12} cy={6} rx={8} ry={3} stroke="currentColor" strokeWidth={1.6} />
      <path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="currentColor" strokeWidth={1.6} />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x={3} y={13} width={4} height={8} rx={0.8} stroke="currentColor" strokeWidth={1.6} />
      <rect x={10} y={9} width={4} height={12} rx={0.8} stroke="currentColor" strokeWidth={1.6} />
      <rect x={17} y={5} width={4} height={16} rx={0.8} stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x={5} y={11} width={14} height={10} rx={2} stroke="currentColor" strokeWidth={1.6} />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={12} cy={16} r={1.2} fill="currentColor" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={6} cy={12} r={2.5} stroke="currentColor" strokeWidth={1.6} />
      <circle cx={18} cy={7} r={2.5} stroke="currentColor" strokeWidth={1.6} />
      <circle cx={18} cy={17} r={2.5} stroke="currentColor" strokeWidth={1.6} />
      <path d="M8.5 11l7-3m-7 5l7 3" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
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

function EyeIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5C7 5 2.7 8.2 1 12c1.7 3.8 6 7 11 7s9.3-3.2 11-7c-1.7-3.8-6-7-11-7z" stroke="currentColor" strokeWidth={1.6} />
      <circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={12} cy={8} r={4} stroke="currentColor" strokeWidth={1.6} />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth={1.6} />
      <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4l2.1 2.1M4.2 19.8l2.1-2.1m11.4-11.4l2.1-2.1" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x={2} y={4} width={20} height={16} rx={2} stroke="currentColor" strokeWidth={1.6} />
      <path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Section data ──────────────────────────────────────────────── */

const collectedData = [
  "اسم المستخدم",
  "البريد الإلكتروني",
  "صورة الحساب",
  "بيانات اللعب والإحصائيات",
  "التقدم داخل اللعبة",
  "المشتريات والعناصر الرقمية",
  "بيانات الجهاز الأساسية لتحسين الأداء والأمان",
];

const dataUses = [
  "تشغيل اللعبة وتحسين التجربة",
  "حفظ التقدم والإحصائيات",
  "حماية الحسابات ومنع الغش",
  "تحسين الأنظمة والأداء",
  "تقديم الدعم الفني",
];

const thirdPartyServices = ["Firebase", "Google Authentication", "خدمات الدفع الإلكتروني"];

const SECTIONS = [
  {
    id: "data-collected",
    icon: <DatabaseIcon />,
    title: "البيانات التي قد نقوم بجمعها",
    content: (
      <>
        <p>قد نقوم بجمع بعض المعلومات الأساسية مثل:</p>
        <ul className="space-y-1 pr-5">
          {collectedData.map((item) => (
            <li key={item} className="list-disc marker:text-[#C4B5FD]">{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "data-usage",
    icon: <ChartIcon />,
    title: "كيفية استخدام البيانات",
    content: (
      <>
        <p>يتم استخدام البيانات من أجل:</p>
        <ul className="space-y-1 pr-5">
          {dataUses.map((item) => (
            <li key={item} className="list-disc marker:text-[#C4B5FD]">{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "data-protection",
    icon: <LockIcon />,
    title: "حماية البيانات",
    content: (
      <p>
        نحن نستخدم خدمات وتقنيات آمنة لتخزين البيانات وحماية الحسابات من الوصول غير المصرح به.
      </p>
    ),
  },
  {
    id: "data-sharing",
    icon: <ShareIcon />,
    title: "مشاركة البيانات",
    content: (
      <>
        <p>نحن لا نقوم ببيع بيانات المستخدمين أو مشاركتها مع أي جهة خارجية لأغراض تجارية.</p>
        <p>قد يتم استخدام بعض خدمات الطرف الثالث فقط لتشغيل اللعبة وتحسين خدماتها، مثل:</p>
        <ul className="space-y-1 pr-5">
          {thirdPartyServices.map((item) => (
            <li key={item} className="list-disc marker:text-[#C4B5FD]">{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "purchases",
    icon: <CartIcon />,
    title: "المشتريات والعملات الرقمية",
    content: (
      <p>
        العناصر والعملات داخل اللعبة رقمية وغير قابلة للاسترداد بعد الاستخدام أو الشراء، إلا في الحالات
        التي يحددها القانون أو إدارة اللعبة.
      </p>
    ),
  },
  {
    id: "behavior",
    icon: <EyeIcon />,
    title: "السلوك داخل اللعبة",
    content: (
      <p>
        قد نقوم بمراجعة بعض الأنشطة داخل اللعبة للحفاظ على بيئة آمنة وعادلة لجميع اللاعبين.
      </p>
    ),
  },
  {
    id: "accounts",
    icon: <UserIcon />,
    title: "حسابات المستخدمين",
    content: (
      <p>
        يحق للمستخدم طلب حذف حسابه أو التوقف عن استخدام الخدمة في أي وقت.
      </p>
    ),
  },
  {
    id: "amendments",
    icon: <SettingsIcon />,
    title: "التعديلات",
    content: (
      <p>
        يحق لإدارة اللعبة تعديل سياسة الخصوصية أو تحديثها في أي وقت لتحسين الخدمة أو الامتثال للأنظمة.
        استمرار استخدام اللعبة يعني موافقتك على التحديثات الجديدة.
      </p>
    ),
  },
  {
    id: "contact",
    icon: <MailIcon />,
    title: "التواصل",
    content: (
      <p>
        لأي استفسار أو ملاحظات يمكن التواصل عبر البريد الإلكتروني المرتبط بالخدمة.
      </p>
    ),
  },
] as const;

/* ─── Component ─────────────────────────────────────────────────── */

export function PrivacyContent() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement | null>>(new Map());
  const tocRef = useRef<HTMLDivElement>(null);

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
                    {/* Shield illustration */}
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
                      <ShieldIcon />
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
                        سياسة الخصوصية
                      </h1>
                      <p
                        className="mt-1.5 text-sm font-bold leading-relaxed"
                        style={{ color: "#6D28D9" }}
                      >
                        كيف نحمي بياناتك داخل مين أنا؟
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ═══ TABLE OF CONTENTS ════════════════════════════ */}
            <motion.div
              variants={staggerItem}
              ref={tocRef}
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
                        آخر تحديث لسياسة الخصوصية: 2026
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

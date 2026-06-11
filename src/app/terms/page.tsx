import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الشروط والأحكام | مين أنا؟",
  description: "الشروط والأحكام الخاصة بلعبة مين أنا.",
};

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

export default function TermsPage() {
  return (
    <main
      dir="rtl"
      className="app-page w-full"
      style={{
        background: "radial-gradient(120% 70% at 50% 0%, #FFF1DF 0%, #FCE8D2 55%, #FFF7EF 100%)",
      }}
    >
      <div className="app-scroll-y px-4 py-8 sm:px-6">
        <article className="mx-auto w-full max-w-3xl rounded-[1.75rem] border border-white/80 bg-white/90 p-5 text-[#5e3011] shadow-[0_18px_44px_rgba(196,134,82,0.16)] sm:p-7">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#bc7a45]">آخر تحديث: 2026</p>
              <h1 className="mt-1 text-2xl font-black text-[#8a3f16] sm:text-3xl">الشروط والأحكام</h1>
              <p className="mt-2 text-sm font-semibold leading-7 text-[#8a5a35]">
                مرحبًا بك في لعبة "مين أنا". باستخدامك للعبة، فإنك توافق على الالتزام بالشروط والأحكام التالية.
              </p>
            </div>
            <Link href="/" className="rounded-full bg-[#fff1dd] px-4 py-2 text-sm font-black text-[#b45309]">
              الرئيسية
            </Link>
          </div>

          <LegalSection title="استخدام الخدمة">
            يجب استخدام اللعبة بشكل قانوني وأخلاقي وعدم الإساءة إلى اللاعبين أو استغلال الأنظمة.
          </LegalSection>

          <LegalSection title="يمنع داخل اللعبة">
            <LegalList items={prohibited} />
          </LegalSection>

          <LegalSection title="الحسابات">
            المستخدم مسؤول عن حماية حسابه وعدم مشاركة بيانات تسجيل الدخول مع الآخرين.
          </LegalSection>

          <LegalSection title="العقوبات">
            <p>يحق لإدارة اللعبة اتخاذ الإجراءات المناسبة ضد أي حساب مخالف، وتشمل:</p>
            <LegalList items={penalties} />
            <p>وذلك بحسب نوع المخالفة وتكرارها.</p>
          </LegalSection>

          <LegalSection title="المشتريات والعناصر الرقمية">
            جميع العملات والعناصر داخل اللعبة تعتبر عناصر رقمية مخصصة للاستخدام داخل اللعبة فقط. لا يحق للمستخدم
            المطالبة بقيمتها المالية خارج إطار اللعبة.
          </LegalSection>

          <LegalSection title="التحديثات والتغييرات">
            <p>قد يتم تعديل ما يلي في أي وقت بهدف تحسين التجربة العامة:</p>
            <LegalList items={updates} />
          </LegalSection>

          <LegalSection title="توفر الخدمة">
            نسعى لتوفير تجربة مستقرة، لكن لا نضمن عمل الخدمة دون انقطاع دائم أو خلوها الكامل من الأخطاء التقنية.
          </LegalSection>

          <LegalSection title="حقوق الملكية">
            جميع التصاميم والأنظمة والمحتوى والعلامات الخاصة باللعبة تعتبر ملكًا لإدارة اللعبة ولا يجوز نسخها أو
            إعادة استخدامها دون إذن.
          </LegalSection>

          <LegalSection title="إنهاء الخدمة">
            يحق لإدارة اللعبة تعليق أو إيقاف أي حساب يخالف القوانين أو يهدد سلامة المجتمع أو الأنظمة.
          </LegalSection>

          <LegalSection title="الموافقة">
            باستخدامك للعبة فإنك تقر بموافقتك الكاملة على هذه الشروط والأحكام.
          </LegalSection>
        </article>
      </div>
    </main>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[#f4d4b0]/70 py-4 first:border-t-0">
      <h2 className="mb-2 text-lg font-black text-[#8a3f16]">{title}</h2>
      <div className="space-y-2 text-sm font-semibold leading-7 text-[#6f4528]">{children}</div>
    </section>
  );
}

function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1 pr-5">
      {items.map((item) => (
        <li key={item} className="list-disc">
          {item}
        </li>
      ))}
    </ul>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | مين أنا؟",
  description: "سياسة الخصوصية الخاصة بلعبة مين أنا.",
};

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

export default function PrivacyPage() {
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
              <h1 className="mt-1 text-2xl font-black text-[#8a3f16] sm:text-3xl">سياسة الخصوصية</h1>
              <p className="mt-2 text-sm font-semibold leading-7 text-[#8a5a35]">
                نحن في لعبة "مين أنا" نحترم خصوصية جميع المستخدمين ونلتزم بحماية بياناتهم وتجربتهم داخل اللعبة.
                باستخدامك للعبة، فإنك توافق على سياسة الخصوصية التالية.
              </p>
            </div>
            <Link href="/" className="rounded-full bg-[#fff1dd] px-4 py-2 text-sm font-black text-[#b45309]">
              الرئيسية
            </Link>
          </div>

          <LegalSection title="البيانات التي قد نقوم بجمعها">
            <p>قد نقوم بجمع بعض المعلومات الأساسية مثل:</p>
            <LegalList items={collectedData} />
          </LegalSection>

          <LegalSection title="كيفية استخدام البيانات">
            <p>يتم استخدام البيانات من أجل:</p>
            <LegalList items={dataUses} />
          </LegalSection>

          <LegalSection title="حماية البيانات">
            نحن نستخدم خدمات وتقنيات آمنة لتخزين البيانات وحماية الحسابات من الوصول غير المصرح به.
          </LegalSection>

          <LegalSection title="مشاركة البيانات">
            <p>نحن لا نقوم ببيع بيانات المستخدمين أو مشاركتها مع أي جهة خارجية لأغراض تجارية.</p>
            <p>قد يتم استخدام بعض خدمات الطرف الثالث فقط لتشغيل اللعبة وتحسين خدماتها، مثل:</p>
            <LegalList items={thirdPartyServices} />
          </LegalSection>

          <LegalSection title="المشتريات والعملات الرقمية">
            العناصر والعملات داخل اللعبة رقمية وغير قابلة للاسترداد بعد الاستخدام أو الشراء، إلا في الحالات التي
            يحددها القانون أو إدارة اللعبة.
          </LegalSection>

          <LegalSection title="السلوك داخل اللعبة">
            قد نقوم بمراجعة بعض الأنشطة داخل اللعبة للحفاظ على بيئة آمنة وعادلة لجميع اللاعبين.
          </LegalSection>

          <LegalSection title="حسابات المستخدمين">
            يحق للمستخدم طلب حذف حسابه أو التوقف عن استخدام الخدمة في أي وقت.
          </LegalSection>

          <LegalSection title="التعديلات">
            يحق لإدارة اللعبة تعديل سياسة الخصوصية أو تحديثها في أي وقت لتحسين الخدمة أو الامتثال للأنظمة. استمرار
            استخدام اللعبة يعني موافقتك على التحديثات الجديدة.
          </LegalSection>

          <LegalSection title="التواصل">
            لأي استفسار أو ملاحظات يمكن التواصل عبر البريد الإلكتروني المرتبط بالخدمة.
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

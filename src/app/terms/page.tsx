import type { Metadata } from "next";
import { TermsContent } from "./TermsContent";

export const metadata: Metadata = {
  title: "الشروط والأحكام | مين أنا؟",
  description: "الشروط والأحكام الخاصة بلعبة مين أنا.",
};

export default function TermsPage() {
  return <TermsContent />;
}

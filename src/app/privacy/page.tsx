import type { Metadata } from "next";
import { PrivacyContent } from "./PrivacyContent";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | مين أنا؟",
  description: "سياسة الخصوصية الخاصة بلعبة مين أنا.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}

import { PageTransition } from "@/components/navigation/PageTransition";

export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}

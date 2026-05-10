import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff6ea",
};

export const metadata: Metadata = {
  title: "مين أنا؟",
  description: "لعبة تخمين اجتماعية سريعة عبر الويب",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`}>
      <body className="min-h-[100dvh] min-h-full font-sans text-[#5e3011] antialiased">
        <AuthProvider>
          <div className="relative min-h-full overflow-x-hidden">
            <div className="pointer-events-none fixed -top-16 -right-16 h-64 w-64 rounded-full bg-[#ffbc72]/45 blur-3xl" />
            <div className="pointer-events-none fixed top-1/2 -left-20 h-72 w-72 rounded-full bg-[#ffd59f]/45 blur-3xl" />
            <div className="pointer-events-none fixed bottom-0 right-1/4 h-48 w-48 rounded-full bg-[#ffc180]/35 blur-3xl" />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

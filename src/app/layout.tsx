import type { Metadata, Viewport } from "next";
import { Baloo_Bhaijaan_2, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PlayerProfileModalProvider } from "@/components/providers/PlayerProfileModalProvider";
import { GlobalRoomInviteDockLazy } from "@/components/layout/GlobalRoomInviteDockLazy";

const balooBhaijaan2 = Baloo_Bhaijaan_2({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-baloo",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
});

// Mobile-first viewport. We intentionally:
//   • lock initial-scale + maximum-scale to disable pinch/double-tap zoom
//     while typing into inputs (iOS Safari auto-zooms when font-size < 16px
//     and any of these is missing).
//   • opt into edge-to-edge with `viewport-fit=cover` so safe-area-insets
//     get real values on iPhones with home-indicators / notches.
//   • omit `interactiveWidget: "resizes-content"` — combining it with JS
//     VisualViewport sizing caused inconsistent layout vs visible height on
//     mobile Safari (empty bands when the keyboard opened).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#7C3AED",
};

export const metadata: Metadata = {
  title: "مين أنا؟ | لعبة التخمين الاجتماعية",
  description: "تحدَّ ذكاءك، اطرح الأسئلة، واكتشف بطاقتك قبل خصمك في تجربة اجتماعية سريعة وممتعة.",
  keywords: ["مين أنا", "لعبة تخمين", "ألعاب جماعية", "ألعاب أصدقاء", "Party Game", "Guessing Game", "Multiplayer", "لعبة عربية"],
  openGraph: {
    title: "مين أنا؟ | لعبة التخمين الاجتماعية",
    description: "تحدَّ ذكاءك، اطرح الأسئلة، واكتشف بطاقتك قبل خصمك في تجربة اجتماعية سريعة وممتعة.",
    type: "website",
    locale: "ar_AR",
    url: "https://saeer.xyz",
    siteName: "مين أنا؟",
  },
  twitter: {
    card: "summary_large_image",
    title: "مين أنا؟ | لعبة التخمين الاجتماعية",
    description: "تحدَّ ذكاءك، اطرح الأسئلة، واكتشف بطاقتك قبل خصمك في تجربة اجتماعية سريعة وممتعة.",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${balooBhaijaan2.variable} ${plusJakartaSans.variable} antialiased`}>
      <body className="app-shell flex flex-col font-sans text-[#5e3011] antialiased">
        <AuthProvider>
          <PlayerProfileModalProvider>
            <div className="flex flex-1 flex-col min-w-0">
              <GlobalRoomInviteDockLazy />
              <div className="app-main">{children}</div>
            </div>
          </PlayerProfileModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

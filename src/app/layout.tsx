import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { GlobalRoomInviteDock } from "@/components/social/GlobalRoomInviteDock";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
});

// Mobile-first viewport. We intentionally:
//   • lock initial-scale + maximum-scale to disable pinch/double-tap zoom
//     while typing into inputs (iOS Safari auto-zooms when font-size < 16px
//     and any of these is missing).
//   • opt into edge-to-edge with `viewport-fit=cover` so safe-area-insets
//     get real values on iPhones with home-indicators / notches.
//   • set `interactiveWidget: "resizes-content"` so Android Chrome shrinks
//     the layout instead of overlaying the keyboard on top of game UI.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#fff6ea",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "مين أنا؟",
  description: "لعبة تخمين اجتماعية سريعة عبر الويب",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`}>
      <body className="app-shell font-sans text-[#5e3011] antialiased">
        <AuthProvider>
          <GlobalRoomInviteDock />
          <div
            className="relative w-full overflow-x-hidden"
            style={{
              // Match VisualViewport hook (`--app-vh`) so nested full-height
              // gameplay is not clipped by a stale 100dvh shell on mobile.
              minHeight: "var(--app-vh, 100dvh)",
              height: "var(--app-vh, 100dvh)",
            }}
          >
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

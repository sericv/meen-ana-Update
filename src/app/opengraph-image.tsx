import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const alt = "مين أنا؟ | لعبة التخمين الاجتماعية";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  // Read font file locally for 100% reliable offline builds
  let fontData: Buffer;
  try {
    const fontPath = path.join(process.cwd(), "src/app/BalooBhaijaan2-Bold.woff");
    fontData = fs.readFileSync(fontPath);
  } catch (e) {
    console.error("Failed to read font file locally", e);
    // Create an empty buffer as fallback to prevent crash, though file is guaranteed to exist
    fontData = Buffer.alloc(0);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 50%, #2E1065 100%)",
          padding: "60px 40px 40px",
          boxSizing: "border-box",
          position: "relative",
          fontFamily: '"Baloo Bhaijaan 2", system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Floating background decals */}
        <div style={{ position: "absolute", top: "10%", left: "8%", fontSize: 90, opacity: 0.08 }}>❓</div>
        <div style={{ position: "absolute", bottom: "15%", left: "10%", fontSize: 80, opacity: 0.08 }}>🕵️‍♂️</div>
        <div style={{ position: "absolute", top: "15%", right: "10%", fontSize: 70, opacity: 0.08 }}>✨</div>
        <div style={{ position: "absolute", bottom: "20%", right: "8%", fontSize: 90, opacity: 0.08 }}>🔍</div>

        {/* Top Header Section */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <h1
            style={{
              fontSize: "85px",
              fontWeight: 800,
              color: "#FFE600",
              margin: 0,
              padding: 0,
              textShadow: "0 4px 20px rgba(0,0,0,0.3)",
              lineHeight: 1.1,
            }}
          >
            مين أنا؟
          </h1>
          <p
            style={{
              fontSize: "26px",
              fontWeight: 600,
              color: "#F3E8FF",
              margin: 0,
              padding: 0,
              textAlign: "center",
            }}
          >
            تحدَّ ذكاءك واكتشف بطاقتك قبل خصمك.
          </p>
        </div>

        {/* Center Cards Showcase */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, margin: "20px 0" }}>
          {/* Card Left */}
          <div
            style={{
              width: "130px",
              height: "180px",
              background: "#FFFFFF",
              borderRadius: "20px",
              border: "4px solid #8B5CF6",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(-12deg) translateY(15px)",
              fontSize: "50px",
            }}
          >
            🍎
          </div>

          {/* Center Card (Favicon / Main concept) */}
          <div
            style={{
              width: "150px",
              height: "210px",
              background: "#FFE600",
              borderRadius: "24px",
              border: "6px solid #2E1065",
              boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              transform: "scale(1.05)",
              position: "relative",
            }}
          >
            <span style={{ fontSize: "90px", fontWeight: 900, color: "#2E1065", lineHeight: 1 }}>؟</span>
          </div>

          {/* Card Right */}
          <div
            style={{
              width: "130px",
              height: "180px",
              background: "#FFFFFF",
              borderRadius: "20px",
              border: "4px solid #8B5CF6",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(12deg) translateY(15px)",
              fontSize: "50px",
            }}
          >
            🦁
          </div>
        </div>

        {/* Bottom footer & tags */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          {/* Play Button visual teaser */}
          <div
            style={{
              background: "linear-gradient(135deg, #FFE600 0%, #F59E0B 100%)",
              border: "2px solid #D97706",
              borderRadius: "999px",
              padding: "10px 32px",
              fontSize: "18px",
              fontWeight: 800,
              color: "#2E1065",
              boxShadow: "0 6px 16px rgba(245, 158, 11, 0.3)",
            }}
          >
            العب الآن مجاناً
          </div>

          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#A78BFA",
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <span>اللعب الجماعي</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>المنافسة</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>التخمين</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Baloo Bhaijaan 2",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}

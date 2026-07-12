import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_PATH = path.join(__dirname, "BalooBhaijaan2-Bold.ttf");

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fontBuffer = fs.readFileSync(FONT_PATH);
  const fontBytes = new Uint8Array(fontBuffer.length);
  fontBytes.set(fontBuffer);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          fontFamily: "Baloo Bhaijaan 2",
          backgroundImage:
            "linear-gradient(165deg, #7C3AED 0%, #5B21B6 55%, #3B0764 100%)",
        }}
      >
        {/* ── Decorative background glows ── */}
        <div
          style={{
            position: "absolute",
            width: 560,
            height: 560,
            borderRadius: "50%",
            top: -180,
            right: -140,
            backgroundImage:
              "radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 440,
            height: 440,
            borderRadius: "50%",
            bottom: -140,
            left: -100,
            backgroundImage:
              "radial-gradient(circle, rgba(91, 33, 182, 0.45) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundImage:
              "radial-gradient(circle, rgba(255, 230, 0, 0.05) 0%, transparent 60%)",
          }}
        />

        {/* ── Subtle decorative dots ── */}
        <div
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.07)",
            top: "13%",
            left: "9%",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.05)",
            top: "26%",
            right: "14%",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.06)",
            bottom: "18%",
            right: "11%",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.04)",
            bottom: "32%",
            left: "13%",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            transform: "rotate(45deg)",
            backgroundColor: "rgba(255, 230, 0, 0.07)",
            top: "16%",
            right: "22%",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            transform: "rotate(45deg)",
            backgroundColor: "rgba(255, 230, 0, 0.05)",
            bottom: "14%",
            left: "20%",
          }}
        />

        {/* ── Main content ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* ── Gold accent line ── */}
          <div
            style={{
              width: 48,
              height: 3,
              borderRadius: 2,
              backgroundColor: "#FFE600",
              marginBottom: 18,
            }}
          />

          {/* ── Brand title: "مين أنا؟" ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "row-reverse",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 62,
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.1,
              }}
            >
              مين
            </span>
            <span
              style={{
                fontSize: 62,
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.1,
              }}
            >
              أنا؟
            </span>
          </div>

          {/* ── Subtitle: "لعبة التخمين الاجتماعية" ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "row-reverse",
              justifyContent: "center",
              gap: 8,
              marginTop: 4,
              marginBottom: 38,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.65)",
                lineHeight: 1.4,
              }}
            >
              لعبة
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.65)",
                lineHeight: 1.4,
              }}
            >
              التخمين
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.65)",
                lineHeight: 1.4,
              }}
            >
              الاجتماعية
            </span>
          </div>

          {/* ── Three cards ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginBottom: 34,
            }}
          >
            <PlayerCard number={1} label="اللاعب" sub="01" />
            <MysteryCard />
            <PlayerCard number={2} label="اللاعب" sub="02" />
          </div>

          {/* ── Tagline ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "row-reverse",
              justifyContent: "center",
              gap: 5,
              maxWidth: 680,
              marginBottom: 20,
            }}
          >
            <TagWord>تحدَّ</TagWord>
            <TagWord>ذكاءك،</TagWord>
            <TagWord>اطرح</TagWord>
            <TagWord>الأسئلة،</TagWord>
            <TagWord>واكتشف</TagWord>
            <TagWord>بطاقتك</TagWord>
            <TagWord>قبل</TagWord>
            <TagWord>خصمك.</TagWord>
          </div>

          {/* ── CTA button ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "15px 40px",
              borderRadius: 999,
              backgroundImage:
                "linear-gradient(180deg, #FFE600 0%, #F59E0B 100%)",
              boxShadow:
                "0 4px 0 #B45309, 0 8px 24px rgba(0, 0, 0, 0.25)",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row-reverse",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#5B21B6",
                  lineHeight: 1,
                }}
              >
                ابدأ
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#5B21B6",
                  lineHeight: 1,
                }}
              >
                اللعب
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#5B21B6",
                  lineHeight: 1,
                }}
              >
                الآن
              </span>
            </div>
          </div>

          {/* ── Tags ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "row-reverse",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <TagWordSmall>اللعب</TagWordSmall>
            <TagWordSmall>الجماعي</TagWordSmall>
            <TagWordSmall>•</TagWordSmall>
            <TagWordSmall>المنافسة</TagWordSmall>
            <TagWordSmall>•</TagWordSmall>
            <TagWordSmall>التخمين</TagWordSmall>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Baloo Bhaijaan 2",
          data: fontBytes.buffer,
          weight: 800,
          style: "normal",
        },
      ],
    }
  );
}

/* ─── Sub-components ─────────────────────────────────── */

function TagWord({ children }: { children: string }) {
  return (
    <span
      style={{
        fontSize: 16,
        fontWeight: 700,
        color: "rgba(255, 255, 255, 0.78)",
        lineHeight: 1.6,
      }}
    >
      {children}
    </span>
  );
}

function TagWordSmall({ children }: { children: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "rgba(255, 255, 255, 0.45)",
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  );
}

function PlayerCard({
  number,
  label,
  sub,
}: {
  number: number;
  label: string;
  sub: string;
}) {
  return (
    <div
      style={{
        width: 100,
        height: 142,
        borderRadius: 14,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        borderWidth: 1.5,
        borderStyle: "solid",
        borderColor: "rgba(255, 255, 255, 0.08)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
          backgroundImage:
            "linear-gradient(135deg, #FFE600 0%, #FFC107 100%)",
          boxShadow: "0 2px 8px rgba(255, 230, 0, 0.3)",
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#5B21B6",
            lineHeight: 1,
          }}
        >
          {number}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row-reverse",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.8)",
            lineHeight: 1.3,
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "rgba(255, 255, 255, 0.4)",
          lineHeight: 1.3,
        }}
      >
        {sub}
      </span>
    </div>
  );
}

function MysteryCard() {
  return (
    <div
      style={{
        width: 134,
        height: 180,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: 5,
        backgroundImage: "linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)",
        boxShadow:
          "0 8px 28px rgba(0, 0, 0, 0.35), 0 0 0 2px rgba(255, 255, 255, 0.1)",
      }}
    >
      <div
        style={{
          width: 124,
          height: 170,
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundImage:
            "linear-gradient(180deg, #A78BFA 0%, #7C3AED 100%)",
        }}
      >
        {/* Corner dots */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.18)",
          }}
        />

        <span
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1,
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        >
          ؟
        </span>
      </div>
    </div>
  );
}

import Image from "next/image";

type Props = {
  width: number;
  height: number;
  title?: string;
  category?: string;
  variant?: "front" | "back";
  tilt?: number;
  imageUrl?: string;
  priority?: boolean;
};

export function ShellGameCard({
  width,
  height,
  title,
  category,
  variant = "front",
  tilt = 0,
  imageUrl,
  priority = false,
}: Props) {
  const isBack = variant === "back";

  return (
    <div
      className={isBack ? "gcard gcard-back" : "gcard"}
      style={{
        width,
        height,
        transform: `rotate(${tilt}deg)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isBack ? "center" : "flex-end",
        padding: isBack ? 0 : 10,
      }}
    >
      {/* Front: image area */}
      {!isBack && imageUrl ? (
        <div
          className="relative mb-2 w-full flex-1 overflow-hidden rounded-xl"
          style={{
            /* Subtle inner vignette on image for card depth */
            boxShadow: "inset 0 0 0 1px rgba(180,100,30,0.08)",
          }}
        >
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes={`${width}px`}
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            unoptimized
          />
          {/* Subtle gradient overlay at bottom of image */}
          <div
            style={{
              position: "absolute",
              inset: "50% 0 0",
              background: "linear-gradient(to bottom, transparent, rgba(58,37,23,0.18))",
              pointerEvents: "none",
            }}
          />
        </div>
      ) : null}

      {/* Front: text */}
      {!isBack && title ? (
        <>
          <div
            className="h-display fw-7 text-sm"
            style={{
              textAlign: "center",
              lineHeight: 1.2,
              color: "oklch(0.22 0.04 45)",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
          {category ? (
            <span
              className="text-xs muted mt-1"
              style={{ opacity: 0.75, fontWeight: 600 }}
            >
              {category}
            </span>
          ) : null}
        </>
      ) : isBack ? (
        /* Back face: layered ؟ marks for depth illusion */
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span
            className="h-display fw-8"
            style={{
              fontSize: 32,
              opacity: 0.12,
              position: "absolute",
              transform: "translate(6px, 6px)",
            }}
          >
            ؟
          </span>
          <span
            className="h-display fw-8"
            style={{ fontSize: 32, opacity: 0.40 }}
          >
            ؟
          </span>
        </div>
      ) : null}
    </div>
  );
}

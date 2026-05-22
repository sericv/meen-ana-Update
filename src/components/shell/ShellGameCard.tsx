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
        padding: isBack ? 0 : 12,
      }}
    >
      {!isBack && imageUrl ? (
        <div className="relative mb-2 w-full flex-1 overflow-hidden rounded-xl">
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
        </div>
      ) : null}
      {!isBack && title ? (
        <>
          <div className="h-display fw-7 text-sm" style={{ textAlign: "center", lineHeight: 1.2 }}>
            {title}
          </div>
          {category ? (
            <span className="text-xs muted mt-1" style={{ opacity: 0.85 }}>
              {category}
            </span>
          ) : null}
        </>
      ) : isBack ? (
        <span className="h-display fw-8" style={{ fontSize: 28, opacity: 0.35 }}>
          ؟
        </span>
      ) : null}
    </div>
  );
}

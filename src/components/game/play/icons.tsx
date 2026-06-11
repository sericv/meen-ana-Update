export function IconSend({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M1.5 9L16.5 1.5l-3 7.5 3 7.5L1.5 9z" fill={color} />
    </svg>
  );
}

export function IconBulb({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return <IconHintBulb size={size} variant="flat" color={color} />;
}

/** لمبة تلميح — أسلوب رسومي موحّد للزر والشارة */
export function IconHintBulb({
  size = 32,
  variant = "illustrated",
  color = "currentColor",
}: {
  size?: number;
  variant?: "flat" | "illustrated";
  color?: string;
}) {
  const h = Math.round(size * 1.12);
  if (variant === "flat") {
    return (
      <svg width={size} height={h} viewBox="0 0 20 22" fill="none" aria-hidden>
        <path
          d="M10 1.5a6.5 6.5 0 00-4 11.6c.7.6 1 1.4 1 2.3v1.1h6v-1.1c0-.9.3-1.7 1-2.3A6.5 6.5 0 0010 1.5z"
          fill={color}
        />
        <rect x="7" y="17.5" width="6" height="2" rx="1" fill={color} />
      </svg>
    );
  }
  return (
    <svg width={size} height={h} viewBox="0 0 40 44" fill="none" aria-hidden>
      <defs>
        <linearGradient id="hintBulbGlass" x1="10" y1="4" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF9E8" />
          <stop offset="0.45" stopColor="#FFE08A" />
          <stop offset="1" stopColor="#F2B544" />
        </linearGradient>
        <linearGradient id="hintBulbBase" x1="14" y1="32" x2="26" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8C878" />
          <stop offset="1" stopColor="#B88820" />
        </linearGradient>
        <radialGradient id="hintBulbGlow" cx="0" cy="0" r="1" gradientTransform="translate(20 14) scale(14)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF6C8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFB84A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="14" rx="14" ry="12" fill="url(#hintBulbGlow)" opacity="0.55" />
      <path
        d="M20 5.5c-5.2 0-9.2 4.1-9.2 9.1 0 2 .7 3.5 1.6 4.6.8.9 1.2 2 1.2 3.2v1.6h12.8v-1.6c0-1.2.4-2.3 1.2-3.2.9-1.1 1.6-2.6 1.6-4.6 0-5-4-9.1-9.2-9.1z"
        fill="url(#hintBulbGlass)"
        stroke="#C8881F"
        strokeWidth="1.2"
      />
      <path
        d="M14.5 11.5c2.2-1.8 5.8-1.5 7.8.8"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="13" y="33" width="14" height="4.5" rx="2" fill="url(#hintBulbBase)" stroke="#9A6A18" strokeWidth="0.8" />
      <rect x="15.5" y="37.5" width="9" height="2" rx="1" fill="#7A5010" opacity="0.35" />
      <path d="M17 24.5h6" stroke="#E8A830" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function IconClose({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconMic({ size = 12, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="5" y="2" width="6" height="9" rx="3" stroke={color} strokeWidth="1.5" />
      <path d="M3 8a5 5 0 0010 0M8 13v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconFwd({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4 10h10M11 6l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconStar({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden>
      <path
        d="M11 2l2.4 5.8 6.3.5-4.8 4.1 1.5 6.1L11 15.8 7.6 18.5l1.5-6.1-4.8-4.1 6.3-.5L11 2z"
        fill={color}
      />
    </svg>
  );
}

export function IconCheck({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCross({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconTarget({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}

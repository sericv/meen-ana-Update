"use client";

import type { TacticalToolId } from "@/lib/profile/tactical-tools";

const stroke = "currentColor";

export function TacticalToolIcon({ id, size = 22 }: { id: TacticalToolId; size?: number }) {
  switch (id) {
    case "extra_time":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="13" r="8" stroke={stroke} strokeWidth="1.8" />
          <path d="M12 9v5l3 2" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 3h6M12 3v2" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "time_pressure":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3M5.6 18.4l2.1-2.1M12 21v-3M18.4 18.4l-2.1-2.1M21 12h-3M18.4 5.6l-2.1 2.1"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M8 14h8l-1.5-4H9.5L8 14z" fill={stroke} fillOpacity="0.25" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );
    case "extra_question":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="5" width="14" height="11" rx="2.5" stroke={stroke} strokeWidth="1.8" />
          <path d="M8 9h6M8 12h4" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="18" cy="16" r="4" stroke={stroke} strokeWidth="1.6" />
          <path d="M18 14.5v3M16.8 16h2.4" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3l7 3v6c0 5-3 8-7 9-4-1-7-4-7-9V6l7-3z"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <path d="M9 12l2 2 4-4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

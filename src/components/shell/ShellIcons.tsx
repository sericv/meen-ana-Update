type IconProps = { name: string; size?: number; color?: string };

export function ShellIcon({ name, size = 20, color = "currentColor" }: IconProps) {
  const s = size;
  switch (name) {
    case "bell":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3a5 5 0 00-5 5v2.5L5 13v1h14v-1l-2-2.5V8a5 5 0 00-5-5zM10 19h4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "plus":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case "search":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="6" stroke={color} strokeWidth="2" />
          <path d="M16 16l5 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "shop":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 9l1.5-4h11L19 9v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9z"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M5 9h14" stroke={color} strokeWidth="2" />
        </svg>
      );
    case "trophy":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M8 4h8v3a4 4 0 01-8 0V4zM6 4H4v2a2 2 0 002 2M18 4h2v2a2 2 0 01-2 2M12 11v3M9 20h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "play":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 7l10 5-10 5V7z" fill={color} />
        </svg>
      );
    case "swords":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 20L9 9m0 0l3-3 3 3m-3-3v11M20 4l-5 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "friends":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="9" cy="8" r="3" stroke={color} strokeWidth="2" />
          <path d="M3 19c0-3 2.7-5 6-5M15 11a3 3 0 100-6M21 19c0-2.5-2-4.5-4.5-4.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "user":
    case "home":
      return name === "home" ? (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="9" r="4" stroke={color} strokeWidth="2" />
          <path d="M5 21v-1.2C5 16.3 8.1 14 12 14s7 2.3 7 5.8V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "back":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 6l-6 6 6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "settings":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "sparkle":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" fill={color} />
        </svg>
      );
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3l2.4 6.8H22l-5.8 4.2 2.2 6.8L12 16.8 5.6 21l2.2-6.8L2 9.8h7.6L12 3z" fill={color} />
        </svg>
      );
    case "flame":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3c2 4 4 5 4 9a4 4 0 11-8 0c0-4 2-5 4-9z"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "lightbulb":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 18h6M10 22h4M12 3a5 5 0 00-3 9.2V15h6v-2.8A5 5 0 0012 3z" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "close":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "copy":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="8" y="8" width="12" height="12" rx="2" stroke={color} strokeWidth="2" />
          <path d="M6 16V6a2 2 0 012-2h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "share":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v10M8 9l4-4 4 4M6 19h12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "check":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 12l5 5L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chat":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 6h16v10H8l-4 4V6z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "sound":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M8 10v4h4l5 4V6l-5 4H8z" fill={color} />
        </svg>
      );
    case "image":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="2" />
          <circle cx="9" cy="10" r="1.5" fill={color} />
          <path d="M3 16l5-5 4 4 3-3 6 6" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    default:
      return <span style={{ width: s, height: s }} aria-hidden />;
  }
}

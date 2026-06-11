"use client";

import { useEffect, useState } from "react";

export function ShellStatusBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit", hour12: false }),
      );
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="statusbar" aria-hidden>
      <span>{time || "٩:٤١"}</span>
      <span className="icons">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
          <rect x="0" y="8" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5" width="3" height="7" rx="0.5" />
          <rect x="9" y="2" width="3" height="10" rx="0.5" />
          <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" />
        </svg>
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden>
          <path d="M1 4.5C4.5 1 13.5 1 17 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M3.5 7.5C6 5.5 12 5.5 14.5 7.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="9" cy="10" r="1.5" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="currentColor" aria-hidden>
          <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke="currentColor" fill="none" />
          <rect x="2" y="2" width="17" height="8" rx="1.5" />
          <rect x="23" y="4" width="2.5" height="4" rx="1" />
        </svg>
      </span>
    </div>
  );
}

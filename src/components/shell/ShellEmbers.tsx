"use client";

import { useMemo } from "react";

export function ShellEmbers({ count = 10 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 13 + 7) % 96}%`,
        delay: `${(i % 5) * 0.9}s`,
        dur: `${3.2 + (i % 4) * 0.7}s`,
        dx: `${(i % 2 === 0 ? 1 : -1) * (8 + (i % 5) * 4)}px`,
      })),
    [count],
  );

  return (
    <div className="embers" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="ember"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.dur,
            ["--dx" as string]: p.dx,
          }}
        />
      ))}
    </div>
  );
}

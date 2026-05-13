/**
 * Gameplay routes need a single in-flow column whose height tracks the
 * VisualViewport (`--app-vh`). Nesting a second `position:fixed` shell with
 * the same height as the document often produces empty bands on mobile Safari
 * when the soft keyboard opens/closes.
 */
export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="room-viewport-host flex h-[var(--app-vh,100dvh)] min-h-0 w-full max-w-[100vw] flex-col overflow-hidden overscroll-none">
      {children}
    </div>
  );
}

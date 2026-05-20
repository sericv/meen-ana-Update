/** Shown while the room gameplay bundle loads. */
export function RoomRouteLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6" aria-busy>
      <div className="route-loading-spinner" />
      <p className="text-sm font-semibold text-[#9b6338]">جاري تحميل الغرفة…</p>
    </div>
  );
}

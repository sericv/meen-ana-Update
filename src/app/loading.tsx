/** Instant feedback while the next route chunk loads. */
export default function RootLoading() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6"
      aria-busy
      aria-label="جاري التحميل"
    >
      <div className="route-loading-spinner" />
      <p className="text-sm font-semibold text-[#9b6338]">جاري التحميل…</p>
    </div>
  );
}

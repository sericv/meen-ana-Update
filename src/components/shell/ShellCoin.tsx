export function ShellCoin({
  value,
  compact = false,
}: {
  value: number | string;
  /** Smaller padding for tight cards (shop grid, etc.). */
  compact?: boolean;
}) {
  const text = typeof value === "number" ? value.toLocaleString("en-US") : value;
  return (
    <span className={compact ? "coin coin-compact" : "coin"} title={String(text)}>
      <span className="coin-ico" aria-hidden />
      <span className="coin-value">{text}</span>
    </span>
  );
}

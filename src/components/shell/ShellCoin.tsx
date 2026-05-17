export function ShellCoin({ value }: { value: number | string }) {
  return (
    <span className="coin">
      <span className="coin-ico" aria-hidden />
      {typeof value === "number" ? value.toLocaleString("ar") : value}
    </span>
  );
}

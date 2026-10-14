/** Values longer than 8 characters (e.g. "66 / 90 / 14") step down one size and never wrap (B4 ruling). */
const LONG_VALUE = 8;

export function StatTile({ value, label }: { value: string; label: string }) {
  const statClass = value.length > LONG_VALUE ? "t-mono-stat t-mono-stat-long" : "t-mono-stat";
  return <div className="stat-tile"><p className={statClass}>{value}</p><p className="t-small">{label}</p></div>;
}

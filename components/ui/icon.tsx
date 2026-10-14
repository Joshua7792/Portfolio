/* Spec §6.17: inline SVG, stroke currentColor, width 2, round caps and joins, fill none. viewBox 0 0 20 20,
   except close (viewBox 24, drawn at 24). Icons are always decorative: the link or button text names the action. */
const paths = {
  download: "M10 3v10M6 9l4 4 4-4M4 16h12",
  "arrow-right": "M4 10h12M11 5l5 5-5 5",
  "arrow-left": "M16 10H4M9 5l-5 5 5 5",
  "arrow-up-right": "M6 14L14 6M7 6h7v7",
  external: "M11 3h6v6M17 3l-8 8M15 12v5H3V5h5",
  close: "M6 6l12 12M18 6L6 18",
} as const;

export type IconName = keyof typeof paths;

/** One decorative stroke icon by name (spec §6.17). Size comes from the attributes below or the caller's CSS. */
export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const box = name === "close" ? 24 : 20;
  return (
    <svg aria-hidden="true" className={className || undefined} focusable="false" width={box} height={box} viewBox={`0 0 ${box} ${box}`}
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

/** Spec §6.1 / §6.2: the download icon every Resume pill carries, with the pill's icon hover classes. */
export function DownloadIcon() {
  return <Icon className="button-icon icon-download" name="download" />;
}

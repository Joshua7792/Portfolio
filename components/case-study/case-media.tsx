import Image from "next/image";
import styles from "./case-media.module.css";

type CaseMediaProps = {
  src: string;
  alt: string;
  available: boolean;
  sizes: string;
  ratio?: "cover" | "wide";
  /** Above-the-fold LCP image: preloaded and fetched at high priority. */
  preload?: boolean;
  unoptimized?: boolean;
  className?: string;
};

/** One media box per spec §6.16: the real file, or a same-size placeholder that names the public path. */
export function CaseMedia({ src, alt, available, sizes, ratio = "cover", preload = false, unoptimized = false, className = "" }: CaseMediaProps) {
  const label = src.replace(/^\/+/, "");
  return (
    <div className={`${styles.box} ${ratio === "wide" ? styles.wide : styles.cover} ${className}`.trim()}>
      {available
        ? <Image alt={alt} className={styles.image} fetchPriority={preload ? "high" : undefined} fill preload={preload} sizes={sizes} src={src} unoptimized={unoptimized} />
        : <div aria-label={`Placeholder for ${label}`} className={styles.placeholder} role="img"><span className="t-mono-ph">{label}</span></div>}
    </div>
  );
}

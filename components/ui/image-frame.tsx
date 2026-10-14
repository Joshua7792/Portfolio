import Image from "next/image";
import { assetExists, requireAsset } from "@/lib/assets";

type ImageFrameProps = {
  src: string;
  alt: string;
  className?: string;
  /** Above-the-fold LCP image: preloaded and fetched at high priority. */
  priority?: boolean;
  /** The page cannot ship without it: a production build fails when the file is missing (lib/assets requireAsset). */
  required?: boolean;
  placeholderLabel?: string;
  sizes?: string;
};

/** Spec §6.5 / §6.16 image frame: the real file, or a same-size placeholder that names the public path. */
export function ImageFrame({ src, alt, className = "", priority = false, required = false, placeholderLabel, sizes = "(min-width: 1024px) 50vw, 100vw" }: ImageFrameProps) {
  const available = required ? requireAsset(src) : assetExists(src);
  return (
    <div className={`image-frame ${className}`.trim()}>
      {available ? <Image alt={alt} fetchPriority={priority ? "high" : undefined} fill preload={priority} sizes={sizes} src={src} /> :
        <div aria-label={`Placeholder for ${src}`} className="placeholder" role="img"><span className="t-mono-ph">{placeholderLabel ?? src}</span></div>}
    </div>
  );
}

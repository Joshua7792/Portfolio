import { NewTabHint } from "@/components/ui/new-tab-hint";
import { Reveal } from "@/components/ui/reveal";
import type { EvidenceItem } from "./case-assets";
import { CaseMedia } from "./case-media";
import { CaseSection } from "./case-section";
import { Walkthrough } from "./walkthrough";
import styles from "./evidence-gallery.module.css";

const HALF = "(min-width: 1440px) 640px, (min-width: 1024px) calc(50vw - 80px), calc(100vw - 40px)";
const FULL = "(min-width: 1440px) 1312px, (min-width: 1024px) calc(100vw - 128px), calc(100vw - 40px)";

function Media({ item, sizes }: { item: EvidenceItem; sizes: string }) {
  // The figcaption is the text alternative, so the image alt is empty (r3 N-3: no double announcement).
  if (item.poster && item.available) return <Walkthrough className={styles.media} gif={item.src} poster={item.poster} sizes={sizes} />;
  const media = <CaseMedia alt="" available={item.available} className={styles.media} sizes={sizes} src={item.src} />;
  if (!item.available) return media;
  // Phase 3 ruling F8: screenshots are dense at 640x400, so each opens full size in a new tab.
  return (
    <a className={styles.open} href={item.src} rel="noopener" target="_blank">
      {media}
      <span className="sr-only">Open full-size image</span><NewTabHint />
    </a>
  );
}

/** Spec §7.3 evidence grid: 2 columns of 640x400, row gap 48; an odd count makes figure 1 full width (1312x820). */
export function EvidenceGallery({ items }: { items: EvidenceItem[] }) {
  if (items.length === 0) return null;
  const oddCount = items.length % 2 === 1;
  return (
    <CaseSection heading="Evidence" id="evidence">
      <div className={styles.grid}>
        {items.map((item, index) => {
          const full = oddCount && index === 0;
          return (
            <Reveal className={`${styles.cell} ${full ? styles.full : ""}`.trim()} index={index} key={item.src}>
              <figure className={styles.figure}>
                <Media item={item} sizes={full ? FULL : HALF} />
                <figcaption className={`t-mono-label ${styles.caption}`}>{item.caption}</figcaption>
              </figure>
            </Reveal>
          );
        })}
      </div>
    </CaseSection>
  );
}

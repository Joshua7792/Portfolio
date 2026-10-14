import Image from "next/image";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import type { CaseStudy } from "@/content/schema";
import { architectureDiagram } from "./case-assets";
import { CaseSection } from "./case-section";
import styles from "./architecture.module.css";

/**
 * Spec §7.3 diagram slot. Phase 3 ruling S1 overrules §14.6: with no architecture.svg, the architecture paragraph is
 * ordinary section prose, exactly like Problem (no box, no caption).
 */
export function Architecture({ study }: { study: CaseStudy }) {
  const diagram = architectureDiagram(study);
  const intro = <p className="t-body">{study.architecture}</p>;

  if (!diagram) return <CaseSection heading="Architecture" id="architecture" intro={intro} />;

  return (
    <CaseSection heading="Architecture" id="architecture" intro={intro}>
      <figure className={styles.figure}>
        <div className={styles.slot}>
          <div className={styles.canvas}>
            <Image alt={`${diagram.title}. ${diagram.description}`} className={styles.image} fill
              sizes="(min-width: 1440px) 1213px, (min-width: 1024px) calc(100vw - 227px), calc(100vw - 75px)" src={diagram.src} unoptimized />
          </div>
        </div>
        <figcaption className={`t-mono-label ${styles.caption}`}>
          <span>{diagram.title}</span>
          <a className={`text-link ${styles.open}`} href={diagram.src} rel="noopener" target="_blank">Open diagram<NewTabHint /></a>
        </figcaption>
      </figure>
    </CaseSection>
  );
}

import type { CaseStudy } from "@/content/schema";
import { Reveal } from "@/components/ui/reveal";
import { StatTile } from "@/components/ui/stat-tile";
import { CaseSection } from "./case-section";
import styles from "./results.module.css";

/** Spec §7.3 results: three stat tiles (§6.14) in cols 1-4 / 5-8 / 9-12, 416 wide with a 32 gap; stacked below 1024. */
export function Results({ study }: { study: CaseStudy }) {
  return (
    <CaseSection heading="Results" id="results">
      <ul className={styles.grid}>
        {study.results.map((result, index) => (
          <li className={styles.item} key={result.label}>
            <Reveal className={styles.tile} index={index}>
              <StatTile label={result.label} value={result.value} />
            </Reveal>
          </li>
        ))}
      </ul>
    </CaseSection>
  );
}

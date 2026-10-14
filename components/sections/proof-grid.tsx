import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { site } from "@/content/site";
import styles from "./proof-grid.module.css";

/* Spec §14.8: the column labels are literal, not content-owned. */
const ASKS_LABEL = "What the job asks";
const BUILT_LABEL = "What I built";

const projectTitles = new Map(site.work.projects.map((project) => [project.slug, project.title]));

/** The schema already rejects a proof row that targets no case study; this keeps a broken link from rendering a raw slug. */
function caseTitle(slug: string): string {
  const title = projectTitles.get(slug);
  if (!title) throw new Error(`Proof row links to an unknown case study: ${slug}`);
  return title;
}

/** Spec §6.12 / §7.1 proof grid on forest: each row is one link from a job requirement to the case study that meets it. */
export function ProofGrid() {
  const { heading, rows } = site.proofGrid;
  return (
    <section aria-labelledby="proof-heading" className={`band-forest ${styles.section}`} data-surface="dark" id="proof">
      <div className="container">
        <h2 className={`t-h2 ${styles.heading}`} id="proof-heading">{heading}</h2>
        <div aria-hidden="true" className={styles.header}>
          <p className={`t-mono-label ${styles.asks}`}>{ASKS_LABEL}</p>
          <p className={`t-mono-label ${styles.built}`}>{BUILT_LABEL}</p>
        </div>
        <ul className={styles.rows}>
          {rows.map((row, index) => {
            const slug = row.href.slice("/work/".length);
            return (
              <li key={`${row.href}-${row.label}`}>
                <Reveal index={index}>
                  <Link className={styles.row} href={row.href}>
                    <div className={styles.asks}>
                      <p className={`t-mono-label ${styles.rowLabel}`}>{ASKS_LABEL}</p>
                      <p className={`t-lead ${styles.asksText}`}>{row.asks}</p>
                    </div>
                    <div className={styles.built}>
                      <p className={`t-mono-label ${styles.rowLabel}`}>{BUILT_LABEL}</p>
                      <h3 className={`t-h3 ${styles.builtText}`}>{row.built}</h3>
                      <p className={`t-mono-label ${styles.caseName}`}>
                        {caseTitle(slug)}
                        <Icon className={styles.inlineIcon} name="arrow-right" />
                      </p>
                    </div>
                    <span aria-hidden="true" className={styles.circle}><Icon className={styles.circleIcon} name="arrow-right" /></span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

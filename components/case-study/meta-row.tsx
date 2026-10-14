import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import { stackItems, type CaseStudy } from "@/content/schema";
import styles from "./meta-row.module.css";

/** Spec §7.3 meta band: Role, Stack, Period, Links. With no links, Stack takes the fourth column so no cell sits empty. */
export function MetaRow({ study }: { study: CaseStudy }) {
  const { repo, demo } = study.links;
  const hasLinks = Boolean(repo || demo);
  return (
    <section aria-label="Project details" className={styles.band} data-surface="light">
      <dl className={`container ${styles.grid}`}>
        <div className={styles.cell}>
          <dt className="t-mono-label">Role</dt>
          <dd className="t-body">{study.role}</dd>
        </div>
        <div className={`${styles.cell} ${styles.stack} ${hasLinks ? "" : styles.wide}`.trim()}>
          <dt className="t-mono-label">Stack</dt>
          <dd className="t-body">{stackItems(study.stack).join(", ")}</dd>
        </div>
        <div className={`${styles.cell} ${styles.period}`}>
          <dt className="t-mono-label">Period</dt>
          <dd className="t-body">{study.period}</dd>
        </div>
        {hasLinks && <div className={`${styles.cell} ${styles.linksCell}`}>
          <dt className="t-mono-label">Links</dt>
          <dd className={`t-body ${styles.links}`}>
            {demo && <Link className={`text-link ${styles.link}`} href={demo} prefetch={false}>Interactive demo<Icon className={styles.linkIcon} name="arrow-right" /></Link>}
            {repo && <a className={`text-link ${styles.link}`} href={repo} rel="noopener noreferrer" target="_blank">Source on GitHub<NewTabHint /><Icon className={styles.linkIcon} name="external" /></a>}
          </dd>
        </div>}
      </dl>
    </section>
  );
}

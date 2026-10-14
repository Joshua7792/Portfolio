import Link from "next/link";
import type { CaseStudy } from "@/content/schema";
import { Sparkle } from "@/components/ui/sparkle";
import { StatusBadge } from "@/components/ui/status-badge";
import { Icon } from "@/components/ui/icon";
import styles from "./case-header.module.css";

type CaseHeaderProps = { study: CaseStudy; lead: string };

/** Spec §7.3 / §7.4 header band: back link, status badge, h1, lead. */
export function CaseHeader({ study, lead }: CaseHeaderProps) {
  return (
    <section aria-labelledby="case-title" className={`band-forest ${styles.header}`} data-surface="dark">
      <div aria-hidden="true" className={styles.sparkles}>
        <Sparkle className={styles.sparkleLarge} size={80} />
        <Sparkle className={styles.sparkleSmall} size={32} />
        <Sparkle className={styles.sparkleMobile} size={40} />
      </div>
      <div className={`container ${styles.inner}`}>
        <Link className={`t-mono-label ${styles.back}`} href="/#work">
          <Icon className={styles.backIcon} name="arrow-left" />
          <span>All work</span>
        </Link>
        <div className={styles.badge}><StatusBadge status={study.status} /></div>
        <h1 className={`t-h1 ${styles.title}`} id="case-title">{study.title}</h1>
        <p className={`t-lead ${styles.lead}`}>{lead}</p>
      </div>
    </section>
  );
}

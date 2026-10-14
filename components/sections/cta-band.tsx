import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@/components/ui/icon";
import { Sparkle } from "@/components/ui/sparkle";
import { site } from "@/content/site";
import styles from "./cta-band.module.css";

/** Spec §7.1 / §7.2 resume band on amber. Spec §14.3: one resume path everywhere, read from content. */
export function CtaBand() {
  const { heading, body, buttonLabel, note } = site.cta;
  return (
    <section aria-labelledby="cta-heading" className={`band-amber ${styles.section}`} data-surface="light" id="resume">
      <div className={`container ${styles.inner}`}>
        <Sparkle className={styles.sparkLarge} size={64} />
        <Sparkle className={styles.sparkSmall} size={32} />
        <Sparkle className={styles.sparkMobile} size={40} />
        <div className={styles.copy}>
          <h2 className={`t-h2 ${styles.heading}`} id="cta-heading">{heading}</h2>
          <p className={`t-body ${styles.body}`}>{body}</p>
        </div>
        <div className={styles.actions}>
          {/* `download` without target="_blank": with both, Firefox can leave an empty tab behind (r1-react N6). */}
          <Button aria-describedby="cta-note" className={styles.button} download href={site.meta.links.resumePdf} size="lg" variant="inverse">
            <span>{buttonLabel}</span>
            <DownloadIcon />
          </Button>
          <p className={`t-mono-label ${styles.note}`} id="cta-note">{note}</p>
        </div>
      </div>
    </section>
  );
}

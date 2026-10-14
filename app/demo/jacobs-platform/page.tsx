import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/sections/cta-band";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Sparkle } from "@/components/ui/sparkle";
import { site } from "@/content/site";
import { assetExists } from "@/lib/assets";
import { getCase } from "@/lib/cases";
import styles from "./demo.module.css";

const SLUG = "jacobs-reporting-platform";
const DEMO_SRC = "/demo/jacobs-platform/index.html";
const PAGE_PATH = "/demo/jacobs-platform";

function demoContent() {
  const found = getCase(SLUG);
  if (!found) throw new Error("The Jacobs reporting platform content is missing.");
  return found;
}

/** Own title, canonical and social card, so a shared demo link does not show the home page preview. */
export function generateMetadata(): Metadata {
  const { study, project } = demoContent();
  const title = `${study.title} demo | ${site.meta.name}`;
  const image = { url: `/work/${SLUG}/cover.webp`, alt: project.coverAlt };
  return {
    title,
    description: project.oneLine,
    alternates: { canonical: PAGE_PATH },
    openGraph: { title, description: project.oneLine, type: "website", siteName: site.meta.name, url: PAGE_PATH, images: [image] },
    twitter: { card: "summary_large_image", title, description: project.oneLine, images: [image.url] },
  };
}

/** Spec §7.5 demo shell: sticky synthetic-data banner, forest header, framed iframe (or the §6.16 placeholder). */
export default function JacobsPlatformDemoPage() {
  const { study, project } = demoContent();
  const available = assetExists(DEMO_SRC);

  return <>
    <aside aria-label="Data notice" className={styles.banner} data-surface="light">
      <div className={`container ${styles.bannerInner}`}>
        <Sparkle className={styles.bannerSparkle} size={16} />
        <p className="t-mono-label">Synthetic data. Structure identical to production.</p>
      </div>
    </aside>
    <section aria-labelledby="demo-title" className={`band-forest ${styles.header}`} data-surface="dark">
      <div className="container">
        <Link className={`t-mono-label ${styles.back}`} href={`/work/${SLUG}`} prefetch={false}>
          <Icon className={styles.backIcon} name="arrow-left" />
          <span>Case study</span>
        </Link>
        <h1 className={`t-h1 ${styles.title}`} id="demo-title">{study.title}</h1>
        <p className={`t-lead ${styles.lead}`}>{project.oneLine}</p>
        {available && <Button className={styles.fullScreen} href={DEMO_SRC} size="md" target="_blank" variant="secondary">
          <Icon className="button-icon" name="external" />
          <span>Open full screen</span>
        </Button>}
      </div>
    </section>
    <section aria-label="Interactive demo" className={styles.frameBand} data-surface="light">
      <div className="container">
        <p className={`t-mono-label ${styles.mobileNote}`}>Best viewed on desktop.</p>
        {available
          ? <div className={styles.frame}>
              <iframe className={styles.iframe} loading="lazy" sandbox="allow-scripts" src={DEMO_SRC}
                title={`${study.title}, synthetic data`} />
            </div>
          : <div aria-label={`Placeholder for ${DEMO_SRC.slice(1)}`} className={`${styles.frame} ${styles.placeholder}`} role="img">
              <span className="t-mono-ph">{DEMO_SRC.slice(1)}</span>
            </div>}
        <p className={`t-mono-label ${styles.caption}`}>{study.demoNote}</p>
      </div>
    </section>
    <CtaBand />
  </>;
}

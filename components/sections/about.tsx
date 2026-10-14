import { Chip } from "@/components/ui/chip";
import { ImageFrame } from "@/components/ui/image-frame";
import { Sparkle } from "@/components/ui/sparkle";
import { site } from "@/content/site";
import styles from "./about.module.css";

const { about } = site;

// Spec §7.1 / §7.2 about rows. No scroll reveal: headings and paragraphs stay still (spec §8).
export function About() {
  return (
    <section aria-labelledby="about-heading" className={styles.about} data-surface="light" id="about">
      <div className={`container ${styles.grid}`}>
        <div className={styles.text}>
          <h2 className="t-h2" id="about-heading">{about.heading}</h2>
          <p className={`t-lead ${styles.bio}`}>{about.bio}</p>
          <ul className={styles.chips}>
            {about.chips.map((chip) => <li key={chip}><Chip>{chip}</Chip></li>)}
          </ul>
        </div>
        <div className={styles.photo}>
          <div aria-hidden="true" className={styles.block} />
          <ImageFrame alt={about.portraitAlt} className={styles.frame} required sizes="(min-width: 1024px) 304px, (min-width: 768px) 320px, 240px"
            src="/images/about-portrait.webp" />
          <Sparkle className={styles.sparkle} size={40} />
        </div>
      </div>
    </section>
  );
}

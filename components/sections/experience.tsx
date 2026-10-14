import { Reveal } from "@/components/ui/reveal";
import { Sparkle } from "@/components/ui/sparkle";
import { site } from "@/content/site";
import styles from "./experience.module.css";

/** Spec §6.13 / §7.1 timeline on ink. The schema caps bullets at 3, so every bullet in content renders. */
export function Experience() {
  const { heading, entries } = site.experience;
  return (
    <section aria-labelledby="experience-heading" className={`band-ink ${styles.section}`} data-surface="dark" id="experience">
      <div className={`container ${styles.layout}`}>
        <h2 className={`t-h2 ${styles.heading}`} id="experience-heading">{heading}</h2>
        <ol className={styles.timeline}>
          {entries.map((entry, index) => (
            <li key={`${entry.company}-${entry.role}`}>
              <Reveal className={styles.item} index={index}>
                <p className={`t-mono-label ${styles.date}`}>{entry.period}</p>
                <div aria-hidden="true" className={styles.rail}><Sparkle className={styles.spark} size={16} /></div>
                <div className={styles.content}>
                  <h3 className={`t-h3 ${styles.role}`}>{entry.role}</h3>
                  <p className={`t-body ${styles.company}`}>{entry.company}, {entry.location}</p>
                  <ul className={styles.bullets}>
                    {entry.bullets.map((bullet) => <li className="t-body" key={bullet}>{bullet}</li>)}
                  </ul>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

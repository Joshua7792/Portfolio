import { Reveal } from "@/components/ui/reveal";
import { Sparkle } from "@/components/ui/sparkle";
import { site } from "@/content/site";
import styles from "./education.module.css";

/** Content stores each certification as "Name, Date"; the date is the last comma-separated part. */
function splitCertification(item: string): { name: string; date: string } {
  const cut = item.lastIndexOf(", ");
  return cut === -1 ? { name: item, date: "" } : { name: item.slice(0, cut), date: item.slice(cut + 2) };
}

/** Spec §7.1 / §7.2 education and certifications on cream. */
export function Education() {
  const { education, certifications } = site;
  return (
    <section aria-labelledby="education-heading" className={`band-cream ${styles.section}`} data-surface="light" id="education">
      <div className="container">
        <h2 className={`t-h2 ${styles.heading}`} id="education-heading">{education.heading}</h2>
        <div className={styles.columns}>
          <ul className={`${styles.list} ${styles.educationList}`}>
            {education.entries.map((entry, index) => (
              <li key={`${entry.school}-${entry.credential}`}>
                <Reveal className={styles.eduRow} index={index}>
                  <p className={`t-mono-label ${styles.date}`}>{entry.period}</p>
                  <h3 className={`t-h4 ${styles.degree}`}>{entry.credential}</h3>
                  <p className={`t-small ${styles.muted}`}>{entry.school}</p>
                  {entry.line ? <p className={`t-small ${styles.muted}`}>{entry.line}</p> : null}
                </Reveal>
              </li>
            ))}
          </ul>
          <h3 className={`t-h3 ${styles.certHeading}`}>{certifications.heading}</h3>
          <ul className={`${styles.list} ${styles.certList}`}>
            {certifications.items.map((item, index) => {
              const { name, date } = splitCertification(item);
              return (
                <li key={item}>
                  <Reveal className={styles.certRow} index={index}>
                    <Sparkle className={styles.spark} size={16} />
                    <p className={`t-body ${styles.certName}`}>{name}</p>
                    {date ? <p className={`t-mono-label ${styles.date} ${styles.certDate}`}>{date}</p> : null}
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

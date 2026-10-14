import { Reveal } from "@/components/ui/reveal";
import { site } from "@/content/site";
import styles from "./featured-work.module.css";
import { ProjectCard } from "./project-card";

/** §7.1 work band: the four `featured` projects as a 2x2 grid, the rest as a compact 1x4 row (the schema enforces four). */
export function FeaturedWork() {
  const { sectionHeading, projects } = site.work;
  const featured = projects.filter((project) => project.featured);
  const compact = projects.filter((project) => !project.featured);
  return (
    <section aria-labelledby="work-heading" className={`band-cream ${styles.section}`} data-surface="light" id="work">
      <div className="container">
        <h2 className={`t-h2 ${styles.heading}`} id="work-heading">{sectionHeading}</h2>
        <ul className={styles.featuredGrid}>
          {featured.map((project, index) => (
            <li key={project.slug}>
              <Reveal index={index % 2}><ProjectCard project={project} variant="featured" /></Reveal>
            </li>
          ))}
        </ul>
        <ul className={styles.compactGrid}>
          {compact.map((project, index) => (
            <li key={project.slug}>
              <Reveal index={index}><ProjectCard project={project} variant="compact" /></Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

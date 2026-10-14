import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ImageFrame } from "@/components/ui/image-frame";
import { StatusBadge } from "@/components/ui/status-badge";
import { stackItems, type Project } from "@/content/schema";
import styles from "./project-card.module.css";

type CardVariant = "featured" | "compact";

/* Rendered widths (spec §6.10 / §6.11): featured 640 at lg, full width below; compact 304 at lg, a 112 thumb below. */
const FEATURED_SIZES = "(min-width: 1024px) 640px, 100vw";
const COMPACT_SIZES = "(min-width: 1024px) 304px, 112px";

/** Spec §6.10: the card's stack line is comma-separated, 4 items max (the case-study meta row lists them all). */
const CARD_STACK_ITEMS = 4;

type ProjectCardProps = { project: Project; variant: CardVariant };

/** Spec §6.10 featured card / §6.11 compact card (a list row below lg). The title link's overlay makes the card one link. */
export function ProjectCard({ project, variant }: ProjectCardProps) {
  const featured = variant === "featured";
  const coverPath = `work/${project.slug}/cover.webp`;
  return (
    <article className={`${styles.card} ${featured ? styles.featured : styles.compact}`}>
      <ImageFrame alt={project.coverAlt} className={styles.cover} placeholderLabel={coverPath} required
        sizes={featured ? FEATURED_SIZES : COMPACT_SIZES} src={`/${coverPath}`} />
      <div className={styles.body}>
        <div className={styles.meta}>
          <StatusBadge status={project.status} />
          {featured ? <Icon className={styles.icon} name="arrow-up-right" /> : null}
        </div>
        <h3 className={`${featured ? "t-h3" : "t-h4"} ${styles.title}`}>
          <Link className={styles.link} href={`/work/${project.slug}`}>{project.title}</Link>
        </h3>
        <p className={`${featured ? "t-body" : "t-small"} ${styles.oneLine}`}>{project.oneLine}</p>
        {featured ? <p className={`t-mono-label ${styles.stack}`}>{stackItems(project.stack).slice(0, CARD_STACK_ITEMS).join(", ")}</p> : null}
      </div>
    </article>
  );
}

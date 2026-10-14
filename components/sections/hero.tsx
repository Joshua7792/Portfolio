import { DisplayWord } from "@/components/ui/display-word";
import { ImageFrame } from "@/components/ui/image-frame";
import { Sparkle } from "@/components/ui/sparkle";
import { site } from "@/content/site";
import { cssVars } from "@/lib/css-vars";
import { motion } from "@/lib/motion";
import styles from "./hero.module.css";

const { hero, meta, footer } = site;

/* Spec §6.6: a handle whose prefix names a profile becomes a link. The accessible name leads with the profile's own
   label from content (footer.links: "GitHub", "LinkedIn") and keeps the visible text (WCAG 2.5.3). Other handles
   ("LOC: ...") stay plain text. */
const profiles: Record<string, string> = { "GH:": meta.links.github, "LI:": meta.links.linkedin };

function profileFor(handle: string): { href: string; label: string } | null {
  const prefix = Object.keys(profiles).find((key) => handle.startsWith(key));
  if (!prefix) return null;
  const href = profiles[prefix];
  const label = footer.links.find((link) => link.href === href)?.label;
  if (!label) throw new Error(`No footer link labels the profile ${href}.`);
  return { href, label };
}

// Durations for the one orchestrated hero moment (spec §8 rows 8-13), sourced from lib/motion.
const motionVars = cssVars({
  "--hero-duration": motion.duration.hero,
  "--hero-echo-duration": motion.duration.reveal,
  "--hero-entrance-duration": motion.duration.entrance,
  "--hero-fade-duration": motion.duration.fade,
});

/** Spec §7.1 / §7.2 hero. The entrance is pure CSS from the server HTML (spec §8), so it never waits for hydration. */
export function Hero() {
  const [scrollFirst, ...scrollRest] = hero.scrollBadge.split(" ");

  return (
    <section aria-labelledby="hero-name" className={styles.hero} data-surface="dark" id="hero" style={motionVars}>
      <h1 className="sr-only" id="hero-name">{meta.name}</h1>
      <div className={`container ${styles.stage}`}>
        <DisplayWord className={styles.word} word={hero.displayWord} />
        <div className={styles.portrait}>
          <ImageFrame alt={hero.portraitAlt} className={styles.frame} priority required
            sizes="(min-width: 1024px) 416px, (min-width: 768px) 320px, 240px" src="/images/hero-portrait.webp" />
        </div>
        <div aria-hidden="true" className={styles.sparkles}>
          <Sparkle className={`${styles.sparkle} ${styles.s1}`} size={48} />
          <Sparkle className={`${styles.sparkle} ${styles.s2}`} size={28} />
          <Sparkle className={`${styles.sparkle} ${styles.s3}`} size={28} />
          <Sparkle className={`${styles.sparkle} ${styles.s4}`} size={56} />
          <Sparkle className={`${styles.sparkle} ${styles.m1}`} size={32} />
          <Sparkle className={`${styles.sparkle} ${styles.m2}`} size={24} />
        </div>
        <p className={`t-h3 ${styles.headline}`}>{hero.headline}</p>
        <ul aria-label="Profile" className={`t-mono-handle ${styles.handles}`}>
          {hero.handles.map((handle) => {
            const profile = profileFor(handle);
            return (
              <li key={handle}>
                {profile ? (
                  <a aria-label={`${profile.label}, ${handle}`} className={styles.handleLink} href={profile.href}>
                    <span className={styles.handleText}>{handle}</span>
                  </a>
                ) : handle}
              </li>
            );
          })}
        </ul>
        <div className={styles.badgeWrap}>
          <a className={`t-scroll ${styles.badge}`} href="#about">
            <span>{scrollFirst}</span> <span>{scrollRest.join(" ")}</span>
          </a>
        </div>
      </div>
    </section>
  );
}

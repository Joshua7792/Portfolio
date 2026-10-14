import type { CaseStudy } from "@/content/schema";
import { assetExists, readPublicText, requireAsset } from "@/lib/assets";

/* Asset paths follow spec §11 (relative to /public): /work/<slug>/cover.webp, NN.webp, walkthrough.gif, architecture.svg. */
const MAX_EVIDENCE_IMAGES = 6;
const WALKTHROUGH = "walkthrough.gif";

export type EvidenceItem = {
  src: string;
  caption: string;
  available: boolean;
  /** For a walkthrough GIF: the still shown until the reader presses Play (WCAG 2.2.2 ruling, spec §14.7 amended). */
  poster: string | null;
};

export function workAsset(slug: string, file: string): string {
  return `/work/${slug}/${file}`;
}

/** Every case study ships its cover; a production build fails without it (requireAsset). */
export function coverAsset(slug: string): { src: string; available: boolean } {
  const src = workAsset(slug, "cover.webp");
  return { src, available: requireAsset(src) };
}

/** A figure's caption comes from its content entry. A file on disk with no entry is a content gap, so the build fails. */
function captionFor(study: CaseStudy, file: string): string {
  const entry = study.evidence.find((item) => item.file === file);
  if (!entry) throw new Error(`work/${study.slug}/${file} exists but has no caption in content/site.ts evidence.`);
  return entry.caption;
}

/**
 * Evidence figures, decided at build time: 01.webp to 06.webp in order (stopping at the first gap), then the
 * walkthrough GIF when the content lists it and the file exists. With no files at all (draft), the listed files
 * render as §6.16 placeholders.
 */
export function evidenceItems(study: CaseStudy): EvidenceItem[] {
  const found: string[] = [];
  for (let n = 1; n <= MAX_EVIDENCE_IMAGES; n += 1) {
    const file = `${String(n).padStart(2, "0")}.webp`;
    if (!assetExists(workAsset(study.slug, file))) break;
    found.push(file);
  }
  const listsWalkthrough = study.evidence.some((entry) => entry.file === WALKTHROUGH);
  if (listsWalkthrough && assetExists(workAsset(study.slug, WALKTHROUGH))) found.push(WALKTHROUGH);

  const draft = found.length === 0;
  const files = draft ? study.evidence.map((entry) => entry.file).filter((file) => file !== "cover.webp") : found;
  const firstStill = workAsset(study.slug, "01.webp");
  const poster = assetExists(firstStill) ? firstStill : workAsset(study.slug, "cover.webp");
  return files.map((file) => {
    const src = workAsset(study.slug, file);
    return { src, caption: captionFor(study, file), available: assetExists(src), poster: file === WALKTHROUGH ? poster : null };
  });
}

export type Diagram = { src: string; title: string; description: string };

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&apos;": "'", "&#39;": "'" };

/** Text of the first <title> or <desc> element (not <titles>), whitespace collapsed and basic XML entities decoded. */
function svgText(svg: string, tag: "title" | "desc"): string {
  const match = svg.match(new RegExp(`<${tag}(?=[\\s>])[^>]*>([\\s\\S]*?)</${tag}>`));
  const raw = match?.[1] ?? "";
  return raw.replace(/&(?:amp|lt|gt|quot|apos|#39);/g, (entity) => ENTITIES[entity] ?? entity).replace(/\s+/g, " ").trim();
}

/** The architecture diagram when architecture.svg exists; its own <title> and <desc> become the caption and alt text. */
export function architectureDiagram(study: CaseStudy): Diagram | null {
  const src = workAsset(study.slug, "architecture.svg");
  if (!assetExists(src)) return null;
  const svg = readPublicText(src);
  const title = svgText(svg, "title") || study.title;
  return { src, title, description: svgText(svg, "desc") || study.architecture };
}

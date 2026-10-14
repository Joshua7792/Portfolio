import { z } from "zod";

const nonempty = z.string().min(1);
/** Profile and repository links: https only (no javascript:, data: or plain http). */
const httpsUrl = z.url({ protocol: /^https$/ });
/** Same-site paths: one leading slash, never the protocol-relative "//host" form. */
const sitePath = z.string().regex(/^\/(?!\/)\S*$/, "Must be a same-site path such as /resume/file.pdf");
const status = z.enum(["In production", "In progress", "Paper / sandbox", "Shipped"]);
const metric = z.strictObject({ value: nonempty, label: nonempty });
const slug = nonempty.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
/** Spec §6.13: up to 3 bullets per role; a fourth fails the build instead of vanishing. */
const MAX_BULLETS = 3;
/** Spec §7.1: the work band shows exactly four featured cards (2x2) and four compact ones. */
const FEATURED_COUNT = 4;

const project = z.strictObject({
  slug,
  title: nonempty,
  oneLine: nonempty,
  status,
  stack: nonempty,
  featured: z.boolean(),
  coverAlt: nonempty,
  metrics: z.array(metric).length(3),
});

const caseStudy = z.strictObject({
  slug,
  title: nonempty,
  status,
  period: nonempty,
  role: nonempty,
  stack: nonempty,
  links: z.strictObject({ repo: httpsUrl.nullable(), demo: sitePath.nullable() }),
  demoNote: z.string(),
  problem: nonempty,
  built: z.array(nonempty).min(1),
  architecture: nonempty,
  evidence: z.array(z.strictObject({ file: nonempty, caption: nonempty })).min(1),
  results: z.array(metric).length(3),
  next: nonempty,
});

/** Content stores a stack as "a; b; c". */
export function stackItems(stack: string): string[] {
  return stack.split(";").map((item) => item.trim()).filter(Boolean);
}

export const siteSchema = z.strictObject({
  meta: z.strictObject({
    siteTitle: nonempty,
    siteDescription: nonempty,
    ogTitle: nonempty,
    ogDescription: nonempty,
    name: nonempty,
    roleLine: nonempty,
    location: nonempty,
    links: z.strictObject({ github: httpsUrl, linkedin: httpsUrl, resumePdf: sitePath }),
  }),
  nav: z.strictObject({
    items: z.array(z.strictObject({ label: nonempty, href: z.string().regex(/^#[a-z][a-z0-9-]*$/) })).length(3),
    ctaDesktop: nonempty,
    ctaMobile: nonempty,
  }),
  hero: z.strictObject({ displayWord: nonempty, eyebrow: nonempty, headline: nonempty, subline: nonempty,
    handles: z.array(nonempty).length(3), scrollBadge: nonempty, portraitAlt: nonempty }),
  about: z.strictObject({ heading: nonempty, bio: nonempty, chips: z.array(nonempty).length(4), portraitAlt: nonempty }),
  proofGrid: z.strictObject({ heading: nonempty, rows: z.array(z.strictObject({ label: nonempty,
    asks: nonempty, built: nonempty, href: z.string().regex(/^\/work\/[a-z0-9-]+$/) })).length(6) }),
  work: z.strictObject({ sectionHeading: nonempty, intro: nonempty, projects: z.array(project).length(8) }),
  caseStudies: z.array(caseStudy).length(8),
  experience: z.strictObject({ heading: nonempty, entries: z.array(z.strictObject({ company: nonempty,
    role: nonempty, period: nonempty, location: nonempty, bullets: z.array(nonempty).min(1).max(MAX_BULLETS) })).length(5) }),
  education: z.strictObject({ heading: nonempty, entries: z.array(z.strictObject({ school: nonempty,
    credential: nonempty, period: nonempty, line: z.string() })).length(2) }),
  certifications: z.strictObject({ heading: nonempty, items: z.array(nonempty).length(4) }),
  cta: z.strictObject({ heading: nonempty, body: nonempty, buttonLabel: nonempty, note: nonempty }),
  footer: z.strictObject({ giantWord: nonempty, line: nonempty,
    links: z.array(z.strictObject({ label: nonempty, href: z.union([httpsUrl, sitePath]) })).length(3) }),
  alsoBuilt: z.strictObject({ heading: nonempty, items: z.array(z.strictObject({ title: nonempty,
    description: z.string(), href: httpsUrl.nullable() })).length(4) }),
}).superRefine((data, context) => {
  const issue = (message: string) => context.addIssue({ code: "custom", message });
  const projects = data.work.projects;
  const cases = data.caseStudies;
  const projectSlugs = new Set(projects.map((item) => item.slug));
  const caseSlugs = new Set(cases.map((item) => item.slug));
  if (projectSlugs.size !== 8 || caseSlugs.size !== 8 || [...projectSlugs].some((value) => !caseSlugs.has(value))) {
    issue("Project and case-study slugs must match uniquely");
  }
  // Pagination walks caseStudies; the cards walk projects. One order keeps "next" equal to the next card.
  if (projects.some((item, index) => cases[index]?.slug !== item.slug)) issue("caseStudies must follow work.projects order");
  if (projects.filter((item) => item.featured).length !== FEATURED_COUNT) issue(`Exactly ${FEATURED_COUNT} projects must be featured`);
  for (const item of projects) {
    const study = cases.find((entry) => entry.slug === item.slug);
    if (!study) continue;
    if (study.title !== item.title) issue(`${item.slug}: card and case-study titles differ`);
    if (study.status !== item.status) issue(`${item.slug}: card and case-study statuses differ`);
    // The case-study stack is the long form; every card stack item must appear in it. A card item may join two
    // tools with "and" ("Jest and Playwright") where the long form lists them apart ("Jest; Playwright with axe").
    const caseStack = stackItems(study.stack);
    const listed = (entry: string) => caseStack.some((value) => value === entry || value.startsWith(`${entry} `));
    const missing = stackItems(item.stack).filter((entry) => !listed(entry) && !entry.split(/\s+and\s+/).every(listed));
    if (missing.length > 0) issue(`${item.slug}: card stack items missing from the case study: ${missing.join(", ")}`);
  }
  if (data.proofGrid.rows.some((row) => !projectSlugs.has(row.href.slice("/work/".length)))) {
    issue("Proof links must target a case study");
  }
});

export type Site = z.infer<typeof siteSchema>;
export type Project = Site["work"]["projects"][number];
export type CaseStudy = Site["caseStudies"][number];
export type Status = Project["status"];

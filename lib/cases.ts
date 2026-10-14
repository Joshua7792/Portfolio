import type { CaseStudy, Project } from "@/content/schema";
import { site } from "@/content/site";

export type CaseEntry = { study: CaseStudy; project: Project; previous: CaseStudy; next: CaseStudy };

/**
 * One lookup for both route pages. Returns null for an unknown slug (the route 404s). A case study without its project
 * card is a broken content invariant (the schema forbids it), so that throws and fails the build.
 */
export function getCase(slug: string): CaseEntry | null {
  const studies = site.caseStudies;
  const index = studies.findIndex((entry) => entry.slug === slug);
  if (index === -1) return null;
  const project = site.work.projects.find((entry) => entry.slug === slug);
  if (!project) throw new Error(`Case study "${slug}" has no project card in content/site.ts.`);
  const count = studies.length;
  return { study: studies[index], project, previous: studies[(index - 1 + count) % count], next: studies[(index + 1) % count] };
}

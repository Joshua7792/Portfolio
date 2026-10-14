import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Architecture } from "@/components/case-study/architecture";
import { CaseHeader } from "@/components/case-study/case-header";
import { CaseMedia } from "@/components/case-study/case-media";
import { CasePagination } from "@/components/case-study/case-pagination";
import { CaseSection } from "@/components/case-study/case-section";
import { coverAsset, evidenceItems } from "@/components/case-study/case-assets";
import { EvidenceGallery } from "@/components/case-study/evidence-gallery";
import { MetaRow } from "@/components/case-study/meta-row";
import { Results } from "@/components/case-study/results";
import { CtaBand } from "@/components/sections/cta-band";
import { site } from "@/content/site";
import { getCase } from "@/lib/cases";
import styles from "./page.module.css";

type WorkPageProps = { params: Promise<{ slug: string }> };

/* cacheComponents: all 8 slugs are prerendered from generateStaticParams, so awaiting params is build-time data.
   The route opts out of dev-only instant-navigation validation, which flags the generic [slug] shell's `await params`. */
export const instant = false;

/** Spec §11 site-wide social preview (1200x630), used when a case study has no cover. */
const SITE_OG_IMAGE = { url: "/og.png", width: 1200, height: 630 };

export function generateStaticParams() {
  return site.caseStudies.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: WorkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const found = getCase(slug);
  if (!found) return {};
  const { study, project } = found;
  const title = `${study.title} | ${site.meta.name}`;
  const cover = coverAsset(slug);
  // Next merges metadata per top-level key, so this openGraph block restates siteName and always carries an image.
  const image = cover.available ? { url: cover.src, alt: project.coverAlt } : { ...SITE_OG_IMAGE, alt: site.meta.name };
  return {
    title,
    description: study.problem,
    alternates: { canonical: `/work/${slug}` },
    openGraph: { title, description: project.oneLine, type: "article", siteName: site.meta.name, url: `/work/${slug}`, images: [image] },
    twitter: { card: "summary_large_image", title, description: project.oneLine, images: [image.url] },
  };
}

/** Spec §7.3 / §7.4 case-study page. */
export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params;
  const found = getCase(slug);
  if (!found) notFound();
  const { study, project, previous, next } = found;
  const cover = coverAsset(slug);

  return <>
    <CaseHeader lead={project.oneLine} study={study} />
    <MetaRow study={study} />
    <div className={`container ${styles.cover}`}>
      <CaseMedia alt={project.coverAlt} available={cover.available} preload
        sizes="(min-width: 1440px) 1312px, (min-width: 1024px) calc(100vw - 128px), calc(100vw - 40px)" src={cover.src} />
    </div>
    <CaseSection heading="Problem" id="problem" intro={<p className="t-body">{study.problem}</p>} />
    <CaseSection heading="What I built" id="built" intro={
      <ul className={`t-body ${styles.list}`}>
        {study.built.map((item) => <li key={item}>{item}</li>)}
      </ul>
    } />
    <Architecture study={study} />
    <EvidenceGallery items={evidenceItems(study)} />
    <Results study={study} />
    <CaseSection heading="What I'd do next" id="next" intro={<p className="t-body">{study.next}</p>} />
    <CasePagination next={next} previous={previous} />
    <CtaBand />
  </>;
}

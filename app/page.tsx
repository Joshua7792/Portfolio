import type { Metadata } from "next";
import { About } from "@/components/sections/about";
import { CtaBand } from "@/components/sections/cta-band";
import { Education } from "@/components/sections/education";
import { Experience } from "@/components/sections/experience";
import { FeaturedWork } from "@/components/sections/featured-work";
import { Hero } from "@/components/sections/hero";
import { ProofGrid } from "@/components/sections/proof-grid";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/** Landing page, spec §7.1 band order: hero, about, proof, work, experience, education, resume band. */
export default function HomePage() {
  return <>
    <Hero />
    <About />
    <ProofGrid />
    <FeaturedWork />
    <Experience />
    <Education />
    <CtaBand />
  </>;
}

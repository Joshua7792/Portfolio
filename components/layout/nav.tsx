import Link from "next/link";
import { site } from "@/content/site";
import { Brand } from "@/components/layout/brand";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@/components/ui/icon";

/** Spec §6.1 sticky nav. Section links are absolute ("/#about") so they work from the route pages too. */
export function Nav() {
  const { meta, nav } = site;
  return <header className="site-nav" data-surface="dark">
    <div className="container site-nav-inner">
      <Brand name={meta.name} size={28} />
      <nav aria-label="Main" className="desktop-nav">
        <div className="nav-links">
          {nav.items.map((item) => <Link className="nav-link t-nav" href={`/${item.href}`} key={item.href}>{item.label}</Link>)}
        </div>
        <Button className="nav-resume" download href={meta.links.resumePdf} size="sm">{nav.ctaDesktop}<DownloadIcon /></Button>
      </nav>
      {/* Plain values only: the client menu must not import content/site.ts. */}
      <MobileMenu ctaLabel={nav.ctaMobile} items={nav.items} name={meta.name} resumeHref={meta.links.resumePdf} />
    </div>
  </header>;
}

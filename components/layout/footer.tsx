import Link from "next/link";
import { site } from "@/content/site";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@/components/ui/icon";
import { NewTabHint } from "@/components/ui/new-tab-hint";

/** Spec §6.15 giant word: the name on two lines, given names then surname (derived, so a three-part name still splits right). */
function nameLines(name: string): [string, string] {
  const cut = name.lastIndexOf(" ");
  return cut === -1 ? [name, ""] : [name.slice(0, cut), name.slice(cut + 1)];
}

/**
 * Spec §7.1 / §7.2 footer. Section links match the nav: absolute "/#id" links that work from every route.
 * The Download Resume pill shows at lg only (Phase 3 ruling S3: below 1024 the resume band and the menu carry it).
 * The social row lists the external profile links; the resume entry is the pill, not a social link.
 */
export function Footer() {
  const { meta, nav, footer } = site;
  const [givenNames, surname] = nameLines(meta.name);
  const socialLinks = footer.links.filter((link) => link.href.startsWith("https://"));
  return <footer className="site-footer" data-surface="dark">
    <div className="container footer-top">
      <Brand name={meta.name} size={28} />
      <nav aria-label="Footer navigation" className="footer-nav">
        <div className="nav-links">
          {nav.items.map((item) => <Link className="nav-link t-nav" href={`/${item.href}`} key={item.href}>{item.label}</Link>)}
        </div>
        <Button download href={meta.links.resumePdf} size="sm">{nav.ctaDesktop}<DownloadIcon /></Button>
      </nav>
    </div>
    <nav aria-label="Footer navigation" className="container footer-mobile-links">
      {nav.items.map((item) => <Link className="t-body" href={`/${item.href}`} key={item.href}>{item.label}</Link>)}
    </nav>
    <div aria-hidden="true" className="container footer-word">
      <p className="t-footer">{givenNames}</p>{surname ? <p className="t-footer">{surname}</p> : null}
    </div>
    <div className="container footer-bottom">
      <p className="t-mono-label text-cream-muted">{footer.line}</p>
      <nav aria-label="Social links" className="footer-links">
        {socialLinks.map((link) => <a className="t-mono-label text-link" href={link.href} key={link.label} rel="noreferrer" target="_blank">{link.label}<NewTabHint /></a>)}
      </nav>
    </div>
  </footer>;
}

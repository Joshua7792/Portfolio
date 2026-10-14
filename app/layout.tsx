import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], display: "swap", variable: "--font-archivo" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-plex-mono" });

export const metadata: Metadata = {
  // OG and canonical URLs resolve against this origin (lib/site-url: domain env, else the Vercel host, else localhost).
  metadataBase: siteUrl(),
  title: site.meta.siteTitle,
  description: site.meta.siteDescription,
  // Spec §11: og.png (1200x630) is the site-wide social preview; case studies override it with their cover.
  openGraph: { title: site.meta.ogTitle, description: site.meta.ogDescription, type: "website", siteName: site.meta.name,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: site.meta.name }] },
  twitter: { card: "summary_large_image", title: site.meta.ogTitle, description: site.meta.ogDescription, images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // suppressHydrationWarning: the inline script below adds the "js" class before hydration (spec §8).
  return <html lang="en" className={`${archivo.variable} ${plexMono.variable}`} suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: 'document.documentElement.classList.add("js")' }} /></head>
    <body>
      <a className="skip-link t-btn-md" href="#main">Skip to content</a>
      <Nav />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer />
      <svg aria-hidden="true" height="0" width="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="duo-hero" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0" />
            <feComponentTransfer><feFuncR type="table" tableValues="0.1412 0.9490" /><feFuncG type="table" tableValues="0.2549 0.6471" /><feFuncB type="table" tableValues="0.1843 0.0863" /></feComponentTransfer>
          </filter>
          <filter id="duo-about" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0" />
            <feComponentTransfer><feFuncR type="table" tableValues="0.0588 0.9529" /><feFuncG type="table" tableValues="0.1020 0.9216" /><feFuncB type="table" tableValues="0.0784 0.8627" /></feComponentTransfer>
          </filter>
        </defs>
      </svg>
    </body>
  </html>;
}

import type { NextConfig } from "next";

/*
 * Security headers (R-4 F2). The site is prerendered static HTML, so per-request nonces are not available and
 * script-src keeps 'unsafe-inline' for Next's inline bootstrap scripts and the html.js class script in app/layout.tsx.
 * next/font self-hosts the fonts (font-src 'self'); the demo iframe is same-origin (frame-src / frame-ancestors 'self');
 * the demo's favicon is a data: URI (img-src data:). The CSP is production-only: `next dev` needs eval for HMR.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: csp }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // R-4 also proposed Cross-Origin-Opener-Policy: same-origin. Dropped (R-6 ruling): with it, Lighthouse cannot record
  // a page-load trace (NO_NAVSTART, reproduced locally, gone when only that header is stripped), and a static site with
  // no popups or window.opener use gains little from it; new-tab links already carry rel="noopener".
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  // Lets `next dev` serve its client chunks when opened as 127.0.0.1 (otherwise React never hydrates there).
  allowedDevOrigins: ["127.0.0.1"],
  // Stops `next dev` from writing code/AGENTS.md on every start.
  agentRules: false,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

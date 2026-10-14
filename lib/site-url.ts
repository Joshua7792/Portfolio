/**
 * Absolute origin for metadata (OG and canonical URLs). NEXT_PUBLIC_SITE_URL wins once the domain is bought (S-5);
 * until then Vercel's own production host, which Vercel sets on every build. `||` (not `??`) so an empty variable
 * falls through instead of making `new URL("")` throw.
 */
export function siteUrl(): URL {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : "http://localhost:3000"));
  // A hosted production build (Vercel, or any CI, which all set CI or VERCEL) must never publish localhost OG URLs.
  // A local `next build` for checks on this machine sets neither, so it keeps the localhost fallback.
  const hosted = Boolean(process.env.CI || process.env.VERCEL);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (local && hosted && process.env.NODE_ENV === "production") {
    throw new Error("metadataBase resolves to localhost in a hosted production build; set NEXT_PUBLIC_SITE_URL.");
  }
  return url;
}

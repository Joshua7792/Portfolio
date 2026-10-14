import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/* Build-time asset checks. They run in server components only and assume `next build` runs from code/
   (Vercel Root Directory = code). Paths are public URLs such as "/work/joshua-os/cover.webp". */
const publicDirectory = path.join(process.cwd(), "public");

/** False for anything that is not a same-site path ("/x"); the protocol-relative "//host" form included. */
function isSitePath(publicPath: string): boolean {
  return publicPath.startsWith("/") && !publicPath.startsWith("//");
}

/** True when the public URL names an existing file inside public/ ("../" escapes resolve outside and return false).
    The path is built inline from publicDirectory so Turbopack scopes its file tracing to public/. */
export function assetExists(publicPath: string): boolean {
  if (!isSitePath(publicPath)) return false;
  const absolutePath = path.resolve(publicDirectory, `.${publicPath}`);
  return absolutePath.startsWith(`${publicDirectory}${path.sep}`) && existsSync(absolutePath);
}

/**
 * For assets the page cannot ship without (the two portraits, every cover). In a production build a missing file
 * fails the build instead of shipping a placeholder; in development it returns false so the §6.16 placeholder shows.
 */
export function requireAsset(publicPath: string): boolean {
  const available = assetExists(publicPath);
  if (!available && process.env.NODE_ENV === "production") throw new Error(`Required asset is missing: public${publicPath}`);
  return available;
}

/** UTF-8 text of a public file (e.g. an SVG's <title>), through the same traversal guard. */
export function readPublicText(publicPath: string): string {
  if (!assetExists(publicPath)) throw new Error(`Not an existing public file: ${publicPath}`);
  // Statically scoped to public/ so the build traces only that folder.
  return readFileSync(path.join(process.cwd(), "public", publicPath), "utf8");
}

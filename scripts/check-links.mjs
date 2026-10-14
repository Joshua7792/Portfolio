// Link and asset checker for the portfolio's production build.
// Usage: npm run check:links (or: node scripts/check-links.mjs http://localhost:3001)
// Crawls /, derives the case-study routes from its /work/<slug> links (exactly 8 expected), then crawls those and the
// demo: every href, src, srcset, poster, iframe src, og/twitter image and icon link, following internal static HTML
// pages one level (the demo), and requests each URL once.
// Internal URLs must answer 200 with no redirect (any 3xx fails) and every in-page fragment must exist; every route
// must answer 200. External URLs must return 200 (redirects followed), or 403/999 (bot walls on LinkedIn and similar),
// which are reported with their code. Exit 1 on any failure.

const BASE = (process.argv[2] ?? "http://localhost:3001").replace(/\/$/, "");
const ORIGIN = new URL(BASE).origin;
const CASE_STUDIES = 8;
const BOT_WALL = new Set([403, 999]);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

const decode = (value) => value.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');

/** Pull every URL-bearing attribute out of server-rendered HTML. */
function extract(html) {
  const found = [];
  for (const tag of html.match(/<[a-z]+\b[^>]*>/gi) ?? []) {
    const name = tag.match(/^<([a-z]+)/i)[1].toLowerCase();
    for (const [, key, raw] of tag.matchAll(/\s(href|src|poster|srcset|content|imagesrcset)="([^"]*)"/gi)) {
      const value = decode(raw);
      const k = key.toLowerCase();
      if (k === "content") {
        if (/property="og:image"|name="twitter:image"|property="og:url"/i.test(tag)) found.push({ tag: name, url: value });
      } else if (k === "srcset" || k === "imagesrcset") {
        // Candidates are "url descriptor" pairs separated by ", "; a URL may itself contain commas (next/image).
        for (const part of value.split(/,\s+/)) { const url = part.trim().split(/\s+/)[0]; if (url) found.push({ tag: name, url }); }
      } else if (name === "link" && /rel="(preconnect|dns-prefetch)"/i.test(tag)) {
        continue; // origins, not resources
      } else {
        found.push({ tag: name, url: value });
      }
    }
  }
  return found;
}

const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

async function get(url, external) {
  try {
    const res = await fetch(url, { redirect: external ? "follow" : "manual", headers: { "user-agent": UA, accept: "*/*" }, signal: AbortSignal.timeout(20000) });
    const type = res.headers.get("content-type") ?? "";
    const body = type.includes("text/html") ? await res.text() : (await res.arrayBuffer(), "");
    return { status: res.status, type, body, location: res.headers.get("location") ?? "" };
  } catch (error) {
    return { status: 0, type: "", body: "", location: "", error: external ? String(error.cause?.code ?? error.message) : String(error.message) };
  }
}

const pages = new Map(); // route path -> response
const refs = new Map(); // absolute url -> Set of "route <tag>"
const fragments = []; // { from, path, id }

function addRef(url, from, tag) {
  if (!refs.has(url)) refs.set(url, new Set());
  refs.get(url).add(`${from} <${tag}>`);
}

async function crawl(path, depth) {
  const res = await get(BASE + path, false);
  pages.set(path, res);
  if (!res.body) return;
  for (const { tag, url } of extract(res.body)) {
    if (/^(mailto|tel|data|javascript):/i.test(url) || url === "") continue;
    const abs = new URL(url, BASE + path);
    // Metadata URLs carry metadataBase (NEXT_PUBLIC_SITE_URL, localhost fallback); check the same path on BASE.
    const internal = abs.origin === ORIGIN || /^https?:\/\/localhost(:\d+)?$/.test(abs.origin);
    const target = internal ? new URL(abs.pathname + abs.search, ORIGIN) : abs;
    if (internal && abs.hash) fragments.push({ from: path, path: target.pathname, id: decodeURIComponent(abs.hash.slice(1)) });
    target.hash = "";
    addRef(target.href, path, tag);
    if (internal && depth < 1 && target.pathname.endsWith(".html") && !pages.has(target.pathname)) await crawl(target.pathname, depth + 1);
  }
}

await crawl("/", 0);
const slugs = [...new Set([...(pages.get("/").body ?? "").matchAll(/href="\/work\/([a-z0-9-]+)"/g)].map((m) => m[1]))];
const ROUTES = ["/", ...slugs.map((slug) => `/work/${slug}`), "/demo/jacobs-platform"];
for (const route of ROUTES.slice(1)) await crawl(route, 0);

const rows = [];
let failures = 0;
if (slugs.length !== CASE_STUDIES) {
  failures += 1;
  rows.push({ ok: false, status: slugs.length, kind: "routes", url: "/work/<slug> links on /", type: "", refs: 0, note: `expected ${CASE_STUDIES}` });
}
for (const route of ROUTES) {
  const status = pages.get(route)?.status ?? 0;
  if (status !== 200) {
    failures += 1;
    rows.push({ ok: false, status, kind: "route", url: route, type: "", refs: 0, note: "every route must answer 200" });
  }
}

for (const [url, from] of [...refs].sort(([a], [b]) => a.localeCompare(b))) {
  const internal = new URL(url).origin === ORIGIN;
  const path = internal ? url.slice(ORIGIN.length) : url;
  const res = pages.get(path) ?? (await get(url, !internal));
  const ok = res.status === 200 || (!internal && BOT_WALL.has(res.status));
  if (!ok) failures += 1;
  const redirect = internal && res.status >= 300 && res.status < 400 ? `redirect to ${res.location}` : "";
  const botWall = !internal && res.status !== 200 && ok ? "bot wall, reported not failed" : "";
  rows.push({ ok, status: res.status || res.error, kind: internal ? "internal" : "external", url: path, type: res.type.split(";")[0], refs: from.size, note: redirect || botWall });
}

for (const f of fragments) {
  const page = pages.get(f.path) ?? (await get(BASE + f.path, false));
  const ok = ids(page.body ?? "").has(f.id);
  if (!ok) failures += 1;
  rows.push({ ok, status: ok ? "id found" : "id missing", kind: "fragment", url: `${f.path}#${f.id}`, type: "", refs: 1, note: `from ${f.from}` });
}

const unique = rows.filter((r, i) => r.kind !== "fragment" || rows.findIndex((x) => x.url === r.url) === i);
for (const r of unique) process.stdout.write(`${r.ok ? "OK  " : "FAIL"} ${String(r.status).padEnd(8)} ${r.kind.padEnd(8)} ${r.url}${r.type ? `  [${r.type}]` : ""}${r.note ? `  (${r.note})` : ""}\n`);
const counts = (kind) => unique.filter((r) => r.kind === kind).length;
process.stdout.write(`\nroutes ${ROUTES.length} (case studies ${slugs.length}), internal ${counts("internal")}, external ${counts("external")}, fragments ${counts("fragment")}, failures ${failures}\n`);
process.exitCode = failures ? 1 : 0;

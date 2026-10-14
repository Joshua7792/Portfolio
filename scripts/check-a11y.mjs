// Accessibility gate for the portfolio's production build (axe-core, WCAG 2.0/2.1/2.2 A and AA plus best practice).
// Usage: npm run check:a11y (or: node scripts/check-a11y.mjs http://localhost:3001)
// Derives the case-study routes from the links on / (8 expected), then scans the 10 routes at 1440 and 375 in Chrome.
// Every scroll reveal is forced visible first, so axe sees the real colors. The site DOM is the gate (exit 1 on any
// violation); the embedded demo iframe is a vendored synthetic prototype, scanned and reported separately.
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const BASE = (process.argv[2] ?? "http://localhost:3001").replace(/\/$/, "");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const WIDTHS = [{ width: 1440, height: 900 }, { width: 375, height: 812 }];
const CASE_STUDIES = 8;

const home = await (await fetch(`${BASE}/`)).text();
const slugs = [...new Set([...home.matchAll(/href="\/work\/([a-z0-9-]+)"/g)].map((m) => m[1]))];
if (slugs.length !== CASE_STUDIES) throw new Error(`Expected ${CASE_STUDIES} case studies on /, found ${slugs.length}`);
const routes = ["/", ...slugs.map((slug) => `/work/${slug}`), "/demo/jacobs-platform"];

const browser = await chromium.launch({ channel: "chrome" });
let siteViolations = 0;
let frameViolations = 0;
try {
  for (const viewport of WIDTHS) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      // Reveal everything that waits for scroll, then wait until no reveal is hidden.
      await page.evaluate(async () => {
        for (const node of document.querySelectorAll(".reveal")) { node.scrollIntoView({ block: "center", behavior: "instant" }); await new Promise((r) => setTimeout(r, 30)); }
        window.scrollTo({ top: 0, behavior: "instant" });
      });
      await page.waitForFunction(() => document.querySelectorAll('.reveal[data-visible="false"]').length === 0, null, { timeout: 10000 });
      await page.waitForTimeout(300);

      const site = await new AxeBuilder({ page }).withTags(TAGS).exclude("iframe").analyze();
      siteViolations += site.violations.length;
      const label = `${route} @${viewport.width}`;
      process.stdout.write(`${site.violations.length ? "FAIL" : "OK  "} site   ${label}: ${site.violations.length} violations, ${site.passes.length} rules passed\n`);
      for (const v of site.violations) process.stdout.write(`       ${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0]?.target.join(" ")}\n`);

      if (await page.locator("iframe").count()) {
        const frame = await new AxeBuilder({ page }).withTags(TAGS).include("iframe").analyze();
        frameViolations += frame.violations.length;
        process.stdout.write(`${frame.violations.length ? "INFO" : "OK  "} iframe ${label}: ${frame.violations.length} violations (vendored demo, not gating)\n`);
        for (const v of frame.violations) process.stdout.write(`       ${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0]?.target.join(" ")}\n`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
process.stdout.write(`\nroutes ${routes.length} x ${WIDTHS.length} widths: site violations ${siteViolations}, demo iframe violations ${frameViolations}\n`);
process.exitCode = siteViolations ? 1 : 0;

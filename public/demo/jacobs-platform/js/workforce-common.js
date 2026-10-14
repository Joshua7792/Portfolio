/* ============================================================================
   workforce-common.js — shared infra for the ported workforce pages.
   Reads window.WORKFORCE (baked separately from window.RPT; see workforce-data.js).
   Exposes window.WF (raw data) and window.WFUI (shared render helpers) so every
   domain file (certs/bidders/hours/jha) stays consistent and self-contained.
   Uses ONLY this repo's design tokens + badge classes — no workforce colours.
   ========================================================================== */
(function () {
  window.Pages = window.Pages || {};
  const F = window.F;
  const WF = window.WF = (typeof window.WORKFORCE !== 'undefined') ? window.WORKFORCE : null;
  const esc = F.esc;

  /* ---- shared re-render primitive -----------------------------------------
     Workforce pages that own client-side filters/pagination call
     window.mountPage(id) to re-render the current route in place. Mirrors the
     router's mount + `_after_<id>` sequence so post-render handlers rebind. */
  window.mountPage = function (id) {
    const v = document.getElementById('view');
    if (!v || typeof window.Pages[id] !== 'function') return;
    v.innerHTML = '<div class="page">' + window.Pages[id]() + '</div>';
    if (typeof window.Pages['_after_' + id] === 'function') window.Pages['_after_' + id]();
  };

  /* ---- value formatters (workforce) --------------------------------------*/
  const missing = (v) => (v == null || v === '') ? '<span class="muted">—</span>' : esc(v);
  const num = (v) => (v == null) ? '—' : Number(v).toLocaleString('en-US');
  const num1 = (v) => (v == null) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 });
  const pct1 = (v) => (v == null) ? '—' : Number(v).toFixed(1) + '%';
  const int = (v) => (v == null) ? '—' : String(Math.round(Number(v)));

  /* ---- certification status → this repo's badge classes ------------------
     Workbook rule (mirrors conditional formatting): green > 60d to 1-yr
     anniversary, yellow 31–60, red ≤ 30 / past, blank = no date. */
  const CERT_BADGE = { green: 'b-green', yellow: 'b-amber', red: 'b-red', blank: 'b-slate' };
  const CERT_LABEL = { green: 'Current', yellow: 'Due soon', red: 'Overdue', blank: 'No date' };
  const certPill = (status) => {
    const s = String(status == null ? 'blank' : status).toLowerCase();
    return `<span class="badge ${CERT_BADGE[s] || 'b-slate'}"><span class="d" style="background:currentColor"></span>${CERT_LABEL[s] || esc(status)}</span>`;
  };
  const pill = (cls, label) => `<span class="badge ${cls}"><span class="d" style="background:currentColor"></span>${esc(label)}</span>`;

  /* ---- freshness caption from generated_at -------------------------------
     Two timestamps, because one of them alone is misleading: when the bundle was
     baked, AND when the SOURCE workbook for the page being viewed was last saved.
     If the workbook is NEWER than the bake, the boss is looking at a pre-edit
     snapshot — say so loudly rather than letting a stale page look current.
     (This is exactly the 18-Aug-26 incident: baked 13:57, workbook saved 14:01.)

     Every domain bakes its OWN workbook metadata (WF.<key>.workbook), so a
     caption that always names the certifications workbook is wrong on every
     other page (2026-09-01 fix). fresh(domainKey) is keyed on the SAME domain
     key used by dom()/U.dom() throughout the workforce pages
     (excel/bidders/induction/hours/jha) — a caller just passes its own data key
     and the plain-language name is derived here, never hardcoded per call
     site. An omitted key falls back to the pre-2026-09-01 behaviour
     (certifications, the only workbook ever named here) for backward
     compatibility; a key whose domain baked no workbook metadata (e.g.
     induction today) degrades to the generic bake-time-only caption rather
     than naming the wrong workbook. */
  const stamp = (iso) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const DOMAIN_WORKBOOK_LABEL = { excel: 'certifications', bidders: 'bidders', induction: 'training', hours: 'hours', jha: 'JHA' };
  const fresh = (domainKey) => {
    if (!WF || !WF.generated_at) return '';
    try {
      let s = 'Workforce data generated ' + stamp(WF.generated_at);
      const key = domainKey || 'excel';
      const src = WF[key] && WF[key].workbook;
      if (src && src.last_modified) {
        const label = DOMAIN_WORKBOOK_LABEL[key] || key;
        s += ` · ${label} workbook saved ` + stamp(src.last_modified);
        if (new Date(src.last_modified) > new Date(WF.generated_at)) {
          s += ' — <b style="color:var(--over)">workbook is newer than this build; re-run Start Dashboard.bat</b>';
        }
      }
      return s;
    } catch (e) { return ''; }
  };

  /* ---- page header (mirrors pages.js head(); Export PDF chip only) --------
     domainKey (optional, 3rd arg) is forwarded straight to fresh() so a page
     can name its own source workbook; omitted, it keeps today's behaviour. */
  const head = (h1, p, domainKey) => {
    const f = fresh(domainKey);
    return `<div class="page-head"><div><h1>${esc(h1)}</h1><p>${p || ''}${f ? ` <span class="wf-fresh">· ${f}</span>` : ''}</p></div>
      <div class="chips"><button class="chip" onclick="window.print()">⤓ Export PDF</button></div></div>`;
  };

  /* ---- KPI strip: items [{label,value,sub,tone}] tone:''|'is-positive'|'is-risk' */
  const kpiStrip = (items) => `<div class="wf-kpis">${items.map(k => `
    <div class="wf-kpi ${k.tone || ''}"><div class="wf-kpi-lab">${esc(k.label)}</div>
    <div class="wf-kpi-val">${k.value}</div>${k.sub ? `<div class="wf-kpi-sub">${k.sub}</div>` : ''}</div>`).join('')}</div>`;

  /* ---- guard panel when a domain didn't bake -----------------------------*/
  const guard = (domain) => `<div class="note red" style="margin-top:14px"><b>${esc(domain)} data not available.</b>
    Re-run the workforce bake (<code>Start Dashboard.bat</code>) to regenerate
    <code>dashboard/js/workforce-data.js</code>.</div>`;

  /* ---- domain accessor with guard ---------------------------------------*/
  const dom = (key) => (WF && WF[key]) ? WF[key] : null;

  /* ---- record detail modal ------------------------------------------------
     Self-contained equivalent of the reports pages' details.js -> interact.js
     [data-detail] path, but workforce domain files never touch details.js —
     they build a {title, html} record inline and hand it to the SAME modal
     engine (window.Interact.openDialog), reusing interact.css's .detail-grid
     / .detail-kv / .detail-eyebrow styling (no new colour system).

     window.__WFM is a per-render cache: every workforce page is a pure
     string builder re-run on each mount/mountPage, so a full page render
     calls wfmReset() once up front, then each record row/card calls wfm()
     to push its {title,html} and get back the `data-wfm="<idx>"
     tabindex="0"` attribute string to splice into its own markup. A partial
     re-paint of just one page section (search/pagination) does NOT reset —
     it only appends fresh entries — because on every one of these pages
     wfm() is used by exactly one section, so old indices are simply
     orphaned (unreachable from the DOM) rather than colliding with a
     still-visible row. */
  window.__WFM = window.__WFM || [];
  const wfmReset = () => { window.__WFM = []; };
  const kv = (label, value, cls) => `<div class="detail-kv${cls ? ` ${cls}` : ''}"><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
  const wfm = (title, pairs, eyebrow) => {
    const html = `<div class="detail-eyebrow">${esc(eyebrow || 'Workforce record')}</div><dl class="detail-grid">${pairs.map(p => kv(p[0], p[1], p[2])).join('')}</dl>`;
    const idx = window.__WFM.push({ title: esc(title == null || title === '' ? '—' : title), html }) - 1;
    return `data-wfm="${idx}" tabindex="0"`;
  };

  /* ---- single delegated click/keydown listener for [data-wfm] -------------
     Registered once here (this IIFE runs once at script load, mirroring
     interact.js's own delegated listeners) — never re-registered on
     mountPage/re-render. Fully independent of interact.js's [data-detail]
     handling: different attribute, same underlying openDialog(). */
  const wfmHit = (t) => t && t.closest && t.closest('[data-wfm]');
  function openWfm(el) {
    const idx = Number(el.dataset.wfm);
    const rec = window.__WFM[idx];
    if (!rec || !window.Interact) return;
    window.Interact.openDialog(rec, el);
  }
  document.addEventListener('click', (e) => { const el = wfmHit(e.target); if (el) openWfm(el); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = wfmHit(e.target); if (!el || e.repeat) return;
    e.preventDefault(); openWfm(el);
  });

  window.WFUI = { esc, missing, num, num1, pct1, int, certPill, pill, head, kpiStrip, guard, fresh, dom, CERT_BADGE, CERT_LABEL, wfm, wfmReset, kv };
})();

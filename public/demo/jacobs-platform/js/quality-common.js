/* ============================================================================
   quality-common.js — shared furniture for the QUALITY section.

   The workbook Assets/Quality/Quality Training Log.xlsx holds TWO kinds of log
   and therefore drives TWO pages:

     #/quality-training    who ATTENDED a training      window.QUALITY.training
     #/quality-signature   who SIGNED to be eligible    window.QUALITY.signature

   Both sections have the identical shape (they are built by one summarize() in
   etl/extract_quality.py), so everything that is the same on both pages lives
   here as window.QL and neither page file repeats it. This mirrors
   workforce-common.js, one level down: WFUI is dashboard-wide, QL is
   QUALITY-wide.

   window.QUALITY is the FOURTH independent blob — never merged with
   window.RPT, window.WORKFORCE or window.SORDATA.

   Invent nothing: a blank workbook cell renders as an em dash or a hatched
   "not recorded" bucket, never as 0 and never as a guess. Names are shown
   exactly as typed — never split, merged, accent-corrected or de-duplicated.
   ========================================================================== */
(function () {
  const U = window.WFUI;
  const F = window.F || {};
  const esc = U.esc;
  const fdate = F.fdate || function (iso) { return iso || '—'; };
  const D = (typeof window.QUALITY !== 'undefined') ? window.QUALITY : null;

  const plural = (n, one, many) => (n === 1 ? one : (many || one + 's'));
  const emptyRow = (n, msg) =>
    `<tr><td colspan="${n}" class="muted center" style="padding:20px">${esc(msg)}</td></tr>`;

  /* ---- page furniture -----------------------------------------------------
     Two timestamps, because either alone is misleading: when the bundle was
     baked AND when the workbook was last saved. If the workbook is NEWER, the
     boss is reading a pre-edit snapshot — say so loudly rather than letting a
     stale page look current. (The 18-Aug-26 certifications incident.) -------*/
  function stamp(iso) {
    return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  }
  function freshness() {
    if (!D || !D.generated_at) return '';
    try {
      let s = 'Built ' + stamp(D.generated_at);
      const mod = D.source && D.source.modified;
      if (mod) {
        s += ' · workbook saved ' + stamp(mod);
        if (new Date(mod) > new Date(D.generated_at)) {
          s += ' — <b style="color:var(--over)">workbook is newer than this build;'
            + ' re-run Start Dashboard.bat</b>';
        }
      }
      return s;
    } catch (e) { return ''; }
  }

  /** Page head. `sheets` is this page's own worksheet list, so the caption
      names the sheets THIS page reads rather than the whole workbook. */
  function head(title, blurb, sheets) {
    const f = freshness();
    let src = '';
    if (D && D.source) {
      const n = (sheets || []).length;
      src = ` Source: <b>${esc(D.source.file)}</b> · ${n} ${plural(n, 'worksheet')}`
        + (n ? ` (${(sheets || []).map(s => esc(s.sheet)).join(', ')})` : '')
        + ` · <code>${esc(D.source.folder)}</code>.`;
    }
    return `<div class="page-head"><div><h1>${esc(title)}</h1>
        <p>${blurb}${src}${f ? ` <span class="wf-fresh">· ${f}</span>` : ''}</p></div>
      <div class="chips"><button class="chip" onclick="window.print()">⤓ Export PDF</button></div></div>`;
  }

  const guard = () => `<div class="note red" style="margin-top:14px"><b>Quality data not available.</b>
    <code>window.QUALITY</code> was not found. Run <code>Start Dashboard.bat</code> (or
    <code>python etl/extract_quality.py</code>) to regenerate
    <code>dashboard/js/quality-data.js</code> from <code>Assets/Quality/</code>.</div>`;

  /** The honest empty state for a log kind the workbook does not contain.
      A page with no data must say what is missing and how to add it — never
      render zeros that look like a real measurement of nothing. */
  const noLog = (what, how) => `<div class="note amber" style="margin-top:16px">
    <b>No ${esc(what)} in this workbook.</b> ${how} Nothing is being hidden: every
    worksheet found is listed in the Source coverage notice on the
    <a href="#/quality-training">Quality Training Log</a> page.</div>`;

  /* ---- distribution bars (label · bar · count) ---------------------------*/
  function distBars(items, color) {
    if (!items || !items.length) return '<p class="muted" style="margin:6px 0">No data.</p>';
    const max = Math.max(1, ...items.map(i => i.count || 0));
    return items.map(i => {
      const w = Math.max(3, Math.round(100 * (i.count || 0) / max));
      return `<div class="ql-dist hit" tabindex="0" data-tip="${esc(i.label + ': ' + i.count + ' ' + plural(i.count, 'record'))}">
        <div class="ql-dist-lab${i.blank ? ' muted' : ''}">${esc(i.label)}</div>
        <div class="progress" style="flex:1"><i class="${i.blank ? 'is-blank' : ''}" style="width:${w}%;background:${i.blank ? '' : (color || 'var(--brand)')}"></i></div>
        <div class="ql-dist-n${i.blank ? ' muted' : ''}">${i.count}</div>
      </div>`;
    }).join('');
  }

  /* ---- sessions column chart ---------------------------------------------
     One column per date the workbook actually records. Honest at n=1 (a single
     real session is a single real column) and it becomes a trend as sessions
     accumulate. Capped at the most recent SESSION_CAP, and the cap is STATED
     when it bites — a silent truncation reads as "that's all of them". ------*/
  const SESSION_CAP = 18;
  function sessionColumns(sessions, noun) {
    noun = noun || 'attendee';
    if (!sessions || !sessions.length) return '<p class="muted">No dated sessions.</p>';
    const shown = sessions.slice(-SESSION_CAP);
    const W = 720, H = 200, pl = 34, pr = 14, pt = 18, pb = 40;
    const max = Math.max(1, ...shown.map(s => s.count));
    const gw = (W - pl - pr) / shown.length;
    const bw = Math.min(58, gw * 0.56);
    const y = (v) => H - pb - (H - pt - pb) * v / max;
    let grid = '';
    for (let g = 0; g <= 4; g++) {
      const gy = pt + (H - pt - pb) * g / 4;
      const v = Math.round(max * (4 - g) / 4);
      grid += `<line x1="${pl}" y1="${gy.toFixed(1)}" x2="${W - pr}" y2="${gy.toFixed(1)}" stroke="var(--border-2)"/>`
        + `<text x="${pl - 7}" y="${(gy + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--muted)">${v}</text>`;
    }
    const bars = shown.map((s, i) => {
      const cx = pl + gw * i + gw / 2, top = y(s.count);
      // `trainings` is null on a signature session — it is not tied to a
      // training at all, and "0 trainings" would be a lie about the source.
      let tip = `${fdate(s.date)}: ${s.count} ${plural(s.count, noun)}`
        + ` · ${s.companies} ${plural(s.companies, 'company', 'companies')}`;
      if (s.trainings != null) tip += ` · ${s.trainings} ${plural(s.trainings, 'training')}`;
      return `<g class="hit" tabindex="0" data-tip="${esc(tip)}">
        <rect x="${(cx - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${(H - pb - top).toFixed(1)}" rx="4" fill="var(--brand)"/>
        <text x="${cx.toFixed(1)}" y="${(top - 6).toFixed(1)}" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--ink)">${s.count}</text>
        <text x="${cx.toFixed(1)}" y="${H - 18}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${esc(fdate(s.date))}</text>
        <title>${esc(tip)}</title></g>`;
    }).join('');
    return `<svg class="svgc ql-sessions" viewBox="0 0 ${W} ${H}" width="100%" role="img"
        aria-label="Records per session">${grid}${bars}</svg>`
      + (sessions.length > shown.length
        ? `<p class="ql-single">Showing the most recent ${shown.length} of
             ${sessions.length} sessions; the earlier ${sessions.length - shown.length}
             are still counted in every total above and listed in the roster.</p>` : '');
  }

  /* ---- flag badges --------------------------------------------------------
     A flag is a statement about a BLANK or a REPEAT in the workbook, never a
     judgement about the data's meaning. `duplicate` is amber, not red: the row
     may well be a genuine second attendance. ------------------------------*/
  const FLAG_BADGE = {
    no_name: 'b-red', no_first_name: 'b-amber', no_last_name: 'b-amber',
    no_date: 'b-red', unreadable_date: 'b-amber', no_company: 'b-amber',
    no_training: 'b-amber',
    duplicate: 'b-amber',
  };
  const flagLabel = (f) =>
    ((D && D.coverage && D.coverage.flag_labels) || {})[f] || f.replace(/_/g, ' ');
  function flagBadges(flags) {
    if (!flags || !flags.length) return '<span class="muted">—</span>';
    return `<span class="ql-flags">${flags.map(f =>
      U.pill(FLAG_BADGE[f] || 'b-slate', flagLabel(f))).join('')}</span>`;
  }

  /* ---- record modal -------------------------------------------------------
     One builder for both log kinds: a signature record simply has no Training
     row, rather than a Training row reading "—" (which would imply the sheet
     had a training column and left it blank). --------------------------- */
  function recordModal(r, eyebrow) {
    const labels = (D.coverage && D.coverage.field_labels) || {};
    const L = (k, fb) => esc(labels[k] || fb || k);
    const pairs = [];
    if (r.training) pairs.push([L('training', 'Training'), esc(r.training)]);
    pairs.push(
      [L('first_name'), U.missing(r.first_name)],
      [L('last_name'), U.missing(r.last_name)],
      ['Name as shown', U.missing(r.full_name)],
      [L('company'), U.missing(r.company)],
      [L('date'), r.date ? esc(fdate(r.date)) : '<span class="muted">—</span>'],
      ['Date as written in the workbook', r.date_raw
        ? `<span class="ql-longtext">${esc(r.date_raw)}</span>` : '<span class="muted">—</span>'],
      ['Where this comes from', `sheet <b>${esc(r.sheet)}</b>, row <b>${r.excel_row}</b>`],
      ['Needs attention', flagBadges(r.flags)]);
    if (r.extra) {
      Object.keys(r.extra).forEach(k => pairs.push(
        [k, r.extra[k] == null ? '<span class="muted">—</span>'
          : `<span class="ql-longtext">${esc(r.extra[k])}</span>`]));
    }
    return U.wfm(r.full_name || `Row ${r.excel_row}`, pairs, eyebrow);
  }

  /* ---- data-quality notice (per log section) ------------------------------
     Renders '' the moment the section is complete, so a clean log shows
     nothing at all. Every entry names the sheet AND the Excel row, because a
     disclosure you cannot act on is decoration. ---------------------------*/
  function issuesNotice(sec) {
    const issues = (sec && sec.issues) || [];
    if (!issues.length) return '';
    const flagged = (sec.kpis || {}).flagged || 0;
    const rows = issues.map(i => `<tr>
      <td>${U.pill(FLAG_BADGE[i.kind] || 'b-slate', i.label)}</td>
      <td class="mono">${esc(i.sheet)} · row ${i.excel_row}</td>
      <td class="muted">${esc(i.detail)}</td></tr>`).join('');
    return `<div class="card" style="margin-top:16px" role="note" aria-label="Quality data notice">
      <details class="cov-note">
        <summary style="cursor:pointer;font-size:13.5px;color:var(--muted);outline-offset:3px">
          <b style="color:var(--ink)">Needs attention</b> · ${U.num(flagged)}
          ${plural(flagged, 'row')} · ${issues.length} ${plural(issues.length, 'issue')} to fix in the workbook</summary>
        <div class="tbl-wrap" style="margin-top:12px"><table class="tbl">
          <thead><tr><th>What</th><th>Where</th><th>Detail</th></tr></thead>
          <tbody>${rows}</tbody></table></div>
        <p class="muted" style="margin:10px 0 0;font-size:11.5px">Every row above is
          <b>still counted</b> in the totals on this page — this dashboard never deletes or
          silently repairs a record the workbook contains. Fix the named cell in
          <code>${esc((D.source || {}).file || 'the workbook')}</code>, save, close Excel and
          re-run <code>Start Dashboard.bat</code>; this panel disappears on its own once the
          workbook is complete.</p>
      </details></div>`;
  }

  /* ---- source-coverage notice (workbook-level, identical on both pages) ----
     Mirrors sor-page.js::coverageNotice and app.js::coverageNoticePanel. This
     one ALWAYS renders, because the sheet-kind classification is a decision
     this code made about the boss's workbook and he must be able to see it and
     overrule it (by renaming a tab). ---------------------------------------*/
  const KIND_BADGE = { training: 'b-green', signature: 'b-slate', skipped: 'b-amber' };
  const KIND_WORD = { training: 'Training log', signature: 'Signature log', skipped: 'Skipped' };
  function coverageNotice() {
    const c = (D && D.coverage) || {};
    const labels = c.field_labels || {};
    const kinds = c.sheet_kinds || [];
    const gone = (c.fields_missing_header || []).map(k => labels[k] || k);
    const extra = c.extra_columns || [];
    const orphan = c.rows_without_identity || 0;
    const bits = [];
    if (gone.length) bits.push(`<p style="margin:0 0 8px"><b>${gone.length}
      expected ${plural(gone.length, 'column')} not in this workbook:</b>
      ${gone.map(esc).join(', ')} — reported as <b>unavailable</b>, never as zero.</p>`);
    if (extra.length) bits.push(`<p style="margin:0 0 8px"><b>${extra.length} extra
      ${plural(extra.length, 'column')}</b> this dashboard does not have a field for:
      ${extra.map(esc).join(', ')} — carried through and shown on each record.</p>`);
    if (orphan) bits.push(`<p style="margin:0 0 8px"><b>${orphan}
      ${plural(orphan, 'row')}</b> below a header row carried neither a name nor a date,
      so ${plural(orphan, 'it is', 'they are')} not counted.</p>`);
    const rows = kinds.map(s => `<tr>
      <td class="strong">${esc(s.sheet)}</td>
      <td>${U.pill(KIND_BADGE[s.kind] || 'b-slate', KIND_WORD[s.kind] || s.kind)}</td>
      <td class="num">${s.records == null ? '<span class="muted">—</span>' : U.num(s.records)}</td>
      <td class="muted">${esc(s.reason || '')}</td></tr>`).join('');
    const words = (c.signature_keywords || []).map(w => `<code>${esc(w)}</code>`).join(' · ');
    return `<div class="card" style="margin-top:16px" role="note" aria-label="Quality source coverage notice">
      <details class="cov-note">
        <summary style="cursor:pointer;font-size:13.5px;color:var(--muted);outline-offset:3px">
          <b style="color:var(--ink)">Source coverage</b> · how each of the
          ${(D.source || {}).sheet_count} sheets in
          ${esc((D.source || {}).file || 'the workbook')} was read</summary>
        <div class="tbl-wrap" style="margin-top:12px"><table class="tbl">
          <thead><tr><th>Worksheet</th><th>Read as</th><th class="num">Rows</th><th>Why</th></tr></thead>
          <tbody>${rows || emptyRow(4, 'No worksheets found.')}</tbody></table></div>
        <div class="note amber" style="margin-top:12px">
          ${bits.join('')}
          <p style="margin:0 0 8px">${esc(c.schema_note || '')}</p>
          <p style="margin:0">A sheet is read as a <b>signature log</b> when its name contains
            one of ${words || '—'} — a fixed list, matched exactly, with no spell-correction:
            a matcher loose enough to repair a typo is loose enough to merge two sheets the
            workbook never said were the same. <b>Renaming the tab is how you change this</b>,
            and no code changes with it.</p>
        </div>
      </details></div>`;
  }

  /* ---- how this workbook works -------------------------------------------
     Repeats, and now supersedes, the _README sheet inside the workbook — the
     source file is read-only to this code, so the live instruction lives on
     the page. ------------------------------------------------------------*/
  function howToPanel() {
    const file = esc((D.source || {}).file || 'the workbook');
    return `<div class="card" style="margin-top:16px">
      <div class="card-head"><h3>How this workbook works</h3>
        <span class="muted" style="font-size:12px">no code changes needed</span></div>
      <ol class="ql-steps">
        <li><b>Two kinds of sheet.</b> A tab whose name contains <code>signature</code>
          (however you spell it — the current tab reads <code>Sigunature</code>) is read as a
          <b>signature log</b>: who signed to be eligible. Every other tab with a name column
          and a date column is a <b>training log</b>: who attended.</li>
        <li><b>The training's name comes from the <code>Training</code> column</b> when the
          sheet has one, and from the sheet's own name when it does not. Rename the training in
          that column and this page follows on the next rebuild.</li>
        <li><b>Another session?</b> Add rows to the same sheet. One training serves multiple
          contractors on multiple dates — <b>Date</b> and <b>Company</b> are what separate the
          sessions. A brand-new training gets its own tab (copy an existing one, clear the rows).</li>
        <li>Keep the headers: <code>First Name</code>, <code>Last Name</code>, <code>Date</code>,
          <code>Company</code> (Spanish spellings work too). Extra columns are welcome — anything
          this page has no field for is carried straight through onto the person's record.</li>
        <li><b>Save and close Excel</b>, then run <code>Start Dashboard.bat</code>. The build
          refuses to run while Excel still holds the file open, and both quality pages warn you
          when the workbook is newer than the last build.</li>
      </ol></div>`;
  }

  /* ---- deliverables map ---------------------------------------------------
     The spec's definition of done requires the deliverables to be linked and
     every link to work. The program-wide Recap page was deleted in Phase 11, so
     this domain-scoped map lives on the pages it describes. Paths are relative
     to dashboard/index.html, so they resolve over file:// — the way this
     dashboard is actually opened. ----------------------------------------*/
  const DELIVERABLES = [
    ['Source workbook (read-only to code)', '../Assets/Quality/Quality Training Log.xlsx', 'The only database for both quality pages'],
    ['ETL — extract + bake', '../etl/extract_quality.py', 'Fingerprint discovery, header-name columns, two log kinds'],
    ['Machine-readable extract', '../data/quality.json', 'Inspectable JSON'],
    ['Baked browser blob', 'js/quality-data.js', 'window.QUALITY — inlined so file:// works'],
    ['Shared page furniture', 'js/quality-common.js', 'window.QL — what both quality pages share'],
    ['Training page', 'js/quality-training.js', 'Who attended — route #/quality-training'],
    ['Signature page', 'js/quality-signature.js', 'Who signed — route #/quality-signature'],
    ['Page styles', 'css/quality.css', 'Layout only — no new colour system'],
    ['Spec — two logs phase', '../tasks/quality-signature/todo.md', 'This phase: decisions, oracle, review'],
    ['Spec — original build', '../tasks/quality-training/todo.md', 'Phase 1 definition of done'],
    ['Brand & design guidelines', '../tasks/quality-training/brand-quality.md', "The section's tokens, grammar, a11y rules"],
    ['Decision ledger', '../tasks/build-log.md', 'Every question answered without asking'],
    ['Gate — regression oracle', '../tasks/quality-signature/assert_oracle.py', 'Baseline the workbook must reproduce'],
    ['Gate — source fidelity', '../tasks/quality-signature/test_source_fidelity.py', 'Recounted from raw cells, no shared code'],
    ['Gate — robustness', '../tasks/quality-signature/test_robustness.py', 'Mutated workbooks the ETL must survive'],
    ['Gate — file:// boot', '../tasks/quality-signature/verify_file_protocol.js', 'All routes, both pages, zero console errors'],
  ];
  function deliverablesPanel() {
    return `<div class="card" style="margin-top:16px" role="note" aria-label="Quality deliverables map">
      <details class="cov-note">
        <summary style="cursor:pointer;font-size:13.5px;color:var(--muted);outline-offset:3px">
          <b style="color:var(--ink)">Deliverables</b> · ${DELIVERABLES.length} artefacts behind the QUALITY section</summary>
        <div class="tbl-wrap" style="margin-top:12px"><table class="tbl">
          <thead><tr><th>Artefact</th><th>Path</th><th>What it is</th></tr></thead>
          <tbody>${DELIVERABLES.map(([name, href, what]) => `<tr>
            <td class="strong">${esc(name)}</td>
            <td><a href="${esc(href)}">${esc(href.replace(/^\.\.\//, ''))}</a></td>
            <td class="muted">${esc(what)}</td></tr>`).join('')}</tbody>
        </table></div>
        <p class="muted" style="margin:10px 0 0;font-size:11.5px">Paths are relative to
          <code>dashboard/index.html</code> and open when the dashboard is launched from the
          file system (the normal way). Served from a web root of <code>dashboard/</code>, the
          <code>../</code> links sit outside that root and will not resolve.</p>
      </details></div>`;
  }

  window.QL = {
    D, esc, fdate, plural, emptyRow, head, guard, noLog,
    distBars, sessionColumns, FLAG_BADGE, flagLabel, flagBadges,
    recordModal, issuesNotice, coverageNotice, howToPanel, deliverablesPanel,
  };
})();

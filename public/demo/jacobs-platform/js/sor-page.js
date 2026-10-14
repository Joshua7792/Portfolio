/* ============================================================================
   sor-page.js — REPORTS ▸ SOR page (Safety Observation Reports).
   Route: sor.  Data: window.SORDATA (baked by etl/extract_sor.py into sor-data.js),
   independent of window.RPT and window.WORKFORCE — never merge the three.

   Reuses window.WFUI (workforce-common.js) for the generic UI helpers only —
   kpiStrip / pill / missing / num / esc and the [data-wfm] record-modal engine.
   head() and guard() are defined LOCALLY so the freshness caption and the
   fix-it instruction name the SOR bake, not the workforce one.

   Charts are pure functions returning SVG/HTML strings — no chart library, and
   charts.js is not touched. Invent nothing: a blank workbook cell renders as an
   em dash or a hatched "not recorded" bucket, never as 0 and never as a guess.
   ========================================================================== */
(function () {
  const Pages = window.Pages = window.Pages || {};
  const U = window.WFUI;
  const F = window.F || {};
  const esc = U.esc;
  const fdate = F.fdate || function (iso) { return iso || '—'; };
  const D = (typeof window.SORDATA !== 'undefined') ? window.SORDATA : null;

  /* ---- page furniture (local: names the SOR bake, not the workforce one) --*/
  function head() {
    let f = '';
    if (D && D.generated_at) {
      try {
        f = ' <span class="wf-fresh">· Extracted ' + esc(new Date(D.generated_at)
          .toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })) + '</span>';
      } catch (e) { f = ''; }
    }
    const src = D && D.source
      ? ` Source: <b>${esc(D.source.file)}</b> · sheet <b>${esc(D.source.sheet)}</b> · <code>${esc(D.source.folder)}</code>.`
      : '';
    return `<div class="page-head"><div><h1>SOR</h1>
        <p>Safety Observation Reports — Demo Project.${src}${f}</p></div>
      <div class="chips"><button class="chip" onclick="window.print()">⤓ Export PDF</button></div></div>`;
  }
  const guard = () => `<div class="note red" style="margin-top:14px"><b>SOR data not available.</b>
    <code>window.SORDATA</code> was not found. Run <code>Start Dashboard.bat</code> (or
    <code>python etl/extract_sor.py</code>) to regenerate
    <code>dashboard/js/sor-data.js</code> from <code>Assets/SOR/</code>.</div>`;

  /* ---- Excel value → tone. Unmapped values fall back to neutral, never to an
     invented label. Blank buckets carry `blank:true` and are drawn hatched. --*/
  function statusTone(label) {
    const s = String(label || '').trim().toLowerCase();
    if (s === 'resolved' || s === 'closed') return { badge: 'b-green', color: 'var(--under)' };
    if (s === 'already implemented') return { badge: 'b-blue', color: 'var(--st-notstarted)' };
    if (s === 'open') return { badge: 'b-amber', color: 'var(--st-progress)' };
    return { badge: 'b-slate', color: 'var(--muted)' };
  }
  function typeTone(label) {
    const s = String(label || '').trim().toLowerCase();
    if (s.indexOf('unsafe') === 0) return { badge: 'b-red', color: 'var(--over)' };
    if (s.indexOf('safe') === 0) return { badge: 'b-green', color: 'var(--under)' };
    return { badge: 'b-slate', color: 'var(--muted)' };
  }
  /* Ageing bands are a PRESENTATION choice, not workbook data — the thresholds
     are printed under the queue so nothing is implied silently. */
  function ageTone(days) {
    if (days == null) return { color: 'var(--muted)', badge: 'b-slate' };
    if (days >= 21) return { color: 'var(--over)', badge: 'b-red' };
    if (days >= 7) return { color: 'var(--st-progress)', badge: 'b-amber' };
    return { color: 'var(--under)', badge: 'b-green' };
  }

  /* ---- distribution bars (label · bar · count) ---------------------------*/
  function distBars(items, toneFn) {
    if (!items || !items.length) return '<p class="muted" style="margin:6px 0">No data.</p>';
    const max = Math.max(1, ...items.map(i => i.count || 0));
    return items.map(i => {
      const tone = (i.blank || !toneFn) ? null : toneFn(i.label);
      const w = Math.max(3, Math.round(100 * (i.count || 0) / max));
      return `<div class="sor-dist hit" tabindex="0" data-tip="${esc(i.label + ': ' + i.count)}">
        <div class="sor-dist-lab${i.blank ? ' muted' : ''}">${esc(i.label)}</div>
        <div class="progress" style="flex:1"><i class="${i.blank ? 'is-blank' : ''}" style="width:${w}%;background:${i.blank ? '' : (tone ? tone.color : 'var(--brand)')}"></i></div>
        <div class="sor-dist-n${i.blank ? ' muted' : ''}">${i.count}</div>
      </div>`;
    }).join('');
  }

  /* ---- submissions-by-month columns --------------------------------------
     The final column is drawn hatched when `as_of` falls before the end of that
     calendar month: a partial month must never read as a real decline. -------*/
  function monthColumns(months, asOf) {
    if (!months || !months.length) return '<p class="muted">No dated submissions.</p>';
    const W = 720, H = 210, pl = 34, pr = 14, pt = 18, pb = 40;
    const max = Math.max(1, ...months.map(m => m.count));
    const gw = (W - pl - pr) / months.length;
    const bw = Math.min(64, gw * 0.56);
    const y = (v) => H - pb - (H - pt - pb) * v / max;
    let partialIx = -1;
    if (asOf) {
      const last = months[months.length - 1];
      const d = new Date(asOf + 'T00:00:00');
      const inMonth = last.ym === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      if (inMonth && d.getDate() < dim) partialIx = months.length - 1;
    }
    let grid = '';
    for (let g = 0; g <= 4; g++) {
      const gy = pt + (H - pt - pb) * g / 4;
      const v = Math.round(max * (4 - g) / 4);
      grid += `<line x1="${pl}" y1="${gy.toFixed(1)}" x2="${W - pr}" y2="${gy.toFixed(1)}" stroke="var(--border-2)"/>`
        + `<text x="${pl - 7}" y="${(gy + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--muted)">${v}</text>`;
    }
    const bars = months.map((m, i) => {
      const cx = pl + gw * i + gw / 2, top = y(m.count), part = i === partialIx;
      const tip = `${m.label}: ${m.count} submission${m.count === 1 ? '' : 's'}${part ? ' (partial month)' : ''}`;
      return `<g class="hit" tabindex="0" data-tip="${esc(tip)}">
        <rect x="${(cx - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${(H - pb - top).toFixed(1)}" rx="4"
          fill="${part ? 'url(#sorPartial)' : 'var(--brand)'}" stroke="${part ? 'var(--brand)' : 'none'}" stroke-width="${part ? 1.2 : 0}"/>
        <text x="${cx.toFixed(1)}" y="${(top - 6).toFixed(1)}" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--ink)">${m.count}</text>
        <text x="${cx.toFixed(1)}" y="${H - 20}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${esc(m.label)}</text>
        ${part ? `<text x="${cx.toFixed(1)}" y="${H - 7}" text-anchor="middle" font-size="9" fill="var(--muted)">partial</text>` : ''}
        <title>${esc(tip)}</title></g>`;
    }).join('');
    return `<svg class="svgc sor-months" viewBox="0 0 ${W} ${H}" width="100%" role="img"
        aria-label="Observations submitted per month">
      <defs><pattern id="sorPartial" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <rect width="7" height="7" fill="color-mix(in srgb,var(--brand) 16%,transparent)"/>
        <line x1="0" y1="0" x2="0" y2="7" stroke="var(--brand)" stroke-width="3"/></pattern></defs>
      ${grid}${bars}</svg>`;
  }

  /* ---- safe / unsafe split bar -------------------------------------------*/
  function splitBar(parts, total) {
    if (!total) return '';
    return `<div class="sor-split">` + parts.filter(p => p.n > 0).map(p =>
      `<span class="hit" tabindex="0" data-tip="${esc(p.label + ': ' + p.n + ' of ' + total)}"
        style="flex:${p.n};background:${p.bg}${p.ink ? `;color:${p.ink}` : ''}">${p.n}</span>`).join('') + `</div>`;
  }

  /* ---- record modal: every one of the workbook's own columns, in order ----*/
  const longText = (v) => (v == null || v === '')
    ? '<span class="muted">—</span>' : `<span class="sor-longtext">${esc(v)}</span>`;

  function recordModal(r) {
    const labels = (D.coverage && D.coverage.field_labels) || {};
    const L = (k, fb) => esc(labels[k] || fb || k);
    const st = statusTone(r.current_status), ty = typeTone(r.observation_type);
    const pairs = [
      [L('submitted_on', 'Submitted On'), r.submitted_on_raw ? esc(r.submitted_on_raw) : '<span class="muted">—</span>'],
      [L('submitted_by'), U.missing(r.submitted_by)],
      [L('name'), U.missing(r.name)],
      [L('id'), U.missing(r.id)],
      [L('project'), U.missing(r.project)],
      [L('category'), U.missing(r.category)],
      [L('safety_category'), U.missing(r.safety_category)],
      [L('event'), U.missing(r.event)],
      [L('observation_type'), r.observation_type ? U.pill(ty.badge, r.observation_type) : '<span class="muted">—</span>'],
      [L('other_obsv_type'), U.missing(r.other_obsv_type)],
      [L('location'), U.missing(r.location)],
      [L('contractor'), U.missing(r.contractor)],
      [L('companies_observed'), U.missing(r.companies_observed)],
      [L('issue_description'), longText(r.issue_description)],
      [L('desc_resolution'), longText(r.desc_resolution)],
      [L('escalated_to'), longText(r.escalated_to)],
      [L('recommendation'), longText(r.recommendation)],
      [L('original_status'), U.missing(r.original_status)],
      [L('current_status'), r.current_status ? U.pill(st.badge, r.current_status) : '<span class="muted">—</span>'],
      [L('status_comment'), U.missing(r.status_comment)],
      [L('status_changed_by'), U.missing(r.status_changed_by)],
      [L('status_date'), r.status_date_raw ? esc(r.status_date_raw) : '<span class="muted">—</span>'],
    ];
    if (r.is_open && r.days_open != null) {
      pairs.push(['Days open', `${r.days_open} (as of ${fdate(D.as_of)})`]);
    }
    if (r.extra) Object.keys(r.extra).forEach(k => pairs.push([k, longText(r.extra[k])]));
    return U.wfm(`SOR ${r.id || '—'}`, pairs, 'Safety observation record');
  }

  /* ---- narrative cell: what was reported, then what was done about it ----*/
  function narrative(r) {
    const a = r.issue_description || r.recommendation;
    const b = r.desc_resolution;
    if (!a && !b) return '<span class="muted">—</span>';
    return `<div class="sor-narrative"><b>${a ? esc(a) : '<span class="muted">—</span>'}</b>${b ? `<small>${esc(b)}</small>` : ''}</div>`;
  }

  /* ---- table rows ---------------------------------------------------------*/
  function logRow(r) {
    const st = statusTone(r.current_status), ty = typeTone(r.observation_type);
    return `<tr class="hit" ${recordModal(r)}>
      <td class="mono">${r.submitted_date ? fdate(r.submitted_date) : esc(r.submitted_on_raw || '—')}</td>
      <td class="mono">${U.missing(r.id)}</td>
      <td><span class="sor-cell">${U.missing(r.name)}</span></td>
      <td class="muted">${U.missing(r.category)}</td>
      <td>${r.observation_type ? U.pill(ty.badge, r.observation_type) : '<span class="muted">—</span>'}</td>
      <td><span class="sor-cell">${U.missing(r.contractor)}</span></td>
      <td>${narrative(r)}</td>
      <td>${r.current_status ? U.pill(st.badge, r.current_status) : '<span class="muted">—</span>'}</td>
    </tr>`;
  }
  function openRow(r) {
    const a = ageTone(r.days_open);
    return `<tr class="hit" ${recordModal(r)}>
      <td><span class="sor-age" style="color:${a.color}"><span class="d" style="background:${a.color}"></span>${r.days_open == null ? '—' : r.days_open + 'd'}</span></td>
      <td class="mono">${r.submitted_date ? fdate(r.submitted_date) : esc(r.submitted_on_raw || '—')}</td>
      <td class="mono">${U.missing(r.id)}</td>
      <td class="muted">${U.missing(r.category)}</td>
      <td><span class="sor-cell">${U.missing(r.name)}</span></td>
      <td><span class="sor-cell">${U.missing(r.contractor)}</span></td>
      <td>${narrative(r)}</td>
      <td>${U.pill(statusTone(r.current_status).badge, r.current_status || '—')}</td>
    </tr>`;
  }
  const emptyRow = (n, msg) => `<tr><td colspan="${n}" class="muted center">${esc(msg)}</td></tr>`;

  /* ---- source-coverage notice --------------------------------------------
     Renders '' the moment the export fills every field, so a complete workbook
     shows nothing at all. Mirrors app.js::coverageNoticePanel for the P6 export. */
  function coverageNotice() {
    const c = (D && D.coverage) || {};
    const labels = c.field_labels || {};
    const never = (c.fields_never_filled || []).map(k => labels[k] || k);
    const gone = (c.fields_missing_header || []).map(k => labels[k] || k);
    const extra = c.extra_columns || [];
    if (!never.length && !gone.length && !extra.length) return '';
    const bits = [];
    if (gone.length) bits.push(`<p style="margin:0 0 8px"><b>${gone.length} column${gone.length === 1 ? '' : 's'} not in this export:</b>
      ${gone.map(esc).join(', ')} — reported as <b>unavailable</b>, never as zero.</p>`);
    if (never.length) bits.push(`<p style="margin:0 0 8px"><b>${never.length} form field${never.length === 1 ? '' : 's'} present but never filled</b>
      across all ${D.kpis.total} submissions: ${never.map(esc).join(', ')}. The column exists in the workbook and every cell is empty,
      so this dashboard shows an em dash rather than implying a zero.</p>`);
    if (extra.length) bits.push(`<p style="margin:0 0 8px"><b>${extra.length} new column${extra.length === 1 ? '' : 's'}</b>
      not in this dashboard's field map: ${extra.map(esc).join(', ')} — carried through and shown on each record.</p>`);
    const nCols = (c.columns_present || []).length;
    return `<div class="card" style="margin-top:16px" role="note" aria-label="SOR source coverage notice">
      <details class="cov-note">
        <summary style="cursor:pointer;font-size:13.5px;color:var(--muted);outline-offset:3px">
          <b style="color:var(--ink)">Source coverage</b> · ${nCols} columns read from ${esc((D.source || {}).file || 'the workbook')}
          · ${never.length + gone.length} field${(never.length + gone.length) === 1 ? ' carries' : 's carry'} no data</summary>
        <div class="note amber" style="margin-top:12px">${bits.join('')}
          <p style="margin:0">Every column is resolved by <b>header name</b>, never by position — the source team can add,
          drop or reorder columns and this page keeps working. ${esc(c.open_rule || '')}</p>
        </div>
      </details></div>`;
  }

  /* ---- deliverables map ---------------------------------------------------
     The spec's definition of done requires the deliverables to be linked and
     every link to work. The program-wide Recap page was deleted in Phase 11, so
     this SOR-scoped map lives on the page it describes rather than resurrecting
     a deleted route. Paths are relative to dashboard/index.html, so they resolve
     over file:// — the way the dashboard is actually opened. Under a dev server
     rooted at dashboard/ they point outside the root; the caption says so rather
     than pretending otherwise. ---------------------------------------------*/
  const DELIVERABLES = [
    ['Source workbook (read-only)', '../Assets/SOR/sor-log.xlsx', 'The only database for this page'],
    ['ETL — extract + bake', '../etl/extract_sor.py', 'Fingerprint discovery, header-name columns'],
    ['Machine-readable extract', '../data/sor.json', 'Inspectable JSON'],
    ['Baked browser blob', 'js/sor-data.js', 'window.SORDATA — inlined so file:// works'],
    ['Page renderer', 'js/sor-page.js', "This page's route + charts"],
    ['Page styles', 'css/sor.css', 'Layout only — no new colour system'],
    ['Spec + checklist', '../tasks/sor/todo.md', 'Definition of done, decisions, review'],
    ['Brand & design guidelines', '../tasks/sor/brand-sor.md', "This page's tokens, grammar, a11y rules"],
    ['Decision ledger', '../tasks/build-log.md', 'Every question answered without asking'],
    ['Gate — regression oracle', '../tasks/sor/assert_oracle.py', '34 checks vs the baseline'],
    ['Gate — source fidelity', '../tasks/sor/test_source_fidelity.py', '43 checks recounted from raw cells'],
    ['Gate — robustness', '../tasks/sor/test_robustness.py', '15 mutated workbooks'],
    ['Gate — file:// boot', '../tasks/sor/verify_file_protocol.js', 'All routes, zero console errors'],
  ];
  function deliverablesPanel() {
    return `<div class="card" style="margin-top:16px" role="note" aria-label="SOR deliverables map">
      <details class="cov-note">
        <summary style="cursor:pointer;font-size:13.5px;color:var(--muted);outline-offset:3px">
          <b style="color:var(--ink)">Deliverables</b> · ${DELIVERABLES.length} artefacts behind this page</summary>
        <div class="tbl-wrap" style="margin-top:12px"><table class="tbl">
          <thead><tr><th>Artefact</th><th>Path</th><th>What it is</th></tr></thead>
          <tbody>${DELIVERABLES.map(([name, href, what]) => `<tr>
            <td class="strong">${esc(name)}</td>
            <td><a href="${esc(href)}">${esc(href.replace(/^\.\.\//, ''))}</a></td>
            <td class="muted">${esc(what)}</td></tr>`).join('')}</tbody>
        </table></div>
        <p class="muted" style="margin:10px 0 0;font-size:11.5px">Paths are relative to
          <code>dashboard/index.html</code> and open when the dashboard is launched from the file
          system (the normal way). Served from a web root of <code>dashboard/</code>, the four
          <code>../</code> links sit outside that root and will not resolve.</p>
      </details></div>`;
  }

  /* ---- module-local: where the log table's modal records start, so a
     filter re-render reuses those slots instead of growing __WFM forever
     (open-items records sit BELOW this index and stay valid). --------------*/
  let logBase = 0;

  /* =========================== the page ==================================*/
  Pages['sor'] = function () {
    if (!D) return head() + guard();
    U.wfmReset();

    const k = D.kpis || {};
    const rows = D.rows || [];
    const open = D.open_items || [];
    const types = D.by_observation_type || [];
    const blankType = (types.find(t => t.blank) || {}).count || 0;
    const typed = k.total - blankType;
    const other = k.total - k.safe - k.unsafe - blankType;
    const q = D.observer_quality || {};

    const kpis = U.kpiStrip([
      { label: 'Observations', value: U.num(k.total), sub: `${fdate(D.first_submission)} → ${fdate(D.as_of)}` },
      // oldest_open_days is null when an open item carries no usable submitted
      // date — guard it, or the tile prints the literal string "oldest nulld".
      {
        label: 'Open', value: U.num(k.open),
        sub: !k.open ? 'nothing outstanding'
          : (k.oldest_open_days == null ? 'age not datable' : `oldest ${k.oldest_open_days}d`),
        tone: k.open ? 'is-risk' : 'is-positive'
      },
      { label: 'Unsafe conditions', value: U.num(k.unsafe), sub: `of ${typed} typed`, tone: k.unsafe ? 'is-risk' : 'is-positive' },
      { label: 'Safe acts & conditions', value: U.num(k.safe), sub: `of ${typed} typed`, tone: k.safe ? 'is-positive' : '' },
      { label: 'Recommendations', value: U.num(k.recommendations) },
      { label: 'Observers', value: U.num(k.observers), sub: `${k.unnamed} submission${k.unnamed === 1 ? '' : 's'} unnamed` },
      { label: 'Contractors observed', value: U.num(k.companies) },
    ]);

    const trend = `<div class="card">
      <div class="card-head"><h3>Submissions per month</h3>
        <span class="muted" style="font-size:12px">${U.num(k.total)} total · ${fdate(D.first_submission)} → ${fdate(D.as_of)}</span></div>
      ${monthColumns(D.by_month, D.as_of)}
      <p class="muted" style="margin:6px 0 0;font-size:12px">Counted from each record's <b>Submitted On</b> date.
        The hatched column is a month still in progress at the data cut-off (${fdate(D.as_of)}) — not a decline.
        ${D.undated ? `<b>${U.num(D.undated)} submission${D.undated === 1 ? '' : 's'}</b> carry a
          <b>Submitted On</b> value this dashboard could not read as a date, so ${D.undated === 1 ? 'it is' : 'they are'}
          absent from these bars (the bars total ${U.num(k.total - D.undated)}, not ${U.num(k.total)});
          the original text is on each record.` : ''}</p></div>`;

    const mix = `<div class="card">
      <div class="card-head"><h3>Observation mix</h3>
        <span class="muted" style="font-size:12px">${U.num(typed)} of ${U.num(k.total)} typed</span></div>
      ${splitBar([
        { label: 'Safe acts & conditions', n: k.safe, bg: 'var(--under)' },
        { label: 'Unsafe conditions', n: k.unsafe, bg: 'var(--over)' },
        { label: 'Other types', n: other, bg: 'var(--planned)' },
        { label: 'No type recorded', n: blankType, bg: 'color-mix(in srgb,var(--muted) 22%,transparent)', ink: 'var(--muted)' },
      ], k.total)}
      <div class="sor-legend">
        <span><i class="sw" style="background:var(--under)"></i>Safe ${k.safe}</span>
        <span><i class="sw" style="background:var(--over)"></i>Unsafe ${k.unsafe}</span>
        <span><i class="sw" style="background:var(--planned)"></i>Other ${other}</span>
        <span><i class="sw" style="background:color-mix(in srgb,var(--muted) 22%,transparent)"></i>Not recorded ${blankType}</span>
      </div>
      <div style="margin-top:14px">${distBars(types, typeTone)}</div></div>`;

    const sub = (title, bars) => `<div style="border-top:1px solid var(--border-2);margin-top:12px;padding-top:10px">
      <div class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.6px;font-weight:700;margin-bottom:6px">${esc(title)}</div>${bars}</div>`;

    const dists = `<div class="grid cols-3" style="margin:16px 0">
      <div class="card"><div class="card-head"><h3>By current status</h3></div>${distBars(D.by_status, statusTone)}
        ${sub('Event', distBars(D.by_event, null))}</div>
      <div class="card"><div class="card-head"><h3>By contractor</h3></div>${distBars(D.by_contractor, null)}
        <p class="muted" style="margin:8px 0 0;font-size:11.5px">The workbook's <b>Contractor</b> column
          (${U.num(k.total - ((D.by_contractor.find(r => r.blank) || {}).count || 0))} of ${U.num(k.total)} filled).
          <b>Companies Observed</b> is a separate column
          (${U.num(k.total - ((D.by_company_observed.find(r => r.blank) || {}).count || 0))} of ${U.num(k.total)} filled),
          shown on every record's detail.</p></div>
      <div class="card"><div class="card-head"><h3>By category</h3></div>${distBars(D.by_category, null)}
        ${sub('Safety category', distBars(D.by_safety_category, null))}</div>
    </div>`;

    const openCard = `<div class="card">
      <div class="card-head"><h3>Open items — the action queue</h3>
        <span class="muted" style="font-size:12px">${open.length} of ${U.num(k.total)} still open</span></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Age</th><th>Submitted</th><th>ID</th><th>Category</th><th>Observer</th><th>Contractor</th><th>What was reported</th><th>Status</th></tr></thead>
        <tbody>${open.length ? open.map(openRow).join('') : emptyRow(8, 'Nothing is open — every observation is closed out.')}</tbody>
      </table></div>
      <p class="muted" style="margin:10px 0 0;font-size:11.5px">Age is days from <b>Submitted On</b> to the data cut-off
        ${fdate(D.as_of)} (the newest submission in the workbook), not to today — so this number is reproducible.
        Colour banding is a display aid: <b style="color:var(--under)">under 7d</b> ·
        <b style="color:var(--st-progress)">7–20d</b> · <b style="color:var(--over)">21d+</b>.
        ${esc((D.coverage || {}).open_rule || '')}</p>
      <span class="interaction-hint" aria-hidden="true">Select a row for the full Excel record</span></div>`;

    const variants = (q.variant_groups || []);
    const observers = `<div class="card">
      <div class="card-head"><h3>Who is reporting</h3>
        <span class="muted" style="font-size:12px">${k.observers} name${k.observers === 1 ? '' : 's'} · ${k.unnamed} unnamed</span></div>
      ${distBars(D.by_observer, null)}
      ${variants.length ? `<p class="muted" style="margin:10px 0 0;font-size:11.5px">
        <b>Names are free text in the form.</b> ${q.alternate_spellings} of the ${k.observers} entries above are alternate
        spellings of a name already listed (${variants.map(g => esc(g.join(' / '))).join('; ')}). They are shown exactly as
        typed — this dashboard does not merge people the workbook never said were the same.</p>` : ''}</div>`;

    const catOpts = (D.by_category || []).filter(r => !r.blank).map(r => r.label);
    const typeOpts = (D.by_observation_type || []).filter(r => !r.blank).map(r => r.label);
    const statOpts = (D.by_status || []).filter(r => !r.blank).map(r => r.label);
    const contOpts = (D.by_contractor || []).filter(r => !r.blank).map(r => r.label);
    const opt = (list, all) => `<option value="">${all}</option>`
      + list.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');

    // Build the open-items card FIRST so its modal indices are stable, then
    // record where the log table's records begin (see `logBase` above).
    // align-items:start so each card sizes to its own content — the observer
    // list is much taller than the 4-column trend and stretching left dead space.
    const openHtml = openCard
      + `<div class="grid cols-2" style="margin:16px 0;align-items:start">${trend}${observers}</div>`;
    logBase = window.__WFM.length;

    const log = `<div class="card">
      <div class="card-head"><h3>Observation log</h3>
        <span class="muted" style="font-size:12px">every row is one submission in ${esc((D.source || {}).file || 'the workbook')}</span></div>
      <div class="wf-filters">
        <input id="sor-q" type="search" placeholder="Search description, resolution, observer, ID…" aria-label="Search observations" style="min-width:250px">
        <select id="sor-cat" aria-label="Filter by category">${opt(catOpts, 'All categories')}</select>
        <select id="sor-type" aria-label="Filter by observation type">${opt(typeOpts, 'All types')}</select>
        <select id="sor-stat" aria-label="Filter by current status">${opt(statOpts, 'All statuses')}</select>
        <select id="sor-cont" aria-label="Filter by contractor">${opt(contOpts, 'All contractors')}</select>
        <span id="sor-count" class="muted" style="margin-left:auto;font-size:12.5px">${rows.length} result${rows.length === 1 ? '' : 's'}</span>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Submitted</th><th>ID</th><th>Observer</th><th>Category</th><th>Type</th><th>Contractor</th><th>Report / resolution</th><th>Status</th></tr></thead>
        <tbody id="sor-tbody">${rows.length ? rows.map(logRow).join('') : emptyRow(8, 'No observations.')}</tbody>
      </table></div>
      <span class="interaction-hint" aria-hidden="true">Select a row for all ${(D.coverage.columns_present || []).length} workbook fields</span></div>`;

    return head() + kpis
      + `<div style="margin:16px 0">${mix}</div>`
      + dists + openHtml + log + coverageNotice() + deliverablesPanel();
  };

  /* ---- post-render: search + four filters over the log table --------------*/
  Pages['_after_sor'] = function () {
    if (!D) return;
    const rows = D.rows || [];
    const q = document.getElementById('sor-q');
    const cat = document.getElementById('sor-cat');
    const typ = document.getElementById('sor-type');
    const sta = document.getElementById('sor-stat');
    const con = document.getElementById('sor-cont');
    const tbody = document.getElementById('sor-tbody');
    const count = document.getElementById('sor-count');
    if (!q || !cat || !typ || !sta || !con || !tbody || !count) return;

    function apply() {
      const term = q.value.trim().toLowerCase();
      const cv = cat.value, tv = typ.value, sv = sta.value, kv = con.value;
      const filtered = rows.filter(r => {
        if (cv && r.category !== cv) return false;
        if (tv && r.observation_type !== tv) return false;
        if (sv && r.current_status !== sv) return false;
        if (kv && r.contractor !== kv) return false;
        if (term) {
          const hay = [r.id, r.name, r.contractor, r.companies_observed, r.location,
            r.issue_description, r.desc_resolution, r.recommendation, r.event,
            r.safety_category, r.submitted_on_raw].join(' ').toLowerCase();
          if (hay.indexOf(term) === -1) return false;
        }
        return true;
      });
      // Reuse the log table's modal slots so repeated filtering cannot grow
      // __WFM without bound; the open-items records below logBase stay valid.
      window.__WFM.length = logBase;
      tbody.innerHTML = filtered.length ? filtered.map(logRow).join('')
        : emptyRow(8, 'No observations match these filters.');
      count.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
    }
    q.addEventListener('input', apply);
    [cat, typ, sta, con].forEach(el => el.addEventListener('change', apply));
  };
})();

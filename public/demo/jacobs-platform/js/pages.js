/* ============================================================================
   pages.js — one render function per route. Reads window.RPT only.
   All Excel-derived strings pass through F.esc() before hitting innerHTML.
   ========================================================================== */
(function () {
  const Pages = window.Pages = window.Pages || {};
  const D = window.RPT, C = window.Charts, F = window.F;
  const { money, usd, fdate, fmonth, esc } = F;
  const B = D.budget, SC = D.schedule, M = D.meta;
  const DATE = M.schedule_as_of || M.data_date;   // truthful schedule cutoff
  // Dynamic segments + stable per-segment colour (Phase 5). meta.segments is the
  // authoritative ordered list (first appearance in the workbook); colours cycle a
  // fixed palette so each segment keeps the same colour across every chart.
  const SEGMENTS = (M.segments && M.segments.length ? M.segments : (SC.segments || [])).map(s => s.name);
  const PALETTE = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--c7)', 'var(--c8)'];
  const _hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
  const _segIndex = {}; SEGMENTS.forEach((n, i) => { _segIndex[n] = i; });
  const segmentColor = (name) => PALETTE[(_segIndex[name] != null ? _segIndex[name] : Math.abs(_hashStr(String(name)))) % PALETTE.length];
  const DDMONTH = DATE.slice(0, 7);   // schedule-cutoff month (month-in-review split)
  // Cash-flow actual/projected boundary follows the COST report's freshness (a cost
  // concept), not the schedule cutoff. Fall back to the schedule month if absent.
  const CF_ACTUAL = (M.source_freshness && M.source_freshness.cashflow_actual_through) || null;
  let CF_MARK = CF_ACTUAL ? B.cashflow.months.indexOf(CF_ACTUAL) : -1;
  if (CF_MARK < 0) B.cashflow.months.forEach((m, i) => { if (m < DDMONTH) CF_MARK = i; });

  const state = { pkg: 'All', chStatus: 'All', look: 14, month: null };

  function mount(id) { const v = document.getElementById('view'); v.innerHTML = '<div class="page">' + Pages[id]() + '</div>'; if (Pages['_after_' + id]) Pages['_after_' + id](); }

  const head = (h1, p) => `<div class="page-head"><div><h1>${h1}</h1><p>${p}</p></div>
    <div class="chips"><button class="chip" onclick="window.print()">⤓ Export PDF</button>
    <button class="chip" onclick="window.startTour(0)">▶ Boss Brief</button></div></div>`;

  const statusBadge = (s) => {
    const map = { 'Completed': 'b-green', 'In Progress': 'b-amber', 'Not Started': 'b-blue' };
    return `<span class="badge ${map[s] || 'b-slate'}"><span class="d" style="background:currentColor"></span>${esc(s)}</span>`;
  };
  const varCell = (d) => {   // shared BL-variance cell: +late=red, -early=green
    if (d == null) return '<td class="num">—</td>';
    const cls = d > 3 ? 'down' : d < -3 ? 'up' : 'muted';
    return `<td class="num ${cls}">${d > 0 ? '+' : ''}${d}d</td>`;
  };

  const daysFrom = (iso) => Math.round((new Date(iso) - new Date(DATE)) / 864e5);
  const detail = (type, key) => esc(type + ':' + String(key));

  /* ---- honest degradation when the P6 export drops a column ----------------
     A card that prints "0" for a field the source stopped reporting is a lie to
     the boss; "not reported" is the truth. Cov.has(field) is false ONLY for the
     fields this export actually lacks, so a full export renders exactly as it
     always did. COMPLETION_OK is false when the export stamps no actual finish
     dates — then a completed COUNT is a floor, and a PERCENTAGE of that count
     is misleading, so the percentage is withheld. */
  const Cov = window.Cov, COV = window.COV || {};
  const NR = `<span class="muted" title="${esc(Cov.why)}">not reported</span>`;
  const nrDash = `<span class="muted" title="${esc(Cov.why)}">—</span>`;
  const COMPLETION_OK = COV.completion_reliable !== false;
  const COMPLETION_WHY = esc(COV.completion_basis || '');
  // number for a field the export may not carry: value, else "—", else "not reported"
  const covNum = (field, v) => !Cov.has(field) ? nrDash
    : (v == null ? '—' : Number(v).toLocaleString());
  const donePct = (v) => (COMPLETION_OK && v != null) ? v + '%' : nrDash;
  const doneNum = (v) => (v == null ? '—' : Number(v).toLocaleString());
  // "nothing finished this month" is a false claim when the export never stamps an
  // actual finish date. Say what is actually true instead.
  const NO_ACTUALS = `This P6 export stamps no actual finish dates, so completion by month cannot be shown — it is unknown, not zero.`;
  const hint = '<span class="interaction-hint" aria-hidden="true">Select a chart mark or row for source detail</span>';

  /* ======================================================= OVERVIEW ========*/
  Pages.overview = function () {
    const g = B.grand_total, sc = SC.status_counts;
    const pctComplete = 100 * sc.completed / sc.total;
    const cf = B.cashflow;
    const active = B.changes.filter(c => ['In Progress', 'On Hold', 'Submitted'].includes((c.status || '').trim()));
    const activeValue = active.reduce((s, c) => s + (c.amount == null ? 0 : Number(c.amount)), 0);
    const unknownActive = active.filter(c => c.amount == null).length;
    const remaining = g.forecast - g.committed;
    const nextMs = SC.program_milestones.filter(m => m.status !== 'Completed' && m.finish && m.finish >= DATE).sort((a, b) => a.finish.localeCompare(b.finish))[0];
    const nextCrit = SC.activities.filter(a => a.status !== 'Completed' && a.critical && a.finish && daysFrom(a.finish) >= 0 && daysFrom(a.finish) <= 14).sort((a, b) => a.finish.localeCompare(b.finish))[0];
    let hcIndex = -1; B.headcount.actual.forEach((v, i) => { if (v != null) hcIndex = i; });
    const hcActual = hcIndex >= 0 ? B.headcount.actual[hcIndex] : null;
    const hcPlan = hcIndex >= 0 ? B.headcount.planned[hcIndex] : null;
    const metric = (lab, val, sub, cls) => `<div class="metric"><div class="lab">${lab}</div><div class="val ${cls || ''}">${val}</div><div class="delta muted">${sub}</div></div>`;

    const pkgRows = SC.packages.map(p => `
      <tr class="hit" tabindex="0" data-detail="${detail('package', p.package)}"><td class="strong"><span class="seg-dot" style="background:${segmentColor(p.package)}"></span>${esc(p.package)}</td>
      <td class="num">${p.total}</td>
      <td class="num">${COMPLETION_OK ? doneNum(p.completed) : nrDash}</td>
      <td class="num">${covNum('critical', p.critical)}</td>
      <td class="num">${fdate(p.fc_finish)}</td>
      <td style="min-width:110px"><div class="progress"><i style="width:${COMPLETION_OK && p.pct_complete != null ? p.pct_complete : 0}%;background:var(--brand)"></i></div></td>
      <td class="num strong">${donePct(p.pct_complete)}</td></tr>`).join('');

    const topChanges = active.filter(c => c.amount != null).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 5).map(c => `
      <tr class="hit" tabindex="0" data-detail="${detail('cn', c.cn)}"><td class="strong">${esc(c.cn)}</td><td>${esc(c.title)}</td>
      <td>${statusPill(c.status)}</td><td class="num strong">${money(c.amount)}</td></tr>`).join('');

    return head('Command Center', `${esc(M.project)} · ${esc(M.client)} · CM by ${esc(M.cm)} — the decisions behind program status as of ${fdate(DATE)}.`)
      + F.coverageNoticeBanner() + `
    <div class="executive-brief" style="margin-bottom:16px">
      <section class="focal-panel"><div class="lab">Program forecast</div><div class="val" style="font-size:42px">${money(g.forecast)}</div>
        <div class="delta down">${money(Math.abs(g.variance))} above ${money(g.budget)} current budget</div>
        <div style="margin:18px 0 10px">${C.costBar({ paid: g.wip, committed: g.committed, forecast: g.forecast, budget: g.budget, money, detail: 'dial:total' })}</div>
        <p class="muted" style="margin:0">${money(g.committed)} committed · ${money(g.wip)} in place · ${money(remaining)} of forecast not yet committed.</p>
      </section>
      <section class="flat-panel"><div class="section-heading"><div><h2>Attention queue</h2><p>Exceptions and next actions, linked to their source.</p></div><a class="chip" href="#/insights">All insights →</a></div>
        <div class="attention-list">
          <div class="attention-item hit" tabindex="0" role="button" data-detail="dial:total"><b>${money(remaining)} forecast not committed</b><span>${(100 * remaining / g.forecast).toFixed(1)}% of the program forecast remains to be covered.</span></div>
          <a class="attention-item" href="#/changes"><b>${money(activeValue)} active change exposure</b><span>${active.length} active notices; ${unknownActive} ${unknownActive === 1 ? 'has' : 'have'} no entered value.</span></a>
          ${!Cov.has('critical')
      ? `<div class="attention-item"><b>Next P6-critical finish · not reported</b><span>${esc(COV.schedule_export || 'The current P6 export')} carries no Critical column, so critical-path exposure cannot be shown. <a href="#/schedule">Details →</a></span></div>`
      : nextCrit ? `<div class="attention-item hit" tabindex="0" role="button" data-detail="${detail('activity', nextCrit.id)}"><b>Next P6-critical finish · ${fdate(nextCrit.finish)}</b><span>${esc(nextCrit.name)}</span></div>` : ''}
          ${nextMs ? `<div class="attention-item hit" tabindex="0" role="button" data-detail="${detail('milestone', nextMs.id)}"><b>Next program milestone · ${fdate(nextMs.finish)}</b><span>${esc(nextMs.name)}</span></div>` : ''}
          ${hcIndex >= 0 ? `<div class="attention-item hit" tabindex="0" role="button" data-detail="${detail('hcmonth', B.headcount.months[hcIndex])}"><b>${hcActual} on site vs ${hcPlan} planned</b><span>${fmonth(B.headcount.months[hcIndex])} actual resource position.</span></div>` : ''}
        </div>
      </section>
    </div>
    <div class="metric-strip" style="margin-bottom:16px">
      ${metric('Committed', money(g.committed), (100 * g.committed / g.forecast).toFixed(0) + '% of forecast')}
      ${metric('Work in place', money(g.wip), (100 * g.wip / g.forecast).toFixed(0) + '% of forecast')}
      ${metric('Activities complete', doneNum(sc.completed), COMPLETION_OK ? pctComplete.toFixed(1) + '% activity-count basis'
        : `<span title="${COMPLETION_WHY}">derived floor — this export stamps no actual finish dates</span>`)}
      ${metric('P6-critical', covNum('critical', sc.critical), Cov.has('critical') ? 'workbook critical flag'
        : `<span title="${esc(Cov.why)}">not in this P6 export</span>`, Cov.has('critical') ? 'down' : '')}
    </div>
    <div class="grid cols-3" style="margin-bottom:16px">
      <div class="card span-2"><div class="card-head"><h3>Program commitment curve</h3><span class="badge b-slate">${cf.months.length ? `${fmonth(cf.months[0])} → ${fmonth(cf.months[cf.months.length - 1])}` : 'not in latest report'}</span></div>
        ${cf.months.length ? `${C.sCurve({ labels: cf.months.map(fmonth), cumulative: cf.cumulative, period: cf.period, money, markIndex: CF_MARK,
          dotMeta: cf.months.map((m, i) => ({ tip: `${fmonth(m)}: ${money(cf.cumulative[i])} cumulative`, detail: `month:${m}` })) })}
        <div class="legend"><span><i style="background:var(--brand)"></i>Committed to date</span><span><i style="background:var(--brand);opacity:.6"></i>Projected (dashed)</span><span><i style="background:var(--brand-3);opacity:.5"></i>Monthly commitment</span></div>` : `<div class="detail-empty">The latest cost report (${fdate(M.last_updated)}) no longer carries the time-phased commitment-flow curve. Committed-to-date totals stay on the <a href="#/budget">Budget</a> page.</div>`}</div>
      <div class="card"><h3>Construction status</h3><div class="sub">${sc.total.toLocaleString()} total activities</div>
        <div class="center">${C.donut([
          { label: 'Completed', value: sc.completed, color: 'var(--st-complete)', tip: `Completed: ${sc.completed}`, detail: 'status:Completed' },
          { label: 'In Progress', value: sc.in_progress, color: 'var(--st-progress)', tip: `In Progress: ${sc.in_progress}`, detail: 'status:In Progress' },
          { label: 'Not Started', value: sc.not_started, color: 'var(--st-notstarted)', tip: `Not Started: ${sc.not_started}`, detail: 'status:Not Started' }],
      { big: COMPLETION_OK ? pctComplete.toFixed(1) + '%' : '—', small: COMPLETION_OK ? 'complete' : 'not reported' })}</div>
        <div class="legend" style="justify-content:center">
          <span><i style="background:var(--st-complete)"></i>Completed ${sc.completed}</span>
          <span><i style="background:var(--st-progress)"></i>In progress ${sc.in_progress}</span>
          <span><i style="background:var(--st-notstarted)"></i>Not started ${sc.not_started}</span></div></div>
    </div>
    <div class="grid cols-3">
      <div class="card span-2"><div class="card-head"><h3>Package performance</h3><a class="chip" href="#/schedule">Open schedule →</a></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Package</th><th class="num">Acts</th><th class="num">Done</th><th class="num">Critical</th><th class="num">FC finish</th><th>Progress</th><th class="num">%</th></tr></thead><tbody>${pkgRows}</tbody></table></div></div>
      <div class="flat-panel"><div class="card-head"><h3>Largest active change notices</h3><a class="chip" href="#/changes">All →</a></div>
        <div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>CN</th><th>Title</th><th>Status</th><th class="num">Value</th></tr></thead><tbody>${topChanges}</tbody></table></div></div>
    </div>`;
  };

  /* ======================================================= BUDGET ==========*/
  function statusPill(s) {
    s = (s || '').trim();
    const m = { 'Approved': 'b-green', 'In Progress': 'b-amber', 'On Hold': 'b-slate', 'Submitted': 'b-blue', 'Cancelled': 'b-red' };
    return `<span class="badge ${m[s] || 'b-slate'}">${esc(s || '—')}</span>`;
  }
  Pages.budget = function () {
    const g = B.grand_total;
    const cm = B.categories.find(c => c.category === 'CM Services');
    const dial = (title, key, o) => `<div class="card"><div class="card-head"><h3>${title}</h3>${hint}</div>
      ${C.gauge(Object.assign({ title, money, detail: `dial:${key}` }, o))}
      <div style="margin-top:8px">${C.costBar(Object.assign({ money, detail: `dial:${key}` }, o))}</div>
      <div class="legend" style="margin-top:10px">
        <span><i style="background:var(--paid)"></i>Earned / WIP ${money(o.paid)}</span>
        <span><i style="background:var(--committed)"></i>Committed ${money(o.committed)}</span>
        <span><i style="background:var(--planned);opacity:.5"></i>Planned</span>
        <span><i style="width:2px;height:11px;background:var(--ink);border-radius:0"></i>Budget ${money(o.budget)}</span></div></div>`;

    const catRows = B.categories.map(c => {
      const over = c.variance < 0;
      const open = c.forecast - c.committed;
      return `<tr class="hit" tabindex="0" data-detail="${detail('category', c.category)}"><td class="strong">${esc(c.category)}</td>
        <td class="num">${usd(c.budget)}</td><td class="num">${usd(c.committed)}</td>
        <td class="num">${usd(c.wip)}</td><td class="num strong">${usd(c.forecast)}</td>
        <td class="num ${over ? 'down' : 'up'}">${over ? '(' + usd(-c.variance).slice(1) + ')' : usd(c.variance)}</td>
        <td class="num">${usd(open)}</td><td style="min-width:150px">${C.costBar({ paid: c.wip, committed: c.committed, forecast: c.forecast, budget: c.budget, money, detail: `category:${c.category}` })}</td></tr>`;
    }).join('');
    const totalRow = `<tr class="total"><td>Grand Total</td><td class="num">${usd(g.budget)}</td><td class="num">${usd(g.committed)}</td><td class="num">${usd(g.wip)}</td><td class="num">${usd(g.forecast)}</td><td class="num down">(${usd(-g.variance).slice(1)})</td><td class="num">${usd(g.forecast - g.committed)}</td><td></td></tr>`;

    // Head count (fix #5): moved here from Progress — it comes from the cost workbook.
    const hc = B.headcount;
    let hcIdx = -1; hc.actual.forEach((v, i) => { if (v != null) hcIdx = i; });
    const hcActual = hcIdx >= 0 ? hc.actual[hcIdx] : null;
    const hcPlan = hcIdx >= 0 ? hc.planned[hcIdx] : null;
    const nextIdx = hcIdx + 1 < hc.months.length ? hcIdx + 1 : -1;
    const octIdx = hc.months.indexOf('2026-10');
    const waterfall = C.waterfall ? C.waterfall({
      start: { label: 'Current budget', value: g.budget, tip: `Current budget: ${money(g.budget)}`, detail: 'dial:total' },
      steps: B.categories.map(c => ({ label: c.category, value: c.forecast - c.budget, tip: `${c.category}: ${money(c.forecast - c.budget)} budget-to-forecast change`, detail: `category:${c.category}` })),
      end: { label: 'Forecast', value: g.forecast, tip: `Forecast: ${money(g.forecast)}`, detail: 'dial:total' }, money
    }) : '';

    return head('Budget &amp; Cost', `EPCM cost report — the Excel is the single source of truth. Two dials: the whole $${(g.forecast / 1e6).toFixed(1)}M program and the CM scope.`) + `
    <div class="grid cols-2 compact-dials" style="margin-bottom:16px">
      ${dial('Total Program Budget', 'total', { forecast: g.forecast, budget: g.budget, committed: g.committed, paid: g.wip })}
      ${dial('CM Services', 'cm', { forecast: cm.forecast, budget: cm.budget, committed: cm.committed, paid: cm.wip })}
    </div>
    <div class="focal-panel" style="margin-bottom:16px"><div class="card-head"><div><h3>Budget-to-forecast bridge</h3><div class="sub">Category changes connect the ${money(g.budget)} current budget to the ${money(g.forecast)} forecast</div></div>${hint}</div><div class="waterfall-wrap">${waterfall}</div></div>
    <div class="card" style="margin-bottom:16px"><div class="card-head"><h3>Forecast coverage by category</h3>
      <span class="badge b-slate">Budget → Committed → Work in Place → Forecast → Variance</span></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Category</th><th class="num">Current Budget</th><th class="num">Committed</th><th class="num">Work in Place</th><th class="num">Forecast (EAC)</th><th class="num">Variance</th><th class="num">Not committed</th><th>Coverage</th></tr></thead>
      <tbody>${catRows}${totalRow}</tbody></table></div>
      <div class="legend"><span><i style="background:var(--paid)"></i>Earned (WIP)</span><span><i style="background:var(--committed)"></i>Committed</span><span><i style="background:var(--planned);opacity:.5"></i>Planned</span><span><i style="width:2px;height:11px;background:var(--ink);border-radius:0"></i>Budget line</span></div>
      <div class="note" style="margin-top:12px;font-size:12px">“Earned / Work in Place” is invoiced-plus-estimated value from the cost report (June partly estimated), not cash disbursed. Category budgets follow the report’s reallocated “Budget&nbsp;Through&nbsp;Nov’26” view; the same $${(g.forecast / 1e6).toFixed(1)}M grand total reconciles across both source tables.</div></div>
    <div class="card" style="margin-bottom:16px"><div class="card-head"><div><h3>Work-in-place detail</h3><div class="sub">Invoiced &amp; estimated to date, by contract — from the cost report WIP sheet</div></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Contract</th><th>Vendor</th><th class="num">Committed</th><th class="num">Invoiced</th><th class="num">Estimated</th><th class="num">%</th><th class="num">WIP</th><th>Comment</th></tr></thead>
      <tbody>${B.wip.map((w, i) => `<tr class="hit" tabindex="0" data-detail="${detail('wip', i)}"><td class="strong">${esc(w.package)}</td><td class="muted">${esc(w.vendor)}</td><td class="num">${money(w.contract)}</td><td class="num">${money(w.invoiced)}</td><td class="num">${money(w.estimated)}</td><td class="num">${w.pct != null ? (w.pct * 100).toFixed(0) + '%' : '—'}</td><td class="num strong">${money(w.wip)}</td><td class="muted" style="max-width:240px">${w.comment ? esc(w.comment) : '—'}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="flat-panel"><div class="section-heading"><div><h3>Resource plan — head count</h3><div class="sub">Planned vs actual on-site staff (monthly), from the cost report Head Count sheet</div></div></div>
      <div class="metric-strip" style="margin-bottom:14px">
        <div class="metric"><div class="lab">${hcIdx >= 0 ? fmonth(hc.months[hcIdx]) : 'Latest'} actual</div><div class="val">${hcActual == null ? '—' : hcActual}</div><div class="delta muted">${hcPlan == null ? '—' : hcPlan} planned</div></div>
        <div class="metric"><div class="lab">${nextIdx >= 0 ? fmonth(hc.months[nextIdx]) : 'Next plan'}</div><div class="val">${nextIdx >= 0 ? hc.planned[nextIdx] : '—'}</div><div class="delta muted">${hcActual != null && nextIdx >= 0 ? (hc.planned[nextIdx] - hcActual > 0 ? '+' : '') + (hc.planned[nextIdx] - hcActual) + ' from latest actual' : '—'}</div></div>
        <div class="metric"><div class="lab">October plan</div><div class="val">${octIdx >= 0 ? hc.planned[octIdx] : '—'}</div><div class="delta muted">${hcActual != null && octIdx >= 0 ? (hc.planned[octIdx] - hcActual > 0 ? '+' : '') + (hc.planned[octIdx] - hcActual) + ' from latest actual' : '—'}</div></div>
      </div>
      ${C.groupedBar({ labels: hc.months.map(fmonth), series: [
      { name: 'Planned', color: 'var(--planned)', data: hc.planned, meta: hc.months.map((m, i) => ({ tip: `${fmonth(m)} planned: ${hc.planned[i]}`, detail: `hcmonth:${m}` })) },
      { name: 'Actual', color: 'var(--brand)', data: hc.actual, meta: hc.months.map((m, i) => ({ tip: `${fmonth(m)} actual: ${hc.actual[i] == null ? '—' : hc.actual[i]}`, detail: `hcmonth:${m}` })) }
    ] })}
      <div class="legend"><span><i style="background:var(--planned)"></i>Planned</span><span><i style="background:var(--brand)"></i>Actual</span></div></div>`;
  };

  /* ======================================================= CHANGES =========*/
  Pages.changes = function () {
    const ch = B.changes;
    const activeStatus = new Set(['In Progress', 'On Hold', 'Submitted']);
    const val = (s) => ch.filter(c => s === 'All' || (s === 'Active' ? activeStatus.has((c.status || '').trim()) : (c.status || '').trim() === s));
    const sum = (arr) => arr.reduce((s, c) => s + (c.amount == null ? 0 : Number(c.amount)), 0);
    const statuses = ['All', 'Active', 'Approved', 'In Progress', 'On Hold', 'Submitted', 'Cancelled'];
    const byStatus = statuses.slice(2).map(s => ({ s, n: val(s).length, v: sum(val(s)) }));
    const active = val('Active'), pricedActive = active.filter(c => c.amount != null).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    const activeValue = sum(active), unknown = active.length - pricedActive.length;
    const absoluteActive = pricedActive.reduce((s, c) => s + Math.abs(Number(c.amount)), 0);
    const top3Share = absoluteActive ? 100 * pricedActive.slice(0, 3).reduce((s, c) => s + Math.abs(Number(c.amount)), 0) / absoluteActive : 0;
    const largest = pricedActive[0];
    /* CN is this register's primary key, so the log reads in KEY order, not value order.
       Numeric-aware so CN-002 never sorts after CN-010; a blank or non-numeric key sorts
       last rather than becoming NaN and landing arbitrarily. Sequence gaps in the workbook
       in the numbering are preserved — we never renumber the source. */
    const cnNum = (c) => { const n = parseInt(String(c.cn == null ? '' : c.cn).replace(/[^0-9]/g, ''), 10); return isFinite(n) ? n : Infinity; };
    const byCN = (a, b) => cnNum(a) - cnNum(b) || String(a.cn || '').localeCompare(String(b.cn || ''));
    /* A blank source cell is an em dash — never an empty cell, never 0. */
    const cell = (v) => { const s = String(v == null ? '' : v).trim(); return s ? esc(s) : '—'; };
    /* The three trimmed columns carry their full string as a tooltip. The row's existing
       data-detail modal already carries the complete record, so nothing is ever lost. */
    const tip = (v) => { const s = String(v == null ? '' : v).trim(); return s ? ` data-tip="${esc(s)}"` : ''; };
    const rows = val(state.chStatus).slice().sort(byCN).map(c => `
      <tr class="hit" tabindex="0" data-detail="${detail('cn', c.cn)}"><td class="strong">${esc(c.cn)}</td><td class="clip hit"${tip(c.title)}>${cell(c.title)}</td><td class="muted">${cell(c.project)}</td>
      <td class="center">${cell(c.part)}</td><td>${statusPill(c.status)}</td>
      <td class="num strong ${c.amount < 0 ? 'up' : ''}">${c.amount == null ? '—' : money(c.amount)}</td>
      <td class="muted">${cell(c.pcr)}</td>
      <td class="clip hit"${tip(c.originator)}>${cell(c.originator)}</td>
      <td class="clip hit muted"${tip(c.comment)}>${cell(c.comment)}</td></tr>`).join('');
    const pipeline = C.hbars({ rows: byStatus.map(x => ({ label: x.s + ' · ' + x.n, value: x.v, text: money(x.v), color: { Approved: 'var(--st-complete)', 'In Progress': 'var(--committed)', 'On Hold': 'var(--muted)', Submitted: 'var(--st-notstarted)', Cancelled: 'var(--over)' }[x.s] })), max: Math.max(...byStatus.map(x => x.v)) });

    return head('Change Notices', `The change pipeline for program ${esc(M.program)} — what is approved, in play, and on hold pending the client.`) + `
    <div class="grid cols-4" style="margin-bottom:16px">
      <div class="kpi focal-panel"><div class="lab">Active priced exposure</div><div class="val sm warn">${money(activeValue)}</div><div class="delta muted">${active.length} active notices</div></div>
      <div class="kpi"><div class="lab">Value not entered</div><div class="val">${unknown}</div><div class="delta muted">active notices shown by count only</div></div>
      <div class="kpi"><div class="lab">Largest active notice</div><div class="val sm">${largest ? money(largest.amount) : '—'}</div><div class="delta muted">${largest ? esc(largest.cn) : 'no priced active notice'}</div></div>
      <div class="kpi"><div class="lab">Top three concentration</div><div class="val">${top3Share.toFixed(0)}%</div><div class="delta muted">share of absolute priced exposure</div></div>
    </div>
    <div class="card" style="margin-bottom:16px"><h3>Value by status</h3><div class="sub">Where the change dollars sit</div>${pipeline}
      <div class="note amber" style="margin-top:14px;font-size:12px">Forward exposure uses only <b>In Progress, Submitted and On Hold</b> notices. Approved and cancelled records remain in the audit log but are not presented as forward decision exposure. Blank source amounts stay unknown rather than becoming $0.</div></div>
    <div class="card"><div class="card-head"><h3>Change notice log</h3>
        <div class="chips" id="ch-filter">${statuses.map(s => `<button class="chip ${state.chStatus === s ? 'active' : ''}" data-s="${s}">${s}</button>`).join('')}</div></div>
        <div class="tbl-wrap"><table class="tbl tbl-dense"><colgroup><col style="width:57px"><col><col style="width:75px"><col style="width:44px"><col style="width:100px"><col style="width:57px"><col style="width:59px"><col style="width:109px"><col></colgroup><thead><tr><th scope="col">CN</th><th scope="col">Title</th><th scope="col">Project</th><th class="center" scope="col">Part</th><th scope="col">Status</th><th class="num" scope="col">Value</th><th scope="col">PCR</th><th scope="col">Originator</th><th scope="col">Comments</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="note" style="margin-top:10px;font-size:11.5px">Listed in <b>CN order</b>, one line per notice. <b>Title</b> and <b>Comments</b> are trimmed where they do not fit — hover for the full text, or open any row for the complete Excel record (on a touch screen, tap the row: tooltips need a mouse). An ellipsis means trimmed, never missing.</div></div>`;
  };
  Pages._after_changes = function () {
    const f = document.getElementById('ch-filter'); if (!f) return;
    f.querySelectorAll('.chip').forEach(b => b.onclick = () => { state.chStatus = b.dataset.s; mount('changes'); });
  };

  /* ======================================================= SCHEDULE ========*/
  Pages.schedule = function () {
    const pkgs = ['All', ...SEGMENTS];
    const acts = state.pkg === 'All' ? SC.activities : SC.activities.filter(a => a.package === state.pkg);
    const pkgData = state.pkg === 'All' ? SC.packages : SC.packages.filter(p => p.package === state.pkg);
    const finishVar = (a) => a.finish_var_workdays != null ? Number(a.finish_var_workdays) : a.bl_var;
    const sc = {
      total: acts.length, completed: acts.filter(a => a.status === 'Completed').length,
      in_progress: acts.filter(a => a.status === 'In Progress').length,
      not_started: acts.filter(a => a.status === 'Not Started').length,
      critical: Cov.has('critical') ? acts.filter(a => a.critical).length : null,
      ms: acts.filter(a => a.type && a.type.includes('Milestone')).length,
    };
    const pctc = sc.total ? 100 * sc.completed / sc.total : 0;
    const lastFinish = acts.map(a => a.finish).filter(Boolean).sort().slice(-1)[0] || null;

    /* Package summary columns (S4). The set is expressed ONCE, per FIELD: a column
       exists only when this export actually carries the field behind it, so a fuller
       export restores the original layout — order included — with no code change. */
    const varCal = (p) => {
      const variance = p.finish_var_calendar_days != null ? p.finish_var_calendar_days : p.bl_var;
      return variance == null ? `<td class="num">${Cov.has('finish_var_calendar_days') ? '—' : nrDash}</td>`
        : `<td class="num ${variance > 3 ? 'down' : variance < -3 ? 'up' : 'muted'}">${variance > 0 ? '+' : ''}${variance}d</td>`;
    };
    const cols = [{ th: 'Package', align: '', cell: (p) => `<td class="strong">${esc(p.package)}</td>` }];
    if (Cov.has('bl_finish')) cols.push({ th: 'BL finish', align: 'num', cell: (p) => `<td class="num">${fdate(p.bl_finish)}</td>` });
    if (!COMPLETION_OK) cols.push(
      { th: 'Acts', align: 'num', cell: (p) => `<td class="num">${p.total}</td>` },
      { th: 'In progress', align: 'num', cell: (p) => `<td class="num">${p.in_progress}</td>` },
      { th: 'Not started', align: 'num', cell: (p) => `<td class="num">${p.not_started}</td>` },
      { th: 'Current start', align: 'num', cell: (p) => `<td class="num">${fdate(p.current_start)}</td>` });
    cols.push({ th: 'Current finish', align: 'num', cell: (p) => `<td class="num">${fdate(p.current_finish || p.fc_finish)}</td>` });
    if (Cov.has('finish_var_calendar_days')) cols.push({ th: 'Calendar var', align: 'num', cell: varCal });
    if (COMPLETION_OK) cols.push({ th: 'Acts', align: 'num', cell: (p) => `<td class="num">${p.total}</td>` });
    if (Cov.has('critical')) cols.push({ th: 'P6-critical', align: 'num', cell: (p) => `<td class="num">${covNum('critical', p.critical)}</td>` });
    if (COMPLETION_OK) cols.push(
      { th: 'Progress', align: '', cell: (p) => `<td style="min-width:120px"><div class="progress"><i style="width:${p.pct_complete != null ? p.pct_complete : 0}%;background:var(--brand)"></i></div></td>` },
      { th: '%', align: 'num', cell: (p) => `<td class="num strong">${donePct(p.pct_complete)}</td>` });
    const perfHead = cols.map(c => `<th${c.align ? ` class="${c.align}"` : ''}>${c.th}</th>`).join('');
    const perf = pkgData.map(p => `<tr class="hit" tabindex="0" data-detail="${detail('package', p.package)}">${cols.map(c => c.cell(p)).join('')}</tr>`).join('');
    // The original title promises "Baseline vs forecast finish, variance, and completion",
    // so claim it only when EVERY column behind that sentence is live. A partial restore
    // (baselines back, variance still missing) must not keep the fuller promise.
    const perfFull = Cov.has('bl_finish') && Cov.has('finish_var_calendar_days')
      && Cov.has('critical') && COMPLETION_OK;

    const gRows = pkgData.filter(p => p.current_finish || p.fc_finish).map(p => {
      const st = p.current_start || SC.activities.filter(a => a.package === p.package && a.start).map(a => a.start).sort()[0];
      return { label: p.package, start: st || DATE, finish: p.current_finish || p.fc_finish,
        pct: COMPLETION_OK ? p.pct_complete : null, color: segmentColor(p.package),
        tip: COMPLETION_OK && p.pct_complete != null ? `${p.package}: ${p.pct_complete}% complete`
          : `${p.package}: ${Number(p.total).toLocaleString()} activities · ${fdate(st || DATE)} → ${fdate(p.current_finish || p.fc_finish)}`,
        detail: `package:${p.package}` };
    });
    const allStart = gRows.map(r => r.start).sort()[0] || DATE;
    const allFin = gRows.map(r => r.finish).sort().slice(-1)[0] || DATE;

    // Next & Upcoming shows the boss-curated KEY program milestones — the exact list
    // in Assets/…/Program Milestones rev.1.xlsx (baked into schedule.json as
    // key_program_milestones): the curated marquee rows (funding, permits, design
    // issues, construction starts/completions). These live on the P6 "Program Milestones"
    // WBS branch (segment = Program Milestones) and are program-wide, so this panel intentionally
    // ignores the package chip. Falls back to the packaged program_milestones only if
    // the key list is missing from the extract.
    const keySrc = (SC.key_program_milestones && SC.key_program_milestones.length)
      ? SC.key_program_milestones
      : SC.program_milestones.filter(m => m.finish);
    const pm = keySrc.filter((m, i, a) => a.findIndex(x => x.id === m.id) === i)
      .filter(m => m.finish).sort((a, b) => a.finish.localeCompare(b.finish) || a.id.localeCompare(b.id));
    const major = (m) => /Construction Complete|Construction Start|Foundations (Start|Complete)|Structural Steel|Slab on Grade|Full Funding|Tie-Ins Work (Start|Complete)|Pipe-Rack Complete/i.test(m.name);
    // Compact leader-label: strip the verbose phrase but PRESERVE the distinguishing
    // trailing "(…)" so the six Pk3 "Construction Complete" milestones stay distinct.
    const shortMs = (name) => { const p = name.match(/\(([^)]+)\)\s*$/); const base = name.replace(/\s*\([^)]*\)\s*$/, '').replace(/Construction Complete \/ Static Mechanical Completion/i, 'Constr. Complete').replace(/Construction Complete/i, 'Constr. Complete').replace(/Construction Start/i, 'Constr. Start'); return p ? `${base} (${p[1]})` : base; };
    const horizonItems = pm.map(m => ({ id: m.id, date: m.finish, name: m.name, label: shortMs(m.name), status: m.status, type: m.type,
      wbs: m.wbs_name || m.wbs, wbs_name: m.wbs_name || m.wbs, finish_var_workdays: finishVar(m), major: major(m),
      tip: `${m.name} · ${fdate(m.finish)} · ${m.status}`, detail: `milestone:${m.id}` }));
    const isMobile = !!(window.matchMedia && window.matchMedia('(max-width:680px)').matches);
    const horizon = C.milestoneWaterfall ? C.milestoneWaterfall({ items: horizonItems, dataDate: DATE, mobile: isMobile }) : '';
    const completePm = pm.filter(m => m.status === 'Completed').length;
    const upcomingPm = pm.length - completePm;
    const nextPm = pm.find(m => m.status !== 'Completed' && m.finish >= DATE);

    const upcoming = (a) => { const d = daysFrom(a.finish); return a.status !== 'Completed' && d >= 0 && d <= state.look; };
    const rank = (a, b) => (finishVar(b) || 0) - (finishVar(a) || 0) || a.finish.localeCompare(b.finish);
    const critAll = acts.filter(a => a.critical && a.finish && upcoming(a)).sort(rank);
    const keyAll = acts.filter(a => a.key_milestone && a.finish && upcoming(a)).sort(rank);
    const crit = critAll.slice(0, 14), keyms = keyAll.slice(0, 14);
    // Look-ahead variance reversed (fix #6): show standard schedule-variance —
    // ahead of baseline = "+" green, behind = "−" red. Workbook finish_var_workdays
    // is positive=late, so display its negation.
    const laRow = (a) => { const v = finishVar(a); const disp = v == null ? null : -v; return `<tr class="hit" tabindex="0" data-detail="${detail('activity', a.id)}"><td><span class="badge b-slate">${esc(a.package)}</span></td><td class="mono">${esc(a.id)}</td><td>${esc(a.name)}</td><td class="num">${fdate(a.bl_finish)}</td><td class="num">${fdate(a.finish)}</td>${disp == null ? '<td class="num">—</td>' : `<td class="num ${disp > 3 ? 'up' : disp < -3 ? 'down' : 'muted'}">${disp > 0 ? '+' : ''}${disp}d</td>`}</tr>`; };
    // Without baseline variance there is no "exception" to rank on (S6): the honest
    // look-ahead is simply everything scheduled to finish in the window, soonest first.
    const laAll = acts.filter(a => a.finish && upcoming(a)).sort((a, b) => a.finish.localeCompare(b.finish) || String(a.id).localeCompare(String(b.id)));
    const laMs = laAll.filter(a => a.type && a.type.includes('Milestone')).length;
    // A key milestone must never fall off the bottom of the row cap — the boss reads this
    // card for exactly those rows. Take the first 40 chronologically, then re-admit any key
    // milestone that sits beyond the cap and re-sort, so the list stays earliest-first.
    const laCap = 40;
    const laKeyBeyond = laAll.slice(laCap).filter(a => a.key_milestone);
    const laShown = laAll.slice(0, laCap).concat(laKeyBeyond)
      .sort((a, b) => a.finish.localeCompare(b.finish) || String(a.id).localeCompare(String(b.id)));
    // "—" here would read as missing data. It is not: the same declared derivation that
    // makes a zero-duration row a Milestone makes a non-zero-duration row an Activity.
    // Criticality is additive and independently gated, so an export that restores the
    // Critical column but not variance still surfaces critical rows in this table.
    const laType = (a) => {
      const b = [];
      if (a.key_milestone) b.push('<span class="badge b-amber">★ Key milestone</span>');
      else if (a.type && a.type.includes('Milestone')) b.push('<span class="badge b-slate">Milestone</span>');
      if (Cov.has('critical') && a.critical) b.push('<span class="badge b-red">P6-critical</span>');
      return b.length ? b.join(' ') : '<span class="muted">Activity</span>';
    };
    const laFlatRow = (a) => `<tr class="hit" tabindex="0" data-detail="${detail('activity', a.id)}"><td><span class="badge b-slate">${esc(a.package)}</span></td><td class="mono">${esc(a.id)}</td><td>${esc(a.name)}</td><td>${laType(a)}</td><td class="num">${fdate(a.finish)}</td></tr>`;
    const workload = [30, 60, 90].map(n => { const rows = acts.filter(a => a.status !== 'Completed' && a.finish && daysFrom(a.finish) >= 0 && daysFrom(a.finish) <= n); return { n, total: rows.length, critical: rows.filter(a => a.critical).length, ms: rows.filter(a => a.type && a.type.includes('Milestone')).length }; });
    const next90 = workload.find(w => w.n === 90) || { total: 0 };

    // Month in review (fix #7): what actually finished each month (P6 actual finishes).
    const completedActs = acts.filter(a => a.status === 'Completed' && a.finish);
    const byMonth = {}; completedActs.forEach(a => { const k = a.finish.slice(0, 7); (byMonth[k] = byMonth[k] || []).push(a); });
    const monthKeys = Object.keys(byMonth).sort();
    let selMonth = state.month && byMonth[state.month] ? state.month : null;
    if (!selMonth && monthKeys.length) { const past = monthKeys.filter(k => k < DDMONTH); selMonth = past.length ? past[past.length - 1] : monthKeys[monthKeys.length - 1]; }
    const monthActs = selMonth ? byMonth[selMonth].slice().sort((a, b) => a.finish.localeCompare(b.finish) || a.id.localeCompare(b.id)) : [];
    // Month in review stays on the full P6 export (NOT the curated key list): the
    // curated Program-Milestones workbook drives only the Next & Upcoming graphic.
    // Same source/filter as the monthdone drill-down in details.js.
    const msThisMonth = selMonth ? SC.program_milestones.filter(m => m.status === 'Completed' && m.finish && m.finish.slice(0, 7) === selMonth) : [];
    const paceMonths = monthKeys.slice(-8);
    const paceBars = paceMonths.length ? C.hbars({ rows: paceMonths.map(k => ({ label: fmonth(k), value: byMonth[k].length, text: byMonth[k].length + ' done', color: k === selMonth ? 'var(--brand)' : 'var(--brand-3)', tip: `${fmonth(k)}: ${byMonth[k].length} activities completed`, detail: `monthdone:${k}` })), max: Math.max(1, ...paceMonths.map(k => byMonth[k].length)) }) : '';
    const monthChips = monthKeys.slice(-10).map(k => `<button class="chip ${k === selMonth ? 'active' : ''}" data-m="${k}">${fmonth(k)} · ${byMonth[k].length}</button>`).join('');

    // S1: the "critical means the workbook P6 flag" clause is a lie when the export
    // carries no Critical column — drop the clause, keep the rest verbatim.
    return head('Construction Schedule', Cov.has('critical')
      ? `Package summary from the P6 export (data as of ${fdate(DATE)}) — every panel follows the segment filter; critical means the workbook P6 flag.`
      : `Package summary from the P6 export (data as of ${fdate(DATE)}) — every panel follows the segment filter.`)
      + F.coverageNoticePanel() + `
    <div class="chips" id="pkg-filter" style="margin-bottom:16px">${pkgs.map(p => `<button class="chip ${state.pkg === p ? 'active' : ''}" data-p="${esc(p)}">${esc(p)}</button>`).join('')}</div>
    <div class="schedule-stack">
      <div class="focal-panel"><div class="card-head"><div><h3>Next &amp; Upcoming</h3><div class="sub" style="margin:2px 0 0">Key program milestones, first to last · ${completePm} achieved · ${upcomingPm} upcoming${nextPm ? ` · next ${fdate(nextPm.finish)}: ${esc(nextPm.name)}` : ''}</div></div>${hint}</div>
        <div class="chart-frame">${horizon || '<div class="detail-empty">No key program milestones in the source extract.</div>'}</div>
        <div class="legend" style="margin-top:10px">
          <span><i style="background:var(--st-complete)"></i>Achieved</span>
          <span><i style="background:var(--card);border:2px solid var(--brand);box-sizing:border-box"></i>Upcoming</span>
          <span><i style="background:var(--over)"></i>Late vs baseline</span>
          <span><i style="width:2px;height:11px;border-radius:0;background:var(--marker)"></i>Data date</span></div></div>
    </div>
    <div class="card" style="margin-bottom:16px"><div class="card-head"><div><h3>Month in review</h3><div class="sub" style="margin:2px 0 0">What actually finished each month, from P6 actual finish dates${state.pkg !== 'All' ? ' · ' + esc(state.pkg) : ''}${selMonth ? ` · ${fmonth(selMonth)}: ${monthActs.length} completed${msThisMonth.length ? `, ${msThisMonth.length} milestone${msThisMonth.length > 1 ? 's' : ''} achieved` : ''}` : ''}</div></div>${hint}</div>
      ${!COMPLETION_OK ? `<div class="detail-empty">${esc(NO_ACTUALS)} Achieved <b>milestones</b> are still tracked — they come from the curated Program Milestones workbook, shown in <b>Next &amp; Upcoming</b> above.</div>` : `
      <div class="chips" id="month-filter" style="margin-bottom:12px">${monthChips || '<span class="muted">No completed activities in scope</span>'}</div>
      <div class="grid cols-3">
        <div class="span-2"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>ID</th><th>Activity</th><th>Package</th><th class="num">Finished</th></tr></thead><tbody>${monthActs.slice(0, 40).map(a => `<tr class="hit" tabindex="0" data-detail="${detail('activity', a.id)}"><td class="mono">${esc(a.id)}</td><td>${esc(a.name)}</td><td><span class="badge b-slate">${esc(a.package)}</span></td><td class="num">${fdate(a.finish)}</td></tr>`).join('') || `<tr><td colspan="4" class="muted center">${COMPLETION_OK ? 'No activities completed in this month' : esc(NO_ACTUALS)}</td></tr>`}</tbody></table></div>${monthActs.length > 40 ? `<div class="sub">Showing first 40 of ${monthActs.length}</div>` : ''}</div>
        <div><h4 style="margin:4px 0 8px;color:var(--brand)">Program pace</h4><div class="sub" style="margin-bottom:8px">Activities completed per month</div>${paceBars || '<div class="detail-empty">No completions in scope</div>'}${msThisMonth.length ? `<div class="note" style="margin-top:12px;font-size:12px"><b>${fmonth(selMonth)} milestones achieved</b><ul style="margin:6px 0 0;padding-left:16px">${msThisMonth.map(m => `<li>${esc(m.name)}</li>`).join('')}</ul></div>` : ''}</div>
      </div>`}</div>
    <div class="grid cols-4" style="margin-bottom:16px">
      ${COMPLETION_OK ? `
      <div class="kpi"><div class="lab">Activities ${state.pkg !== 'All' ? '· ' + esc(state.pkg) : ''}</div><div class="val">${sc.total.toLocaleString()}</div><div class="delta muted">${COMPLETION_OK ? sc.completed + ' completed' : `<span title="${COMPLETION_WHY}">completion not reported</span>`}</div></div>
      <div class="kpi"><div class="lab">% Complete</div><div class="val">${COMPLETION_OK ? pctc.toFixed(1) + '%' : '—'}</div><div class="delta muted">${COMPLETION_OK ? 'activity count basis' : `<span title="${COMPLETION_WHY}">no actual finish dates in this export</span>`}</div></div>
      <div class="kpi"><div class="lab">P6-critical activities</div><div class="val ${Cov.has('critical') ? 'down' : ''}">${covNum('critical', sc.critical)}</div><div class="delta muted">${Cov.has('critical') ? 'workbook critical flag' : `<span title="${esc(Cov.why)}">no Critical column in this export</span>`}</div></div>
      <div class="kpi"><div class="lab">Program milestones</div><div class="val">${pm.length}</div><div class="delta muted">${completePm} complete · ${upcomingPm} upcoming</div></div>` : `
      <div class="kpi"><div class="lab">Activities ${state.pkg !== 'All' ? '· ' + esc(state.pkg) : ''}</div><div class="val">${sc.total.toLocaleString()}</div><div class="delta muted">${sc.in_progress.toLocaleString()} in progress · ${sc.not_started.toLocaleString()} not started</div></div>
      <div class="kpi"><div class="lab">Finishing next 90 days</div><div class="val">${next90.total.toLocaleString()}</div><div class="delta muted">scheduled finishes</div></div>
      <div class="kpi"><div class="lab">Key milestones</div><div class="val">${pm.length}</div><div class="delta muted">${completePm} achieved · ${upcomingPm} upcoming</div></div>
      <div class="kpi"><div class="lab">Program finish</div><div class="val sm">${fdate(lastFinish)}</div><div class="delta muted">latest scheduled finish</div></div>`}
    </div>
    <div class="card" style="margin-bottom:16px"><h3>${perfFull ? 'Package performance summary' : 'Package summary'}</h3><div class="sub">${perfFull ? 'Baseline vs forecast finish, variance, and completion' : 'Scope, current span and status mix by segment'}</div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr>${perfHead}</tr></thead><tbody>${perf || `<tr><td colspan="${cols.length}" class="muted center">No package summary</td></tr>`}</tbody></table></div></div>
    <div class="card" style="margin-bottom:16px"><div class="card-head"><div><h3>Current package span</h3><div class="sub" style="margin:2px 0 0">Bars use current schedule start and finish${COMPLETION_OK ? '; fill shows activity-count completion' : ''}</div></div>${hint}</div>${gRows.length ? C.gantt({ rows: gRows, min: allStart, max: allFin }) : '<div class="detail-empty">No package span in source.</div>'}</div>
    <div class="flat-panel" style="margin-bottom:16px"><div class="section-heading"><div><h3>30 / 60 / 90-day workload</h3><div class="sub">Incomplete scheduled finishes from the data date</div></div></div><div class="metric-strip">${workload.map(w => `<div class="metric"><div class="lab">Next ${w.n} days</div><div class="val">${w.total}</div><div class="delta muted">${Cov.has('critical') ? w.critical + ' P6-critical' : `${w.ms} milestone${w.ms === 1 ? '' : 's'}`}</div></div>`).join('')}</div></div>
    <div class="card"><div class="card-head"><div><h3>${Cov.has('finish_var_workdays') ? 'Exception-first look ahead' : 'Look ahead'}</h3><div class="sub">${Cov.has('finish_var_workdays') ? `Most behind-baseline first; select a row for logic and source notes. P6 var vs baseline: <span class="up">+ ahead (green)</span> · <span class="down">− behind (red)</span>.` : 'What is scheduled to finish in the window, earliest first.'}</div></div>
      <div class="chips" id="look-filter">${[14, 30, 45].map(n => `<button class="chip ${state.look === n ? 'active' : ''}" data-n="${n}">Next ${n} days</button>`).join('')}</div></div>
      ${Cov.has('finish_var_workdays') ? `<div class="grid cols-2">
        <div><h4 style="margin:4px 0 8px;color:var(--brand)">P6-critical · ${Cov.has('critical') ? `${critAll.length} in next ${state.look} days` : 'not reported'}</h4>
          ${!Cov.has('critical')
      ? `<div class="detail-empty">${esc(COV.schedule_export || 'The current P6 export')} carries no <b>Critical</b> column, so critical-path exposure cannot be listed. This is <b>not</b> a statement that nothing is critical — it is unknown from this export. Re-export the schedule with the Critical column to restore this panel.</div>`
      : `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Pkg</th><th>ID</th><th>Activity</th><th class="num">BL</th><th class="num">Current</th><th class="num">P6 var</th></tr></thead><tbody>${crit.map(laRow).join('') || '<tr><td colspan=6 class="muted center">None in window</td></tr>'}</tbody></table></div>${critAll.length > crit.length ? `<div class="sub">Showing first ${crit.length} of ${critAll.length}</div>` : ''}`}</div>
        <div><h4 style="margin:4px 0 8px;color:var(--brand)">Key milestones · ${keyAll.length} in next ${state.look} days</h4>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Pkg</th><th>ID</th><th>Activity</th><th class="num">BL</th><th class="num">Current</th><th class="num">P6 var</th></tr></thead><tbody>${keyms.map(laRow).join('') || '<tr><td colspan=6 class="muted center">None in window</td></tr>'}</tbody></table></div>${keyAll.length > keyms.length ? `<div class="sub">Showing first ${keyms.length} of ${keyAll.length}</div>` : ''}</div>
      </div>` : `<div>
        <h4 style="margin:4px 0 8px;color:var(--brand)">Finishing in the next ${state.look} days · ${laAll.length} activities · ${laMs} milestones</h4>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Pkg</th><th>ID</th><th>Activity</th><th>Type</th><th class="num">Finish</th></tr></thead><tbody>${laShown.map(laFlatRow).join('') || '<tr><td colspan=5 class="muted center">Nothing scheduled to finish in this window</td></tr>'}</tbody></table></div>${laAll.length > laShown.length ? `<div class="sub">Showing ${laShown.length} of ${laAll.length}, earliest first${laKeyBeyond.length ? ` · every key milestone in the window is included` : ''}</div>` : ''}
      </div>`}</div>`;
  };
  Pages._after_schedule = function () {
    const pf = document.getElementById('pkg-filter'); if (pf) pf.querySelectorAll('.chip').forEach(b => b.onclick = () => { state.pkg = b.dataset.p; mount('schedule'); });
    const lf = document.getElementById('look-filter'); if (lf) lf.querySelectorAll('.chip').forEach(b => b.onclick = () => { state.look = +b.dataset.n; mount('schedule'); });
    const mf = document.getElementById('month-filter'); if (mf) mf.querySelectorAll('.chip').forEach(b => b.onclick = () => { state.month = b.dataset.m; mount('schedule'); });
    if (!window.__cordMhMedia && window.matchMedia) {
      window.__cordMhMedia = window.matchMedia('(max-width:680px)');
      window.__cordMhMedia.addEventListener('change', () => { if (location.hash.replace(/^#\/?/, '').split('/')[0] === 'schedule') mount('schedule'); });
    }
  };

  /* ======================================================= PROGRESS ========*/
  Pages.progress = function () {
    const sc = SC.status_counts, cf = B.cashflow;
    const pctc = 100 * sc.completed / sc.total;
    // P2: eight 0% bars say nothing. When completion is unreliable, plot the activity
    // COUNT per segment — a real number from the same export — on a count axis.
    const pkgMax = Math.max(1, ...SC.packages.map(p => p.total));
    const pkgBars = COMPLETION_OK
      ? SC.packages.map(p => ({ label: p.package, value: p.pct_complete,
        text: p.pct_complete + '% (' + p.completed + '/' + p.total + ')', color: segmentColor(p.package),
        tip: `${p.package}: ${p.pct_complete}% complete`, detail: `package:${p.package}` }))
      : SC.packages.map(p => ({ label: p.package, value: p.total,
        text: p.total.toLocaleString() + ' activities' + (p.in_progress ? ' · ' + p.in_progress + ' in progress' : ''),
        color: segmentColor(p.package),
        tip: `${p.package}: ${p.total.toLocaleString()} activities` + (p.in_progress ? `, ${p.in_progress} in progress` : ''),
        detail: `package:${p.package}` }));
    const msDone = SC.program_milestones.filter(m => m.status === 'Completed').length;
    const msTot = SC.program_milestones.length;
    // The curated Program Milestones workbook still carries achieved/upcoming status,
    // so it is a reliable headline even when the P6 export stamps no actual finishes.
    const keyMs = SC.key_program_milestones || [];
    const keyDone = keyMs.filter(m => m.status === 'Completed').length;
    const delivery = B.delivery_monthly || [];
    const deliveryBars = C.hbars({ rows: delivery.map(x => ({ label: fmonth(x.month), value: x.labor_hours, text: Number(x.labor_hours || 0).toLocaleString() + ' h', color: 'var(--brand)', tip: `${fmonth(x.month)}: ${Number(x.labor_hours || 0).toLocaleString()} labor hours`, detail: `deliverymonth:${x.month}` })), max: Math.max(1, ...delivery.map(x => Number(x.labor_hours || 0))) });
    return head('Progress', `Physical &amp; resource progress against the plan as of ${fdate(DATE)}.`)
      + F.coverageNoticeBanner() + `
    <div class="grid cols-4" style="margin-bottom:16px">
      ${COMPLETION_OK ? `
      <div class="kpi"><div class="lab">Overall complete</div><div class="val">${COMPLETION_OK ? pctc.toFixed(1) + '%' : '—'}</div><div class="delta muted">${COMPLETION_OK ? `${sc.completed}/${sc.total} activities` : `<span title="${COMPLETION_WHY}">not reported · ${sc.total.toLocaleString()} activities</span>`}</div></div>
      <div class="kpi"><div class="lab">In progress</div><div class="val warn">${sc.in_progress}</div><div class="delta muted">active now</div></div>
      <div class="kpi"><div class="lab">Program milestones (all)</div><div class="val">${COMPLETION_OK ? `${msDone}<span class="muted" style="font-size:16px">/${msTot}</span>` : `<span class="muted" style="font-size:16px">${msTot} tracked</span>`}</div><div class="delta muted">${COMPLETION_OK ? `${msTot - msDone} upcoming · incl. design &amp; permit` : `<span title="${COMPLETION_WHY}">achieved count not in this export</span>`} (Schedule shows the ${(SC.key_program_milestones || []).length} key)</div></div>
      <div class="kpi"><div class="lab">Not started</div><div class="val">${sc.not_started.toLocaleString()}</div><div class="delta muted">activities remaining</div></div>` : `
      <div class="kpi"><div class="lab">Key milestones achieved</div><div class="val">${keyMs.length ? `${keyDone}<span class="muted" style="font-size:16px">/${keyMs.length}</span>` : '—'}</div><div class="delta muted">${keyMs.length ? 'curated program milestone workbook' : 'no curated milestone workbook in this extract'}</div></div>
      <div class="kpi"><div class="lab">In progress</div><div class="val warn">${sc.in_progress}</div><div class="delta muted">active now</div></div>
      <div class="kpi"><div class="lab">Not started</div><div class="val">${sc.not_started.toLocaleString()}</div><div class="delta muted">activities remaining</div></div>
      <div class="kpi"><div class="lab">Total activities</div><div class="val">${sc.total.toLocaleString()}</div><div class="delta muted">across ${SC.packages.length} segments</div></div>`}
    </div>
    <div class="grid cols-2" style="margin-bottom:16px">
      <div class="card"><h3>${COMPLETION_OK ? 'Completion by segment' : 'Activity mix by segment'}</h3><div class="sub">${COMPLETION_OK ? 'Activity-count basis; select a segment for detail' : 'Activity count per segment; select a segment for detail'}</div>${C.hbars(COMPLETION_OK ? { rows: pkgBars } : { rows: pkgBars, max: pkgMax })}</div>
      <div class="card"><h3>CM monthly effort burn</h3><div class="sub">Labor hours from analytics transactions; not earned value</div>${delivery.length ? deliveryBars : '<div class="detail-empty">Awaiting refreshed extract</div>'}</div>
    </div>
    <div class="grid cols-1">
      <div class="card"><h3>Commitment progress (S-curve)</h3><div class="sub">Cumulative $ committed vs the plan</div>
        ${cf.months.length ? `${C.sCurve({ labels: cf.months.map(fmonth), cumulative: cf.cumulative, money, markIndex: CF_MARK,
          dotMeta: cf.months.map((m, i) => ({ tip: `${fmonth(m)}: ${money(cf.cumulative[i])} cumulative`, detail: `month:${m}` })) })}
        <div class="note amber" style="margin-top:12px">Committed to date (${fmonth(cf.months[CF_MARK] || cf.months[0])}) is <b>${money(cf.cumulative[CF_MARK] || 0)}</b>. The dashed tail is the <b>planned</b> commitment ramp to the ${money(cf.cumulative[cf.cumulative.length - 1])} forecast by ${fmonth(cf.months[cf.months.length - 1])} — not yet committed.</div>` : `<div class="detail-empty">The latest cost report no longer includes the time-phased commitment-flow curve (the source workbook dropped that sheet). Committed vs forecast totals are on the <a href="#/budget">Budget</a> page.</div>`}</div>
    </div>`;
  };

  window.mountPage = mount;
})();

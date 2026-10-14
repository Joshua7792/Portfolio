/* Decision-support route. Every figure is derived from window.RPT only. */
(function (w) {
  'use strict';
  const Pages = w.Pages = w.Pages || {}, D = w.RPT, F = w.F, C = w.Charts;
  const B = D.budget, S = D.schedule;
  const { money, usd, fdate, fmonth, esc } = F;
  const Cov = w.Cov, COV = w.COV || {};   // what this P6 export actually carries
  const detail = (type, key) => esc(`${type}:${key}`);
  const head = (h1, p) => `<div class="page-head"><div><h1>${h1}</h1><p>${p}</p></div><div class="chips"><button class="chip" onclick="window.print()">⇩ Export PDF</button><button class="chip" onclick="window.startTour(0)">▶ Boss Brief</button></div></div>`;
  const row = (label, value, note) => `<div class="metric"><div class="lab">${label}</div><div class="val">${value}</div><div class="delta muted">${note}</div></div>`;

  Pages.insights = function () {
    const incomplete = (S.activities || []).filter(a => a.status !== 'Completed' && a.total_float != null);
    const floatBins = [
      { label: 'Zero float', test: v => v === 0 },
      { label: '1-10 days', test: v => v > 0 && v <= 10 },
      { label: '11-30 days', test: v => v > 10 && v <= 30 },
      { label: 'Over 30 days', test: v => v > 30 }
    ].map(b => Object.assign(b, { rows: incomplete.filter(a => b.test(Number(a.total_float))) }));
    const floatWatch = incomplete.slice().sort((a, b) => Number(a.total_float) - Number(b.total_float) || String(a.finish || '').localeCompare(String(b.finish || ''))).slice(0, 10);

    const indexed = (B.line_items || []).map((r, index) => ({ r, index }));
    const tbd = indexed.filter(x => String(x.r.contractor || '').trim().toUpperCase() === 'TBD');
    const tbdForecast = tbd.reduce((s, x) => s + Number(x.r.forecast || 0), 0);
    const tbdCommitted = tbd.reduce((s, x) => s + Number(x.r.committed || 0), 0);
    const tbdRows = tbd.slice().sort((a, b) => Number(b.r.forecast || 0) - Number(a.r.forecast || 0)).slice(0, 10);

    const adverse = indexed.filter(x => Number(x.r.variance || 0) < 0).sort((a, b) => Number(a.r.variance) - Number(b.r.variance));
    const adverseTotal = adverse.reduce((s, x) => s + Math.abs(Number(x.r.variance || 0)), 0);
    const topDrivers = adverse.slice(0, 6);
    const topConcentration = adverseTotal ? 100 * topDrivers.reduce((s, x) => s + Math.abs(Number(x.r.variance || 0)), 0) / adverseTotal : 0;
    const driverBars = C.hbars({ rows: topDrivers.map(x => ({
      label: x.r.description || x.r.wp, value: Math.abs(Number(x.r.variance || 0)), text: money(Math.abs(Number(x.r.variance || 0))),
      color: 'var(--over)', tip: `${x.r.description}: ${money(Math.abs(Number(x.r.variance || 0)))} unfavorable`, detail: `lineitem:${x.index}`
    })), max: Math.max(1, ...topDrivers.map(x => Math.abs(Number(x.r.variance || 0)))) });

    const cm = (B.cm_scope || []).map(r => ({ r, index: (B.line_items || []).findIndex(x => x.source_row === r.source_row || (x.description === r.description && x.wp === r.wp)) })).filter(x => x.index >= 0);
    const delivery = B.delivery_monthly || [];
    const totalHours = delivery.reduce((s, x) => s + Number(x.labor_hours || 0), 0);
    const totalAnalytics = delivery.reduce((s, x) => s + Number(x.total_revenue || 0), 0);
    const deliveryBars = C.hbars({ rows: delivery.map(x => ({ label: fmonth(x.month), value: Number(x.total_revenue || 0), text: money(x.total_revenue), color: 'var(--brand)', tip: `${fmonth(x.month)}: ${money(x.total_revenue)} analytics revenue`, detail: `deliverymonth:${x.month}` })), max: Math.max(1, ...delivery.map(x => Number(x.total_revenue || 0))) });
    const wipActions = (B.wip || []).map((r, index) => ({ r, index })).filter(x => x.r.action || x.r.comment).slice(0, 8);
    const sf = D.meta.source_freshness || {};

    return head('Insights', 'The decision layer: schedule pressure, procurement exposure, cost concentration, CM delivery and source confidence.') + `
      <section class="flat-panel" style="margin-bottom:16px">
        <div class="section-heading"><div><h2>Float pressure</h2><p>Incomplete activities grouped by the P6 total-float field. No synthetic health score.</p></div><a class="chip" href="#/schedule">Open schedule →</a></div>
        ${!Cov.has('total_float')
      ? `<div class="detail-empty">${esc(COV.schedule_export || 'The current P6 export')} carries no <b>Total Float</b> column, so float pressure cannot be measured. Showing "0 zero-float activities" here would assert there is no float risk — that is <b>unknown</b> from this export, not zero. Re-export the P6 schedule including <code>Total Float</code>${Cov.has('critical') ? '' : ' and <code>Critical</code>'} and this card returns automatically.</div>`
      : `<div class="metric-strip">${floatBins.map(b => row(esc(b.label), b.rows.length.toLocaleString(), b.label === '1-10 days' ? 'low-float window' : 'activities')).join('')}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Lowest-float activity</th><th>Package</th><th class="num">Finish</th><th class="num">Float</th><th>P6 flag</th></tr></thead><tbody>
        ${floatWatch.map(a => `<tr class="hit" tabindex="0" data-detail="${detail('activity', a.id)}"><td><b>${esc(a.name)}</b><div class="muted">${esc(a.id)}</div></td><td>${esc(a.package)}</td><td class="num">${fdate(a.finish)}</td><td class="num">${Number(a.total_float).toLocaleString()}d</td><td>${a.critical == null ? '<span class="badge b-slate">—</span>' : a.critical ? '<span class="badge b-red">Critical</span>' : '<span class="badge b-slate">Not flagged</span>'}</td></tr>`).join('')
        || '<tr><td colspan="5" class="muted center">No incomplete activities carry a float value</td></tr>'}
        </tbody></table></div>`}
      </section>

      <div class="insight-grid" style="margin-bottom:16px">
        <section class="flat-panel"><div class="section-heading"><div><h2>Unassigned contractor exposure</h2><p>Line items whose Excel contractor field is exactly “TBD.”</p></div></div>
          <div class="metric-strip">${row('TBD line items', tbd.length, 'of ' + indexed.length)}${row('Forecast', money(tbdForecast), 'contractor not assigned')}${row('Committed', money(tbdCommitted), 'on these rows')}</div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Work package / scope</th><th>Category</th><th class="num">Forecast</th></tr></thead><tbody>${tbdRows.map(x => `<tr class="hit" tabindex="0" data-detail="${detail('lineitem', x.index)}"><td><b>${esc(x.r.wp || '—')}</b><div class="muted">${esc(x.r.description)}</div></td><td>${esc(x.r.category)}</td><td class="num">${usd(x.r.forecast)}</td></tr>`).join('')}</tbody></table></div>
        </section>
        <section class="flat-panel"><div class="section-heading"><div><h2>Cost-driver concentration</h2><p>Largest unfavorable line-item variances from the corrected cost columns.</p></div></div>
          <div class="metric-strip">${row('Top six share', topConcentration.toFixed(0) + '%', 'of unfavorable line-item variance')}${row('Drivers shown', topDrivers.length, 'select a bar for source detail')}</div>
          <div class="chart-frame">${driverBars}</div>
        </section>
      </div>

      <div class="insight-grid" style="margin-bottom:16px">
        <section class="flat-panel"><div class="section-heading"><div><h2>CM scope</h2><p>On-site, off-site and travel/reimbursables explain the CM forecast.</p></div><a class="chip" href="#/budget">Open budget →</a></div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Scope</th><th class="num">Budget</th><th class="num">Committed</th><th class="num">Forecast</th><th class="num">Variance</th></tr></thead><tbody>${cm.map(x => `<tr class="hit" tabindex="0" data-detail="${detail('lineitem', x.index)}"><td><b>${esc(x.r.description)}</b></td><td class="num">${usd(x.r.budget)}</td><td class="num">${usd(x.r.committed)}</td><td class="num">${usd(x.r.forecast)}</td><td class="num ${x.r.variance < 0 ? 'down' : 'up'}">${usd(x.r.variance)}</td></tr>`).join('') || '<tr><td colspan="5" class="muted center">Awaiting refreshed extract</td></tr>'}</tbody></table></div>
        </section>
        <section class="flat-panel"><div class="section-heading"><div><h2>CM effort burn</h2><p>Actual labor hours and analytics revenue. This is not earned value or WIP.</p></div></div>
          <div class="metric-strip">${row('Labor hours', totalHours.toLocaleString(), 'analytics transactions')}${row('Analytics revenue', money(totalAnalytics), 'labor plus expenses')}</div>
          <div class="chart-frame">${delivery.length ? deliveryBars : '<div class="detail-empty">Awaiting refreshed extract</div>'}</div>
        </section>
      </div>

      <div class="insight-grid">
        <section class="flat-panel"><div class="section-heading"><div><h2>WIP action register</h2><p>Exact comments and action fields from the WIP sheet.</p></div></div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Package</th><th>Vendor</th><th>Action</th><th class="num">WIP</th></tr></thead><tbody>${wipActions.map(x => `<tr class="hit" tabindex="0" data-detail="${detail('wip', x.index)}"><td><b>${esc(x.r.package)}</b></td><td>${esc(x.r.vendor)}</td><td>${esc(x.r.action || x.r.comment)}</td><td class="num">${usd(x.r.wip)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted center">No action text in source</td></tr>'}</tbody></table></div>
        </section>
        <section class="flat-panel source-freshness"><div class="section-heading"><div><h2>Source freshness</h2><p>Different workbooks close on different dates. The dashboard does not hide that.</p></div></div>
          <dl class="detail-grid">
            <div class="detail-kv"><dt>Schedule export</dt><dd>${fdate(sf.schedule_export && sf.schedule_export.as_of)}</dd></div>
            <div class="detail-kv"><dt>Cost report</dt><dd>${fdate(sf.cost_report && sf.cost_report.as_of)}</dd></div>
            <div class="detail-kv"><dt>Cash-flow actuals</dt><dd>${sf.cashflow_actual_through ? esc(fmonth(sf.cashflow_actual_through)) : '—'}</dd></div>
            <div class="detail-kv"><dt>Headcount actuals</dt><dd>${sf.headcount_actual_through ? esc(fmonth(sf.headcount_actual_through)) : '—'}</dd></div>
            <div class="detail-kv"><dt>Analytics actuals</dt><dd>${sf.analytics_actual_through ? esc(fmonth(sf.analytics_actual_through)) : '—'}</dd></div>
          </dl>
          <div class="note amber">One schedule snapshot is supplied. Trend, prediction, EV, change aging and cross-workbook package correlation are intentionally not claimed.</div>
        </section>
      </div>`;
  };
})(window);

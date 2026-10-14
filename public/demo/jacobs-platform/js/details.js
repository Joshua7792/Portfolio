/* Excel-grounded detail records for interactive dashboard elements. */
(function (w) {
  'use strict';
  const D = w.RPT, F = w.F;
  const dash = (v) => v == null || v === '' ? '—' : F.esc(v);
  const num = (v) => v == null || v === '' ? '—' : Number(v).toLocaleString();
  const date = (v) => v ? F.fdate(v) : '—';
  const money = (v) => v == null || v === '' ? '—' : F.money(Number(v));
  const days = (v) => v == null || v === '' ? '—' : `${v > 0 ? '+' : ''}${num(v)}d`;
  // Signed: a leading "+" is meaningful for variance and float (late / spare).
  const workdays = (v) => v == null || v === '' ? '—' : `${v > 0 ? '+' : ''}${num(v)} workdays`;
  // Unsigned: a duration is never negative, so "+1 workdays" would read as
  // "one day ahead of plan" — a claim the workbook never makes.
  const duration = (v) => v == null || v === '' ? '—' : `${num(v)} workdays`;
  const bool = (v) => v == null ? '—' : (v ? 'Yes' : 'No');
  const kv = (label, value, cls) => `<div class="detail-kv${cls ? ` ${cls}` : ''}"><dt>${F.esc(label)}</dt><dd>${value}</dd></div>`;
  const badge = (text, tone) => `<span class="badge ${tone || 'b-slate'}">${dash(text)}</span>`;
  const statusTone = (s) => ({ Completed: 'b-green', 'In Progress': 'b-amber', Approved: 'b-green', Cancelled: 'b-red', 'Not Started': 'b-blue', Submitted: 'b-blue' }[s] || 'b-slate');
  const shell = (kind, title, id, body, eyebrow) => ({
    title: dash(title),
    html: `<div class="detail-eyebrow">${dash(eyebrow || kind)}${id ? `<span class="detail-id">${dash(id)}</span>` : ''}</div><dl class="detail-grid">${body}</dl>`
  });
  const varianceContext = (v) => v == null ? 'Schedule record' : v > 3 ? 'Late vs baseline' : v < -3 ? 'Ahead vs baseline' : 'Near baseline';

  function scheduleRecord(r, kind) {
    const finishVar = r.finish_var_workdays != null ? r.finish_var_workdays : r.bl_var;
    return shell(kind, r.name, r.id,
      kv('Status', badge(r.status, statusTone(r.status))) + kv('Package', dash(r.package)) +
      kv('Current start', date(r.start)) + kv('Current finish', date(r.finish)) +
      kv('Baseline start', date(r.bl_start)) + kv('Baseline finish', date(r.bl_finish)) +
      kv('P6 finish variance', workdays(finishVar), finishVar > 3 ? 'is-risk' : '') +
      kv('Total float', workdays(r.total_float)) + kv('Remaining float', workdays(r.remaining_float)) +
      kv('Original duration', duration(r.original_duration)) + kv('Remaining duration', duration(r.remaining_duration)) +
      kv('Type', dash(r.type)) + kv('P6 critical flag', bool(r.critical), r.critical ? 'is-risk' : '') +
      kv('WBS code', dash(r.wbs_code)) + kv('WBS', dash(r.wbs_name || r.wbs)) +
      kv('Predecessors', dash(r.predecessors), 'detail-wide') + kv('Successors', dash(r.successors), 'detail-wide') +
      kv('Source comment', dash(r.source_comment), 'detail-wide'), varianceContext(finishVar));
  }
  function packageRecord(r) {
    const pct = r.pct_complete == null ? null : Math.max(0, Math.min(100, Number(r.pct_complete)));
    const finishVar = r.finish_var_calendar_days != null ? r.finish_var_calendar_days : r.bl_var;
    return shell('Package', r.package, '',
      kv('Progress', pct == null ? '—' : `<div class="detail-progress"><span>${num(r.pct_complete)}%</span><div class="progress"><i style="width:${pct}%;background:var(--brand)"></i></div></div>`) +
      kv('Activities', num(r.total)) + kv('Completed', num(r.completed)) + kv('In progress', num(r.in_progress)) +
      kv('Not started', num(r.not_started)) + kv('P6-critical', num(r.critical), r.critical ? 'is-risk' : '') +
      kv('Current start', date(r.current_start)) + kv('Current finish', date(r.current_finish || r.fc_finish)) +
      kv('Baseline start', date(r.bl_start)) + kv('Baseline finish', date(r.bl_finish)) +
      kv('Finish variance', days(finishVar)), varianceContext(finishVar));
  }
  function categoryRecord(r) {
    const notes = (D.budget.variance_notes || []).find(n => n.category === r.category);
    const noteHtml = notes && notes.points && notes.points.length ? `<div class="detail-wide detail-notes"><h4>Variance notes</h4><ul>${notes.points.map(p => `<li>${dash(p)}</li>`).join('')}</ul></div>` : '';
    return shell('Budget category', r.category, '', kv('Budget', money(r.budget)) + kv('Committed', money(r.committed)) + kv('Work in place', money(r.wip)) + kv('Forecast', money(r.forecast)) + kv('Variance', money(r.variance), r.variance < 0 ? 'is-risk' : '') + noteHtml, 'Cost record');
  }
  function monthRecord(key) {
    const c = D.budget.cashflow, i = c.months.indexOf(key); if (i < 0) return null;
    const cfa = (D.meta.source_freshness && D.meta.source_freshness.cashflow_actual_through) || null;
    const actual = cfa ? key <= cfa : key < (D.meta.schedule_as_of || D.meta.data_date).slice(0, 7);
    return shell('Commitment month', F.fmonth(key), key, kv('Period commitment', money(c.period && c.period[i])) + kv('Cumulative commitment', money(c.cumulative && c.cumulative[i])) + kv('Classification', badge(actual ? 'Actual' : 'Projected', actual ? 'b-green' : 'b-blue')), actual ? 'Actual month' : 'Projected month');
  }
  function hcRecord(key) {
    const h = D.budget.headcount, i = h.months.indexOf(key); if (i < 0) return null;
    const a = h.actual[i], p = h.planned[i], delta = a == null || p == null ? null : a - p;
    return shell('Headcount month', F.fmonth(key), key, kv('Planned', num(p)) + kv('Actual', num(a)) + kv('Delta', delta == null ? '—' : `${delta > 0 ? '+' : ''}${num(delta)}`, delta < 0 ? 'is-risk' : ''), a == null ? 'Plan only' : 'Actual vs plan');
  }
  function cnRecord(r) {
    return shell('Change notice', r.title || r.cn, r.cn, kv('Status', badge(r.status, statusTone(r.status))) + kv('Amount', money(r.amount)) + kv('Project', dash(r.project)) + kv('Part', dash(r.part)) + kv('Originator', dash(r.originator)) + kv('PCR', dash(r.pcr)) + kv('Comment', dash(r.comment), 'detail-wide'), 'Change control record');
  }
  function wipRecord(r, key) {
    return shell('Work in place', r.vendor || r.package, key, kv('Package', dash(r.package)) + kv('Vendor', dash(r.vendor)) + kv('Committed (contract)', money(r.contract)) + kv('Invoice reference', dash(r.invoice)) + kv('Invoiced', money(r.invoiced)) + kv('Estimated', money(r.estimated)) + kv('WIP', money(r.wip)) + kv('Percent', r.pct == null ? '—' : `${num(Number(r.pct) * 100)}%`) + kv('Evidence / source', dash(r.source), 'detail-wide') + kv('Comment', dash(r.comment), 'detail-wide') + kv('Action', dash(r.action), 'detail-wide'), 'Excel WIP record');
  }

  function lineItemRecord(r, key) {
    return shell('Cost line item', r.description || r.wp || 'Line item', r.wp || key,
      kv('Category', dash(r.category)) + kv('Work package', dash(r.wp)) + kv('Contractor', dash(r.contractor)) +
      kv('Budget', money(r.budget)) + kv('Committed', money(r.committed)) + kv('Work in place', money(r.wip)) +
      kv('Forecast', money(r.forecast)) + kv('Variance', money(r.variance), r.variance < 0 ? 'is-risk' : '') +
      kv('Source flag', dash(r.raw_flag)) + kv('Source row', num(r.source_row)) + kv('Comment', dash(r.comment), 'detail-wide'), 'Cost workbook record');
  }

  function deliveryMonthRecord(key) {
    const r = (D.budget.delivery_monthly || []).find(x => x.month === key); if (!r) return null;
    return shell('CM delivery month', F.fmonth(key), key,
      kv('Labor hours', num(r.labor_hours)) + kv('Labor revenue', money(r.labor_revenue)) +
      kv('Expense revenue', money(r.expense_revenue)) + kv('Total analytics revenue', money(r.total_revenue)), 'Analytics actual');
  }

  function wbsSummaryRecord(r, key) {
    const finishVar = r.finish_var_workdays != null ? r.finish_var_workdays : r.finish_var_calendar_days;
    return shell('WBS summary', r.label || r.path || key, key,
      kv('Package', dash(r.package)) + kv('WBS path', dash(r.path), 'detail-wide') +
      kv('Current start', date(r.start)) + kv('Current finish', date(r.finish)) +
      kv('Baseline start', date(r.bl_start)) + kv('Baseline finish', date(r.bl_finish)) +
      kv('P6 finish variance', workdays(finishVar), finishVar > 3 ? 'is-risk' : '') +
      kv('Original duration', duration(r.original_duration)) + kv('Remaining duration', duration(r.remaining_duration)) +
      kv('Total float', workdays(r.total_float)) + kv('Remaining float', workdays(r.remaining_float)) + kv('Source row', num(r.source_row)), 'Schedule summary row');
  }
  function monthDoneRecord(key) {
    const acts = (D.schedule.activities || []).filter(a => a.status === 'Completed' && a.finish && a.finish.slice(0, 7) === key);
    if (!acts.length) return null;
    const ms = (D.schedule.program_milestones || []).filter(m => m.status === 'Completed' && m.finish && m.finish.slice(0, 7) === key);
    const crit = acts.filter(a => a.critical).length;
    return shell('Month in review', F.fmonth(key), key,
      kv('Activities completed', num(acts.length)) + kv('P6-critical among them', num(crit)) +
      kv('Program milestones achieved', num(ms.length)), 'P6 actual finishes this month');
  }
  function statusRecord(key) {
    const field = { Completed: 'completed', 'In Progress': 'in_progress', 'Not Started': 'not_started' }[key]; if (!field) return null;
    const rows = (D.schedule.packages || []).map(p => kv(p.package, num(p[field]))).join('');
    return shell('Schedule status', key, '', kv('Overall', num(D.schedule.status_counts[field])) + rows, 'Activity counts by segment');
  }
  function dialRecord(key) {
    const r = key === 'total' ? D.budget.grand_total : (D.budget.categories || []).find(x => x.category === 'CM Services');
    if (!r) return null;
    return shell('Cost dial', key === 'total' ? 'Total Program' : 'CM Services', key, kv('Budget', money(r.budget)) + kv('Committed', money(r.committed)) + kv('Work in place', money(r.wip)) + kv('Forecast', money(r.forecast)) + kv('Variance', money(r.variance), r.variance < 0 ? 'is-risk' : ''), 'Budget vs forecast');
  }
  function build(type, key) {
    let r;
    if (type === 'milestone') { r = (D.schedule.program_milestones || []).find(x => String(x.id) === key) || (D.schedule.activities || []).find(x => String(x.id) === key); return r && scheduleRecord(r, 'Program milestone'); }
    if (type === 'activity') { r = (D.schedule.activities || []).find(x => String(x.id) === key); return r && scheduleRecord(r, 'Activity'); }
    if (type === 'package') { r = (D.schedule.packages || []).find(x => x.package === key); return r && packageRecord(r); }
    if (type === 'category') { r = (D.budget.categories || []).find(x => x.category === key); return r && categoryRecord(r); }
    if (type === 'month') return monthRecord(key);
    if (type === 'hcmonth') return hcRecord(key);
    if (type === 'cn') { r = (D.budget.changes || []).find(x => x.cn === key); return r && cnRecord(r); }
    if (type === 'wip') { r = (D.budget.wip || [])[Number(key)]; return r && wipRecord(r, key); }
    if (type === 'lineitem') { r = (D.budget.line_items || [])[Number(key)] || (D.budget.line_items || []).find(x => x.wp === key); return r && lineItemRecord(r, key); }
    if (type === 'deliverymonth') return deliveryMonthRecord(key);
    if (type === 'wbssummary') { r = (D.schedule.wbs_summaries || []).find(x => String(x.source_row) === key || x.label === key || x.path === key); return r && wbsSummaryRecord(r, key); }
    if (type === 'monthdone') return monthDoneRecord(key);
    if (type === 'status') return statusRecord(key);
    if (type === 'dial') return dialRecord(key);
    return null;
  }
  function open(type, key, invoker) {
    const record = build(type, key) || { title: 'Detail unavailable', html: `<div class="detail-empty">No Excel-extracted record matches <span class="detail-id">${dash(`${type}:${key}`)}</span>.</div>` };
    if (w.Interact) w.Interact.openDialog(record, invoker);
  }
  w.Detail = { build, open };
})(window);

/* ============================================================================
   charts.js — hand-rolled, dependency-free SVG charts (return HTML strings).
   Every function is pure. Colors come from CSS vars via currentColor / inline.
   ========================================================================== */
(function (w) {
  const NS = 'http://www.w3.org/2000/svg';
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hitAttrs = (m, label) => {
    if (!m || (!m.tip && !m.detail)) return '';
    const aria = label || m.tip || m.detail;
    return ` class="hit"${m.tip ? ` data-tip="${esc(m.tip)}"` : ''}${m.detail ? ` data-detail="${esc(m.detail)}"` : ''} tabindex="0" role="button" aria-label="${esc(aria)}"`;
  };
  const htmlHitAttrs = (m) => !m || (!m.tip && !m.detail) ? ''
    : ` class="hit"${m.tip ? ` data-tip="${esc(m.tip)}"` : ''}${m.detail ? ` data-detail="${esc(m.detail)}"` : ''} tabindex="0" role="button" aria-label="${esc(m.tip || m.detail)}"`;

  function polar(cx, cy, r, deg) {
    const a = (deg - 180) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  // arc along a semicircle (0..180 deg maps left..right, top half)
  function arcPath(cx, cy, r, a0, a1) {
    const [x0, y0] = polar(cx, cy, r, a0);
    const [x1, y1] = polar(cx, cy, r, a1);
    const large = (a1 - a0) > 180 ? 1 : 0;
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }

  /* -- half gauge: shows forecast vs budget with paid/committed segments ----- */
  // opts: {title, forecast, budget, committed, paid, money}
  function gauge(o) {
    const cx = 130, cy = 128, r = 104, sw = 20;
    const cap = Math.max(o.forecast, o.budget) || 1;
    const seg = (v) => 180 * Math.min(v, cap) / cap;
    const track = arcPath(cx, cy, r, 0, 180);
    const fc = arcPath(cx, cy, r, 0, seg(o.forecast));
    const comm = o.committed ? arcPath(cx, cy, r, 0, seg(o.committed)) : '';
    const paid = o.paid ? arcPath(cx, cy, r, 0, seg(o.paid)) : '';
    const budgetDeg = seg(o.budget);
    const [bx, by] = polar(cx, cy, r + 12, budgetDeg);
    const [bx0, by0] = polar(cx, cy, r - sw / 2 - 4, budgetDeg);
    const over = o.forecast > o.budget;
    const detail = o.detail ? { detail: o.detail, tip: `${o.title}: ${o.money(o.forecast)} forecast` } : null;
    return `<svg class="svgc${detail ? ' hit' : ''}" viewBox="0 0 260 168" width="100%" role="${detail ? 'button' : 'img'}" aria-label="${esc(o.title)} gauge"${detail ? ` data-tip="${esc(detail.tip)}" data-detail="${esc(detail.detail)}" tabindex="0"` : ''}>
      <path d="${track}" fill="none" stroke="var(--border-2)" stroke-width="${sw}" stroke-linecap="round"/>
      <path class="hit" d="${fc}" fill="none" stroke="var(--planned)" stroke-width="${sw}" stroke-linecap="round" data-tip="${esc(`Forecast ${o.money(o.forecast)}`)}" tabindex="0" role="button" aria-label="${esc(`Forecast ${o.money(o.forecast)}`)}"/>
      ${comm ? `<path class="hit" d="${comm}" fill="none" stroke="var(--committed)" stroke-width="${sw}" stroke-linecap="round" data-tip="${esc(`Committed ${o.money(o.committed)}`)}" tabindex="0" role="button" aria-label="${esc(`Committed ${o.money(o.committed)}`)}"/>` : ''}
      ${paid ? `<path class="hit" d="${paid}" fill="none" stroke="var(--paid)" stroke-width="${sw}" stroke-linecap="round" data-tip="${esc(`Work in Place ${o.money(o.paid)}`)}" tabindex="0" role="button" aria-label="${esc(`Work in Place ${o.money(o.paid)}`)}"/>` : ''}
      <line x1="${bx0.toFixed(1)}" y1="${by0.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="var(--ink)" stroke-width="2.5"/>
      <text x="${bx.toFixed(1)}" y="${(by - 4).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="var(--muted)">Budget</text>
      <text x="130" y="112" text-anchor="middle" font-size="30" font-weight="800" fill="var(--ink)">${o.money(o.forecast)}</text>
      <text x="130" y="133" text-anchor="middle" font-size="11.5" fill="var(--muted)">Forecast · vs ${o.money(o.budget)} budget</text>
      <text x="130" y="152" text-anchor="middle" font-size="11.5" font-weight="700" fill="${over ? 'var(--over)' : 'var(--under)'}">
        ${over ? '▲' : '▼'} ${o.money(Math.abs(o.forecast - o.budget))} ${over ? 'over' : 'under'}</text>
    </svg>`;
  }

  /* -- donut ----------------------------------------------------------------- */
  // segs: [{label,value,color}], center: {big,small}
  function donut(segs, center) {
    const cx = 90, cy = 90, r = 66, sw = 22;
    const tot = segs.reduce((s, x) => s + x.value, 0) || 1;
    let a = 0, out = '';
    segs.forEach(s => {
      const sweep = 360 * s.value / tot;
      if (sweep <= 0) return;
      const [x0, y0] = polar(cx, cy, r, a - 180);
      const [x1, y1] = polar(cx, cy, r, a + sweep - 180);
      const large = sweep > 180 ? 1 : 0;
      out += `<path${hitAttrs(s, `${s.label}: ${s.value}`)} d="M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}" fill="none" stroke="${s.color}" stroke-width="${sw}" stroke-linecap="butt"/>`;
      a += sweep;
    });
    return `<svg class="svgc" viewBox="0 0 180 180" width="150" height="150" role="img" aria-label="donut chart">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border-2)" stroke-width="${sw}"/>
      ${out}
      <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="26" font-weight="800" fill="var(--ink)">${center.big}</text>
      <text x="${cx}" y="${cy + 17}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(center.small)}</text>
    </svg>`;
  }

  /* -- horizontal cost bar (paid | committed | remaining-to-forecast) -------- */
  function costBar(o) { // {paid,committed,forecast,budget,money}
    const cap = Math.max(o.forecast, o.budget) || 1;
    const pct = (v) => 100 * v / cap;
    const paidW = pct(o.paid), commW = Math.max(0, pct(o.committed) - pct(o.paid));
    const planW = Math.max(0, pct(o.forecast) - pct(o.committed));
    const budgetPct = pct(o.budget);
    const rootMeta = o.detail ? { detail: o.detail, tip: `Forecast ${o.money(o.forecast)}; budget ${o.money(o.budget)}` } : null;
    return `<div${htmlHitAttrs(rootMeta)} style="position:relative;height:22px;border-radius:7px;overflow:hidden;background:var(--border-2)">
      <div class="hit" data-tip="${esc(`Work in Place ${o.money(o.paid)}`)}" style="position:absolute;height:100%;width:${paidW}%;background:var(--paid)"></div>
      <div class="hit" data-tip="${esc(`Committed ${o.money(o.committed)}`)}" style="position:absolute;left:${paidW}%;height:100%;width:${commW}%;background:var(--committed)"></div>
      <div class="hit" data-tip="${esc(`Forecast remainder ${o.money(Math.max(0, o.forecast - o.committed))}`)}" style="position:absolute;left:${pct(o.committed)}%;height:100%;width:${planW}%;background:var(--planned);opacity:.5"></div>
      <div title="Budget ${o.money(o.budget)}" style="position:absolute;left:${budgetPct}%;top:-2px;bottom:-2px;width:2px;background:var(--ink)"></div>
    </div>`;
  }

  /* -- S-curve (cumulative area + line, optional period bars) ----------------*/
  function sCurve(o) { // {labels, cumulative, period?, money, markIndex?}  markIndex = last ACTUAL point
    const W = 720, H = 260, pl = 56, pr = 16, pt = 16, pb = 34;
    const n = o.cumulative.length;
    const max = Math.max(...o.cumulative) || 1;
    const x = (i) => pl + (W - pl - pr) * (n === 1 ? .5 : i / (n - 1));
    const y = (v) => H - pb - (H - pt - pb) * v / max;
    const mk = (o.markIndex == null || o.markIndex < 0 || o.markIndex >= n - 1) ? -1 : o.markIndex;
    let bars = '';
    if (o.period) {
      const bw = (W - pl - pr) / n * .5;
      const pmax = Math.max(...o.period) || 1;
      o.period.forEach((v, i) => {
        const h = (H - pt - pb) * v / pmax * .82;
        bars += `<rect x="${(x(i) - bw / 2).toFixed(1)}" y="${(H - pb - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="var(--brand-3)" opacity=".22"/>`;
      });
    }
    // split the line at the data date: solid = actual, dashed = projected
    const pt2 = (i) => `${x(i).toFixed(1)} ${y(o.cumulative[i]).toFixed(1)}`;
    let solid, dashed = '', divider = '';
    if (mk >= 0) {
      solid = 'M' + o.cumulative.slice(0, mk + 1).map((v, i) => `${i ? 'L' : ''}${pt2(i)}`).join(' ');
      dashed = 'M' + [mk, ...Array.from({ length: n - mk - 1 }, (_, k) => mk + 1 + k)].map((i, j) => `${j ? 'L' : ''}${pt2(i)}`).join(' ');
      const dx = x(mk).toFixed(1);
      divider = `<line x1="${dx}" y1="${pt}" x2="${dx}" y2="${H - pb}" stroke="var(--marker)" stroke-width="1.5" stroke-dasharray="4 3"/>
        <text x="${dx}" y="${pt + 10}" text-anchor="middle" font-size="9" font-weight="700" fill="var(--marker)">DATA DATE</text>
        <text x="${(pl + 4)}" y="${pt + 10}" font-size="9" fill="var(--muted)">actual</text>
        <text x="${(W - pr - 4)}" y="${pt + 10}" text-anchor="end" font-size="9" fill="var(--muted)">projected</text>`;
    }
    const line = o.cumulative.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const solidPath = mk >= 0 ? solid : line;
    const area = `${line} L${x(n - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
    let grid = '', ax = '';
    for (let g = 0; g <= 4; g++) {
      const gv = max * g / 4, gy = y(gv);
      grid += `<line x1="${pl}" y1="${gy.toFixed(1)}" x2="${W - pr}" y2="${gy.toFixed(1)}" stroke="var(--border-2)"/>`;
      ax += `<text x="${pl - 8}" y="${(gy + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--muted)">${o.money(gv)}</text>`;
    }
    const step = Math.ceil(n / 8);
    let xl = '';
    o.labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) xl += `<text x="${x(i).toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="10" fill="var(--muted)">${esc(l)}</text>`; });
    const dots = o.cumulative.map((v, i) => {
      const meta = o.dotMeta && o.dotMeta[i];
      const cx = x(i).toFixed(1), cy = y(v).toFixed(1);
      return `<circle cx="${cx}" cy="${cy}" r="3" fill="var(--brand)"/>${meta ? `<circle${hitAttrs(meta, meta.tip || `${o.labels[i]}: ${o.money(v)}`)} cx="${cx}" cy="${cy}" r="11" fill="transparent" stroke="none"/>` : ''}`;
    }).join('');
    return `<svg class="svgc" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="S-curve">
      <defs><linearGradient id="scg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--brand-2)" stop-opacity=".28"/><stop offset="1" stop-color="var(--brand-2)" stop-opacity="0"/>
      </linearGradient></defs>
      ${grid}${bars}<path d="${area}" fill="url(#scg)"/>
      <path d="${solidPath}" fill="none" stroke="var(--brand)" stroke-width="2.5"/>
      ${dashed ? `<path d="${dashed}" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-dasharray="5 4" opacity=".7"/>` : ''}
      ${divider}${dots}${ax}${xl}</svg>`;
  }

  /* -- grouped/paired bars (e.g. planned vs actual headcount) ----------------*/
  function groupedBar(o) { // {labels, series:[{name,color,data}]}
    const W = 720, H = 240, pl = 40, pr = 12, pt = 14, pb = 34;
    const n = o.labels.length, k = o.series.length;
    const all = o.series.flatMap(s => s.data.filter(v => v != null));
    const max = Math.max(...all, 1);
    const gw = (W - pl - pr) / n, bw = Math.min(18, gw / (k + 1));
    const y = (v) => H - pb - (H - pt - pb) * v / max;
    let grid = '';
    for (let g = 0; g <= 4; g++) { const gy = pt + (H - pt - pb) * g / 4; grid += `<line x1="${pl}" y1="${gy}" x2="${W - pr}" y2="${gy}" stroke="var(--border-2)"/>`; grid += `<text x="${pl - 6}" y="${gy + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${Math.round(max * (4 - g) / 4)}</text>`; }
    let bars = '';
    o.labels.forEach((l, i) => {
      const gx = pl + gw * i + (gw - bw * k) / 2;
      o.series.forEach((s, j) => {
        const v = s.data[i]; if (v == null) return;
        const meta = s.meta && s.meta[i];
        bars += `<rect${hitAttrs(meta, meta && meta.tip || `${s.name} ${l}: ${v}`)} x="${(gx + j * bw).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw - 3).toFixed(1)}" height="${(H - pb - y(v)).toFixed(1)}" rx="2.5" fill="${s.color}"><title>${esc(s.name)} ${esc(l)}: ${v}</title></rect>`;
      });
      bars += `<text x="${(pl + gw * i + gw / 2).toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="9.5" fill="var(--muted)">${esc(l)}</text>`;
    });
    return `<svg class="svgc" viewBox="0 0 ${W} ${H}" width="100%" role="img">${grid}${bars}</svg>`;
  }

  /* -- horizontal % complete bars per package --------------------------------*/
  function hbars(o) { // {rows:[{label,value,color}], max?}
    const max = o.max || 100;
    return `<div class="stack" style="gap:12px">` + o.rows.map(r => `
      <div${htmlHitAttrs(r)}><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px">
        <span style="font-weight:600">${esc(r.label)}</span><span class="tnum muted">${r.text || r.value + '%'}</span></div>
      <div class="progress"><i style="width:${Math.min(100, 100 * r.value / max)}%;background:${r.color || 'var(--brand)'}"></i></div></div>`).join('') + `</div>`;
  }

  /* -- package gantt / milestone rail over a shared time axis -----------------*/
  function gantt(o) { // {rows:[{label,start,finish,pct,color}], min, max}
    const W = 760, rowH = 34, pl = 130, pr = 20, pt = 30;
    const H = pt + o.rows.length * rowH + 6;
    const t0 = new Date(o.min).getTime(), t1 = new Date(o.max).getTime();
    const x = (d) => pl + (W - pl - pr) * (new Date(d).getTime() - t0) / (t1 - t0 || 1);
    // year gridlines
    let grid = '';
    const y0 = new Date(o.min).getFullYear(), y1 = new Date(o.max).getFullYear();
    for (let yy = y0; yy <= y1 + 1; yy++) { const gx = x(`${yy}-01-01`); if (gx < pl || gx > W - pr) continue; grid += `<line x1="${gx.toFixed(1)}" y1="${pt - 8}" x2="${gx.toFixed(1)}" y2="${H - 4}" stroke="var(--border-2)"/><text x="${gx.toFixed(1)}" y="${pt - 12}" text-anchor="middle" font-size="10" fill="var(--muted)">${yy}</text>`; }
    let rows = '';
    o.rows.forEach((r, i) => {
      const ry = pt + i * rowH, x0 = x(r.start), x1 = x(r.finish), bw = Math.max(4, x1 - x0);
      rows += `<text x="${pl - 10}" y="${(ry + 20).toFixed(1)}" text-anchor="end" font-size="11.5" font-weight="600" fill="var(--ink)">${esc(r.label)}</text>`;
      rows += `<rect${hitAttrs(r, r.tip || `${r.label}: ${r.pct || 0}%`)} x="${x0.toFixed(1)}" y="${(ry + 4).toFixed(1)}" width="${bw.toFixed(1)}" height="24" rx="8" fill="${r.color || 'var(--brand-3)'}" opacity=".28"/>`;
      rows += `<rect x="${x0.toFixed(1)}" y="${(ry + 8).toFixed(1)}" width="${(bw * (r.pct || 0) / 100).toFixed(1)}" height="16" rx="8" fill="${r.color || 'var(--brand)'}" pointer-events="none"><title>${esc(r.label)} ${r.pct || 0}%</title></rect>`;
    });
    return `<svg class="svgc" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="package gantt">${grid}${rows}</svg>`;
  }

  /* -- program milestone horizon --------------------------------------------*/
  const DAY = 864e5;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MILESTONE_LANES = [
    'Project Milestones',
    'Design Milestones',
    'PC21 - Pk2 - Major Milestones',
    'Package 0 & 1 - Major Milestones',
    'Permit Packages',
    'PC21 - Pk3 - Major Milestones',
  ];

  function dateMs(v) {
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : null;
  }
  function addMonths(v, n) {
    const d = new Date(v);
    d.setUTCMonth(d.getUTCMonth() + n);
    return d.getTime();
  }
  function shortDate(v) {
    const d = new Date(v);
    return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(-2)}`;
  }
  function normalizeMilestones(items) {
    const seen = new Set();
    return (items || []).map((m, ix) => {
      const id = m.id == null ? `milestone-${ix}` : String(m.id);
      const t = dateMs(m.date || m.finish);
      if (seen.has(id) || t == null) return null;
      seen.add(id);
      const nativeVar = m.finish_var_workdays == null ? null : Number(m.finish_var_workdays);
      const legacyVar = m.bl_var == null ? null : Number(m.bl_var);
      const late = m.late == null
        ? (nativeVar == null ? legacyVar != null && legacyVar > 3 : nativeVar > 0)
        : !!m.late;
      return Object.assign({}, m, {
        id, t, date: m.date || m.finish,
        name: m.name || m.label || id,
        lane: m.wbs_name || m.wbs || m.lane || 'Project Milestones',
        done: m.status === 'Completed', late,
        major: !!(m.major || m.labeled),
      });
    }).filter(Boolean).sort((a, b) => a.t - b.t || a.id.localeCompare(b.id));
  }
  function milestoneMeta(m) {
    const variance = m.finish_var_workdays == null ? m.bl_var : m.finish_var_workdays;
    const varianceText = variance == null ? '' : `; ${Number(variance) > 0 ? '+' : ''}${variance}d variance`;
    return {
      tip: m.tip || `${m.name}; ${shortDate(m.t)}; ${m.status || '—'}${varianceText}`,
      detail: m.detail || `milestone:${m.id}`,
    };
  }
  function markSvg(m, x, y, interactive, r) {
    const size = r || 6;
    const color = m.late && !m.done ? 'var(--over)' : m.done ? 'var(--st-complete)' : 'var(--brand)';
    const fill = m.done ? color : 'var(--card)';
    const sw = m.late && !m.done ? 2.6 : 1.8;
    const isStart = /start/i.test(m.type || '');
    const visible = isStart
      ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size}" fill="${fill}" stroke="${color}" stroke-width="${sw}" pointer-events="none"/>`
      : `<path d="M${x.toFixed(1)} ${(y - size).toFixed(1)}L${(x + size).toFixed(1)} ${y.toFixed(1)}L${x.toFixed(1)} ${(y + size).toFixed(1)}L${(x - size).toFixed(1)} ${y.toFixed(1)}Z" fill="${fill}" stroke="${color}" stroke-width="${sw}" pointer-events="none"/>`;
    const stateGlyph = m.done
      ? `<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="900" fill="var(--card)" pointer-events="none">✓</text>`
      : m.late ? `<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="900" fill="var(--over)" pointer-events="none">!</text>` : '';
    if (!interactive) return visible + stateGlyph;
    const meta = milestoneMeta(m);
    return visible + stateGlyph + `<circle${hitAttrs(meta, meta.tip)} cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="transparent" stroke="none"/>`;
  }
  function collisionSlots(items, x, slots, minGap) {
    const last = Array(slots).fill(-Infinity);
    const assigned = new Map();
    items.forEach(m => {
      const mx = x(m.t);
      let slot = last.findIndex(v => mx - v >= minGap);
      if (slot < 0) slot = last.indexOf(Math.min(...last));
      last[slot] = mx;
      assigned.set(m.id, slot);
    });
    return assigned;
  }
  function milestoneSummary(items, dataDate) {
    const done = items.filter(m => m.done).length;
    const next = items.find(m => !m.done && m.t >= dataDate) || items.find(m => !m.done) || null;
    return `<div class="mh-summary"><div><span class="mh-kicker">Program horizon</span><strong>${done} complete <span aria-hidden="true">/</span> ${items.length - done} upcoming</strong></div>
      <div class="mh-next"><span>Next milestone</span><strong>${next ? esc(next.name) : '—'}</strong>${next ? `<time datetime="${esc(next.date)}">${shortDate(next.t)}</time>` : ''}</div></div>`;
  }
  function overviewSvg(items, minT, maxT, dataDate, focusEnd) {
    const W = 1320, H = 124, pl = 34, pr = 18, top = 32;
    const x = t => pl + (W - pl - pr) * (t - minT) / (maxT - minT || 1);
    let ticks = '';
    const start = new Date(minT), end = new Date(maxT);
    for (let yy = start.getUTCFullYear(); yy <= end.getUTCFullYear(); yy++) {
      for (let q = 0; q < 4; q++) {
        const qt = Date.UTC(yy, q * 3, 1);
        if (qt < minT || qt > maxT) continue;
        const qx = x(qt);
        ticks += `<line x1="${qx.toFixed(1)}" y1="${top}" x2="${qx.toFixed(1)}" y2="${H - 10}" stroke="var(--border-2)"/>`;
        ticks += `<text x="${qx.toFixed(1)}" y="16" text-anchor="middle" font-size="9.5" font-weight="${q ? '500' : '750'}" fill="var(--muted)">${q ? `Q${q + 1}` : yy}</text>`;
      }
    }
    const slots = collisionSlots(items, x, 5, 18);
    const ys = [68, 88, 48, 108, 28];
    const marks = items.map(m => markSvg(m, x(m.t), ys[slots.get(m.id)], m.t < dataDate || m.t > focusEnd, 5)).join('');
    const ddx = Math.max(pl, Math.min(W - pr, x(dataDate)));
    const focusX = Math.max(pl, Math.min(W - pr, x(focusEnd)));
    return `<svg class="svgc mh-overview" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Full program overview; milestones inside the focus window continue in the lane view below">
      <rect x="${ddx.toFixed(1)}" y="${top}" width="${Math.max(0, focusX - ddx).toFixed(1)}" height="${H - top - 10}" rx="6" fill="var(--brand-2)" opacity=".055"/>
      ${ticks}<line x1="${pl}" y1="68" x2="${W - pr}" y2="68" stroke="var(--muted)" stroke-width="1.5" opacity=".55"/>
      <line x1="${ddx.toFixed(1)}" y1="${top - 2}" x2="${ddx.toFixed(1)}" y2="${H - 7}" stroke="var(--marker)" stroke-width="1.5" stroke-dasharray="4 3"/>
      ${marks}</svg>`;
  }
  function focusSvg(items, allItems, dataDate, focusEnd, lanes) {
    const W = 1320, pl = 210, pr = 18, pt = 48, rowH = 58, pb = 20;
    const H = pt + lanes.length * rowH + pb;
    const x = t => pl + (W - pl - pr) * (t - dataDate) / (focusEnd - dataDate || 1);
    let bands = '', axis = '';
    const cursor = new Date(dataDate); cursor.setUTCDate(1);
    let monthIx = 0;
    while (cursor.getTime() <= focusEnd) {
      const mt = cursor.getTime(), next = addMonths(mt, 1);
      const x0 = Math.max(pl, x(Math.max(mt, dataDate))), x1 = Math.min(W - pr, x(Math.min(next, focusEnd)));
      if (x1 >= pl && x0 <= W - pr) {
        if (monthIx % 2) bands += `<rect x="${x0.toFixed(1)}" y="${pt - 17}" width="${Math.max(0, x1 - x0).toFixed(1)}" height="${H - pt - 1}" fill="var(--card-2)"/>`;
        const mid = (x0 + x1) / 2, d = new Date(mt), q = Math.floor(d.getUTCMonth() / 3) + 1;
        axis += `<line x1="${x0.toFixed(1)}" y1="${pt - 17}" x2="${x0.toFixed(1)}" y2="${H - pb}" stroke="var(--border-2)"/>`;
        axis += `<text x="${mid.toFixed(1)}" y="${pt - 23}" text-anchor="middle" font-size="9.5" fill="var(--muted)">${MONTHS[d.getUTCMonth()]}</text>`;
        if (d.getUTCMonth() % 3 === 0) axis += `<text x="${x0.toFixed(1)}" y="13" font-size="10" font-weight="750" fill="var(--ink)">${d.getUTCFullYear()} Q${q}</text>`;
      }
      cursor.setUTCMonth(cursor.getUTCMonth() + 1); monthIx++;
    }
    let laneSvg = '', marks = '';
    lanes.forEach((lane, ix) => {
      const y0 = pt + ix * rowH, cy = y0 + rowH / 2;
      const laneItems = items.filter(m => m.lane === lane);
      const laneTotal = allItems.filter(m => m.lane === lane).length;
      laneSvg += `<line x1="0" y1="${(y0 + rowH).toFixed(1)}" x2="${W - pr}" y2="${(y0 + rowH).toFixed(1)}" stroke="var(--border-2)"/>`;
      laneSvg += `<text x="8" y="${(cy - 2).toFixed(1)}" font-size="11" font-weight="700" fill="var(--ink)">${esc(lane)}</text><text x="8" y="${(cy + 14).toFixed(1)}" font-size="9.5" fill="var(--muted)">${laneTotal} program milestones</text>`;
      const slots = collisionSlots(laneItems, x, 3, 20), offsets = [-18, 0, 18];
      laneItems.forEach(m => { marks += markSvg(m, x(m.t), cy + offsets[slots.get(m.id)], true, 6); });
    });
    const ddx = x(dataDate);
    return `<svg class="svgc mh-focus" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Milestones from the data date through the next twelve months by WBS lane">
      ${bands}${axis}${laneSvg}<line x1="${ddx.toFixed(1)}" y1="${pt - 18}" x2="${ddx.toFixed(1)}" y2="${H - pb}" stroke="var(--marker)" stroke-width="1.5" stroke-dasharray="4 3"/>
      <text x="${(ddx + 5).toFixed(1)}" y="${pt - 4}" font-size="9" font-weight="800" fill="var(--marker)">DATA DATE</text>${marks}</svg>`;
  }
  function mobileHitAttrs(m) {
    const meta = milestoneMeta(m), aria = meta.tip || meta.detail;
    return ` class="mh-mobile-row hit"${meta.tip ? ` data-tip="${esc(meta.tip)}"` : ''}${meta.detail ? ` data-detail="${esc(meta.detail)}"` : ''} tabindex="0" role="button" aria-label="${esc(aria)}"`;
  }
  function milestoneHorizonMobile(o) {
    const items = normalizeMilestones(o.items);
    const dataDate = dateMs(o.dataDate) == null ? (items[0] ? items[0].t : Date.now()) : dateMs(o.dataDate);
    const rows = items.map(m => `<li${mobileHitAttrs(m)}><time datetime="${esc(m.date)}">${shortDate(m.t)}</time><span class="mh-mobile-mark ${m.done ? 'is-done' : ''} ${m.late && !m.done ? 'is-late' : ''}" aria-hidden="true"></span><span class="mh-mobile-copy"><small>${esc(m.lane)}</small><strong>${esc(m.name)}</strong><span>${esc(m.status || '—')}${m.late && !m.done ? ' · Late' : ''}</span></span></li>`).join('');
    return `<section class="mh mh-mobile" aria-label="Program milestone horizon">${milestoneSummary(items, dataDate)}<ol class="mh-mobile-list">${rows}</ol></section>`;
  }
  function milestoneHorizon(o) { // {items,dataDate,min?,max?,focusMonths?,mobile?,lanes?}
    if (o.mobile) return milestoneHorizonMobile(o);
    const items = normalizeMilestones(o.items);
    if (!items.length) return '<div class="mh-empty">No program milestones in the source extract.</div>';
    const dataDate = dateMs(o.dataDate) == null ? items[0].t : dateMs(o.dataDate);
    const focusEnd = addMonths(dataDate, o.focusMonths == null ? 12 : o.focusMonths);
    const minT = dateMs(o.min) == null ? items[0].t : dateMs(o.min);
    const maxT = dateMs(o.max) == null ? items[items.length - 1].t : dateMs(o.max);
    const requested = o.lanes && o.lanes.length ? o.lanes.slice() : MILESTONE_LANES.slice();
    const extras = [...new Set(items.map(m => m.lane).filter(l => !requested.includes(l)))];
    const lanes = requested.concat(extras);
    const focus = items.filter(m => m.t >= dataDate && m.t <= focusEnd);
    const calloutItems = focus.filter(m => m.major);
    lanes.forEach(lane => {
      const next = focus.find(m => m.lane === lane && !m.done);
      if (next && !calloutItems.some(m => m.id === next.id)) calloutItems.push(next);
    });
    calloutItems.sort((a, b) => a.t - b.t || a.id.localeCompare(b.id));
    const callouts = calloutItems.length ? `<div class="mh-callouts" aria-label="Named focus milestones">${calloutItems.map(m => `<div><time datetime="${esc(m.date)}">${shortDate(m.t)}</time><span>${esc(m.name)}</span><small>${esc(m.lane)}</small></div>`).join('')}</div>` : '';
    return `<section class="mh mh-desktop" aria-label="Program milestone horizon">${milestoneSummary(items, dataDate)}
      <div class="mh-section-label"><span>Full program</span><span>Every source milestone remains selectable</span></div>${overviewSvg(items, minT, maxT, dataDate, focusEnd)}
      <div class="mh-section-label"><span>Next ${o.focusMonths == null ? 12 : o.focusMonths} months</span><span>WBS focus lanes</span></div>${focusSvg(focus, items, dataDate, focusEnd, lanes)}${callouts}</section>`;
  }

  /* -- program milestone waterfall (Program-Milestones.png style) ------------*/
  // o: {items:[{id,date/finish,name,status,type,finish_var_workdays,major,tip,detail}], dataDate, mobile}
  function milestoneWaterfall(o) {
    if (o.mobile) return milestoneHorizonMobile(o);
    const items = normalizeMilestones(o.items);
    if (!items.length) return '<div class="mh-empty">No key program milestones in the source extract.</div>';
    const dataDate = dateMs(o.dataDate) == null ? items[0].t : dateMs(o.dataDate);
    const W = 1320, pl = 46, pr = 46, top = 24, baseY = 236, H = 430;
    const minT = items[0].t, maxT = items[items.length - 1].t;
    const x = (t) => pl + (W - pl - pr) * (t - minT) / (maxT - minT || 1);
    // year + quarter ticks
    let ticks = '';
    const sY = new Date(minT).getUTCFullYear(), eY = new Date(maxT).getUTCFullYear();
    for (let yy = sY; yy <= eY; yy++) {
      for (let q = 0; q < 4; q++) {
        const qt = Date.UTC(yy, q * 3, 1);
        if (qt < minT || qt > maxT) continue;
        const qx = x(qt);
        ticks += `<line x1="${qx.toFixed(1)}" y1="${top}" x2="${qx.toFixed(1)}" y2="${H - 26}" stroke="var(--border-2)"${q ? '' : ' stroke-width="1.3"'}/>`;
        ticks += `<text x="${qx.toFixed(1)}" y="${H - 9}" text-anchor="middle" font-size="${q ? '9' : '11'}" font-weight="${q ? '500' : '800'}" fill="${q ? 'var(--muted)' : 'var(--ink)'}">${q ? `Q${q + 1}` : yy}</text>`;
      }
    }
    // baseline with elapsed (min -> data date) progress fill
    const ddx = Math.max(pl, Math.min(W - pr, x(dataDate)));
    const base = `<line x1="${pl}" y1="${baseY}" x2="${W - pr}" y2="${baseY}" stroke="var(--border)" stroke-width="3" stroke-linecap="round"/>
      <line x1="${pl}" y1="${baseY}" x2="${ddx.toFixed(1)}" y2="${baseY}" stroke="var(--brand)" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
    const dd = `<line x1="${ddx.toFixed(1)}" y1="${top}" x2="${ddx.toFixed(1)}" y2="${H - 26}" stroke="var(--marker)" stroke-width="1.5" stroke-dasharray="4 3"/>
      <text x="${ddx.toFixed(1)}" y="${top - 5}" text-anchor="middle" font-size="9" font-weight="800" fill="var(--marker)">DATA DATE</text>`;
    // leader-line ("waterfall") labels for the major milestones, alternating above/below
    const clip = (s, n) => { s = String(s); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
    const labelled = items.filter(m => m.major);
    const aboveY = [baseY - 42, baseY - 80, baseY - 118], belowY = [baseY + 42, baseY + 80, baseY + 118];
    const lastX = { above: [-1e9, -1e9, -1e9], below: [-1e9, -1e9, -1e9] };
    const GAP = 168;
    let leaders = '';
    labelled.forEach((m, i) => {
      const side = i % 2 === 0 ? 'above' : 'below';
      const mx = x(m.t);
      let tier = lastX[side].findIndex(v => mx - v >= GAP);
      if (tier < 0) tier = lastX[side].indexOf(Math.min(...lastX[side]));
      lastX[side][tier] = mx;
      const ly = (side === 'above' ? aboveY : belowY)[tier];
      const lx = Math.max(pl + 74, Math.min(W - pr - 74, mx));
      const anchorY = side === 'above' ? ly + 14 : ly - 16;
      const color = m.late && !m.done ? 'var(--over)' : m.done ? 'var(--st-complete)' : 'var(--brand)';
      leaders += `<line x1="${mx.toFixed(1)}" y1="${(baseY + (side === 'above' ? -9 : 9)).toFixed(1)}" x2="${lx.toFixed(1)}" y2="${anchorY.toFixed(1)}" stroke="var(--faint)" stroke-width="1"/>`;
      leaders += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="750" fill="var(--ink)"><tspan x="${lx.toFixed(1)}">${esc(clip(m.label || m.name, 42))}</tspan><tspan x="${lx.toFixed(1)}" dy="12" font-size="9.5" font-weight="600" fill="${color}">${shortDate(m.t)}</tspan></text>`;
    });
    // every milestone is an interactive dot on the baseline
    const dots = items.map(m => markSvg(m, x(m.t), baseY, true, 6)).join('');
    return `<svg class="svgc mh-waterfall" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Program milestone waterfall from ${esc(shortDate(minT))} to ${esc(shortDate(maxT))}; every milestone is selectable">
      ${ticks}${base}${dd}${leaders}${dots}</svg>`;
  }

  /* -- budget-to-forecast waterfall -----------------------------------------*/
  function wrappedLabel(label, x, y, width) {
    const words = String(label).split(/\s+/), lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (test.length > width && line) { lines.push(line); line = word; } else line = test;
    });
    if (line) lines.push(line);
    return `<text x="${x.toFixed(1)}" y="${y}" text-anchor="middle" font-size="9.5" fill="var(--muted)">${lines.map((s, i) => `<tspan x="${x.toFixed(1)}" dy="${i ? 11 : 0}">${esc(s)}</tspan>`).join('')}</text>`;
  }
  function waterfall(o) { // {start:{label,value},steps:[{label,value}],end?,money}
    const start = o.start || { label: 'Start', value: 0 }, steps = o.steps || [];
    const derivedEnd = steps.reduce((v, step) => v + Number(step.value || 0), Number(start.value || 0));
    const end = o.end || { label: 'Forecast', value: derivedEnd };
    const points = [Number(start.value || 0)]; let running = points[0];
    steps.forEach(step => { running += Number(step.value || 0); points.push(running); });
    const max = Math.max(Number(end.value || 0), ...points, 1) * 1.08;
    const W = 760, H = 270, pl = 58, pr = 14, pt = 24, pb = 62;
    const n = steps.length + 2, gw = (W - pl - pr) / n, bw = Math.min(54, gw * .58);
    const x = i => pl + gw * i + gw / 2, y = v => H - pb - (H - pt - pb) * Number(v || 0) / max;
    const format = o.money || (v => String(Math.round(v)));
    let grid = '', bars = '', connectors = '';
    for (let g = 0; g <= 4; g++) {
      const value = max * g / 4, gy = y(value);
      grid += `<line x1="${pl}" y1="${gy.toFixed(1)}" x2="${W - pr}" y2="${gy.toFixed(1)}" stroke="var(--border-2)"/><text x="${pl - 7}" y="${(gy + 4).toFixed(1)}" text-anchor="end" font-size="9.5" fill="var(--muted)">${esc(format(value))}</text>`;
    }
    const totalBar = (item, ix, color) => {
      const value = Number(item.value || 0), top = y(value), base = y(0);
      const meta = { tip: item.tip || `${item.label}: ${format(value)}`, detail: item.detail };
      bars += `<rect${hitAttrs(meta, meta.tip)} x="${(x(ix) - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(2, base - top).toFixed(1)}" rx="4" fill="${color}"/><text x="${x(ix).toFixed(1)}" y="${Math.max(12, top - 7).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="750" fill="var(--ink)">${esc(format(value))}</text>`;
      bars += wrappedLabel(item.label, x(ix), H - pb + 18, Math.max(8, Math.floor(gw / 6)));
    };
    totalBar(start, 0, 'var(--planned)');
    running = Number(start.value || 0);
    steps.forEach((step, si) => {
      const ix = si + 1, delta = Number(step.value || 0), next = running + delta;
      const y0 = y(running), y1 = y(next), top = Math.min(y0, y1), height = Math.max(2, Math.abs(y1 - y0));
      const color = step.color || (delta > 0 ? 'var(--under)' : delta < 0 ? 'var(--over)' : 'var(--muted)');
      const meta = { tip: step.tip || `${step.label}: ${delta > 0 ? '+' : ''}${format(delta)}`, detail: step.detail };
      connectors += `<line x1="${(x(ix - 1) + bw / 2).toFixed(1)}" y1="${y0.toFixed(1)}" x2="${(x(ix) - bw / 2).toFixed(1)}" y2="${y0.toFixed(1)}" stroke="var(--faint)" stroke-width="1" stroke-dasharray="3 3"/>`;
      bars += `<rect${hitAttrs(meta, meta.tip)} x="${(x(ix) - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${height.toFixed(1)}" rx="3" fill="${color}"/><text x="${x(ix).toFixed(1)}" y="${Math.max(12, top - 7).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="750" fill="${color}">${delta > 0 ? '+' : ''}${esc(format(delta))}</text>`;
      bars += wrappedLabel(step.label, x(ix), H - pb + 18, Math.max(8, Math.floor(gw / 6)));
      running = next;
    });
    connectors += `<line x1="${(x(n - 2) + bw / 2).toFixed(1)}" y1="${y(running).toFixed(1)}" x2="${(x(n - 1) - bw / 2).toFixed(1)}" y2="${y(running).toFixed(1)}" stroke="var(--faint)" stroke-width="1" stroke-dasharray="3 3"/>`;
    totalBar(end, n - 1, 'var(--brand)');
    return `<svg class="svgc waterfall" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Budget to forecast waterfall">${grid}${connectors}${bars}</svg>`;
  }

  /* -- sparkline for KPI tiles ----------------------------------------------*/
  function spark(data, color) {
    const W = 96, H = 40, max = Math.max(...data) || 1, min = Math.min(...data);
    const x = (i) => data.length === 1 ? W / 2 : W * i / (data.length - 1);
    const y = (v) => H - 4 - (H - 8) * (v - min) / (max - min || 1);
    const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><path d="${line} L${W} ${H} L0 ${H} Z" fill="${color}" opacity=".12"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2"/></svg>`;
  }

  // Portfolio a11y fix (R-3 S-3): a chart whose marks are focusable is a group of controls, not a single image.
  const groupIfInteractive = (fn) => (...args) => {
    const html = fn(...args);
    if (typeof html !== 'string' || !html.startsWith('<svg')) return html;
    const open = html.indexOf('>');
    return /tabindex="0"/.test(html.slice(open)) ? html.slice(0, open).replace(' role="img"', ' role="group"') + html.slice(open) : html;
  };
  const charts = { gauge, donut, costBar, sCurve, groupedBar, hbars, gantt, milestoneHorizon, milestoneHorizonMobile, milestoneTimeline: milestoneHorizon, milestoneWaterfall, waterfall, spark };
  w.Charts = Object.fromEntries(Object.entries(charts).map(([name, fn]) => [name, groupIfInteractive(fn)]));
})(window);

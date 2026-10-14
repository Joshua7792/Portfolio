/* ============================================================================
   app.js — shell, router, helpers, theme, Boss-Brief tour.
   Data lives in window.RPT (see data.js). Pages live in window.Pages.
   ========================================================================== */
(function () {
  const D = window.RPT;

  /* ---- formatters ---------------------------------------------------------*/
  const money = (v) => {
    if (v == null) return '—';
    const a = Math.abs(v);
    if (a >= 1e9) return '$' + (v / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
    if (a >= 1e6) return '$' + (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
    return '$' + Math.round(v);
  };
  const usd = (v) => v == null ? '—' : '$' + Math.round(v).toLocaleString('en-US');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fdate = (iso) => { if (!iso) return '—'; const d = new Date(iso + 'T00:00:00'); return `${String(d.getDate()).padStart(2, '0')}-${MON[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`; };
  const flong = (iso) => { if (!iso) return '—'; const d = new Date(iso + 'T00:00:00'); const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; return `${days[d.getDay()]}, ${MON[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`; };
  const fmonth = (ym) => { if (!ym) return '—'; const [y, m] = ym.split('-'); return MON[+m - 1] + " '" + y.slice(2); };
  const pct = (v) => (v == null ? '—' : v.toFixed(1) + '%');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  window.F = { money, usd, fdate, flong, fmonth, pct, esc, MON };

  /* ---- schedule source-coverage helper -------------------------------------
     Excel exports can drop columns (e.g. today's 6-column P6 outline export).
     The front end must degrade honestly from what THIS export actually carries
     — never guess, never render a bare "0" for a field the source doesn't
     report. Always test the SPECIFIC field with Cov.has(), never export_shape,
     so a future export that restores only some columns lights those cards back
     up automatically, with no further code change. ------------------------- */
  const COV = (D.schedule && D.schedule.coverage) || {};
  const Cov = {
    has: (f) => !(COV.fields_unavailable || []).includes(f),
    why: 'Not in the current P6 export (' + (COV.schedule_export || 'unknown export') + ')',
  };
  window.COV = COV; window.Cov = Cov;

  /* ---- source-coverage notice: the deliverable the boss reads -------------
     One clearly-visible panel on Schedule (coverageNoticePanel) + a one-line
     version on Overview (coverageNoticeBanner). Both render '' (nothing) the
     moment fields_unavailable is empty, so a full P6 export shows neither. */
  const COV_FIELD_GROUPS = [
    { label: 'criticality (P6 critical-path flag)', fields: ['critical', 'longest_path'] },
    { label: 'total &amp; remaining float', fields: ['total_float', 'remaining_float'] },
    { label: 'baseline dates &amp; duration', fields: ['bl_start', 'bl_finish', 'bl_duration', 'bl_var'] },
    { label: 'schedule variance (finish &amp; duration)', fields: ['finish_var_raw', 'finish_var_workdays', 'finish_var_calendar_days', 'duration_var_raw'] },
    { label: 'actual duration', fields: ['actual_duration'] },
    { label: 'predecessor / successor logic', fields: ['predecessors', 'successors'] },
    { label: 'P6 comments', fields: ['source_comment'] },
    { label: 'WBS code', fields: ['wbs_code'] },
  ];
  // Groups the raw field list into PM-language phrases; any field this dashboard
  // doesn't yet have a phrase for still surfaces (humanized, never dropped).
  function unavailableHumanList() {
    const missing = COV.fields_unavailable || [];
    const grouped = COV_FIELD_GROUPS.filter(g => g.fields.some(f => missing.includes(f)));
    const covered = new Set(grouped.flatMap(g => g.fields));
    const extra = missing.filter(f => !covered.has(f)).map(f => esc(f.replace(/_/g, ' ')));
    return grouped.map(g => g.label).concat(extra);
  }
  function coverageNoticePanel() {
    if (!(COV.fields_unavailable || []).length) return '';
    const human = unavailableHumanList();
    const restore = (COV.restore_columns || []).map(esc).join(', ');
    const nCols = (COV.columns_present || []).length;
    const nGone = (COV.fields_unavailable || []).length;
    // Collapsed by default: no Schedule card depends on the missing fields any more,
    // so the full explanation is one keystroke away instead of a wall of text.
    // <summary> is natively focusable/togglable by keyboard; colours come from theme
    // tokens so the line reads correctly in both light and dark.
    return `<div class="card" style="margin-bottom:16px" role="note" aria-label="Schedule export coverage notice">
      <details class="cov-note">
        <summary style="cursor:pointer;font-size:13.5px;color:var(--muted);outline-offset:3px"><b style="color:var(--ink)">Reduced P6 export</b> · ${nCols} columns exported · ${nGone} fields not reported</summary>
        <div class="note amber" style="margin-top:12px">
          <p style="margin:0 0 8px"><b>${esc(COV.schedule_export || 'The current schedule export')}</b> carries only ${esc((COV.columns_present || []).join(', '))}. As a result this dashboard cannot show ${human.map(h => `<b>${h}</b>`).join(', ')} — reported as <b>unavailable</b>, never as zero.</p>
          <p style="margin:0 0 8px">${esc(COV.completion_basis || '')}</p>
          <p style="margin:0">Fix: re-export the P6 schedule including ${restore ? `<code>${restore}</code>` : 'the missing P6 columns'} — the dashboard restores every affected view automatically, no code change needed.</p>
        </div>
      </details>
    </div>`;
  }
  function coverageNoticeBanner() {
    if (!(COV.fields_unavailable || []).length) return '';
    const human = unavailableHumanList();
    return `<div class="note amber" style="margin-bottom:16px"><b>${(COV.columns_present || []).length}-column P6 export</b> — ${human.join(', ')} ${human.length > 1 ? 'are' : 'is'} not reported in this snapshot (not zero). <a href="#/schedule">Details on Schedule →</a></div>`;
  }
  window.F.coverageNoticePanel = coverageNoticePanel;
  window.F.coverageNoticeBanner = coverageNoticeBanner;

  /* ---- nav icons (inline, 18px) ------------------------------------------*/
  const ic = {
    overview: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10',
    insights: 'M4 19V9m5 10V5m5 14v-7m5 7V2M2 22h20',
    budget: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    schedule: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
    progress: 'M3 3v18h18M7 15l4-4 3 3 5-6',
    changes: 'M4 4h16v4H4zM4 12h10v4H4zM4 20h16',
    certs: 'M12 2l8 3v6c0 5-3.5 8-8 11-4.5-3-8-6-8-11V5zM9 12l2 2 4-4',
    actions: 'M12 2a7 7 0 00-7 7c0 5-3 7-3 7h20s-3-2-3-7a7 7 0 00-7-7zM10 21a2 2 0 004 0',
    contractors: 'M3 21h18M6 21V7l6-4 6 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01',
    workers: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87',
    induction: 'M9 2h6a1 1 0 011 1v2H8V3a1 1 0 011-1zM8 5H6a2 2 0 00-2 2v13a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2',
    bidders: 'M3 7h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2',
    critical: 'M4 22V4M4 4h13l-2 4 2 4H4',
    packages: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8',
    owners: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z',
    hours: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
    jha: 'M12 3l10 18H2L12 3zM12 9v5M12 18h.01',
    sor: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 9a3 3 0 100 6 3 3 0 000-6z',
    quality: 'M12 15a6 6 0 100-12 6 6 0 000 12zM9.5 8.8l1.7 1.7 3.3-3.3M8.2 13.8L7 22l5-3 5 3-1.2-8.2',
    signature: 'M3 17c3.5 0 4-11 7-11s2.5 9 5 9c1.5 0 2-1.5 3-1.5M3 21h18',
  };
  const icon = (k) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${ic[k]}"/></svg>`;
  window.F.icon = icon;

  /* ---- navigation registry -----------------------------------------------*/
  const NAV = [
    { grp: 'Overview' },
    { id: 'overview', label: 'Command Center', icon: 'overview' },
    { id: 'insights', label: 'Insights', icon: 'insights' },
    { grp: 'Finance' },
    { id: 'budget', label: 'Budget & Cost', icon: 'budget' },
    { id: 'changes', label: 'Change Notices', icon: 'changes' },
    { grp: 'Schedule' },
    { id: 'schedule', label: 'Schedule', icon: 'schedule' },
    { id: 'progress', label: 'Progress', icon: 'progress' },
    // ---- Safety Observation Reports (Assets/SOR; window.SORDATA) ------------
    { grp: 'REPORTS', parent: 'HSE' },
    { id: 'sor', label: 'SOR', icon: 'sor' },
    // ---- Quality (Assets/Quality; window.QUALITY) — two logs, one workbook:
    //      who ATTENDED a training, and who SIGNED to be eligible for it. -----
    { grp: 'QUALITY' },
    { id: 'quality-training', label: 'Quality Training Log', icon: 'quality' },
    { id: 'quality-signature', label: 'Quality Signature Log', icon: 'signature' },
  ];

  function renderShell() {
    const link = (n) => `<a href="#/${n.id}" data-id="${n.id}">${icon(n.icon)}<span>${n.label}</span></a>`;
    // Every nav group is a collapsible <details>; the accordion logic (single-open,
    // active-route auto-expand) is wired up after the shell is in the DOM — see route().
    // Red-team F4/F7: build an ordered TREE off `parent` NAME, not off adjacency in NAV —
    // the prior version folded only a *consecutive run* of same-parent groups, so a 7th
    // HSE sub-section appended anywhere else in NAV rendered a second, duplicate top-level
    // "HSE" section instead of joining the first. Bucketing by name (first appearance wins
    // the wrapper's position) makes "adding a sub-section is one word" true unconditionally
    // — insert the new `{grp:'X',parent:'HSE'}` anywhere in NAV and it always joins HSE.
    // This also removes the old `groupItems`/`i` mutable-cursor closure (F7) entirely.
    const topLevel = [];
    const parents = new Map(); // parent name -> its wrapper block, reused on every re-appearance
    let current = null; // the items[] currently collecting links (a section's or sub-section's)
    for (const n of NAV) {
      if (n.grp) {
        if (n.parent) {
          let p = parents.get(n.parent);
          if (!p) { p = { parent: n.parent, subs: [] }; parents.set(n.parent, p); topLevel.push(p); }
          const sub = { name: n.grp, items: [] };
          p.subs.push(sub);
          current = sub.items;
        } else {
          const sec = { name: n.grp, items: [] };
          topLevel.push(sec);
          current = sec.items;
        }
      } else if (current) {
        current.push(n);
      } else {
        topLevel.push({ standalone: n }); // defensive: a bare link before any grp marker
      }
    }
    const nav = topLevel.map(b => {
      if (b.standalone) return link(b.standalone);
      if (b.parent) {
        const subs = b.subs.map(s => `<details class="nav-sec nav-sub"><summary class="nav-group nav-group-col">${s.name}</summary>${s.items.map(link).join('')}</details>`).join('');
        return `<details class="nav-sec nav-sec-parent"><summary class="nav-group nav-group-col">${b.parent}</summary>${subs}</details>`;
      }
      return `<details class="nav-sec"><summary class="nav-group nav-group-col">${b.name}</summary>${b.items.map(link).join('')}</details>`;
    }).join('');
    document.getElementById('app').innerHTML = `
      <aside class="sidebar" id="sidebar">
        <div class="brand"><div class="mark">D</div><div><b>Demo Project</b><span>Control Tower</span></div></div>
        <nav class="nav">${nav}</nav>
        <div class="spacer"></div>
        <div class="foot">Program ${esc(D.meta.program)}<br>CM: ${esc(D.meta.cm)} · Client: Demo Client<br>Updated ${fdate(D.meta.last_updated)}</div>
      </aside>
      <div class="scrim" id="scrim"></div>
      <div class="main">
        <header class="topbar" aria-label="Demo toolbar">
          <button class="iconbtn menu-btn" id="menu" aria-label="Menu"><svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          <div class="chrome">
            <span class="client" title="Demo Client">Demo Client</span><span class="divider"></span>
            <span class="proj">Demo Project<small>Construction Management Dashboard</small></span>
          </div>
          <div class="spacer"></div>
          <div class="datebadge"><small>Last updated</small><b>${flong(D.meta.last_updated)}</b></div>
          <span class="cmco" title="CM Team">CM Team</span>
          <button class="iconbtn" id="tourbtn" title="60-second Boss Brief" aria-label="Guided tour">
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg></button>
          <button class="iconbtn" id="theme" title="Toggle theme" aria-label="Toggle light/dark">
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg></button>
        </header>
        <main id="view" tabindex="-1" aria-label="Demo view"></main>
      </div>
      <div class="tour-bd" id="tourbd"></div>`;

    document.getElementById('menu').onclick = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('scrim').classList.toggle('on'); };
    document.getElementById('scrim').onclick = () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('scrim').classList.remove('on'); };
    document.getElementById('theme').onclick = toggleTheme;
    document.getElementById('tourbtn').onclick = () => tour(0);
    wireNavAccordion();
  }

  /* ---- nav accordion: single-open among SAME-LEVEL siblings only --------------
     Nesting means "one open in the whole nav" would close a section's own parent
     the moment a sub-section opens. Instead each <details> closes only the other
     <details class="nav-sec"> that share its parentElement (its own level). ---- */
  let _navSyncing = false; // guards against re-entrant 'toggle' events while we sync siblings
  function wireNavAccordion() {
    // 'toggle' does not bubble, so each <details> needs its own listener.
    document.querySelectorAll('.nav details.nav-sec').forEach(sec => {
      sec.addEventListener('toggle', () => {
        if (_navSyncing || !sec.open) return;
        _navSyncing = true;
        try {
          const scope = sec.parentElement;
          [...scope.children].forEach(s => { if (s !== sec && s.matches && s.matches('details.nav-sec')) s.open = false; });
        } finally {
          _navSyncing = false; // belt-and-braces: 'toggle' fires as a queued task so the flag is
          // always false again before any handler runs (verified — red-team F3); this only
          // matters if that ever changes, so a throw in the body must not latch the guard true.
        }
      });
    });
  }
  // Opens every ancestor <details class="nav-sec"> of the active route link (the
  // whole chain, e.g. HSE -> HOURS), closes everything else at every level.
  function openActiveNavSection() {
    const active = document.querySelector('.nav a.active');
    if (!active) return;
    _navSyncing = true; // suppress wireNavAccordion's own handler while we bulk-sync
    try {
      const chain = new Set();
      let el = active.closest('details.nav-sec');
      while (el) { chain.add(el); el = el.parentElement.closest('details.nav-sec'); }
      document.querySelectorAll('.nav details.nav-sec').forEach(s => { s.open = chain.has(s); });
    } finally {
      _navSyncing = false; // belt-and-braces — see wireNavAccordion's comment above
    }
  }

  /* ---- theme --------------------------------------------------------------*/
  function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('demo-theme', t); } catch (e) { } }
  function toggleTheme() { applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }

  /* ---- router -------------------------------------------------------------*/
  function route() {
    const id = (location.hash.replace(/^#\/?/, '') || 'overview').split('/')[0];
    const page = window.Pages[id] ? id : 'overview';
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.id === page));
    openActiveNavSection();
    const view = document.getElementById('view');
    view.innerHTML = '<div class="page">' + window.Pages[page]() + '</div>';
    view.focus();
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('scrim').classList.remove('on');
    window.scrollTo(0, 0);
    if (window.Pages['_after_' + page]) window.Pages['_after_' + page]();
  }

  /* ---- Boss-Brief guided tour --------------------------------------------*/
  const activeChanges = (D.budget.changes || []).filter(c => ['In Progress', 'On Hold', 'Submitted'].includes((c.status || '').trim()));
  const activeValue = activeChanges.reduce((sum, c) => sum + (c.amount == null ? 0 : Number(c.amount)), 0);
  const unknownChanges = activeChanges.filter(c => c.amount == null).length;
  // Boss-Brief figures are templated from window.RPT — never baked-in literals.
  const _g = (D.budget && D.budget.grand_total) || {};
  const _sc = (D.schedule && D.schedule.status_counts) || {};
  const _segCount = (D.meta.segments || []).length;
  const _gap = (_g.forecast != null && _g.budget != null) ? _g.forecast - _g.budget : null;
  const _schedAsOf = D.meta.schedule_as_of || D.meta.data_date;
  const TOUR = [
    { h: 'Welcome — the 60-second read', p: `This is the Demo Project: a synthetic capital build under construction management. Everything you see is pulled straight from the cost report and the P6 schedule (data as of ${fdate(_schedAsOf)}) — nothing is invented.`, go: 'overview' },
    { h: 'The money in one screen', p: `Total program forecast is ${money(_g.forecast)} against a ${money(_g.budget)} current budget — a ${money(_gap)} gap; the cost report's own variance notes explain the drivers. The CM slice is ${money(D.meta.cm_forecast)} of that.`, go: 'budget' },
    { h: 'Two dials, three colors', p: 'The left dial is the whole program; the right dial is just the CM services. On every cost bar: solid green = earned/invoiced work in place, amber = committed, grey = still planned. The tick mark is the budget line.', go: 'budget' },
    { h: 'Where the schedule stands', p: `${(_sc.total || 0).toLocaleString()} activities across ${_segCount} program segments. Filter every panel by segment, ${Cov.has('critical') ? `review the ${(_sc.critical || 0).toLocaleString()} P6-critical activities` : 'note that this P6 export carries no Critical column so critical-path exposure is unavailable — not zero'}, and use the exception-first look-ahead like the P6 report your team already knows.`, go: 'schedule' },
    { h: 'Change is the risk', p: `${money(activeValue)} is active across ${activeChanges.length} in-progress, submitted, or on-hold notices. ${unknownChanges} active notices have no entered value, so the dashboard keeps count and dollars separate.`, go: 'changes' },
    { h: 'The decision layer', p: 'Insights explains float pressure, unassigned contractor exposure, cost concentration, CM scope and source freshness. Every row opens its Excel-backed record.', go: 'insights' },
  ];
  function tour(i) {
    const bd = document.getElementById('tourbd');
    if (i < 0 || i >= TOUR.length) { bd.classList.remove('on'); return; }
    const t = TOUR[i]; if (t.go) location.hash = '#/' + t.go;
    bd.classList.add('on');
    bd.innerHTML = `<div class="tour" role="dialog" aria-modal="true" aria-label="Boss Brief">
      <div class="step-ix">BOSS BRIEF · ${i + 1} / ${TOUR.length}</div>
      <h3>${t.h}</h3><p>${t.p}</p>
      <div class="bar"><i style="width:${100 * (i + 1) / TOUR.length}%"></i></div>
      <div class="acts">
        <button class="btn" data-a="skip">Skip</button>
        <div style="display:flex;gap:8px">
          ${i > 0 ? '<button class="btn" data-a="prev">Back</button>' : ''}
          <button class="btn pri" data-a="next">${i === TOUR.length - 1 ? 'Done' : 'Next'}</button>
        </div></div></div>`;
    bd.querySelector('[data-a=skip]').onclick = () => tour(-1);
    bd.querySelector('[data-a=next]').onclick = () => tour(i + 1);
    const prev = bd.querySelector('[data-a=prev]'); if (prev) prev.onclick = () => tour(i - 1);
    bd.onclick = (e) => { if (e.target === bd) tour(-1); };
  }
  window.startTour = tour;

  /* ---- boot ---------------------------------------------------------------*/
  let saved = 'light'; try { saved = localStorage.getItem('demo-theme') || 'light'; } catch (e) { }
  applyTheme(saved);
  renderShell();
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') tour(-1); });
  // Route only after every script (incl. pages.js, loaded after this file) has executed.
  if (document.readyState === 'complete') route();
  else window.addEventListener('load', route);
  // Boss Brief is intentionally user-invoked; local startup stays quiet.
})();

/* ============================================================================
   quality-training.js — QUALITY ▸ Quality Training Log.  Route: quality-training.

   WHO ATTENDED. Data: window.QUALITY.training (baked by etl/extract_quality.py
   into quality-data.js), independent of window.RPT, window.WORKFORCE and
   window.SORDATA — never merge the four.

   Everything this page shares with the Signature Log page lives in
   window.QL (quality-common.js): head/guard, distribution bars, the session
   chart, flag badges, record modals, and the issue / coverage / how-to /
   deliverables panels. Only what is specific to ATTENDANCE lives here.
   ========================================================================== */
(function () {
  const Pages = window.Pages = window.Pages || {};
  const U = window.WFUI;
  const Q = window.QL;
  const D = Q.D;
  const { esc, fdate, plural, emptyRow } = Q;

  const BLURB = 'Who attended each quality training — Demo Project.';

  /* ---- table rows ---------------------------------------------------------*/
  function rosterRow(r) {
    return `<tr class="hit" ${Q.recordModal(r, 'Training attendance record')}>
      <td class="mono">${r.date ? esc(fdate(r.date)) : esc(r.date_raw || '—')}</td>
      <td><span class="ql-cell">${U.missing(r.training)}</span></td>
      <td class="strong"><span class="ql-cell">${U.missing(r.first_name)}</span></td>
      <td><span class="ql-cell">${U.missing(r.last_name)}</span></td>
      <td class="muted"><span class="ql-cell">${U.missing(r.company)}</span></td>
      <td>${Q.flagBadges(r.flags)}</td>
    </tr>`;
  }

  /* ---- worksheet modal ----------------------------------------------------*/
  function sheetModal(t) {
    const range = t.first_date
      ? (t.first_date === t.last_date ? fdate(t.first_date)
        : `${fdate(t.first_date)} → ${fdate(t.last_date)}`)
      : '—';
    const list = (a) => (a && a.length) ? esc(a.join(', ')) : '<span class="muted">—</span>';
    return U.wfm(t.training || t.sheet, [
      ['Training', U.missing(t.training)],
      ['Where the name comes from', U.missing(t.training_source)],
      ['Trainings named in this sheet', list(t.training_names)],
      ['Worksheet', esc(t.sheet)],
      ['Header row', String(t.header_row)],
      ['Attendance records', U.num(t.records)],
      ['Distinct names', U.num(t.people)],
      ['Companies', U.num(t.companies)],
      ['Sessions (distinct dates)', U.num(t.sessions)],
      ['Date range', esc(range)],
      ['Columns in this sheet', list(t.columns_present)],
      ['Extra columns carried through', list(t.extra_columns)],
      ['Expected columns not in this sheet', (t.fields_missing_header || []).length
        ? esc((t.fields_missing_header || []).map(k =>
          ((D.coverage || {}).field_labels || {})[k] || k).join(', '))
        : '<span class="muted">none — the sheet is complete</span>'],
      ['Rows with no name and no date', U.num(t.rows_without_identity)],
    ], 'Training worksheet');
  }

  /* ---- module-local: where the roster's modal records start, so a filter
     re-render reuses those slots instead of growing __WFM forever (the
     worksheet-table records sit BELOW this index and stay valid). ----------*/
  let rosterBase = 0;

  /* =========================== the page ==================================*/
  Pages['quality-training'] = function () {
    if (!D) return Q.head('Quality Training Log', BLURB, []) + Q.guard();
    U.wfmReset();

    const sec = D.training || {};
    const k = sec.kpis || {};
    const rows = sec.rows || [];
    const sheets = sec.sheets || [];
    const headHtml = Q.head('Quality Training Log', BLURB, sheets);
    if (!sheets.length) {
      return headHtml + Q.noLog('training log',
        'No worksheet in it carries attendance rows. Add a tab with '
        + '<code>First Name</code>, <code>Last Name</code>, <code>Date</code> and '
        + '<code>Company</code> headers, then re-run <code>Start Dashboard.bat</code>.')
        + Q.coverageNotice() + Q.howToPanel();
    }

    const companies = sec.by_company || [];
    const sessions = sec.by_session || [];
    const namedCompanies = companies.filter(c => !c.blank);
    const trainingNames = (sec.by_training || []).filter(t => !t.blank);
    const range = sec.first_session
      ? (sec.first_session === sec.as_of ? fdate(sec.as_of)
        : `${fdate(sec.first_session)} → ${fdate(sec.as_of)}`)
      : 'no dated sessions';

    const kpis = U.kpiStrip([
      {
        label: 'Trainings', value: U.num(k.trainings),
        sub: trainingNames.length === 1 ? trainingNames[0].label
          : `across ${U.num(k.sheets)} ${plural(k.sheets, 'worksheet')}`
      },
      { label: 'Attendance records', value: U.num(k.records), sub: range },
      {
        label: 'People trained', value: U.num(k.people),
        sub: k.records === k.people ? 'every record a different name'
          : `${U.num(k.records - k.people)} repeat ${plural(k.records - k.people, 'entry', 'entries')}`
      },
      {
        label: 'Companies', value: U.num(k.companies),
        sub: namedCompanies.length ? namedCompanies[0].label + (namedCompanies.length > 1
          ? ` + ${namedCompanies.length - 1} more` : '') : '—'
      },
      { label: 'Sessions', value: U.num(k.sessions), sub: 'distinct training dates' },
      {
        // A date is longer than a count: at 26px "14-Aug-26" wraps mid-token in a
        // narrow tile. Step it down rather than letting the tile break the date.
        label: 'Latest session',
        value: k.latest_session
          ? `<span style="font-size:20px">${esc(fdate(k.latest_session))}</span>` : '—',
        sub: `${U.num(k.latest_session_attendees)} ${plural(k.latest_session_attendees, 'attendee')}`
      },
      {
        label: 'Needs attention', value: U.num(k.flagged),
        sub: k.flagged ? `${(sec.issues || []).length} ${plural((sec.issues || []).length, 'issue')} to fix`
          : 'workbook is complete',
        tone: k.flagged ? 'is-risk' : 'is-positive'
      },
    ]);

    /* ---- signature cross-check ------------------------------------------
       The eligibility question belongs to the Signature Log page; this is the
       one-line answer plus the way through to it. ------------------------*/
    const rec = D.reconciliation || {};
    const gap = (rec.trained_no_signature || []).length;
    const sigCard = (D.signature && (D.signature.sheets || []).length)
      ? `<div class="ql-crosslink ${gap ? 'is-gap' : 'is-ok'}">
          <div><b>${gap ? U.num(gap) + ' ' + plural(gap, 'attendee') + ' with no signature on file'
        : 'Every attendee has a signature on file'}</b>
            <span class="muted">— ${U.num(rec.matched)} of ${U.num(rec.trained_named)}
            ${plural(rec.trained_named, 'name')} in this log also appear in
            <b>${esc((D.signature.sheets[0] || {}).sheet || 'the signature log')}</b>.</span></div>
          <a class="chip" href="#/quality-signature">Signature log →</a></div>`
      : '';

    /* ---- worksheet coverage table ---------------------------------------*/
    const sheetRows = sheets.map(t => {
      const r = t.first_date
        ? (t.first_date === t.last_date ? fdate(t.first_date)
          : `${fdate(t.first_date)} → ${fdate(t.last_date)}`)
        : '<span class="muted">—</span>';
      return `<tr class="hit" ${sheetModal(t)}>
        <td class="strong">${U.missing(t.training)}</td>
        <td class="muted mono">${esc(t.sheet)}</td>
        <td class="num">${U.num(t.records)}</td>
        <td class="num">${U.num(t.people)}</td>
        <td class="num">${U.num(t.companies)}</td>
        <td class="num">${U.num(t.sessions)}</td>
        <td class="mono">${r}</td></tr>`;
    }).join('');
    const srcNote = sheets.length === 1 && sheets[0].training_source
      ? `The training's name is read from the <b>${esc(sheets[0].training_source)}</b>.` : '';
    const sheetCard = `<div class="card">
      <div class="card-head"><h3>Trainings</h3>
        <span class="muted" style="font-size:12px">one worksheet per training</span></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Training</th><th>Worksheet</th><th class="num">Records</th>
          <th class="num">People</th><th class="num">Companies</th><th class="num">Sessions</th>
          <th>Dates</th></tr></thead>
        <tbody>${sheetRows || emptyRow(7, 'No training sheets found.')}</tbody></table></div>
      <p class="muted" style="margin:10px 0 0;font-size:11.5px">Each row is one worksheet in
        <b>${esc((D.source || {}).file || 'the workbook')}</b>. ${srcNote}
        <b>People</b> counts distinct names, <b>Records</b> counts rows — they differ when the
        same person attends more than once.</p>
      <span class="interaction-hint" aria-hidden="true">Select a row for the sheet's full column map</span></div>`;

    /* ---- distributions --------------------------------------------------*/
    const companyCard = `<div class="card">
      <div class="card-head"><h3>Attendance by company</h3>
        <span class="muted" style="font-size:12px">${U.num(k.records)} ${plural(k.records, 'record')}</span></div>
      ${Q.distBars(companies, 'var(--brand)')}
      ${namedCompanies.length === 1 ? `<p class="ql-single">Every dated record so far comes from a
        single company (<b>${esc(namedCompanies[0].label)}</b>), so this is a one-bar view rather
        than a comparison. It becomes a real distribution as soon as a second contractor attends —
        no code change needed.</p>` : ''}</div>`;

    const sessionCard = `<div class="card">
      <div class="card-head"><h3>Attendance by session</h3>
        <span class="muted" style="font-size:12px">${U.num(k.sessions)} ${plural(k.sessions, 'date')}</span></div>
      ${Q.sessionColumns(sessions, 'attendee')}
      ${sessions.length === 1 ? `<p class="ql-single">The workbook records one training date so
        far (<b>${esc(fdate(sessions[0].date))}</b>). Each further session adds a column here.</p>` : ''}
      ${sec.undated ? `<p class="ql-single"><b>${U.num(sec.undated)}</b>
        ${plural(sec.undated, 'record')} carry a date this dashboard could not read, so
        ${plural(sec.undated, 'it is', 'they are')} absent from these columns (they total
        ${U.num(k.records - sec.undated)}, not ${U.num(k.records)}). The original text is on each
        record.</p>` : ''}</div>`;

    /* ---- roster ---------------------------------------------------------*/
    rosterBase = window.__WFM.length;
    const opt = (list, all) => `<option value="">${esc(all)}</option>`
      + list.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');

    const roster = `<div class="card" style="margin-top:16px">
      <div class="card-head"><h3>Attendance roster</h3>
        <span class="muted" style="font-size:12px">every row is one line in
          ${esc((D.source || {}).file || 'the workbook')}</span></div>
      <div class="wf-filters">
        <input id="ql-q" type="search" placeholder="Search name or company…" aria-label="Search attendance" style="min-width:230px">
        <select id="ql-training" aria-label="Filter by training">${opt(trainingNames.map(t => t.label), 'All trainings')}</select>
        <select id="ql-company" aria-label="Filter by company">${opt(namedCompanies.map(c => c.label), 'All companies')}</select>
        <select id="ql-session" aria-label="Filter by session date">
          <option value="">All sessions</option>
          ${sessions.map(s => `<option value="${esc(s.date)}">${esc(fdate(s.date))}</option>`).join('')}</select>
        <select id="ql-flag" aria-label="Filter by data quality">
          <option value="">All records</option>
          <option value="flagged">Needs attention</option>
          <option value="clean">Complete records</option></select>
        <span id="ql-count" class="muted" style="margin-left:auto;font-size:12.5px">${rows.length} ${plural(rows.length, 'result')}</span>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Date</th><th>Training</th><th>First name</th><th>Last name</th>
          <th>Company</th><th>Needs attention</th></tr></thead>
        <tbody id="ql-tbody">${rows.length ? rows.map(rosterRow).join('') : emptyRow(6, 'No attendance records.')}</tbody>
      </table></div>
      <p class="muted" style="margin:10px 0 0;font-size:11.5px">Names appear exactly as they were
        typed in the workbook — this dashboard does not split, merge, re-spell or de-duplicate
        them.</p>
      <span class="interaction-hint" aria-hidden="true">Select a row for the full workbook record</span></div>`;

    return headHtml + kpis + sigCard
      + `<div style="margin:16px 0">${sheetCard}</div>`
      + `<div class="grid cols-2" style="margin:16px 0;align-items:start">${companyCard}${sessionCard}</div>`
      + roster + Q.issuesNotice(sec) + Q.coverageNotice() + Q.howToPanel() + Q.deliverablesPanel();
  };

  /* ---- post-render: search + four filters over the roster -----------------*/
  Pages['_after_quality-training'] = function () {
    if (!D) return;
    const rows = (D.training || {}).rows || [];
    const q = document.getElementById('ql-q');
    const tr = document.getElementById('ql-training');
    const co = document.getElementById('ql-company');
    const se = document.getElementById('ql-session');
    const fl = document.getElementById('ql-flag');
    const tbody = document.getElementById('ql-tbody');
    const count = document.getElementById('ql-count');
    if (!q || !tr || !co || !se || !fl || !tbody || !count) return;

    function apply() {
      const term = q.value.trim().toLowerCase();
      const tv = tr.value, cv = co.value, sv = se.value, fv = fl.value;
      const filtered = rows.filter(r => {
        if (tv && r.training !== tv) return false;
        if (cv && r.company !== cv) return false;
        if (sv && r.date !== sv) return false;
        if (fv === 'flagged' && !(r.flags || []).length) return false;
        if (fv === 'clean' && (r.flags || []).length) return false;
        if (term) {
          const hay = [r.first_name, r.last_name, r.full_name, r.company, r.training,
            r.date_raw].join(' ').toLowerCase();
          if (hay.indexOf(term) === -1) return false;
        }
        return true;
      });
      // Reuse the roster's modal slots so repeated filtering cannot grow __WFM
      // without bound; the worksheet records below rosterBase stay valid.
      window.__WFM.length = rosterBase;
      tbody.innerHTML = filtered.length ? filtered.map(rosterRow).join('')
        : emptyRow(6, 'No attendance records match these filters.');
      count.textContent = `${filtered.length} ${plural(filtered.length, 'result')}`;
    }
    q.addEventListener('input', apply);
    [tr, co, se, fl].forEach(el => el.addEventListener('change', apply));
  };
})();

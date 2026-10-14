/* ============================================================================
   quality-signature.js — QUALITY ▸ Quality Signature Log.  Route: quality-signature.

   WHO SIGNED to be eligible to take the quality training — the second log in
   Assets/Quality/Quality Training Log.xlsx. Data: window.QUALITY.signature,
   built by the same summarize() as the training section, so the two pages can
   never drift into two different definitions of a session or a person.

   Shared furniture (head, session chart, distribution bars, record modals,
   coverage / how-to / deliverables panels) comes from window.QL
   (quality-common.js). Only the signature-specific parts live here — chiefly
   the SIGNED vS TRAINED reconciliation, which is the question this page exists
   to answer.

   Invent nothing: the two logs are compared on the name a person was actually
   typed under. A spelling that differs between the sheets appears in BOTH gap
   lists and is named — never silently merged into a match.
   ========================================================================== */
(function () {
  const Pages = window.Pages = window.Pages || {};
  const U = window.WFUI;
  const Q = window.QL;
  const D = Q.D;
  const { esc, fdate, plural, emptyRow } = Q;

  const TITLE = 'Quality Signature Log';
  const BLURB = 'Who signed to be eligible for quality training — Demo Project.';

  /* ---- table rows ---------------------------------------------------------*/
  function rosterRow(r) {
    return `<tr class="hit" ${Q.recordModal(r, 'Signature record')}>
      <td class="mono">${r.date ? esc(fdate(r.date)) : esc(r.date_raw || '—')}</td>
      <td class="strong"><span class="ql-cell">${U.missing(r.first_name)}</span></td>
      <td><span class="ql-cell">${U.missing(r.last_name)}</span></td>
      <td class="muted"><span class="ql-cell">${U.missing(r.company)}</span></td>
      <td>${Q.flagBadges(r.flags)}</td>
    </tr>`;
  }

  function sheetModal(t) {
    const range = t.first_date
      ? (t.first_date === t.last_date ? fdate(t.first_date)
        : `${fdate(t.first_date)} → ${fdate(t.last_date)}`)
      : '—';
    const list = (a) => (a && a.length) ? esc(a.join(', ')) : '<span class="muted">—</span>';
    return U.wfm(t.sheet, [
      ['Worksheet', esc(t.sheet)],
      ['Read as', 'Signature log — its name matches a signature keyword'],
      ['Header row', String(t.header_row)],
      ['Signature records', U.num(t.records)],
      ['Distinct names', U.num(t.people)],
      ['Companies', U.num(t.companies)],
      ['Sessions (distinct dates)', U.num(t.sessions)],
      ['Date range', esc(range)],
      ['Columns in this sheet', list(t.columns_present)],
      ['Extra columns carried through', list(t.extra_columns)],
      ['Rows with no name and no date', U.num(t.rows_without_identity)],
    ], 'Signature worksheet');
  }

  /* ---- signed vs trained --------------------------------------------------
     The reason this page is worth opening. Two directions, and they do NOT
     mean the same thing:
       trained without a signature  = a compliance gap  -> --over (red)
       signed without attending yet = a pipeline state  -> --st-progress (amber)
     Zero of either is stated as zero, not hidden, because "no gaps" is the
     answer the boss came for. -------------------------------------------- */
  function gapList(items, emptyMsg) {
    if (!items || !items.length) {
      return `<p class="ql-gap-none">✓ ${esc(emptyMsg)}</p>`;
    }
    return `<div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Name</th><th>Company</th><th>Date</th><th>Where</th></tr></thead>
      <tbody>${items.map(p => `<tr>
        <td class="strong">${U.missing(p.full_name)}</td>
        <td class="muted">${U.missing(p.company)}</td>
        <td class="mono">${p.date ? esc(fdate(p.date)) : '<span class="muted">—</span>'}</td>
        <td class="muted mono">${esc(p.sheet)} · row ${p.excel_row}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  function reconCard(rec, hasTraining) {
    if (!hasTraining) {
      return `<div class="card" style="margin-top:16px">
        <div class="card-head"><h3>Signed vs trained</h3></div>
        <p class="muted" style="margin:6px 0 0;font-size:12.5px">There is no training log in this
          workbook to compare against, so no cross-check is possible. Add a training worksheet and
          this card fills in on the next rebuild.</p></div>`;
    }
    const noSig = rec.trained_no_signature || [];
    const noTrain = rec.signed_not_trained || [];
    const tiles = [
      ['Signed and trained', rec.matched, 'names in both logs', 'is-ok'],
      ['Trained, no signature', noSig.length, 'attended without a signature on file', noSig.length ? 'is-gap' : 'is-ok'],
      ['Signed, not yet trained', noTrain.length, 'signed but not in the training log', noTrain.length ? 'is-wait' : 'is-ok'],
    ].map(([lab, n, sub, tone]) => `<div class="ql-recon-tile ${tone}">
        <div class="ql-recon-n">${U.num(n)}</div>
        <div class="ql-recon-lab">${esc(lab)}</div>
        <div class="ql-recon-sub">${esc(sub)}</div></div>`).join('');

    return `<div class="card" style="margin-top:16px">
      <div class="card-head"><h3>Signed vs trained</h3>
        <span class="muted" style="font-size:12px">the two logs, cross-checked by name</span></div>
      <div class="ql-recon">${tiles}</div>
      <div class="grid cols-2" style="margin-top:14px;align-items:start">
        <div><h4 class="ql-gap-h">Trained without a signature on file</h4>
          ${gapList(noSig, 'None — everyone in the training log has signed.')}</div>
        <div><h4 class="ql-gap-h">Signed but not yet in the training log</h4>
          ${gapList(noTrain, 'None — everyone who signed has attended.')}</div>
      </div>
      <p class="muted" style="margin:12px 0 0;font-size:11.5px">${esc(rec.basis || '')}
        ${rec.unnamed_signature_rows || rec.unnamed_training_rows
        ? `<b>${U.num(rec.unnamed_signature_rows + rec.unnamed_training_rows)}</b> row(s) carry no
           name at all and cannot be matched in either direction; they are listed under
           <i>Needs attention</i>.` : ''}</p></div>`;
  }

  let rosterBase = 0;

  /* =========================== the page ==================================*/
  Pages['quality-signature'] = function () {
    if (!D) return Q.head(TITLE, BLURB, []) + Q.guard();
    U.wfmReset();

    const sec = D.signature || {};
    const sheets = sec.sheets || [];
    const headHtml = Q.head(TITLE, BLURB, sheets);
    if (!sheets.length) {
      return headHtml + Q.noLog('signature log',
        'A worksheet is read as a signature log when its <b>name</b> contains '
        + '<code>signature</code> (or <code>firma</code>). Rename the tab that holds the '
        + 'signatures, save, close Excel and re-run <code>Start Dashboard.bat</code>.')
        + Q.coverageNotice() + Q.howToPanel() + Q.deliverablesPanel();
    }

    const k = sec.kpis || {};
    const rows = sec.rows || [];
    const companies = sec.by_company || [];
    const sessions = sec.by_session || [];
    const namedCompanies = companies.filter(c => !c.blank);
    const rec = D.reconciliation || {};
    const hasTraining = ((D.training || {}).sheets || []).length > 0;
    const noSig = (rec.trained_no_signature || []).length;
    const range = sec.first_session
      ? (sec.first_session === sec.as_of ? fdate(sec.as_of)
        : `${fdate(sec.first_session)} → ${fdate(sec.as_of)}`)
      : 'no dated sessions';

    const kpis = U.kpiStrip([
      { label: 'Signatures on file', value: U.num(k.records), sub: range },
      {
        label: 'People signed', value: U.num(k.people),
        sub: k.records === k.people ? 'every record a different name'
          : `${U.num(k.records - k.people)} repeat ${plural(k.records - k.people, 'entry', 'entries')}`
      },
      {
        label: 'Companies', value: U.num(k.companies),
        sub: namedCompanies.length ? namedCompanies[0].label + (namedCompanies.length > 1
          ? ` + ${namedCompanies.length - 1} more` : '') : '—'
      },
      { label: 'Signing days', value: U.num(k.sessions), sub: 'distinct dates in the log' },
      {
        label: 'Latest',
        value: k.latest_session
          ? `<span style="font-size:20px">${esc(fdate(k.latest_session))}</span>` : '—',
        sub: `${U.num(k.latest_session_attendees)} ${plural(k.latest_session_attendees, 'signature')}`
      },
      hasTraining ? {
        label: 'Trained, no signature', value: U.num(noSig),
        sub: noSig ? 'named in the cross-check below' : 'every attendee has signed',
        tone: noSig ? 'is-risk' : 'is-positive'
      } : {
        label: 'Trained, no signature', value: '—',
        sub: 'no training log to compare against'
      },
      {
        label: 'Needs attention', value: U.num(k.flagged),
        sub: k.flagged ? `${(sec.issues || []).length} ${plural((sec.issues || []).length, 'issue')} to fix`
          : 'workbook is complete',
        tone: k.flagged ? 'is-risk' : 'is-positive'
      },
    ]);

    /* ---- worksheet coverage --------------------------------------------*/
    const sheetRows = sheets.map(t => {
      const r = t.first_date
        ? (t.first_date === t.last_date ? fdate(t.first_date)
          : `${fdate(t.first_date)} → ${fdate(t.last_date)}`)
        : '<span class="muted">—</span>';
      return `<tr class="hit" ${sheetModal(t)}>
        <td class="strong mono">${esc(t.sheet)}</td>
        <td class="num">${U.num(t.records)}</td>
        <td class="num">${U.num(t.people)}</td>
        <td class="num">${U.num(t.companies)}</td>
        <td class="num">${U.num(t.sessions)}</td>
        <td class="mono">${r}</td></tr>`;
    }).join('');
    const sheetCard = `<div class="card">
      <div class="card-head"><h3>Signature worksheets</h3>
        <span class="muted" style="font-size:12px">named as the workbook spells them</span></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Worksheet</th><th class="num">Records</th><th class="num">People</th>
          <th class="num">Companies</th><th class="num">Days</th><th>Dates</th></tr></thead>
        <tbody>${sheetRows || emptyRow(6, 'No signature sheets found.')}</tbody></table></div>
      <p class="muted" style="margin:10px 0 0;font-size:11.5px">The tab is spelled
        <b>${esc(sheets[0].sheet)}</b> in ${esc((D.source || {}).file || 'the workbook')} and is shown
        that way wherever it identifies a source cell. The page title is this dashboard's own
        wording, so it reads <b>Signature</b>.</p>
      <span class="interaction-hint" aria-hidden="true">Select a row for the sheet's full column map</span></div>`;

    /* ---- distributions --------------------------------------------------*/
    const companyCard = `<div class="card">
      <div class="card-head"><h3>Signatures by company</h3>
        <span class="muted" style="font-size:12px">${U.num(k.records)} ${plural(k.records, 'record')}</span></div>
      ${Q.distBars(companies, 'var(--brand)')}
      ${namedCompanies.length === 1 ? `<p class="ql-single">Every dated record so far comes from a
        single company (<b>${esc(namedCompanies[0].label)}</b>), so this is a one-bar view rather
        than a comparison. It becomes a real distribution as soon as a second contractor signs —
        no code change needed.</p>` : ''}</div>`;

    const sessionCard = `<div class="card">
      <div class="card-head"><h3>Signatures by day</h3>
        <span class="muted" style="font-size:12px">${U.num(k.sessions)} ${plural(k.sessions, 'date')}</span></div>
      ${Q.sessionColumns(sessions, 'signature')}
      ${sessions.length === 1 ? `<p class="ql-single">The workbook records one signing date so far
        (<b>${esc(fdate(sessions[0].date))}</b>). Each further day adds a column here.</p>` : ''}
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
      <div class="card-head"><h3>Signature roster</h3>
        <span class="muted" style="font-size:12px">every row is one line in
          ${esc((D.source || {}).file || 'the workbook')}</span></div>
      <div class="wf-filters">
        <input id="qs-q" type="search" placeholder="Search name or company…" aria-label="Search signatures" style="min-width:230px">
        <select id="qs-company" aria-label="Filter by company">${opt(namedCompanies.map(c => c.label), 'All companies')}</select>
        <select id="qs-session" aria-label="Filter by date">
          <option value="">All dates</option>
          ${sessions.map(s => `<option value="${esc(s.date)}">${esc(fdate(s.date))}</option>`).join('')}</select>
        <select id="qs-flag" aria-label="Filter by data quality">
          <option value="">All records</option>
          <option value="flagged">Needs attention</option>
          <option value="clean">Complete records</option></select>
        ${hasTraining ? `<select id="qs-match" aria-label="Filter by training cross-check">
          <option value="">Signed and trained: any</option>
          <option value="trained">In the training log</option>
          <option value="untrained">Not in the training log</option></select>` : ''}
        <span id="qs-count" class="muted" style="margin-left:auto;font-size:12.5px">${rows.length} ${plural(rows.length, 'result')}</span>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Date</th><th>First name</th><th>Last name</th>
          <th>Company</th><th>Needs attention</th></tr></thead>
        <tbody id="qs-tbody">${rows.length ? rows.map(rosterRow).join('') : emptyRow(5, 'No signature records.')}</tbody>
      </table></div>
      <p class="muted" style="margin:10px 0 0;font-size:11.5px">Names appear exactly as they were
        typed in the workbook — this dashboard does not split, merge, re-spell or de-duplicate
        them.</p>
      <span class="interaction-hint" aria-hidden="true">Select a row for the full workbook record</span></div>`;

    return headHtml + kpis + reconCard(rec, hasTraining)
      + `<div style="margin:16px 0">${sheetCard}</div>`
      + `<div class="grid cols-2" style="margin:16px 0;align-items:start">${companyCard}${sessionCard}</div>`
      + roster + Q.issuesNotice(sec) + Q.coverageNotice() + Q.howToPanel() + Q.deliverablesPanel();
  };

  /* ---- post-render: search + filters over the roster ---------------------*/
  Pages['_after_quality-signature'] = function () {
    if (!D) return;
    const rows = (D.signature || {}).rows || [];
    const q = document.getElementById('qs-q');
    const co = document.getElementById('qs-company');
    const se = document.getElementById('qs-session');
    const fl = document.getElementById('qs-flag');
    const mt = document.getElementById('qs-match');   // absent when there is no training log
    const tbody = document.getElementById('qs-tbody');
    const count = document.getElementById('qs-count');
    if (!q || !co || !se || !fl || !tbody || !count) return;

    // The names present in the training log, folded the same way the ETL folds
    // them, so the on-page filter agrees with the reconciliation exactly.
    const fold = (s) => String(s || '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const trained = new Set(((D.training || {}).rows || [])
      .filter(r => r.full_name).map(r => fold(r.full_name)));

    function apply() {
      const term = q.value.trim().toLowerCase();
      const cv = co.value, sv = se.value, fv = fl.value, mv = mt ? mt.value : '';
      const filtered = rows.filter(r => {
        if (cv && r.company !== cv) return false;
        if (sv && r.date !== sv) return false;
        if (fv === 'flagged' && !(r.flags || []).length) return false;
        if (fv === 'clean' && (r.flags || []).length) return false;
        if (mv) {
          const isTrained = !!r.full_name && trained.has(fold(r.full_name));
          if (mv === 'trained' && !isTrained) return false;
          if (mv === 'untrained' && isTrained) return false;
        }
        if (term) {
          const hay = [r.first_name, r.last_name, r.full_name, r.company,
            r.date_raw].join(' ').toLowerCase();
          if (hay.indexOf(term) === -1) return false;
        }
        return true;
      });
      window.__WFM.length = rosterBase;
      tbody.innerHTML = filtered.length ? filtered.map(rosterRow).join('')
        : emptyRow(5, 'No signature records match these filters.');
      count.textContent = `${filtered.length} ${plural(filtered.length, 'result')}`;
    }
    q.addEventListener('input', apply);
    [co, se, fl, mt].forEach(el => el && el.addEventListener('change', apply));
  };
})();

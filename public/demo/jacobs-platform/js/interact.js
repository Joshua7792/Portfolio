/* Delegated tooltip and accessible modal engine; survives page re-renders. */
(function (w, d) {
  'use strict';
  let tip, modal, invoker, lastHover;
  const hoverCapable = w.matchMedia('(hover:hover)').matches;
  const hit = (target) => target && target.closest && target.closest('.hit');
  const detailHit = (target) => target && target.closest && target.closest('[data-detail]');

  function ensureTip() {
    if (!tip) { tip = d.createElement('div'); tip.id = 'tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true; d.body.appendChild(tip); }
    return tip;
  }
  function hideTip() { if (tip) tip.hidden = true; lastHover = null; }
  function positionTip(e, el) {
    const t = ensureTip(), pad = 10, gap = 12, r = el.getBoundingClientRect();
    t.hidden = false;
    const tr = t.getBoundingClientRect();
    let x = e && e.clientX ? e.clientX + gap : r.left + r.width / 2 - tr.width / 2;
    let y = e && e.clientY ? e.clientY + gap : r.top - tr.height - 8;
    x = Math.max(pad, Math.min(w.innerWidth - tr.width - pad, x));
    if (y + tr.height > w.innerHeight - pad) y = r.top - tr.height - 8;
    y = Math.max(pad, y);
    t.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  }
  function showTip(el, e) {
    if (!el || !el.dataset.tip || (!hoverCapable && e && e.type.startsWith('pointer'))) return;
    const t = ensureTip(); t.textContent = el.dataset.tip; lastHover = el; positionTip(e, el);
  }
  function closeDialog() {
    if (!modal) return;
    const restore = invoker;
    modal.classList.remove('on'); hideTip();
    const remove = () => { if (modal) modal.remove(); modal = null; invoker = null; if (restore && restore.isConnected) restore.focus(); };
    if (w.matchMedia('(prefers-reduced-motion:reduce)').matches) remove(); else w.setTimeout(remove, 170);
  }
  function openDialog(record, source) {
    if (modal) { modal.remove(); modal = null; }
    hideTip(); invoker = source || d.activeElement;
    modal = d.createElement('div'); modal.className = 'detail-scrim';
    modal.innerHTML = `<section class="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title"><header><div><div class="detail-label">Excel record detail</div><h2 id="detail-title">${record.title}</h2></div><button class="detail-close" type="button" aria-label="Close detail">×</button></header><div class="detail-body">${record.html}</div></section>`;
    d.body.appendChild(modal); requestAnimationFrame(() => modal && modal.classList.add('on'));
    modal.querySelector('.detail-close').addEventListener('click', closeDialog);
    modal.addEventListener('pointerdown', e => { if (e.target === modal) closeDialog(); });
    modal.querySelector('.detail-close').focus();
  }
  function trap(e) {
    if (!modal) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(); return; }
    if (e.key !== 'Tab') return;
    const items = [...modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled);
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function activate(el) {
    const raw = el && el.dataset.detail; if (!raw) return;
    const cut = raw.indexOf(':'); if (cut < 1) return;
    w.Detail.open(raw.slice(0, cut), raw.slice(cut + 1), el);
  }
  d.addEventListener('pointerover', e => { const el = hit(e.target); if (el && el !== hit(e.relatedTarget)) showTip(el, e); });
  d.addEventListener('pointerout', e => { const el = hit(e.target); if (el && el !== hit(e.relatedTarget)) hideTip(); });
  d.addEventListener('focusin', e => { const el = hit(e.target); if (el) showTip(el, null); });
  d.addEventListener('focusout', e => { if (hit(e.target)) hideTip(); });
  d.addEventListener('click', e => { const el = detailHit(e.target); if (el) activate(el); });
  d.addEventListener('keydown', e => {
    trap(e); if (modal || (e.key !== 'Enter' && e.key !== ' ')) return;
    const el = detailHit(e.target); if (!el || e.repeat) return;
    e.preventDefault(); activate(el);
  });
  w.addEventListener('scroll', hideTip, true);
  w.addEventListener('resize', hideTip);
  w.addEventListener('hashchange', () => { hideTip(); if (modal) closeDialog(); });
  w.Interact = { openDialog, closeDialog, hideTip };
})(window, document);

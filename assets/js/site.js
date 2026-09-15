/* AV_ — shared behaviour */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sidebar in / out ---------- */
  var shell = document.getElementById('shell');
  var closeBtn = document.getElementById('closeBtn');
  var openBtn = document.getElementById('openBtn');
  var scrim = document.getElementById('scrim');
  var phone = function () { return window.innerWidth < 760; };

  function setOpen(open) {
    shell.classList.toggle('collapsed', !open);
    closeBtn.setAttribute('aria-expanded', String(open));
    openBtn.setAttribute('aria-expanded', String(open));
    if (scrim) scrim.setAttribute('aria-hidden', String(!open));
    // on phones the drawer sits over the page, so freeze the page behind it
    document.body.style.overflow = (open && phone()) ? 'hidden' : '';
    if (!phone()) { try { localStorage.setItem('av_menu', open ? '1' : '0'); } catch (e) {} }
  }
  closeBtn.addEventListener('click', function () { setOpen(false); openBtn.focus(); });
  openBtn.addEventListener('click', function () { setOpen(true); closeBtn.focus(); });

  if (scrim) scrim.addEventListener('click', function () { setOpen(false); openBtn.focus(); });

  var saved = null;
  try { saved = localStorage.getItem('av_menu'); } catch (e) {}
  if (phone() || saved === '0') setOpen(false);

  // switching between the phone and desktop layouts mid-session
  var wasPhone = phone();
  window.addEventListener('resize', function () {
    var isPhone = phone();
    if (isPhone === wasPhone) return;
    wasPhone = isPhone;
    if (isPhone) setOpen(false);
    else setOpen(saved !== '0');
  });

  /* ---------- clock ---------- */
  var start = Date.now() - (7 * 3600 + 42 * 60 + 11) * 1000;
  function pad(n) { return String(n).padStart(2, '0'); }
  function tick() {
    var d = new Date(), c = document.getElementById('clock'), u = document.getElementById('uptime');
    if (c) c.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    if (u) {
      var s = Math.floor((Date.now() - start) / 1000);
      u.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
    }
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- modal ---------- */
  var modal = document.getElementById('modal');
  var lastFocus = null;

  function openModal(title, html) {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.querySelector('.mt').textContent = title;
    modal.querySelector('.modal-body').innerHTML = html;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.querySelector('.modal-body').innerHTML = '';
    document.body.style.overflow = (phone() && !shell.classList.contains('collapsed')) ? 'hidden' : '';
    if (lastFocus) lastFocus.focus();
  }
  if (modal) {
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.addEventListener('mousedown', function (e) { if (e.target === modal) closeModal(); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal && !modal.hidden) { closeModal(); return; }
    if (!shell.classList.contains('collapsed')) { setOpen(false); openBtn.focus(); }
  });

  document.querySelectorAll('[data-modal]').forEach(function (el) {
    function fire() {
      var detail = el.querySelector('.detail');
      openModal(el.dataset.title || '', detail ? detail.innerHTML : '');
    }
    el.addEventListener('click', fire);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
    });
  });

  /* ---------- search + tag filter (projects) ---------- */
  var searchInput = document.getElementById('search');
  var rows = [].slice.call(document.querySelectorAll('.rows .row'));
  var filterBtns = [].slice.call(document.querySelectorAll('.filters button'));
  var countEl = document.getElementById('count');
  var emptyEl = document.getElementById('empty');
  var active = '';

  function apply() {
    var q = (searchInput ? searchInput.value : '').trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (r) {
      var hay = (r.dataset.search || '').toLowerCase();
      var tags = (r.dataset.tags || '').toLowerCase();
      var ok = (!q || hay.indexOf(q) > -1) && (!active || tags.split(',').indexOf(active) > -1);
      r.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (countEl) countEl.textContent = shown + ' / ' + rows.length + ' SHOWN';
    if (emptyEl) emptyEl.classList.toggle('hide', shown > 0);
  }
  if (searchInput) searchInput.addEventListener('input', apply);
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      active = (active === b.dataset.tag) ? '' : b.dataset.tag;
      filterBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.tag === active)); });
      apply();
    });
  });
  if (rows.length) apply();
})();

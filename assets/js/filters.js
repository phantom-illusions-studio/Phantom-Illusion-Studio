/* Catalogue filter helper shared by catalogue/apps/games/software pages.
   Client-side filtering only — backend queries unchanged. */
(function () {
  'use strict';

  function byRelease(a, b) { return new Date(b.release_date) - new Date(a.release_date); }
  function byName(a, b) { return String(a.name).localeCompare(String(b.name)); }

  function applyFilters(items, state) {
    var q = (state.q || '').trim().toLowerCase();
    var out = items.filter(function (it) {
      if (state.type && state.type !== 'all' && it.item_type !== state.type) return false;
      if (state.dist === 'file' && it.distribution_type !== 'file') return false;
      if (state.dist === 'link' && it.distribution_type !== 'link') return false;
      if (q) {
        var hay = ((it.name || '') + ' ' + (it.short_description || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    out.sort(state.sort === 'name' ? byName : byRelease);
    return out;
  }

  async function render(state) {
    updateFilterSummary(state);
    var grid = document.getElementById(state.gridId);
    var count = document.getElementById(state.countId);
    var items = applyFilters(state.items, state);
    if (count) {
      var scope = state.type && state.type !== 'all' ? state.type + ' · ' : '';
      count.textContent = items.length + (items.length === 1 ? ' product' : ' products') + ' — ' + scope + 'updated from studio catalogue';
    }
    if (!items.length) {
      grid.innerHTML = window.PhantomCards.stateHTML(
        'No products match',
        state.items.length ? 'Try a different search term or filter.' : 'Nothing published here yet. Check back soon.',
        state.emptyLinkHref || 'index.html', state.emptyLinkLabel || 'Back to home'
      );
      return;
    }
    await window.PhantomCards.renderGrid(items, grid);
  }

  function wireToolbar(state) {
    var q = document.getElementById(state.qId || 'q');
    var sort = document.getElementById(state.sortId || 'sort');
    var segDist = document.querySelectorAll('[data-seg="dist"] button');
    var segType = document.querySelectorAll('[data-seg="type"] button');
    var toggle = document.getElementById('filterToggle');
    var toolbar = toggle ? toggle.closest('.toolbar') : null;
    if (q) q.addEventListener('input', function () { state.q = q.value; render(state); });
    if (sort) sort.addEventListener('change', function () { state.sort = sort.value; render(state); });
    segDist.forEach(function (btn) {
      btn.addEventListener('click', function () {
        segDist.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        state.dist = btn.getAttribute('data-value');
        render(state);
      });
    });
    segType.forEach(function (btn) {
      btn.addEventListener('click', function () {
        segType.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        state.type = btn.getAttribute('data-value');
        render(state);
      });
    });
    /* Mobile filter disclosure: same controls, collapsed behind a toggle. */
    if (toggle && toolbar) {
      toggle.addEventListener('click', function () {
        var open = toolbar.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }

  var TYPE_LABELS = { app: 'Apps', game: 'Games', software: 'Software' };
  var DIST_LABELS = { file: 'Download', link: 'Link' };

  function updateFilterSummary(state) {
    var summary = document.getElementById('filterSummary');
    var count = document.getElementById('filterCount');
    if (!summary && !count) return;
    var parts = [];
    var active = 0;
    if (state.type && state.type !== 'all') { parts.push(TYPE_LABELS[state.type] || state.type); active++; }
    if (state.dist && state.dist !== 'all') { parts.push(DIST_LABELS[state.dist] || state.dist); active++; }
    if (summary) summary.textContent = parts.length ? parts.join(' · ') : 'All products';
    if (count) {
      count.textContent = String(active);
      if (active > 0) count.removeAttribute('hidden');
      else count.setAttribute('hidden', '');
    }
  }

  function initState(opts) {
    var state = {
      items: [], q: '', dist: 'all', sort: 'newest',
      type: opts.type || 'all',
      gridId: opts.gridId, countId: opts.countId,
      qId: opts.qId, sortId: opts.sortId,
      emptyLinkHref: opts.emptyLinkHref, emptyLinkLabel: opts.emptyLinkLabel
    };
    wireToolbar(state);
    return state;
  }

  window.PhantomFilter = { initState: initState, render: render, applyFilters: applyFilters };
})();

/* Shared product-card renderer. Presentation only — data contracts unchanged.
   Backend: window.dataService (getPublicUrl). Navigation: description.html?id=<id>.
   Download flow identical to previous implementation (public URL + temp anchor). */
(function () {
  'use strict';

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  async function iconUrlFor(item) {
    var fallback = 'assets/images/logo.png';
    if (item && item.icon_path) {
      try {
        var url = await window.dataService.getPublicUrl(
          item.icon_bucket || window.STORAGE_BUCKETS.ICONS,
          item.icon_path
        );
        if (url) return url;
      } catch (err) { console.error('Error getting icon URL:', err); }
    }
    return fallback;
  }

  function initials(name) {
    var words = String(name || '?').trim().split(/\s+/).slice(0, 2);
    return words.map(function (w) { return w.charAt(0).toUpperCase(); }).join('') || '?';
  }

  function actionButtons(item) {
    if (!item || !item.is_published) return '';
    if (item.distribution_type === 'file') {
      return '<button type="button" class="btn btn-primary btn-sm" data-action="download">Get</button>' +
        '<a class="btn btn-secondary btn-sm" href="description.html?id=' + encodeURIComponent(item.id) + '" data-action="details">Details</a>';
    }
    if (item.distribution_type === 'link') {
      var href = escapeHtml(item.external_url || '#');
      return '<a class="btn btn-primary btn-sm" href="' + href + '" target="_blank" rel="noopener noreferrer" data-action="open">Open</a>' +
        '<a class="btn btn-secondary btn-sm" href="description.html?id=' + encodeURIComponent(item.id) + '" data-action="details">Details</a>';
    }
    return '<a class="btn btn-secondary btn-sm" href="description.html?id=' + encodeURIComponent(item.id) + '" data-action="details">Details</a>';
  }

  async function cardElement(item) {
    var card = document.createElement('article');
    card.className = 'p-card fade-in';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', (item.name || 'Product') + ' — view details');

    var iconUrl = await iconUrlFor(item);
    var type = escapeHtml(item.item_type || 'product');
    var version = escapeHtml(item.version || '—');
    var name = escapeHtml(item.name || 'Untitled');
    var desc = escapeHtml(item.short_description || '');
    var dist = item.distribution_type === 'file' ? 'Download' : (item.distribution_type === 'link' ? 'Web link' : '—');

    card.innerHTML =
      '<div class="p-card-top">' +
        '<img class="p-icon" src="' + escapeHtml(iconUrl) + '" alt="" loading="lazy" onerror="this.outerHTML=\'<span class=&quot;p-icon-fallback&quot; aria-hidden=&quot;true&quot;>' + escapeHtml(initials(item.name)) + '</span>\'">' +
        '<div class="p-id"><h3>' + name + '</h3>' +
          '<div class="p-badges"><span class="badge badge-type-' + type.toLowerCase() + '">' + type + '</span>' +
          '<span class="badge badge-version">v' + version + '</span></div>' +
        '</div>' +
      '</div>' +
      (desc ? '<p class="p-desc">' + desc + '</p>' : '') +
      '<div class="p-meta"><span class="dot" aria-hidden="true"></span><span>' + escapeHtml(dist) + ' · Available</span></div>' +
      '<div class="p-actions">' + actionButtons(item) + '</div>';

    function goToDetail() { window.location.href = 'description.html?id=' + encodeURIComponent(item.id); }
    card.addEventListener('click', function (e) {
      var t = e.target.closest('[data-action]');
      if (!t) { goToDetail(); return; }
      var action = t.getAttribute('data-action');
      if (action === 'download') {
        e.preventDefault(); e.stopPropagation();
        window.handleDownload(e, item.id, item.storage_path);
      } else if (action === 'details') {
        e.preventDefault(); goToDetail();
      }
      /* open: default anchor behaviour (new tab) */
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target === card) goToDetail();
    });
    return card;
  }

  function skeletonHTML(count) {
    var out = '';
    for (var i = 0; i < (count || 3); i++) out += '<div class="skeleton"><i></i><i></i><i></i></div>';
    return '<div class="skeleton-grid" aria-hidden="true">' + out + '</div>';
  }

  function stateHTML(title, body, linkHref, linkLabel) {
    return '<div class="state-box" role="status"><h3>' + escapeHtml(title) + '</h3><p>' +
      escapeHtml(body) + '</p>' +
      (linkHref ? '<a class="btn btn-secondary btn-sm" href="' + escapeHtml(linkHref) + '">' + escapeHtml(linkLabel || 'Back to catalogue') + '</a>' : '') + '</div>';
  }

  async function renderGrid(items, container) {
    container.innerHTML = '';
    for (var i = 0; i < items.length; i++) {
      container.appendChild(await cardElement(items[i]));
    }
  }

  function showToast(message, kind) {
    var el = document.createElement('div');
    el.className = kind === 'success' ? 'success-message' : 'error-message';
    el.setAttribute('role', kind === 'success' ? 'status' : 'alert');
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 5000);
  }

  async function handleDownload(event, itemId, storagePath) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    try {
      var publicUrl = await window.dataService.getPublicUrl(window.STORAGE_BUCKETS.DOWNLOADS, storagePath);
      if (publicUrl) {
        var link = document.createElement('a');
        link.href = publicUrl;
        link.download = String(storagePath || '').split('/').pop() || 'download';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error('Public URL is null for storagePath:', storagePath);
        showToast('Download URL not available. Please contact support.', 'error');
      }
    } catch (err) {
      console.error('Error handling download:', err);
      showToast('Failed to initiate download. Please try again.', 'error');
    }
  }

  window.PhantomCards = { cardElement: cardElement, renderGrid: renderGrid, skeletonHTML: skeletonHTML, stateHTML: stateHTML, showToast: showToast, escapeHtml: escapeHtml, iconUrlFor: iconUrlFor };
  window.handleDownload = handleDownload; /* global: inline handlers + card buttons */
})();

/* Product detail. Backend: getItemById(?id=). Download flow identical to catalogue. */
document.addEventListener('DOMContentLoaded', function () { initDescriptionPage(); });

async function initDescriptionPage() {
  try {
    var params = new URLSearchParams(window.location.search);
    var itemId = params.get('id');
    if (!itemId) {
      renderMessage('No product selected', 'Choose a product from the catalogue to view its details.', 'catalogue.html', 'Browse the catalogue');
      return;
    }
    await loadItemDetails(itemId);
  } catch (err) {
    console.error('Error initializing description page:', err);
    renderMessage('Could not load this product', 'Check your connection and try again.', 'catalogue.html', 'Back to catalogue');
  }
}

async function loadItemDetails(itemId) {
  var container = document.getElementById('item-detail-content');
  if (!container) return;
  try {
    var item = await window.dataService.getItemById(itemId);
    if (!item) {
      renderMessage('Product not found', 'It may have been unpublished or removed.', 'catalogue.html', 'Back to catalogue');
      return;
    }
    await renderItemDetails(item, container);
  } catch (err) {
    console.error('Error loading item details:', err);
    renderMessage('Could not load this product', 'Check your connection and try again.', 'catalogue.html', 'Back to catalogue');
  }
}

function renderMessage(title, body, href, label) {
  var container = document.getElementById('item-detail-content');
  if (!container) return;
  document.title = title + ' — Phantom Illusions Studio';
  container.innerHTML = window.PhantomCards.stateHTML(title, body, href, label);
}

async function renderItemDetails(item, container) {
  var esc = window.PhantomCards.escapeHtml;
  var iconUrl = await window.PhantomCards.iconUrlFor(item);
  var release = formatDate(item.release_date);
  var distLabel = item.distribution_type === 'file' ? 'Direct download' : (item.distribution_type === 'link' ? 'External link' : '—');
  var type = esc(item.item_type || 'product');
  document.title = (item.name || 'Product') + ' — Phantom Illusions Studio';

  var backHref = item.item_type === 'app' ? 'apps.html' : (item.item_type === 'game' ? 'games.html' : (item.item_type === 'software' ? 'software.html' : 'catalogue.html'));
  var plural = item.item_type === 'software' ? 'software' : (item.item_type ? item.item_type + 's' : 'catalogue');
  var backLabel = 'Back to ' + plural;

  container.innerHTML =
    '<p class="crumbs"><a href="index.html">Studio</a> / <a href="catalogue.html">Catalogue</a> / <span>' + type + '</span></p>' +
    '<div class="detail-layout">' +
      '<aside class="detail-side" aria-label="Product facts">' +
        '<div class="detail-art"><img src="' + esc(iconUrl) + '" alt="' + esc(item.name) + ' artwork" onerror="this.outerHTML=\'<span class=&quot;p-icon-fallback&quot; aria-hidden=&quot;true&quot;>' + esc((item.name || '?').trim().charAt(0).toUpperCase()) + '</span>\'"></div>' +
        '<table class="fact-table"><tbody>' +
          factRow('Type', type) +
          factRow('Version', 'v' + esc(item.version || '—')) +
          factRow('Released', esc(release)) +
          factRow('Availability', esc(distLabel)) +
          (item.distribution_type === 'link' && item.external_url ? factRow('Destination', '<a href="' + esc(item.external_url) + '" target="_blank" rel="noopener noreferrer" style="color:var(--brand-ink)">' + esc(hostOf(item.external_url)) + '</a>') : '') +
        '</tbody></table>' +
        '<div class="p-actions">' + detailActions(item) + '</div>' +
      '</aside>' +
      '<div class="detail-main">' +
        '<a class="back-link" href="' + backHref + '">← ' + esc(backLabel) + '</a>' +
        '<div class="p-badges" style="margin-top:1rem"><span class="badge badge-type-' + esc(String(item.item_type || '').toLowerCase()) + '">' + type + '</span><span class="badge badge-version">v' + esc(item.version || '—') + '</span></div>' +
        '<h1>' + esc(item.name) + '</h1>' +
        '<p class="detail-short">' + esc(item.short_description || '') + '</p>' +
        '<div class="detail-actions-row">' + detailActions(item, true) + '</div>' +
        '<div class="detail-body"><h2>About this release</h2><p>' + esc(item.full_description || item.short_description || 'No description published yet.') + '</p></div>' +
      '</div>' +
    '</div>';

  var dl = container.querySelector('[data-dl]');
  if (dl) dl.addEventListener('click', function (e) { e.preventDefault(); handleDetailDownload(item.id, item.storage_path); });
}

function factRow(k, v) {
  return '<tr><th scope="row">' + window.PhantomCards.escapeHtml(k) + '</th><td>' + v + '</td></tr>';
}

function detailActions(item, large) {
  var cls = large ? 'btn' : 'btn btn-sm';
  if (!item.is_published) return '<span style="font-size:.85rem;color:var(--text-faint)">Not currently available.</span>';
  if (item.distribution_type === 'file') {
    return '<button type="button" class="' + cls + ' btn-primary" data-dl style="' + (large ? '' : 'flex:1') + '">Get · v' + window.PhantomCards.escapeHtml(item.version || '') + '</button>' +
      (large ? '' : '');
  }
  if (item.distribution_type === 'link') {
    return '<a class="' + cls + ' btn-primary" href="' + window.PhantomCards.escapeHtml(item.external_url || '#') + '" target="_blank" rel="noopener noreferrer">Open product</a>';
  }
  return '';
}

function formatDate(value) {
  if (!value) return '—';
  var d = new Date(value);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function hostOf(url) {
  try { return new URL(url).hostname; } catch (err) { return url; }
}

async function handleDetailDownload(itemId, storagePath) {
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
      window.PhantomCards.showToast('Download URL not available. Please contact support.', 'error');
    }
  } catch (err) {
    console.error('Error handling download:', err);
    window.PhantomCards.showToast('Failed to initiate download. Please try again.', 'error');
  }
}
/* Keep global name used by inline handlers elsewhere on this page. */
window.handleDownload = function (a, b, c) {
  if (typeof b === 'string' && typeof c === 'string') return handleDetailDownload(b, c);
  if (typeof a === 'string') return handleDetailDownload(a, b);
};

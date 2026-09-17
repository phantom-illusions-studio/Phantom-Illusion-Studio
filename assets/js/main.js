/* Homepage: featured releases, studio index counts, latest releases.
   Backend contracts unchanged: getFeaturedItems + getItemsByType. */
document.addEventListener('DOMContentLoaded', function () { initHomePage(); });

async function initHomePage() {
  try {
    await Promise.all([loadFeaturedItems(), loadStudioIndex(), loadLatest()]);
  } catch (err) {
    console.error('Error initializing homepage:', err);
  }
}

async function loadFeaturedItems() {
  var container = document.getElementById('featured-items');
  if (!container) return;
  try {
    var items = await window.dataService.getFeaturedItems();
    if (!items.length) {
      container.innerHTML = window.PhantomCards.stateHTML('No featured releases yet', 'Featured products will appear here once the studio highlights them.', 'catalogue.html', 'Browse the catalogue');
      return;
    }
    await window.PhantomCards.renderGrid(items.slice(0, 6), container);
  } catch (err) {
    console.error('Error loading featured items:', err);
    container.innerHTML = window.PhantomCards.stateHTML('Could not load featured releases', 'Check your connection and refresh the page.', null, null);
  }
}

async function loadStudioIndex() {
  try {
    var results = await Promise.all([
      window.dataService.getItemsByType('app'),
      window.dataService.getItemsByType('game'),
      window.dataService.getItemsByType('software')
    ]);
    var counts = [results[0].length, results[1].length, results[2].length];
    setText('idx-apps', counts[0]);
    setText('idx-games', counts[1]);
    setText('idx-software', counts[2]);
    setText('cat-count-apps', label(counts[0]));
    setText('cat-count-games', label(counts[1]));
    setText('cat-count-software', label(counts[2]));
    var all = results[0].concat(results[1], results[2]);
    all.sort(byRelease);
    var box = document.getElementById('idx-latest');
    if (box) {
      box.innerHTML = all.length
        ? 'Latest release: <strong>' + window.PhantomCards.escapeHtml(all[0].name) + '</strong> · v' + window.PhantomCards.escapeHtml(all[0].version || '—')
        : 'Latest release: <strong>none published yet</strong>';
    }
    return all;
  } catch (err) {
    console.error('Error loading studio index:', err);
    return [];
  }
}

async function loadLatest() {
  var container = document.getElementById('latest-grid');
  if (!container) return;
  var all = await loadStudioIndexCached();
  if (!all.length) {
    container.innerHTML = window.PhantomCards.stateHTML('No releases yet', 'Published products will appear here automatically.', 'catalogue.html', 'Browse the catalogue');
    return;
  }
  await window.PhantomCards.renderGrid(all.slice(0, 6), container);
}

var __allCache = null;
async function loadStudioIndexCached() {
  if (__allCache) return __allCache;
  try {
    var results = await Promise.all([
      window.dataService.getItemsByType('app'),
      window.dataService.getItemsByType('game'),
      window.dataService.getItemsByType('software')
    ]);
    __allCache = results[0].concat(results[1], results[2]).sort(byRelease);
  } catch (err) { __allCache = []; }
  return __allCache;
}

function byRelease(a, b) { return new Date(b.release_date) - new Date(a.release_date); }
function setText(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; }
function label(n) { return n + (n === 1 ? ' product' : ' products'); }

/* Full catalogue: merges getItemsByType('app'|'game'|'software'). All published-only, as before. */
document.addEventListener('DOMContentLoaded', function () { initCataloguePage(); });

async function initCataloguePage() {
  var state = window.PhantomFilter.initState({ gridId: 'catalogue-grid', countId: 'catalogue-count', type: 'all', emptyLinkHref: 'index.html', emptyLinkLabel: 'Back to home' });
  var grid = document.getElementById('catalogue-grid');
  try {
    var results = await Promise.all([
      window.dataService.getItemsByType('app'),
      window.dataService.getItemsByType('game'),
      window.dataService.getItemsByType('software')
    ]);
    state.items = results[0].concat(results[1], results[2]);
    await window.PhantomFilter.render(state);
  } catch (err) {
    console.error('Error loading catalogue:', err);
    grid.innerHTML = window.PhantomCards.stateHTML('Could not load the catalogue', 'Check your connection and refresh the page.', null, null);
  }
}

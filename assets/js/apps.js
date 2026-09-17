/* Apps listing. Backend: getItemsByType('app'). Filtering is client-side. */
document.addEventListener('DOMContentLoaded', function () { initAppsPage(); });

async function initAppsPage() {
  var state = window.PhantomFilter.initState({ gridId: 'apps-grid', countId: 'apps-count', type: 'app', emptyLinkHref: 'catalogue.html', emptyLinkLabel: 'Browse full catalogue' });
  var grid = document.getElementById('apps-grid');
  try {
    state.items = await window.dataService.getItemsByType('app');
    await window.PhantomFilter.render(state);
  } catch (err) {
    console.error('Error loading apps:', err);
    grid.innerHTML = window.PhantomCards.stateHTML('Could not load applications', 'Check your connection and refresh the page.', null, null);
  }
}

/* Software listing. Backend: getItemsByType('software'). Filtering is client-side. */
document.addEventListener('DOMContentLoaded', function () { initSoftwarePage(); });

async function initSoftwarePage() {
  var state = window.PhantomFilter.initState({ gridId: 'software-grid', countId: 'software-count', type: 'software', emptyLinkHref: 'catalogue.html', emptyLinkLabel: 'Browse full catalogue' });
  var grid = document.getElementById('software-grid');
  try {
    state.items = await window.dataService.getItemsByType('software');
    await window.PhantomFilter.render(state);
  } catch (err) {
    console.error('Error loading software:', err);
    grid.innerHTML = window.PhantomCards.stateHTML('Could not load software', 'Check your connection and refresh the page.', null, null);
  }
}

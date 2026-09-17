/* Games listing. Backend: getItemsByType('game'). Filtering is client-side. */
document.addEventListener('DOMContentLoaded', function () { initGamesPage(); });

async function initGamesPage() {
  var state = window.PhantomFilter.initState({ gridId: 'games-grid', countId: 'games-count', type: 'game', emptyLinkHref: 'catalogue.html', emptyLinkLabel: 'Browse full catalogue' });
  var grid = document.getElementById('games-grid');
  try {
    state.items = await window.dataService.getItemsByType('game');
    await window.PhantomFilter.render(state);
  } catch (err) {
    console.error('Error loading games:', err);
    grid.innerHTML = window.PhantomCards.stateHTML('Could not load games', 'Check your connection and refresh the page.', null, null);
  }
}

/* Shared mobile navigation. IDs: hamburger, mobileMenu, mobileOverlay, mobileMenuClose. */
(function () {
  function init() {
    var hamburger = document.getElementById('hamburger');
    var mobileMenu = document.getElementById('mobileMenu');
    var mobileOverlay = document.getElementById('mobileOverlay');
    var mobileMenuClose = document.getElementById('mobileMenuClose');
    if (!hamburger || !mobileMenu || !mobileOverlay) return;

    function setOpen(open) {
      mobileMenu.classList.toggle('active', open);
      mobileOverlay.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open && mobileMenuClose) mobileMenuClose.focus();
    }
    function toggle() { setOpen(!mobileMenu.classList.contains('active')); }

    hamburger.addEventListener('click', toggle);
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', function () { setOpen(false); });
    mobileOverlay.addEventListener('click', function () { setOpen(false); });
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        setOpen(false);
        hamburger.focus();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

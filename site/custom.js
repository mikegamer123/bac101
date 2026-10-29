/* bac101 interim global patches (see README.md). Each fix is isolated in try/catch. */
(function () {
  'use strict';

  /* BAC-12 (interim): add canonical only if missing. Real fix: server-side redirect in GHL. */
  function fixCanonical() {
    if (document.querySelector('link[rel="canonical"]')) return;
    var path = location.pathname.replace(/\/+$/, '');
    if (path === '' || path === '/glavna') path = '/';
    var l = document.createElement('link');
    l.rel = 'canonical';
    l.href = 'https://bac101.rs' + path;
    document.head.appendChild(l);
  }

  /* BAC-10: split a tel: anchor containing two phone numbers into two anchors. */
  function fixPhones() {
    var anchors = document.querySelectorAll('a[href^="tel:"]');
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      if (a.getAttribute('data-bac-split')) continue;
      var nums = (a.textContent || '').match(/\+\d[\d ]{6,}\d/g);
      if (!nums || nums.length !== 2 || !a.parentNode) continue;
      for (var j = 0; j < 2; j++) {
        var c = a.cloneNode(false);
        c.setAttribute('href', 'tel:+' + nums[j].replace(/\D/g, ''));
        c.setAttribute('data-bac-split', '1');
        c.removeAttribute('id');
        c.removeAttribute('aria-label');
        c.textContent = nums[j].replace(/\s+/g, ' ');
        c.style.display = 'inline-block';
        c.style.margin = '0 6px';
        a.parentNode.insertBefore(c, a);
      }
      a.parentNode.removeChild(a);
    }
  }

  function run() {
    var fixes = [fixCanonical, fixPhones];
    for (var i = 0; i < fixes.length; i++) {
      try { fixes[i](); } catch (e) { /* never throw */ }
    }
  }

  function start() {
    run();
    try {
      var timer = null;
      var mo = new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () { mo.disconnect(); run(); }, 300);
      });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 5000);
    } catch (e) { /* ignore */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

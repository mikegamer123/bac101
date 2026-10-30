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
      if (a.style.display === 'none') continue;
      var nums = (a.textContent || '').match(/\+\d[\d ]{6,}\d/g);
      if (!nums || nums.length !== 2 || !a.parentNode) continue;
      /* Hydration can adopt one of our links, so clear earlier ones and split again. */
      a.removeAttribute('data-bac-split');
      var old = a.parentNode.querySelectorAll('a[data-bac-split]');
      for (var k = 0; k < old.length; k++) old[k].parentNode.removeChild(old[k]);
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
      /* Hide, never remove: Vue owns this node and hydration re-renders it. */
      a.style.display = 'none';
    }
  }

  /* BAC-01: Serbian store labels (the builder has no field for them). */
  var LABELS = {
    'add to cart': 'Dodaj u korpu', 'buy now': 'Kupi odmah', 'view cart': 'Pogledaj korpu',
    'continue shopping': 'Nastavi kupovinu', 'your cart is empty': 'Vaša korpa je prazna',
    'add items to your cart to continue shopping': 'Dodajte proizvode u korpu da biste nastavili kupovinu',
    'item(s) added': 'proizvod(a) dodato', 'out of stock': 'Nema na stanju', 'checkout': 'Nastavi na plaćanje',
    'my cart': 'Moja korpa', 'contact': 'Kontakt', 'email address': 'Email adresa', 'shipping details': 'Podaci za dostavu',
    'full name': 'Ime i prezime', 'phone number': 'Telefon', 'full address': 'Adresa', 'country': 'Država',
    'city name': 'Grad', 'zip code': 'Poštanski broj', 'billing address same as shipping address': 'Adresa za račun je ista kao adresa dostave',
    'add notes to your order': 'Dodajte napomenu uz porudžbinu', 'cart summary': 'Pregled korpe', 'edit cart': 'Izmeni korpu',
    'apply': 'Primeni', 'continue': 'Nastavi', 'enter coupon code': 'Unesite kod kupona', 'log in to use your saved addresses': 'Prijavite se za sačuvane adrese',
    'subtotal': 'Međuzbir', 'total': 'Ukupno', 'quantity': 'Količina', 'price': 'Cena', 'product': 'Proizvod'
  };
  function fixLabels() {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) {
      if (/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)) continue;
      var t = n.nodeValue.trim(), k = t.toLowerCase();
      var star = /\s*\*$/.test(k);
      if (star) k = k.replace(/\s*\*$/, '');
      var m = k.match(/^only (\d+) items? left in stock$/);
      var added = k.match(/^(\d+) item\(s\) added$/);
      if (m) n.nodeValue = 'Na stanju još ' + m[1];
      else if (added) n.nodeValue = 'Dodato u korpu: ' + added[1];
      else if (LABELS[k]) n.nodeValue = LABELS[k] + (star ? ' *' : '');
    }
    var inputs = document.querySelectorAll('input[placeholder]');
    for (var i = 0; i < inputs.length; i++) {
      var ph = LABELS[inputs[i].placeholder.toLowerCase()];
      if (ph) inputs[i].placeholder = ph;
    }
  }

  /* TEMPORARY: orders are blocked until prices and shipping are confirmed. Remove to open checkout. */
  var ORDER_RE = /place order|complete|confirm|pay now|^pay|submit|buy|poruč|naruči|plati|potvrdi|završi/i;
  function onCheckout() { return /\/checkout/.test(location.pathname); }
  function blockCheckout() {
    if (!onCheckout()) return;
    var bs = document.querySelectorAll('button, input[type="submit"]');
    for (var i = 0; i < bs.length; i++) {
      if (ORDER_RE.test(bs[i].textContent || bs[i].value || '')) {
        bs[i].disabled = true;
        bs[i].setAttribute('data-bac-blocked', '1');
      }
    }
    if (!document.getElementById('bac-order-notice') && document.body) {
      var d = document.createElement('div');
      d.id = 'bac-order-notice';
      d.textContent = 'Online poručivanje uskoro počinje. Za porudžbinu nas pozovite: +381 621978511 ili +381 63268391.';
      document.body.insertBefore(d, document.body.firstChild);
    }
  }
  /* Capture phase, so this also stops clicks on buttons that re-render before blockCheckout runs. */
  function stopOrder(e) {
    if (!onCheckout()) return;
    var el = e.target && e.target.closest && e.target.closest('button, input[type="submit"], a');
    if (e.type === 'submit' || (el && (el.getAttribute('data-bac-blocked') || ORDER_RE.test(el.textContent || el.value || '')))) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  document.addEventListener('click', stopOrder, true);
  document.addEventListener('submit', stopOrder, true);

  function run() {
    var fixes = [fixCanonical, fixPhones, fixLabels, blockCheckout];
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
        timer = setTimeout(run, 300);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* ignore */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

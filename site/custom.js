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
        /* BAC-37: no left margin, so the numbers line up with the text above them. */
        c.style.margin = '0 12px 0 0';
        a.parentNode.insertBefore(c, a);
      }
      /* Hide, never remove: Vue owns this node and hydration re-renders it. */
      a.style.display = 'none';
    }
  }

  /* BAC-24: GHL prints RSD as "din.20825.00"; show "20.825 din". Output has no "din." so it cannot re-match. */
  function formatDin(whole, dec) {
    var w = whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+$)/g, '.');
    var d = dec ? (dec.length === 1 ? dec + '0' : dec) : '00';
    return w + (d === '00' ? '' : ',' + d) + ' din';
  }
  function fixPrices() {
    var store = document.body.classList.contains('bac-store');
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) {
      if (/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName)) continue;
      var v = n.nodeValue;
      if (store && /^\s*€0[.,]00\s*$/.test(v)) { n.nodeValue = '0 din'; continue; }
      if (v.indexOf('din.') === -1) continue;
      var r = v.replace(/din\.\s?(\d+)(?:[.,](\d{1,2}))?/g, function (m, a, b) { return formatDin(a, b); });
      if (r !== v) n.nodeValue = r;
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
    'city name': 'Grad', 'zip code': 'Poštanski broj', 'state / province': 'Opština', 'serbia': 'Srbija', 'billing address same as shipping address': 'Adresa za račun je ista kao adresa dostave',
    'add notes to your order': 'Dodajte napomenu uz porudžbinu', 'cart summary': 'Pregled korpe', 'edit cart': 'Izmeni korpu',
    'apply': 'Primeni', 'continue': 'Nastavi', 'enter coupon code': 'Unesite kod kupona', 'log in to use your saved addresses': 'Prijavite se za sačuvane adrese',
    'payment': 'Plaćanje', 'coupon': 'Kupon', 'show more': 'Prikaži još', 'show less': 'Prikaži manje',
    'prikazi još': 'Prikaži još', 'prikazi manje': 'Prikaži manje',
    'cash on delivery (cod)': 'Plaćanje pouzećem', 'subtotal': 'Međuzbir', 'total': 'Ukupno', 'quantity': 'Količina', 'price': 'Cena', 'product': 'Proizvod'
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
      var qty = t.match(/^qty:\s*(\d+)$/i);
      if (m) n.nodeValue = 'Na stanju još ' + m[1];
      else if (added) n.nodeValue = 'Dodato u korpu: ' + added[1];
      else if (qty) n.nodeValue = 'Količina: ' + qty[1];
      else if (k.indexOf('100% secure & safe payments') !== -1) n.nodeValue = '100% sigurna kupovina';
      else if (n.nodeValue.indexOf('All Rights Reserved') !== -1) n.nodeValue = n.nodeValue.replace('All Rights Reserved', 'Sva prava zadržana');
      else if (LABELS[k]) n.nodeValue = LABELS[k] + (star ? ' *' : '');
    }
    var inputs = document.querySelectorAll('input[placeholder]');
    for (var i = 0; i < inputs.length; i++) {
      var ph = LABELS[inputs[i].placeholder.toLowerCase()];
      if (ph) inputs[i].placeholder = ph;
    }
  }

  /* TEMPORARY: orders are blocked until prices and shipping are confirmed. Remove to open checkout. */
  /* Removing the order block below means setting ORDERS_BLOCKED to false as well (used by fixOrderLine, BAC-35). */
  var ORDERS_BLOCKED = true;
  var ORDER_RE = /^\s*(continue|nastavi)\s*$|place order|complete|confirm|pay now|^pay|submit|buy|poruč|naruči|plati|potvrdi|završi/i;
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
  /* The checkout re-enables its button when the form validates, so keep re-asserting. */
  if (onCheckout()) setInterval(blockCheckout, 500);

  /* BAC-13 (interim): one H1 per page. Later H1s become H2; store pages promote the product name. */
  function fixHeadings() {
    var h = document.querySelectorAll('h1');
    for (var i = 1; i < h.length; i++) {
      var n = document.createElement('h2');
      n.innerHTML = h[i].innerHTML;
      n.className = h[i].className;
      n.style.cssText = 'margin:0;font-size:inherit;' + h[i].style.cssText;
      h[i].parentNode.replaceChild(n, h[i]);
    }
    if (!h.length) {
      var name = document.querySelector('.hl-product-detail-product-name');
      if (name) name.setAttribute('role', 'heading'), name.setAttribute('aria-level', '1');
    }
  }

  /* BAC-01: /cart and /checkout have no title in GHL. */
  function fixTitles() {
    var t = { '/cart': 'Korpa | BAC101', '/checkout': 'Porudžbina | BAC101' }[location.pathname.replace(/\/+$/, '')];
    if (t && document.title !== t) document.title = t;
  }

  /* BAC-23: store pages use GHL's menu, so give them the same nav as the main pages. */
  var NAV_HTML = '<a href="/" class="n-logo"><img src="https://assets.cdn.filesafe.space/Jns38Sxc2dLAdqiwTeCO/media/6991c74e24813c6e1ab3d616.webp" alt="BAC101"></a>' +
    '<div class="n-links"><a href="/">Glavna</a><a href="/katalog">Katalog</a>' +
    '<div class="n-dd"><span>BAC101 ▾</span><div class="n-dd-menu"><a href="/kako-radi">Kako radi</a><a href="/istorija">Istorija</a><a href="/videi">Video datoteke</a></div></div>' +
    '<a href="/partneri">Partneri</a>' +
    '<div class="n-dd"><span>Testiranja ▾</span><div class="n-dd-menu"><a href="/pepeo">Pepeo, teški ubica</a><a href="/studija">Studija slučaja BAC101</a><a href="/testiranje">Testiranje proizvoda uživo</a></div></div>' +
    '<a href="/kontakt">Kontakt</a></div>' +
    '<div class="n-icons"><a href="https://wa.me/381621978511"><img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp"></a>' +
    '<a href="viber://chat?number=%2B381621978511"><img src="https://assets.cdn.filesafe.space/Jns38Sxc2dLAdqiwTeCO/media/69de54ddacf21ea88ad2accb.png" alt="Viber"></a></div>';
  function fixNav() {
    if (!/^\/(cart|checkout|products-list|product-details)/.test(location.pathname)) return;
    if (!document.body.classList.contains('bac-store')) {
      document.body.classList.add('bac-store');
      var font = document.createElement('link');
      font.rel = 'stylesheet';
      font.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(font);
    }
    if (!document.querySelector('nav.n')) {
      var nav = document.createElement('nav');
      nav.className = 'n bac-nav';
      nav.innerHTML = NAV_HTML;
      var notice = document.getElementById('bac-order-notice');
      document.body.insertBefore(nav, notice ? notice.nextSibling : document.body.firstChild);
    }
    var ghl = document.querySelector('.c-nav-menu');
    var section = ghl && ghl.closest('.c-section');
    if (section) section.style.display = 'none';
    /* GHL's cart button keeps updating while hidden, so read the count from it. */
    var count = document.querySelector('.nav-cart-button');
    var cart = document.querySelector('[data-bac-cart]');
    if (count && cart) {
      var n = parseInt(count.textContent, 10);
      var label = n > 0 ? 'Korpa (' + n + ')' : 'Korpa';
      if (cart.textContent !== label) cart.textContent = label;
    }
  }

  /* BAC-20: custom-coded pages have their own nav with no cart link. */
  function fixNavCart() {
    var links = document.querySelector('nav.n .n-links');
    if (!links || links.querySelector('[data-bac-cart]')) return;
    var a = document.createElement('a');
    a.href = '/cart';
    a.textContent = 'Korpa';
    a.setAttribute('data-bac-cart', '1');
    links.appendChild(a);
  }

  /* BAC-06: the form's legal links point back to the page itself. */
  function fixLegalLinks() {
    var map = { 'privacy policy': ['/privacy-policy', 'Politika privatnosti'], 'terms of service': ['/terms-conditions', 'Uslovi korišćenja'], 'terms & conditions': ['/terms-conditions', 'Uslovi korišćenja'] };
    var as = document.querySelectorAll('a');
    for (var i = 0; i < as.length; i++) {
      var m = map[as[i].textContent.trim().toLowerCase()];
      if (m) { as[i].setAttribute('href', m[0]); as[i].textContent = m[1]; }
    }
    /* BAC-25: store-page footers have the same two items as plain text. */
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n, hits = [];
    while ((n = w.nextNode())) if (/^\s*Terms & Conditions \| Privacy Policy\s*$/.test(n.nodeValue) && n.parentNode.nodeName !== 'A') hits.push(n);
    for (var j = 0; j < hits.length; j++) {
      var frag = document.createDocumentFragment();
      var t = document.createElement('a'); t.href = '/terms-conditions'; t.textContent = 'Uslovi korišćenja';
      var pp = document.createElement('a'); pp.href = '/privacy-policy'; pp.textContent = 'Politika privatnosti';
      frag.appendChild(t); frag.appendChild(document.createTextNode(' | ')); frag.appendChild(pp);
      hits[j].parentNode.replaceChild(frag, hits[j]);
    }
  }

  /* BAC-26: preselect Serbia on checkout, once; the user's choice wins afterwards. */
  var countryDone = false;
  function fixCountry() {
    if (countryDone || !onCheckout()) return;
    var sel = document.querySelector('select[name="country"]');
    if (!sel) return;
    countryDone = true;
    if (sel.value === '') {
      sel.value = 'RS';
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /* BAC-29: hide the pager when there is a single page. */
  function fixPagination() {
    var p = document.getElementById('product-list-pagination');
    if (!p) return;
    /* (?!\d), not \b: the text runs together as "Strana 1 / 1Sledeća". */
    if (/Strana\s*1\s*\/\s*1(?!\d)/.test(p.textContent)) { p.style.display = 'none'; p.setAttribute('data-bac-hid', '1'); }
    else if (p.getAttribute('data-bac-hid')) { p.style.display = ''; p.removeAttribute('data-bac-hid'); }
  }

  /* BAC-30: the cart shows the variant as a bare number ("25"). */
  function fixVariants() {
    /* .product-variant: drawer and checkout; .cart-item-variant: the /cart page. */
    var vs = document.querySelectorAll('.product-variant, .cart-item-variant');
    for (var i = 0; i < vs.length; i++) {
      var t = vs[i].textContent.trim();
      if (/^\d+$/.test(t) && vs[i].children.length === 0) vs[i].textContent = t + ' pranja';
    }
  }

  /* BAC-31: no checkout button for an empty cart. */
  function fixEmptyCart() {
    if (!/\/cart/.test(location.pathname)) return;
    /* innerText: only visible text, so a hidden empty-cart template cannot hide the button. */
    var empty = document.body.innerText.indexOf('Vaša korpa je prazna') !== -1;
    var bs = document.querySelectorAll('.hl-checkout-btn');
    for (var i = 0; i < bs.length; i++) {
      if (empty) bs[i].classList.add('bac-hidden'); else bs[i].classList.remove('bac-hidden');
    }
  }

  /* BAC-32: /partneri plural forms and SEO strings that follow the computed stats. */
  function plural(n) { return n + (n % 10 === 1 && n % 100 !== 11 ? ' partner' : ' partnera'); }
  function fixPartners() {
    var cs = document.querySelectorAll('.partner-count, .city-count');
    for (var i = 0; i < cs.length; i++) {
      var m = cs[i].textContent.trim().match(/^(\d+)\s*partner[a-z]*$/i);
      if (m) { var r = plural(parseInt(m[1], 10)); if (cs[i].textContent !== r) cs[i].textContent = r; }
    }
    if (!/\/partneri/.test(location.pathname)) return;
    var pe = document.getElementById('bac-stat-partners'), ce = document.getElementById('bac-stat-countries');
    if (!pe || !ce) return;
    var p = parseInt(pe.textContent, 10), c = parseInt(ce.textContent, 10);
    if (!(p > 0 && c > 0)) return;
    function sync(s) { return s.replace(/\d+( servisa)/, p + '$1').replace(/\d+( zemalja)/, c + '$1').replace(/\d+( partnera)/, p + '$1'); }
    if (document.title) document.title = sync(document.title);
    var sels = ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]'];
    for (var j = 0; j < sels.length; j++) {
      var el = document.querySelector(sels[j]);
      if (el && el.content) el.setAttribute('content', sync(el.content));
    }
  }

  /* BAC-22: /katalog is static HTML with no links to the store products. */
  var PRODUCTS = {
    'BAC101 DPF': '6ae7404d90f5beded40f2c13',
    'DC101 & CF101': '6ae741bc7d1cf14640a9a59f',
    'FC101 & SC101': '6ae7422255bfb617cd3f0f97',
    'DC101 za AdBlue': '6ae741bc7d1cf14640a9a59f',
    'FC101 i SC101': '6ae7422255bfb617cd3f0f97'
  };
  /* BAC-34: CF101 is out of stock; show the store names and AdBlue-only copy. Runs before fixCatalog. */
  function fixCatalogCopy() {
    if (!/^\/katalog/.test(location.pathname)) return;
    var names = document.querySelectorAll('.grid .card .card-name');
    for (var i = 0; i < names.length; i++) {
      var t = names[i].textContent.trim();
      var body = names[i].parentNode;
      if (t === 'DC101 & CF101') {
        names[i].textContent = 'DC101 za AdBlue';
        var code = body.querySelector('.card-code');
        if (code) code.textContent = 'AdBlue DEF Anti-Crystal';
        var desc = body.querySelector('.card-desc');
        if (desc) desc.innerHTML = ' Adblue DEF Anti-Crystal formula za dizel motore. Sprečava kristalizaciju AdBlue tečnosti. <ul><li>Adblue DEF Anti-Crystal zaštita</li><li>Sprečava kristalizaciju</li><li>Formulisano za dizel motore</li></ul> ';
      } else if (t === 'FC101 & SC101') {
        names[i].textContent = 'FC101 i SC101';
      }
    }
  }
  /* BAC-35: the hero promises online ordering while orders are blocked. */
  function fixOrderLine() {
    if (!ORDERS_BLOCKED) return;
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var n, hits = [];
    while ((n = w.nextNode())) {
      if (n.nodeValue.trim() === 'Poručite online – dostava na adresu!') hits.push(n);
    }
    for (var i = 0; i < hits.length; i++) {
      var v = hits[i].nodeValue;
      hits[i].nodeValue = v.replace('Poručite online – dostava na adresu!', 'Poručite telefonom ili putem WhatsApp-a – dostava na adresu!');
    }
  }
  function fixCatalog() {
    var names = document.querySelectorAll('.grid .card .card-name');
    for (var i = 0; i < names.length; i++) {
      var id = PRODUCTS[names[i].textContent.trim()];
      var body = names[i].parentNode;
      /* Cards without an id are out of stock until the import arrives. */
      if (!id) { names[i].closest('.card').style.display = 'none'; continue; }
      if (body.querySelector('.bac-card-btn')) continue;
      var a = document.createElement('a');
      a.className = 'bac-card-btn';
      a.href = '/product-details/product/' + id;
      a.textContent = 'Pogledaj proizvod';
      body.appendChild(a);
    }
    var grid = document.querySelector('.grid-wrap');
    if (names.length && grid && !document.querySelector('.bac-all-btn')) {
      var all = document.createElement('a');
      all.className = 'bac-card-btn bac-all-btn';
      all.href = '/products-list';
      all.textContent = 'Svi proizvodi';
      grid.appendChild(all);
    }
  }

  /* BAC-39: cookie consent. The head snippet reads localStorage 'bac_consent' before fbq('init'); with 'denied' or no
     choice the pixel sends nothing. The memory copy keeps the banner closed when storage throws (private mode). */
  var consentMem = null;
  function getConsent() {
    try {
      var v = localStorage.getItem('bac_consent');
      if (v === 'granted' || v === 'denied') return v;
    } catch (e) { /* storage blocked */ }
    return consentMem;
  }
  function setConsent(v) {
    consentMem = v;
    try {
      if (v) localStorage.setItem('bac_consent', v); else localStorage.removeItem('bac_consent');
    } catch (e) { /* storage blocked */ }
  }
  function removeConsentBanner() {
    var b = document.getElementById('bac-consent');
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }
  function fixConsentBanner() {
    if (getConsent() || document.getElementById('bac-consent') || !document.body) return;
    var d = document.createElement('div');
    d.id = 'bac-consent';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-live', 'polite');
    d.setAttribute('aria-label', 'Kolačići');
    d.innerHTML = '<div class="bac-consent-text">Koristimo kolačiće (Meta Pixel) da bismo merili posete i poboljšali oglase. Možete ih prihvatiti ili odbiti. ' +
      '<a href="/privacy-policy">Politika privatnosti</a></div>' +
      '<div class="bac-consent-btns"><button type="button" id="bac-consent-yes">Prihvatam</button><button type="button" id="bac-consent-no">Odbijam</button></div>';
    document.body.appendChild(d);
  }
  /* BAC-39: footer link that reopens the banner, placed after each footer "Politika privatnosti" link. */
  function fixConsentLink() {
    var as = document.querySelectorAll('a');
    for (var i = 0; i < as.length; i++) {
      if (as[i].textContent.trim() !== 'Politika privatnosti') continue;
      var next = as[i].nextElementSibling;
      if (next && next.getAttribute('data-bac-consent-link')) continue;
      var foot = as[i].closest('.ft-blinks');
      if (!foot) {
        var p = as[i].parentNode;
        for (var k = 0; p && p !== document.body && k < 6; k++, p = p.parentNode) {
          if ((p.textContent || '').indexOf('Sva prava zadržana') !== -1) { foot = p; break; }
        }
      }
      if (!foot) continue;
      var a = document.createElement('a');
      a.href = '#';
      a.textContent = 'Podešavanja kolačića';
      a.setAttribute('data-bac-consent-open', '1');
      a.setAttribute('data-bac-consent-link', '1');
      as[i].parentNode.insertBefore(document.createTextNode(' | '), as[i].nextSibling);
      as[i].parentNode.insertBefore(a, as[i].nextSibling.nextSibling);
    }
  }
  /* Module-level, capture phase: run() re-executes on every DOM mutation. */
  document.addEventListener('click', function (e) {
    try {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('#bac-consent-yes')) {
        setConsent('granted');
        /* No extra PageView: fbq holds events while revoked and sends them on grant (tested 2026-11-26). */
        if (window.fbq) window.fbq('consent', 'grant');
        removeConsentBanner();
      } else if (t.closest('#bac-consent-no')) {
        setConsent('denied');
        if (window.fbq) window.fbq('consent', 'revoke');
        removeConsentBanner();
      } else {
        var o = t.closest('[data-bac-consent-open], a');
        if (o && (o.hasAttribute('data-bac-consent-open') || o.textContent.trim() === 'Podešavanja kolačića')) {
          e.preventDefault();
          setConsent(null);
          fixConsentBanner();
        }
      }
    } catch (err) { /* never throw */ }
  }, true);

  /* BAC-40: dropdowns open on :hover only; touch tablets (>860px) need tap-to-open. */
  document.addEventListener('click', function (e) {
    try {
      var t = e.target;
      if (!t || !t.closest) return;
      var dds = document.querySelectorAll('nav.n .n-dd'), i;
      var span = t.closest('nav.n .n-dd > span');
      if (span) {
        e.preventDefault();
        var dd = span.parentNode, wasOpen = dd.classList.contains('bac-open');
        for (i = 0; i < dds.length; i++) dds[i].classList.remove('bac-open');
        if (!wasOpen) dd.classList.add('bac-open');
      } else if (!t.closest('nav.n .n-dd.bac-open')) {
        for (i = 0; i < dds.length; i++) dds[i].classList.remove('bac-open');
      }
    } catch (err) { /* never throw */ }
  }, true);

  /* BAC-41: Meta pixel events; consent is enforced by fbq itself. */
  function parseRsd(s) {
    s = String(s == null ? '' : s).replace(/din\.?/gi, '').replace(/[^\d.,]/g, '');
    if (!/\d/.test(s)) return null;
    if (s.indexOf(',') !== -1) s = s.replace(/\./g, '').replace(',', '.');
    else if (!/^\d+\.\d{1,2}$/.test(s)) s = s.replace(/\./g, '');
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }
  function onProduct() { return /^\/product-details/.test(location.pathname); }
  function productInfo() {
    var nameEl = document.querySelector('.hl-product-detail-product-name');
    var priceEl = document.querySelector('.hl-product-detail-product-price');
    return {
      name: (nameEl && nameEl.textContent.trim()) || document.title,
      price: priceEl ? parseRsd(priceEl.textContent) : null
    };
  }
  var leadSent = false;
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function trackLead(btn) {
    var box = btn.parentNode;
    for (var k = 0; box && k < 8 && !box.querySelector('input'); k++) box = box.parentNode;
    if (!box || !box.querySelectorAll) return;
    var ins = box.querySelectorAll('input'), email = '', phone = '';
    for (var i = 0; i < ins.length; i++) {
      var ph = ins[i].placeholder || '';
      if (ins[i].type === 'email' || /^Email/i.test(ph)) email = ins[i].value;
      else if (ins[i].type === 'tel' || /^Telefon/i.test(ph)) phone = ins[i].value;
    }
    if (email.indexOf('@') !== -1 && digits(phone).length >= 6) {
      leadSent = true;
      window.fbq('track', 'Lead', { content_name: 'Kontakt forma' });
    }
  }
  document.addEventListener('click', function (e) {
    try {
      var t = e.target;
      if (!window.fbq || !t || !t.closest) return;
      var a = t.closest('a[href^="tel:"], a[href^="mailto:"], a[href*="wa.me"], a[href^="viber:"]');
      if (a) {
        var h = a.getAttribute('href');
        var m = /^tel:/.test(h) ? 'phone' : /^mailto:/.test(h) ? 'email' : /^viber:/.test(h) ? 'viber' : 'whatsapp';
        window.fbq('track', 'Contact', { method: m });
        return;
      }
      var b = t.closest('button');
      if (!b) return;
      var txt = b.textContent || '';
      if (txt.indexOf('dpfcleaner@') !== -1) {
        window.fbq('track', 'Contact', { method: 'email' });
      } else if (txt.trim() === 'Pošalji') {
        if (!leadSent) trackLead(b);
      } else if (onProduct() && txt.indexOf('Dodaj u korpu') !== -1) {
        var info = productInfo();
        var qEl = document.querySelector('.hl-quantity-input') || document.querySelector('.hl-pdp-quantity');
        if (qEl && qEl.tagName !== 'INPUT') qEl = qEl.querySelector('input');
        var qty = qEl ? parseInt(qEl.value, 10) : 1;
        if (!(qty > 0)) qty = 1;
        window.fbq('track', 'AddToCart', { content_name: info.name, value: (info.price || 0) * qty, currency: 'RSD', content_type: 'product' });
      }
    } catch (err) { /* never throw */ }
  }, true);
  /* One-shot page events, driven by run(); the flag is set only once fbq exists. */
  var viewSent = false, checkoutSent = false;
  function fixPixelEvents() {
    if (!window.fbq) return;
    if (!viewSent && onProduct()) {
      var info = productInfo();
      if (info.price !== null) {
        viewSent = true;
        window.fbq('track', 'ViewContent', { content_name: info.name, value: info.price, currency: 'RSD', content_type: 'product' });
      }
    }
    if (!checkoutSent && onCheckout()) {
      checkoutSent = true;
      window.fbq('track', 'InitiateCheckout');
    }
  }

  /* BAC-43: the site's own contact cards (homepage, /kontakt) had no submit logic, so every message was lost.
     Swap each card for the GHL form "Kontakt Bac101" (bot protection, CRM contact, email notification). */
  var FORM_ID = 'MFkmm0K1Hc0UzzWDRlCy';
  function fixContactForm() {
    var cards = document.querySelectorAll('#b101 .ct-card, #b101k .ct-card');
    if (!cards.length) return;
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (card.getAttribute('data-bac-form')) continue;
      card.setAttribute('data-bac-form', '1');
      card.style.cssText = 'padding:0;background:transparent;box-shadow:none;overflow:hidden;border-radius:14px;max-width:520px;width:100%;';
      card.innerHTML = '<iframe src="https://api.leadconnectorhq.com/widget/form/' + FORM_ID + '" id="inline-' + FORM_ID +
        '" data-layout="{\'id\':\'INLINE\'}" data-trigger-type="alwaysShow" data-activation-type="alwaysActivated" data-deactivation-type="neverDeactivate"' +
        ' data-form-name="Kontakt Bac101" data-height="990" data-layout-iframe-id="inline-' + FORM_ID + '" data-form-id="' + FORM_ID +
        '" title="Kontakt Bac101" style="width:100%;height:990px;border:none;display:block;"></iframe>';
      var legal = card.parentNode && card.parentNode.querySelector(':scope > .ct-legal');
      if (legal) legal.style.display = 'none'; /* the form carries its own consent text and policy links */
    }
    if (!document.querySelector('script[src*="form_embed.js"]')) {
      var s = document.createElement('script');
      s.src = 'https://link.msgsndr.com/js/form_embed.js';
      document.body.appendChild(s);
    }
  }

  function run() {
    var fixes = [fixContactForm,fixCanonical, fixPhones, fixPrices, fixLabels, fixCountry, fixPagination, fixVariants, fixEmptyCart, fixPartners, blockCheckout, fixHeadings, fixTitles, fixNav, fixNavCart, fixLegalLinks, fixConsentLink, fixCatalogCopy, fixCatalog, fixOrderLine, fixNav, fixConsentBanner, fixPixelEvents];
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
        timer = setTimeout(run, 80);
      });
      /* characterData too: the store re-renders drawer text in place, undoing the labels. */
      mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    } catch (e) { /* ignore */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

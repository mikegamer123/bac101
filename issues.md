# bac101.rs - issue tracker

Source: `docs/problemi-izvorni.txt` (site review, October 2026). IDs follow document order. Each item quotes the Serbian original.
Verify with `python -I scripts/audit.py` (writes `audit-report.json`).

## Legend

- **Priority**: Critical / High / Medium (from the source document headings).
- **Channel**:
  - `MCP` - GoHighLevel API via MCP (product prices, variants, descriptions, redirects).
  - `CSS/JS` - global custom code in `site/`, served via jsDelivr.
  - `Builder` - GHL page builder / site settings, done in the browser.
  - `Content` - text drafted in `content/`, then applied.
- **Status**: `open` / `check` / `patch ready` / `in progress` / `fixed` / `verified`.
- **Audit check**: name of the check in `scripts/audit.py`, or `manual`.

## Status summary

| ID | Priority | Title | Channel | Status | Audit check |
|---|---|---|---|---|---|
| BAC-01 | Critical | No buy / add-to-cart button, no cart icon | Builder | live, ordering blocked | `check_buy_button` |
| BAC-02 | Critical | Price invisible (white on white) | CSS/JS + Builder | patched (interim) | manual |
| BAC-03 | Critical | All variants have the same price | MCP | open | manual |
| BAC-04 | Critical | Names/descriptions do not match variants | MCP | open | manual |
| BAC-05 | Critical | EUR only; no RSD, VAT note, delivery/payment info | Content + Builder | open | `check_rsd_vat` |
| BAC-06 | High | Privacy/Terms links point to example.com | Content + Builder | links patched; legal text to review | `check_example_links` |
| BAC-07 | High | /kontakt tab title is "Rivali Digital" | Builder | kontakt fixed; footer credit to confirm | `check_rivali` |
| BAC-08 | High | /studija shows only "Hans Muller" | Content + Builder | owner to confirm author | `check_hans_muller` |
| BAC-09 | High | /videi has no video, wrong title | Content + Builder | check | `check_videi` |
| BAC-10 | Medium | Phone link dials one number for two | CSS/JS + Builder | patched (interim) | `check_tel_links` |
| BAC-11 | Medium | robots.txt and sitemap.xml empty | Builder | verified | `check_robots_sitemap` |
| BAC-12 | Medium | / and /glavna duplicate, no canonical | MCP | check | `check_duplicate_home` |
| BAC-13 | Medium | Heading (H1) structure broken | Builder | patched (interim, JS) | `check_h1` |
| BAC-14 | Medium | Menu item "Testiranja" -> /#new-menu-item | Builder | verified | `check_menu_placeholder` |
| BAC-15 | Medium | Catalog split into 6 + 3 pages | Builder | verified | `check_catalog_paging` |
| BAC-16 | Medium | Hero image lazy-loaded; text clipped at ~800px | Builder | text verified; lazy OK | `check_hero_lazy` |
| BAC-17 | Medium | Mobile overflow (388px on 375px) due to video | CSS/JS + Builder | verified | `check_mobile_overflow` |
| BAC-18 | Medium | Desktop horizontal overflow ~8px (nav/hero/footer wider than viewport) | Builder | verified | manual |
| BAC-19 | High | No menu under 860px on custom-coded pages | CSS/JS + Builder | patched (interim) | manual |
| BAC-20 | High | No cart link on custom-coded pages | CSS/JS + Builder | patched (interim) | manual |
| BAC-21 | High | Cart page had template header (Business Name) | Builder | verified | manual |
| BAC-22 | High | /katalog cards had no product links | CSS/JS + Builder | patched (interim) | manual |
| BAC-23 | High | Store pages used a different menu and off-brand buttons | CSS/JS + Builder | patched (interim) | manual |
| BAC-24 | High | Prices shown as "din.20825.00" | CSS/JS + Builder | patch ready | manual |
| BAC-25 | Medium | Remaining English store/checkout labels | CSS/JS + Builder | patch ready | manual |
| BAC-26 | Medium | Checkout country not preselected | CSS/JS + Builder | patch ready | manual |
| BAC-27 | High | Cart summary header breaks on phones | CSS/JS + Builder | patch ready | manual |
| BAC-28 | Low | Mobile nav scrollbar looks like an underline | CSS/JS + Builder | patch ready | manual |
| BAC-29 | Medium | Product list crops bottles; pager shown for one page | CSS/JS + Builder | patch ready | manual |
| BAC-30 | Medium | Cart variant shown as bare "25" | CSS/JS + Builder | patch ready | manual |
| BAC-31 | Medium | Empty cart still shows checkout button | CSS/JS + Builder | patch ready | manual |
| BAC-32 | Medium | /partneri plurals, stale SEO numbers, overflowing socials | CSS/JS + Builder | patch ready | manual |
| BAC-33 | Medium | /pepeo warning heading unreadable | CSS/JS + Builder | patch ready | manual |
| BAC-34 | Medium | /katalog still advertises CF101 (out of stock) | CSS/JS + Builder | patch ready | manual |
| BAC-35 | High | Homepage promises online ordering while blocked | CSS/JS + Builder | patch ready | manual |
| BAC-36 | Medium | Leftover home hero below the footer on /katalog, /terms-conditions, /privacy-policy | CSS + Builder | patch ready | manual |
| BAC-37 | Low | Store footer contact column cramped on tablets; small "Prikaži još" tap target; phone links indented | CSS/JS | patch ready | manual |
| BAC-38 | Medium | Menu jumps on page load: "Korpa" is added by JS and dropped again by GHL hydration | CSS | patch ready | manual |
| BAC-39 | High | No cookie consent; Meta pixel must not fire before consent | JS/CSS + GHL head | patch ready | manual |
| BAC-40 | Medium | Header dropdowns open only on hover; unusable on touch tablets | CSS/JS | patch ready | manual |
| BAC-41 | Medium | No Meta pixel conversion events (Contact, Lead, AddToCart, ViewContent, InitiateCheckout) | JS | patch ready | manual |

### Live check, 2026-10-29 (before any change)
- Already OK on the live site: BAC-06 (no example.com links, but a real privacy policy page is still unverified), BAC-09 (/videi has 6 videos and its own title), BAC-12 (/ and /glavna both have canonical -> https://bac101.rs/; a redirect is still nicer), BAC-17 (no horizontal overflow at 375px on /, /glavna, /kako-radi, /videi, /istorija, /bac101, /kontakt, /studija, /products-list, product page). Status `check` = confirm with the owner, then close.
- BAC-07 moved: /kontakt title is now fine, but "Rivali Digital" is on / (footer "Site by Rivali Digital", may be intentional).
- BAC-08 also on /testiranje.
- BAC-01 confirmed in the browser: product page buttons are only the variant chips (1/5/12/25/50/1000) and +/-; no add-to-cart.
- BAC-02 patch (`site/custom.css`) tested by injection: price colour rgb(255,255,255) -> rgb(17,17,17).
- BAC-10 patch (`site/custom.js`) tested by injection: one `tel:+381 63268391` anchor -> `tel:+381621978511` and `tel:+38163268391`.

### Deployed, 2026-10-29
- jsDelivr tag added to Bac101 website Settings > Head tracking code (field was empty before). GHL injects it client-side (not in the server HTML), so `audit.py` cannot see the patches; verify in a browser.
- Verified live in the browser: product page price rgb(17,17,17); product-page tel: links split into `tel:+381621978511` and `tel:+38163268391`; /kontakt (already separate links) untouched.
- New: BAC-18, /kontakt at 1368px viewport has scrollWidth 1376 (`nav.n`, `.hero`, `.ft` end at 1376px), likely a `100vw` width including the scrollbar. Pre-existing, not caused by the patches.

### BAC-01 finding, 2026-10-30
- Payments > Integrations has an empty "Connected" section: no payment provider at all. Likely the reason the storefront shows no add-to-cart (not yet proven; re-check after connecting one).
- Options seen there: Stripe, PayPal, Authorize.net, NMI, Manual Payment Methods (Cash on Delivery), Square, Adyen, Mercado Pago.
- Store "Bac101" includes 9 products (6 more are excluded).
- Cash on Delivery connected 2026-10-30, enabled for E-commerce Stores only (GHL locks the name "Cash on Delivery (COD)"). The buy button did NOT appear.
- Actual cause: page data has `showAddToCartButton`, `showBuyNowButton` and `showCartIcon` all false. These are builder toggles on the product detail element and nav menu. Button text is still English ("Add to cart", "Buy Now").
- Later payment options stay open: "Add Custom Payment" is free on the Manual Payment page; other providers can be connected alongside.
- Shipping: no zones configured under Payments > Settings > Shipping (2026-10-30); needs setup before checkout can work.
- BAC-10 correction: the first patch was undone by Vue hydration (one button, both numbers, dialled one). Fixed in 41a807d; two links confirmed 9s after load.

### QA, 2026-10-30 (pin baa0d8d)
- Add to cart, cart drawer, /cart and /checkout pass on desktop and 375px. Checkout shows the notice; "Nastavi" is disabled with pointer-events none.
- NOT tested: clicking "Nastavi" on a fully filled form (refused, it could place a real order). The block is browser-side only, so a determined visitor could bypass it; the shipping setup is untested too.
- `audit.py` reads server HTML, so BAC-10 and BAC-13 stay FAIL there even though the browser shows them fixed.
- Home hero text "Poručite online" is wrong while ordering is blocked. /katalog is a separate page from /products-list.

### Reported 2026-10-30: /cart leads to product list
- Not reproduced. /cart stayed on /cart with an empty cart, from the Korpa link, and via www and trailing-slash URLs. "Nastavi kupovinu" on the empty cart is the expected way to reach the list. Waiting on steps from the reporter.
- /katalog shows 6 of 9 products (no DPF + pumpica, BACP1, BAKFK); "Svi proizvodi (9)" links to /products-list.

### Store cut to owner's stock, 2026-10-31
- Excluded from store (not deleted): BAC101 CUT, CUT + pumpica, DPF + pumpica, BACP1, BACP1G, BAKFK. /katalog hides their cards.
- BAC101 DPF now only 5 and 25 pranja; CF101 removed. Prices NOT entered: the store is locked to EUR, see content/prices.md.

### RSD products live, 2026-11-02
- New RSD products in the store: BAC101 DPF (5/25 pranja), DC101 za AdBlue, FC101 i SC101. Old EUR products taken out of the store (not deleted).
- New DPF had stock tracking on with 0 qty (accidental), set to 999 per variant until the owner gives real stock.
- Original photos attached 2026-11-02 (BACR5.jpg, dc101.png (DC101 only, since CF101 is gone), SC101 & Fc101.png, from media folders Bac101/... and JMB/Saubereu). A DC101 duplicate (6ae83a610c38ff41f1301a5c) exists, excluded from the store.

---

## Critical

### BAC-01 - No buy / add-to-cart button
- **Priority**: Critical
- **Pages**: all 9 product pages, header (site-wide), /cart, /checkout
- **Channel**: Builder
- **Status**: open
- **Audit check**: `check_buy_button`
- **Original (P4)**: "Ni na jednoj od 9 stranica proizvoda nema dugmeta „Kupi“ / „Dodaj u korpu“. Na stranici postoje samo dugmad za izbor varijante i +/− za količinu. Posetilac može da izabere količinu, ali posle toga nema na šta da klikne. U zaglavlju nema ni ikonice korpe, iako stranice /cart i /checkout postoje (obe bez naslova)."
- **Notes**: Add the buy/add-to-cart element to the product template, add a cart icon to the header, give /cart and /checkout headings. The audit only detects text/attributes; a button rendered client-side may be invisible to it.

### BAC-02 - Price not visible
- **Priority**: Critical
- **Pages**: all product pages
- **Channel**: CSS/JS (interim) + Builder (proper)
- **Status**: open
- **Audit check**: manual
- **Original (P5)**: "Cene na stranicama proizvoda se ne vide. Cena (npr. €75.00) postoji, ali je napisana belim slovima na beloj pozadini."
- **Notes**: Interim CSS override for the price element in `site/`; proper fix is the text colour in the product template. Colour contrast cannot be checked from HTML; verify visually.

### BAC-03 - All variants same price
- **Priority**: Critical
- **Pages**: all product pages (CUT, DPF and their "+ pumpica" versions)
- **Channel**: MCP
- **Status**: open
- **Audit check**: manual
- **Original (P6)**: "Sve varijante imaju istu cenu. Kod „BAC101 DPF“ 1 pranje, 5 pranja i 1000 pranja koštaju isto, €75.00. Isti problem imaju i CUT i DPF proizvodi, kao i njihove verzije „+ pumpica“."
- **Notes**: Needs the real price list from the owner; then update variant prices via the products API.

### BAC-04 - Names/descriptions do not match variants
- **Priority**: Critical
- **Pages**: BAC101 CUT, BAC101 CUT + pumpica (check the rest)
- **Channel**: MCP
- **Status**: open
- **Audit check**: manual
- **Original (P7)**: "Nazivi i opisi proizvoda ne odgovaraju varijantama. „BAC101 CUT“ (€115) je opisan kao paket od 12 doza (BACR12G), a nudi od 1 do 1000 pranja. „BAC101 CUT + pumpica“ je opisan kao komplet za 50 jedinica."
- **Notes**: Draft corrected descriptions in `content/`, then apply via the API. Needs owner confirmation of what each product actually contains.

### BAC-05 - EUR only, no RSD / VAT / delivery info
- **Priority**: Critical
- **Pages**: product pages, /cart, /checkout, footer
- **Channel**: Content + Builder
- **Status**: open
- **Audit check**: `check_rsd_vat`
- **Original (P8)**: "Cene su samo u evrima, na .rs sajtu namenjenom kupcima u Srbiji. Nema cene u dinarima, napomene o PDV-u, niti informacija o dostavi i plaćanju."
- **Notes**: Decide on currency (RSD display or settings), add VAT note and delivery/payment text (draft in `content/`). Audit passes when product pages mention RSD/din, PDV and dostava.

## High

### BAC-06 - Privacy Policy / Terms point to example.com
- **Priority**: High
- **Pages**: contact form (two links below it), footer
- **Channel**: Content + Builder
- **Status**: open
- **Audit check**: `check_example_links`
- **Original (P10)**: "Linkovi „Privacy Policy“ i „Terms“ vode na https://www.example.com/. To važi i za dva linka odmah ispod kontakt forme koja prikuplja ime, email i telefon. Tekst „Terms & Conditions | Privacy Policy“ u futeru je običan tekst, a ne link. Prava politika privatnosti ne postoji. To je bitno zbog Zakona o zaštiti podataka o ličnosti (ZZPL), jer sajt prikuplja lične podatke i saglasnost za SMS poruke."
- **Notes**: Draft the privacy policy (ZZPL) and terms in `content/` (legal review recommended), create pages, relink form and footer.

### BAC-07 - /kontakt title is "Rivali Digital"
- **Priority**: High
- **Pages**: /kontakt
- **Channel**: Builder
- **Status**: open
- **Audit check**: `check_rivali`
- **Original (P11)**: "Naslov stranice /kontakt u kartici pregledača je „Rivali Digital“, ime agencije umesto BAC101."
- **Notes**: Page SEO title in page settings.

### BAC-08 - /studija only "Hans Muller"
- **Priority**: High
- **Pages**: /studija
- **Channel**: Content + Builder
- **Status**: open
- **Audit check**: `check_hans_muller`
- **Original (P12)**: "Na stranici /studija stoji samo ime „Hans Muller“, bez citata i bez konteksta. Izgleda kao zaostali tekst iz šablona."
- **Notes**: Either write real content (needs owner input) or remove the template leftover.

### BAC-09 - /videi has no video, wrong title
- **Priority**: High
- **Pages**: /videi
- **Channel**: Content + Builder
- **Status**: open
- **Audit check**: `check_videi`
- **Original (P13)**: "Na stranici /videi nema nijednog videa, a naslov je „ISTORIJA BAC101…“, to jest naslov stranice o istoriji."
- **Notes**: Add the videos (needs source material) or hide the page; fix title/H1. Note the video may be embedded client-side.

## Medium

### BAC-10 - Phone link dials wrong number
- **Priority**: Medium
- **Pages**: wherever the phone link appears (header/footer/contact)
- **Channel**: Builder
- **Status**: open
- **Audit check**: `check_tel_links`
- **Original (P15)**: "Link za poziv bira samo jedan broj. Jedan link obuhvata oba broja, pa se dodirom na „+381 621978511“ zapravo poziva +381 63268391. Uz to, razmak unutar linka nije ispravan."
- **Notes**: Split into two separate `tel:` links with no spaces in the href.

### BAC-11 - robots.txt and sitemap.xml empty
- **Priority**: Medium
- **Pages**: /robots.txt, /sitemap.xml
- **Channel**: Builder
- **Status**: open
- **Audit check**: `check_robots_sitemap`
- **Original (P16)**: "Fajlovi robots.txt i sitemap.xml su prazni. Učitavaju se bez greške, ali nemaju sadržaj."
- **Notes**: Site settings (SEO / robots, sitemap generation).

### BAC-12 - / and /glavna duplicate, no canonical
- **Priority**: Medium
- **Pages**: /, /glavna
- **Channel**: MCP (redirect)
- **Status**: open
- **Audit check**: `check_duplicate_home`
- **Original (P17)**: "Početna stranica postoji dva puta, na / i na /glavna. Nijedna stranica ne govori pretraživačima koja je glavna verzija (nema canonical oznake)."
- **Notes**: Redirect /glavna -> / (301) via the redirects API; optionally add canonical.

### BAC-13 - Heading structure
- **Priority**: Medium
- **Pages**: / (5 H1), catalog, /bac101, /kontakt, /kako-radi, /istorija, /videi (0 H1)
- **Channel**: Builder
- **Status**: open
- **Audit check**: `check_h1`
- **Original (P18)**: "Naslovi su neuređeni. Početna stranica ima 5 glavnih naslova (H1), od kojih se prvi ponavlja. Katalog, /bac101, /kontakt, /kako-radi, /istorija i /videi nemaju nijedan."
- **Notes**: Exactly one H1 per page; demote the rest to H2.

### BAC-14 - Menu item "Testiranja" -> /#new-menu-item
- **Priority**: Medium
- **Pages**: site-wide menu
- **Channel**: Builder
- **Status**: open
- **Audit check**: `check_menu_placeholder`
- **Original (P19)**: "Stavka menija „Testiranja“ vodi na /#new-menu-item, što je zaostali link. Radi samo preko podmenija."
- **Notes**: Point to a real page or make it a non-link parent.

### BAC-15 - Catalog split 6 + 3
- **Priority**: Medium
- **Pages**: catalog
- **Channel**: Builder
- **Status**: open
- **Audit check**: `check_catalog_paging`
- **Original (P20)**: "Katalog je podeljen na dve strane (6 + 3) iako ima samo 9 proizvoda. Drugu stranu je lako prevideti."
- **Notes**: Raise items per page to 12 or more. The catalog URL is not in the source; the audit guesses it (ASSUMED).

### BAC-16 - Hero image lazy-loaded
- **Priority**: Medium
- **Pages**: / (and /glavna)
- **Channel**: Builder
- **Status**: open
- **Audit check**: `check_hero_lazy`
- **Original (P21)**: "Glavna slika na početnoj stranici je podešena da se učitava kasno. To je prvo što posetilac vidi, pa se sporo učitava i na početku se prikazuje kao sivi pravougaonik. Tekst u tom delu je odsečen na levoj i desnoj ivici pri širini od oko 800px."
- **Notes**: Disable lazy-load on the hero. The ~800px text clipping needs a visual check (not audited).

### BAC-17 - Mobile horizontal overflow
- **Priority**: Medium
- **Pages**: pages with an embedded video
- **Channel**: CSS/JS (interim) + Builder (proper)
- **Status**: open
- **Audit check**: `check_mobile_overflow`
- **Original (P22)**: "Na telefonu je stranica malo šira od ekrana (388px na ekranu od 375px) zbog ugrađenog videa, pa se malo pomera ulevo i udesno."
- **Notes**: Interim `max-width:100%` on iframes/video in `site/` CSS. The audit only flags fixed-width iframes; real overflow needs a browser check.

### BAC-24 - Prices shown as "din.20825.00"
- **Priority**: High
- **Channel**: CSS/JS + Builder
- **Status**: patch ready
- **Notes**: GHL renders RSD prices as `din.N.NN` everywhere (product, list, cart, drawer, checkout). Interim JS `fixPrices` shows `20.825 din`; the `€0.00` cart placeholder becomes `0 din`. Interim; proper fix in the builder. Verify live after deploy.

### BAC-25 - Remaining English store/checkout labels
- **Priority**: Medium
- **Channel**: CSS/JS + Builder
- **Status**: patch ready
- **Notes**: Payment, Coupon, Show more/less, `Qty:`, "100% Secure & Safe Payments", footer "All Rights Reserved", "Terms & Conditions" translated in `LABELS`/`fixLabels`/`fixLegalLinks`. Interim; proper fix in the builder. Verify live after deploy.

### BAC-26 - Checkout country not preselected
- **Priority**: Medium
- **Channel**: CSS/JS + Builder
- **Status**: patch ready
- **Notes**: `fixCountry` sets `select[name="country"]` to `RS` once per page load, firing input/change. User choice wins afterwards. Interim; proper fix in the builder. Verify live after deploy.

### BAC-27 - Cart summary header breaks on phones
- **Priority**: High
- **Channel**: CSS/JS + Builder
- **Status**: patch ready
- **Notes**: BAC-23 26px heading wrapped and the chevron overlapped "Izmeni korpu" at <=640px. CSS gives a 20px nowrap heading and a flex row. Interim; proper fix in the builder. Verify live after deploy.

### BAC-28 - Mobile nav scrollbar looks like an underline
- **Priority**: Low
- **Channel**: CSS/JS + Builder
- **Status**: patch ready
- **Notes**: Scrollbar hidden on `.n-links` (nav.n and nav.bac-nav), right-edge mask fade hints at scrolling. Interim; proper fix in the builder. Verify live after deploy.

### BAC-29 - Product list crops bottles; pager shown for one page
- **Priority**: Medium
- **Channel**: CSS/JS + Builder
- **Status**: patch ready
- **Notes**: `object-fit: contain` on list images; `fixPagination` hides `#product-list-pagination` when it reads "Strana 1 / 1". Interim; proper fix in the builder. Verify live after deploy.

### BAC-30 - Cart variant shown as bare "25"
- **Priority**: Medium
- **Channel**: CSS/JS + Builder
- **Status**: patch ready
- **Notes**: `fixVariants` rewrites digit-only `.product-variant` text to "N pranja" (cart, drawer, checkout). Interim; proper fix in the builder. Verify live after deploy.

### BAC-31 - Empty cart still shows checkout button
- **Priority**: Medium
- **Channel**: CSS/JS + Builder
- **Status**: patch ready
- **Notes**: `fixEmptyCart` toggles `.bac-hidden` on `.hl-checkout-btn` on /cart based on "Vaša korpa je prazna". Interim; proper fix in the builder. Verify live after deploy.

### BAC-32 - /partneri plurals, stale SEO numbers, overflowing socials
- **Priority**: Medium
- **Channel**: CSS/JS + Builder
- **Status**: patch ready
- **Notes**: `fixPartners` normalises "N partner/partnera" and syncs title/description/og numbers with `#bac-stat-partners`/`#bac-stat-countries`; `.dist-socials` wraps. Interim; proper fix in the builder. Verify live after deploy.

### BAC-33 - /pepeo warning heading unreadable
- **Priority**: Medium
- **Channel**: CSS/JS + Builder
- **Status**: patch ready
- **Notes**: `.warning h4` colour `#b3530a` on `#fff8f0` (contrast ~4.9:1). Interim; proper fix in the builder. Verify live after deploy.

### BAC-34 - /katalog still advertises CF101 (out of stock)
- **Priority**: Medium
- **Channel**: CSS/JS + Builder
- **Status**: patch ready
- **Notes**: `fixCatalogCopy` (runs before `fixCatalog`) renames the "DC101 & CF101" card to "DC101 za AdBlue" with AdBlue-only copy and "FC101 & SC101" to "FC101 i SC101" (store names). `PRODUCTS` has both old and new keys. Interim; proper fix is editing the static /katalog HTML. Verify live after deploy.

### BAC-35 - Homepage promises online ordering while orders are blocked
- **Priority**: High
- **Channel**: CSS/JS + Builder
- **Status**: patch ready
- **Notes**: `fixOrderLine` replaces the hero line "Poručite online – dostava na adresu!" with "Poručite telefonom ili putem WhatsApp-a – dostava na adresu!" while `ORDERS_BLOCKED` is true. Set `ORDERS_BLOCKED = false` when the order block is removed. Interim; proper fix in the builder. Verify live after deploy.

### BAC-39 - Cookie consent banner gating the Meta pixel
- **Priority**: High
- **Channel**: JS/CSS + GHL head setting
- **Status**: patch ready
- **Notes**: `fixConsentBanner` shows `#bac-consent` until a choice is stored in localStorage `bac_consent` (`granted`/`denied`). The head snippet must call `fbq('consent', ...)` from that key before `fbq('init')`. "Prihvatam" grants consent and sends the suppressed PageView. Footer link "Podešavanja kolačića" (after "Politika privatnosti") reopens the banner. Verify live after deploy and in Meta Events Manager.

### BAC-40 - Header dropdowns do not open on touch tablets
- **Priority**: Medium
- **Channel**: CSS/JS
- **Status**: patch ready
- **Notes**: Tap on `.n-dd > span` toggles `.bac-open` (width > 860px); a tap elsewhere closes. Below 861px menus stay flattened (BAC-19). Verify on a 1024px touch device.

### BAC-41 - Meta pixel conversion events
- **Priority**: Medium
- **Channel**: JS
- **Status**: patch ready
- **Notes**: Contact, Lead (once per load), AddToCart, ViewContent, InitiateCheckout via `window.fbq`; consent is enforced by fbq. `parseRsd` converts "20.825 din" / "din.20825.00" / "1.250,50 din". Verify in Meta Events Manager (test events).

### BAC-42 - Builder copies of the patches
- **Priority**: Medium
- **Channel**: Builder (paste site/pages/*.html)
- **Status**: done 2026-11-27 (all 13 pages published, verified with scripts/verify_pages.py)
- **Notes**: The 13 files in `site/pages/` now contain the runtime fixes of `custom.js`/`custom.css` as page source: nav "Korpa" link (`data-bac-cart`), Serbian footer and contact-form legal links, BAC-17/18/19/28 CSS (+ BAC-16 hero on home, BAC-22 buttons on katalog), home order line (BAC-35), katalog cards (out-of-stock cards removed, AdBlue/FC101 copy, product buttons), partneri Serbian plurals, pepeo warning heading colour. `custom.js` stays compatible (checks for existing markup). Needs pasting into each page in the builder and Publish; see `site/pages/README.md`.

### BAC-43 - Contact forms sent nothing
- **Priority**: High
- **Channel**: custom.js + GHL form "Kontakt Bac101" (MFkmm0K1Hc0UzzWDRlCy)
- **Status**: done 2026-11-27 (live c5aaa67; form_embed.js dropped, frame height set by width)
- **Notes**: The cards on the homepage and /kontakt were static HTML; "Pošalji" had no submit logic and the GHL form had zero submissions. Its submit endpoint needs a Turnstile token, so custom.js (`fixContactForm`) swaps each `.ct-card` for the embedded GHL form (no form_embed.js: it hid the frame when the size message came first). Form fixed in the form builder: policy links were example.com (now bac101.rs, Serbian text), email notification on (to bac.101dpfcleaner@gmail.com), thank-you message in Serbian instead of an empty redirect.

### BAC-44 - Terms said euros and prepayment
- **Priority**: Medium
- **Channel**: Builder (/terms-conditions) + custom.js
- **Status**: done 2026-11-27
- **Notes**: Section 4 now says dinars (RSD) and cash on delivery; section 3 no longer says orders wait for payment. Checkout country "Serbia" shown as "Srbija" (custom.js LABELS).

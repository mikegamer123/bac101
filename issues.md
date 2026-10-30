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

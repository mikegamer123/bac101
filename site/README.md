# bac101 interim site patches

Served via jsDelivr, loaded by `header-snippet.html`. All are INTERIM; proper fixes go in the GHL builder.
Evidence fetched 2026-10-29.

| ID | File | Selector | Evidence |
|---|---|---|---|
| BAC-02 | css | `.hl-product-detail-product-price` | `/product-details/product/6995ede838475b6bfe4dcf25`: `<p class="hl-product-detail-product-price">€75.00</p>`; site CSS sets `color:var(--white)` (`--white:#ffffff`). Patched to `#111` (also used in the page CSS). |
| BAC-17 | css | `#b101 .vid-wrap`, `#b101 .vid-wrap iframe`, plus generic youtube/vimeo iframes | Home `/`: `<div class="vid-wrap"><iframe src="https://www.youtube.com/embed/vA0cOvatyuo" ...>`. Gets max-width:100% and 16/9. `overflow-x:hidden` safety net is commented out in the CSS. |
| BAC-16 (partial) | css | `#b101 .h-left`, `.h-left-in` (inside grid `#b101 .h`) | Home `/`: `.h-left{padding:80px 64px}`, `.h-left-in{max-width:480px}`. At 641-1024px adds 32px side padding and word-wrap. **Hero image lazy-loading is a Builder fix** (late JS cannot fix it). |
| BAC-12 | js | `link[rel=canonical]` | Home already has `<link rel="canonical" href="https://bac101.rs/">`; JS adds one only when missing. Real fix: server-side redirect in GHL. |
| BAC-10 | js | `a[href^="tel:"]` with two numbers in text | Product page: `<a id="button-fvSXmeIoMT_btn" href="tel:+381 63268391" aria-label="+381 621978511 &amp; +381 63268391">` (a GHL button, text spread over spans). Split into `tel:+381621978511` and `tel:+38163268391`. Home footer already has separate anchors (untouched). Idempotent via `data-bac-split`. |
| BAC-24 | js | text nodes `din.N.NN` | GHL prints RSD as `din.20825.00` (product, list, cart, drawer, checkout). Rewritten to `20.825 din`; store `€0.00` placeholder -> `0 din`. |
| BAC-25 | js | `LABELS`, `fixLabels`, `fixLegalLinks` | Remaining English: Payment, Coupon, Show more/less, `Qty: n`, `100% Secure & Safe Payments`, `All Rights Reserved`, `Terms & Conditions`. |
| BAC-26 | js | `select[name="country"]` on /checkout | Starts at `""`; set to `RS` once per page load and fire input/change for Vue. |
| BAC-27 | css | `.cart-summary-heading-container`, `.hl-cart-heading`, `.chevron.mobile`, `.edit-cart` | <=640px: 26px heading wrapped and chevron overlapped "Izmeni korpu". 20px heading, flex row. |
| BAC-28 | css | `nav.n .n-links`, `nav.bac-nav .n-links` | <=860px: scrollbar looked like an underline; hidden, right-edge mask fade added. |
| BAC-29 | css+js | `.hl-product-list-item-details .image-wrapper img`, `#product-list-pagination` | Tall bottles cropped (cover) -> contain. Pager hidden when "Strana 1 / 1". |
| BAC-30 | js | `.product-variant` | Bare digits ("25") -> "25 pranja". |
| BAC-31 | js+css | `.hl-checkout-btn` on /cart | Hidden (`.bac-hidden`) while "Vaša korpa je prazna" is on the page. |
| BAC-32 | js+css | `.partner-count`, `.city-count`, `#bac-stat-*`, `.dist-socials` | Serbian plural; title/description/og numbers synced with stats; social buttons wrap. |
| BAC-33 | css | `.warning h4` on /pepeo | Orange heading on #fff8f0 unreadable -> `#b3530a`. |
| BAC-34 | js | `.grid .card .card-name`, `.card-code`, `.card-desc` on /katalog | CF101 is out of stock (`content/prices.md`); store sells "DC101 za AdBlue" and "FC101 i SC101". `fixCatalogCopy` rewrites the two cards (idempotent on current name); `PRODUCTS` keeps old and new keys. |
| BAC-35 | js | text node "Poručite online – dostava na adresu!" on `/`, `/glavna` | Orders are blocked (`ORDERS_BLOCKED`), so the hero line becomes "Poručite telefonom ili putem WhatsApp-a – dostava na adresu!". Set `ORDERS_BLOCKED = false` with the order block. |
| BAC-36 | css | `#section-akMPQ975W4` (/katalog), `#section-12sa5qbPON` (/terms-conditions), `#section-mPpw4s6out` (/privacy-policy) | Each page ends with an 807px copy of the home hero after the footer. Hidden; delete the sections in the builder. |
| BAC-37 | css/js | `#button-tbTbiszUH0_btn`, `.show-more`, `a[data-bac-split]` | Envelope icon hidden at 641-1024px (it wrapped onto its own line), 10px tap padding on "Prikaži još", split phone links lose their 6px left margin. |
| BAC-38 | css | `nav.n .n-links:not(:has([data-bac-cart]))::after` | Same-styled "Korpa" placeholder until the JS link exists, so the centred menu does not shift. Padding needs !important: the page CSS resets `#b101nav *::after` padding. Verified identical item positions at 1366/1024/375. |
| BAC-39 | js+css | `#bac-consent`, `bac_consent` in localStorage, `[data-bac-consent-open]` | Cookie banner appended to `body` (survives GHL re-renders, re-inserted by `run()`); click listener registered once. The head snippet reads `bac_consent` before `fbq('init')`; Prihvatam -> `fbq('consent','grant')` + PageView. Footer link "Podešavanja kolačića" reopens it. |
| BAC-40 | js+css | `nav.n .n-dd > span`, `.n-dd.bac-open` | Dropdowns opened on :hover only; tap toggles `bac-open` (>860px only; <=860px menus stay flattened, BAC-19). |
| BAC-41 | js | `fbq` events, `parseRsd` | Contact (tel/mailto/wa.me/viber, footer email button), Lead ("Pošalji" with valid email + phone, once), AddToCart, ViewContent (/product-details), InitiateCheckout (/checkout). All guarded by `window.fbq`. |

Note: the split buttons lose GHL button styling classes only partly (anchors are cloned shallowly, so classes stay but inner spans are replaced by plain text); check visually.

## Deploy
1. Push to `main`. 2. Purge both URLs in `header-snippet.html` (purge.jsdelivr.net). 3. Hard-reload.

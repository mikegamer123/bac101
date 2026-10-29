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

Note: the split buttons lose GHL button styling classes only partly (anchors are cloned shallowly, so classes stay but inner spans are replaced by plain text); check visually.

## Deploy
1. Push to `main`. 2. Purge both URLs in `header-snippet.html` (purge.jsdelivr.net). 3. Hard-reload.

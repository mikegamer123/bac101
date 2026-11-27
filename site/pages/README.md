# site/pages - GHL custom-code sources

One file per page: the exact GoHighLevel "Custom HTML/Javascript" source of that page, exported from `__NUXT_DATA__` on 2026-11-26 and then patched with the builder copies of the `site/custom.js` / `site/custom.css` fixes (BAC-42), so each page is correct even without `custom.js`.

## Deploy

1. Copy the whole content of the file.
2. In the GHL page builder open the page, select the Custom HTML element > Open Code Editor.
3. Select all, paste, Save.
4. Save the page, then Publish.

## Rule for Rivali

Always start from these files, never from older copies or from a stale editor tab (the ATM Performance incident: an old copy overwrote live changes). If the live page was edited in the builder since 2026-11-26, re-export it first and merge.

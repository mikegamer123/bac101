# bac101.rs — GoHighLevel site fixes

Site: https://bac101.rs, hosted on GoHighLevel (website "Bac101", sub-account location `Jns38Sxc2dLAdqiwTeCO`).
Dashboard: https://app.gohighlevel.com/v2/location/Jns38Sxc2dLAdqiwTeCO/dashboard

## Layout
- `issues.md` — the tracker (BAC-01..). Every change references an issue ID; update its Status when done.
- `docs/problemi-izvorni.txt` — the original problem list (Serbian).
- `site/custom.css`, `site/custom.js` — global patches, served via jsDelivr from GitHub and loaded by one tag in the GHL site header (`site/header-snippet.html`). Deploy = push, then purge the jsDelivr cache.
- `content/` — text drafts (legal pages, product copy) before they are applied in GHL.
- `scripts/audit.py` — crawls the live site and checks each issue; `python -I scripts/audit.py`. Run it after every deploy.

## Change channels (cheapest first)
1. **GHL MCP** (`highlevel` in `.mcp.json`, OAuth): products/prices, redirects, blogs, media, custom values. No page-builder content.
2. **CSS/JS** in `site/`: interim visual/behaviour patches only; the proper fix goes in the builder.
3. **Builder via the in-app browser**: buttons, links, menus, page titles/SEO, headings, site settings. The dashboard is slow: batch edits per page and save once.

## Rules
- Verify every fix on the live site (audit script or browser) before marking it done.
- Site language is Serbian (Latin script); keep diacritics (č, ć, š, ž, đ).
- Ask before publishing pages, changing prices or anything customer-visible in GHL.

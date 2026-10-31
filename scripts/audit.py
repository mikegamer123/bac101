#!/usr/bin/env python3
"""Crawl bac101.rs and verify the issues in issues.md (BAC-01..BAC-17).

Standard library only. Usage: python -I scripts/audit.py [--base URL] [--json PATH]
Exit code 1 if any check FAILs.
"""
import argparse
import json
import re
import sys
import time
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.parse import urljoin, urlparse, urldefrag
from urllib.request import Request, urlopen

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
TIMEOUT = 20
MAX_PAGES = 60
REQUIRED = ["/", "/glavna", "/kontakt", "/studija", "/videi", "/istorija",
            "/kako-radi", "/bac101", "/cart", "/checkout", "/robots.txt",
            "/sitemap.xml"]
# ASSUMED: the catalog URL is not stated in the source; probe common slugs.
CATALOG_GUESSES = ["/products-list", "/katalog", "/proizvodi", "/products", "/store", "/shop", "/prodavnica"]
EXPECTED_PRODUCTS = 3
CATALOG_SLUGS = {p.strip("/") for p in CATALOG_GUESSES}
SKIP_EXT = re.compile(r"\.(jpe?g|png|gif|webp|svg|ico|css|js|pdf|zip|mp4|woff2?|ttf)$", re.I)
BUY_TERMS = ["add to cart", "dodaj u korpu", "kupi", "buy now"]


# ---------------------------------------------------------------- fetching
def fetch(url):
    req = Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    try:
        with urlopen(req, timeout=TIMEOUT) as r:
            status, final, ctype = r.status, r.geturl(), r.headers.get("Content-Type", "")
            body = r.read().decode(r.headers.get_content_charset() or "utf-8", "replace")
    except HTTPError as e:
        status, final, ctype = e.code, e.geturl(), e.headers.get("Content-Type", "")
        body = e.read().decode("utf-8", "replace")
    except Exception as e:  # network error, timeout
        return {"url": url, "status": 0, "final": url, "ctype": "", "body": "", "error": str(e)}
    return {"url": url, "status": status, "final": final, "ctype": ctype, "body": body}


# ---------------------------------------------------------------- parsing
class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.h1 = []
        self.canonical = None
        self.meta_desc = False
        self.links = []      # {"href", "text"}
        self.imgs = []       # {"src", "loading", "before_h1"}
        self.iframes = []
        self.videos = 0
        self.text = []
        self.attr_values = []
        self._in_title = False
        self._h1 = None
        self._skip = 0
        self._a = None
        self._seen_h1 = False

    def handle_starttag(self, tag, attrs):
        a = {k: (v or "") for k, v in attrs}
        self.attr_values.extend(a.values())
        if tag in ("script", "style"):
            self._skip += 1
        elif tag == "title":
            self._in_title = True
        elif tag == "h1":
            self._h1 = []
            self._seen_h1 = True
        elif tag == "a" and "href" in a:
            self._a = {"href": a["href"], "text": []}
        elif tag == "img":
            self.imgs.append({"src": a.get("src", a.get("data-src", "")),
                              "loading": a.get("loading", "").lower(),
                              "before_h1": not self._seen_h1})
        elif tag == "iframe":
            self.iframes.append(a)
        elif tag == "video":
            self.videos += 1
        elif tag == "link" and "canonical" in a.get("rel", "").lower():
            self.canonical = a.get("href", "")
        elif tag == "meta" and a.get("name", "").lower() == "description" and a.get("content", "").strip():
            self.meta_desc = True

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self._skip = max(0, self._skip - 1)
        elif tag == "title":
            self._in_title = False
        elif tag == "h1" and self._h1 is not None:
            self.h1.append(" ".join("".join(self._h1).split()))
            self._h1 = None
        elif tag == "a" and self._a is not None:
            self._a["text"] = " ".join("".join(self._a["text"]).split())
            self.links.append(self._a)
            self._a = None

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._skip:
            return
        self.text.append(data)
        if self._h1 is not None:
            self._h1.append(data)
        if self._a is not None:
            self._a["text"].append(data)


def parse_page(res):
    p = PageParser()
    p.feed(res["body"])
    text = " ".join(" ".join(p.text).split())
    return {
        "status": res["status"], "final": res["final"], "title": " ".join(p.title.split()),
        "h1": p.h1, "canonical": p.canonical, "meta_desc": p.meta_desc, "links": p.links,
        "imgs": p.imgs, "iframes": p.iframes, "videos": p.videos, "text": text,
        "attr_blob": " ".join(p.attr_values),
    }


# ---------------------------------------------------------------- helpers
def path_of(url):
    return urlparse(url).path or "/"


def is_product(url):
    return "/product-details/" in path_of(url).lower()


def is_catalog(url):
    return path_of(url).strip("/").split("/")[-1].lower() in CATALOG_SLUGS


def same_host_links(page, base_host):
    out = []
    for l in page["links"]:
        h = l["href"].strip()
        if not h or h.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        u = urldefrag(urljoin(page["final"], h))[0]
        pu = urlparse(u)
        if pu.scheme in ("http", "https") and pu.netloc.lower().replace("www.", "", 1) == base_host \
                and not SKIP_EXT.search(pu.path):
            out.append(u)
    return out


def digits_norm(s):
    d = re.sub(r"\D", "", s)
    if d.startswith("00"):
        d = d[2:]
    elif d.startswith("0"):
        d = "381" + d[1:]
    return d


def crawl(base):
    base = base.rstrip("/")
    host = urlparse(base).netloc.lower().replace("www.", "", 1)
    queue = deque(urljoin(base + "/", p.lstrip("/")) for p in REQUIRED)
    queue.extend(urljoin(base + "/", p.lstrip("/")) for p in CATALOG_GUESSES)
    seen, raw, pages = set(), {}, {}
    sitemap_done = False
    while queue and len(raw) < MAX_PAGES:
        batch = []
        while queue and len(raw) + len(batch) < MAX_PAGES:
            u = queue.popleft()
            if u not in seen:
                seen.add(u)
                batch.append(u)
        if not batch:
            break
        with ThreadPoolExecutor(max_workers=8) as ex:
            results = list(ex.map(fetch, batch))
        for r in results:
            raw[r["url"]] = r
            if r["status"] != 200 or "text/html" not in r["ctype"].lower() and not r["body"].lstrip().startswith("<"):
                continue
            if r["url"].endswith(("robots.txt", "sitemap.xml")):
                continue
            pg = parse_page(r)
            pages[r["url"]] = pg
            links = same_host_links(pg, host)
            prod = [u for u in links if is_product(u) or is_catalog(u)]
            for u in reversed(prod):          # products/catalogs first
                if u not in seen:
                    queue.appendleft(u)
            if path_of(r["url"]) == "/":      # home links, then sitemap
                queue.extend(u for u in links if u not in seen)
        if not sitemap_done and base + "/sitemap.xml" in raw:
            sitemap_done = True
            for loc in re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", raw[base + "/sitemap.xml"]["body"]):
                if urlparse(loc).netloc.lower().replace("www.", "", 1) == host:
                    queue.append(loc)
    return base, raw, pages


# ---------------------------------------------------------------- checks
# Each check(ctx) -> (status, [evidence]); status in PASS/FAIL/MANUAL.
def get_page(ctx, path):
    return ctx["pages"].get(urljoin(ctx["base"] + "/", path.lstrip("/")))


def product_pages(ctx):
    return {u: p for u, p in ctx["pages"].items() if is_product(u)}


def check_buy_button(ctx):
    prods = product_pages(ctx)
    if not prods:
        return "MANUAL", ["no product pages discovered (check may be blind)"]
    bad, ok = [], []
    for u, p in prods.items():
        blob = (p["text"] + " " + p["attr_blob"]).lower()
        (ok if any(t in blob for t in BUY_TERMS) else bad).append(u)
    if bad:
        return "FAIL", ["%d/%d product pages without buy/add-to-cart text, e.g. %s" % (len(bad), len(prods), bad[0])]
    return "PASS", ["all %d product pages contain a buy term" % len(prods)]


def check_rsd_vat(ctx):
    prods = product_pages(ctx)
    if not prods:
        return "MANUAL", ["no product pages discovered"]
    rx = re.compile(r"\brsd\b|\bdin\b|dinar|pdv|dostav|isporuk", re.I)
    bad = [u for u, p in prods.items() if not rx.search(p["text"])]
    if bad:
        return "FAIL", ["%d/%d product pages lack RSD/PDV/dostava text, e.g. %s" % (len(bad), len(prods), bad[0])]
    return "PASS", ["all %d product pages mention RSD/PDV/dostava" % len(prods)]


def check_example_links(ctx):
    hits = [(u, l["href"]) for u, p in ctx["pages"].items() for l in p["links"]
            if "example.com" in l["href"].lower()]
    if hits:
        return "FAIL", ["%d link(s) to example.com, e.g. %s -> %s" % (len(hits), hits[0][0], hits[0][1])]
    return "PASS", ["no example.com links on %d pages" % len(ctx["pages"])]


def _find(ctx, needle, title_only=False):
    n = needle.lower()
    return [u for u, p in ctx["pages"].items()
            if n in p["title"].lower() or (not title_only and n in p["text"].lower())]


def check_rivali(ctx):
    hits = _find(ctx, "rivali digital")
    if hits:
        return "FAIL", ["'Rivali Digital' on %s (kontakt title: %r)" % (hits[0], (get_page(ctx, "/kontakt") or {}).get("title"))]
    return "PASS", ["'Rivali Digital' not found on %d pages" % len(ctx["pages"])]


def check_hans_muller(ctx):
    hits = _find(ctx, "hans muller")
    if hits:
        return "FAIL", ["'Hans Muller' on %s" % ", ".join(hits[:3])]
    return "PASS", ["'Hans Muller' not found on %d pages" % len(ctx["pages"])]


def check_videi(ctx):
    p = get_page(ctx, "/videi")
    if not p:
        return "FAIL", ["/videi did not return an HTML 200 page"]
    vid = p["videos"] + sum(1 for f in p["iframes"]
                            if re.search(r"youtube|vimeo|video|wistia|loom", f.get("src", f.get("data-src", "")), re.I))
    probs = []
    if vid == 0:
        probs.append("no <video>/video iframe")
    if "istorija" in p["title"].lower() or any("istorija" in h.lower() for h in p["h1"]):
        probs.append("title/H1 mentions ISTORIJA (title=%r)" % p["title"])
    if probs:
        return "FAIL", ["/videi: " + "; ".join(probs)]
    return "PASS", ["/videi has %d video element(s), title=%r" % (vid, p["title"])]


def check_tel_links(ctx):
    found, bad = 0, []
    num_rx = re.compile(r"\+?\d[\d\s\-/().]{6,}\d")
    for u, p in ctx["pages"].items():
        for l in p["links"]:
            if not l["href"].lower().startswith("tel:"):
                continue
            found += 1
            nums = num_rx.findall(l["text"])
            hd = digits_norm(l["href"][4:])
            if len(nums) > 1:
                bad.append("%s: text has %d numbers (%r)" % (u, len(nums), l["text"]))
            elif nums and digits_norm(nums[0]) != hd:
                bad.append("%s: href %r != text %r" % (u, l["href"], l["text"]))
            elif re.search(r"\s", l["href"].strip()):
                bad.append("%s: whitespace in href %r" % (u, l["href"]))
    if not found:
        return "MANUAL", ["no tel: links found on any page (check may be blind)"]
    if bad:
        return "FAIL", ["%d bad of %d tel: links, e.g. %s" % (len(bad), found, bad[0])]
    return "PASS", ["%d tel: links consistent" % found]


def check_robots_sitemap(ctx):
    base, raw = ctx["base"], ctx["raw"]
    r, s = raw.get(base + "/robots.txt"), raw.get(base + "/sitemap.xml")
    probs = []
    if not r or r["status"] != 200 or not r["body"].strip():
        probs.append("robots.txt empty/missing (status %s)" % (r or {}).get("status"))
    elif "sitemap" not in r["body"].lower():
        probs.append("robots.txt has no Sitemap line")
    locs = re.findall(r"<loc>", (s or {}).get("body", ""))
    if not s or s["status"] != 200 or not s["body"].strip():
        probs.append("sitemap.xml empty/missing (status %s)" % (s or {}).get("status"))
    elif not locs:
        probs.append("sitemap.xml has no <loc> entries")
    if probs:
        return "FAIL", ["; ".join(probs)]
    return "PASS", ["robots.txt references sitemap; sitemap.xml has %d <loc>" % len(locs)]


def check_duplicate_home(ctx):
    h, g = get_page(ctx, "/"), get_page(ctx, "/glavna")
    if not h or not g:
        return "MANUAL", ["/ or /glavna not an HTML 200 page"]
    if urldefrag(g["final"])[0].rstrip("/") == urldefrag(h["final"])[0].rstrip("/"):
        return "PASS", ["/glavna redirects to %s" % g["final"]]
    if h["canonical"] and g["canonical"] and h["canonical"].rstrip("/") == g["canonical"].rstrip("/"):
        return "PASS", ["both canonical -> %s" % h["canonical"]]
    return "FAIL", ["/ and /glavna both 200, canonical %r vs %r" % (h["canonical"], g["canonical"])]


def check_h1(ctx):
    probs = []
    h = get_page(ctx, "/")
    if h and (len(h["h1"]) != 1):
        probs.append("/ has %d H1 %s" % (len(h["h1"]), h["h1"][:3]))
    paths = ["/bac101", "/kontakt", "/kako-radi", "/istorija", "/videi"]
    targets = [(p, get_page(ctx, p)) for p in paths]
    targets += [(path_of(u), p) for u, p in ctx["pages"].items() if is_catalog(u)]
    for name, p in targets:
        if p is not None and len(p["h1"]) != 1:
            probs.append("%s has %d H1" % (name, len(p["h1"])))
    if probs:
        return "FAIL", ["; ".join(probs)]
    return "PASS", ["exactly one H1 on /, catalog and listed pages"]


def check_menu_placeholder(ctx):
    hits = [u for u, p in ctx["pages"].items() if any("#new-menu-item" in l["href"] for l in p["links"])]
    if hits:
        return "FAIL", ["'#new-menu-item' link on %d page(s), e.g. %s" % (len(hits), hits[0])]
    return "PASS", ["no '#new-menu-item' links on %d pages" % len(ctx["pages"])]


def check_catalog_paging(ctx):
    cats = {u: p for u, p in ctx["pages"].items() if is_catalog(u)}
    if not cats:
        return "MANUAL", ["catalog page not found (guessed %s; ASSUMED)" % ", ".join(CATALOG_GUESSES)]
    for u, p in cats.items():
        paged = [l["href"] for l in p["links"] if re.search(r"[?&]page=\d|/page/\d|[?&]p=\d", l["href"])]
        nprod = len({urldefrag(urljoin(p["final"], l["href"]))[0] for l in p["links"] if is_product(l["href"])})
        if paged:
            return "FAIL", ["%s lists %d products and has paging link %s" % (u, nprod, paged[0])]
        # GHL paginates client-side ("Sledeća" button), so count products in the first page instead.
        if nprod and nprod < EXPECTED_PRODUCTS:
            return "FAIL", ["%s shows %d of %d products on the first page (paginated)" % (u, nprod, EXPECTED_PRODUCTS)]
    return "PASS", ["catalog page(s) list all products: %s" % ", ".join(cats)]


def check_hero_lazy(ctx):
    probs = []
    for path in ("/", "/glavna"):
        p = get_page(ctx, path)
        if not p:
            continue
        if not p["imgs"]:
            probs.append("%s: no <img> found (check may be blind)" % path)
            continue
        early = [i for i in p["imgs"][:3] + [i for i in p["imgs"] if i["before_h1"]] if i["loading"] == "lazy"]
        if early:
            probs.append("%s: lazy img %s" % (path, early[0]["src"][:80]))
    lazy = [x for x in probs if "lazy img" in x]
    if lazy:
        return "FAIL", lazy[:2]
    if probs:
        return "MANUAL", probs
    return "PASS", ["first 3 images / images before first H1 are not lazy"]


def check_mobile_overflow(ctx):
    for u, p in ctx["pages"].items():
        for f in p["iframes"]:
            w = re.sub(r"\D", "", f.get("width", "")) if not f.get("width", "").endswith("%") else ""
            if w and int(w) > 375:
                return "FAIL", ["%s: iframe width=%s (> 375px)" % (u, f["width"])]
    return "MANUAL", ["no fixed-width iframe > 375px in HTML; verify at 375px in a browser"]


CHECKS = [
    ("BAC-01", check_buy_button), ("BAC-02", None), ("BAC-03", None), ("BAC-04", None),
    ("BAC-05", check_rsd_vat), ("BAC-06", check_example_links), ("BAC-07", check_rivali),
    ("BAC-08", check_hans_muller), ("BAC-09", check_videi), ("BAC-10", check_tel_links),
    ("BAC-11", check_robots_sitemap), ("BAC-12", check_duplicate_home), ("BAC-13", check_h1),
    ("BAC-14", check_menu_placeholder), ("BAC-15", check_catalog_paging),
    ("BAC-16", check_hero_lazy), ("BAC-17", check_mobile_overflow),
]
MANUAL_NOTES = {
    "BAC-02": "price colour (white on white) needs visual check",
    "BAC-03": "variant prices are not in static HTML; check via products API",
    "BAC-04": "names/descriptions vs variants need human comparison",
}


def blind_warnings(ctx):
    pages = ctx["pages"].values()
    w = []
    if not ctx["pages"]:
        return ["no HTML pages fetched at all; every check is blind"]
    if sum(len(p["links"]) for p in pages) == 0:
        w.append("no <a href> found on any page: link checks (06, 10, 14) may be blind")
    if sum(len(p["h1"]) for p in pages) == 0:
        w.append("no <h1> found on any page: H1 check (13) may be blind")
    if sum(len(p["imgs"]) for p in pages) == 0:
        w.append("no <img> found on any page: hero lazy check (16) may be blind")
    if not any(p["title"] for p in pages):
        w.append("no <title> found on any page: title checks (07, 09) may be blind")
    if not product_pages(ctx):
        w.append("no product pages discovered: checks 01, 05 may be blind")
    return w


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--base", default="https://bac101.rs")
    ap.add_argument("--json", default="audit-report.json")
    args = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    t0 = time.time()
    base, raw, pages = crawl(args.base)
    ctx = {"base": base, "raw": raw, "pages": pages}
    results = {}
    for bid, fn in CHECKS:
        status, ev = fn(ctx) if fn else ("MANUAL", [MANUAL_NOTES[bid]])
        results[bid] = {"status": status, "evidence": ev}
    warnings = blind_warnings(ctx)

    print("Crawled %d URLs (%d HTML pages, %d product) from %s in %.1fs"
          % (len(raw), len(pages), len(product_pages(ctx)), base, time.time() - t0))
    for w in warnings:
        print("WARNING: " + w)
    for bid, r in results.items():
        print("%s %-6s %s" % (bid, r["status"], r["evidence"][0] if r["evidence"] else ""))
    counts = {s: sum(1 for r in results.values() if r["status"] == s) for s in ("PASS", "FAIL", "MANUAL")}
    print("Summary: %(PASS)d PASS, %(FAIL)d FAIL, %(MANUAL)d MANUAL" % counts)

    report = {
        "base": base, "counts": counts, "warnings": warnings, "results": results,
        "pages": {u: {k: v for k, v in p.items() if k not in ("text", "attr_blob")}
                  | {"text_len": len(p["text"])} for u, p in pages.items()},
        "fetched": {u: {"status": r["status"], "final": r["final"], "error": r.get("error")}
                    for u, r in raw.items()},
    }
    with open(args.json, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    return 1 if counts["FAIL"] else 0


if __name__ == "__main__":
    sys.exit(main())

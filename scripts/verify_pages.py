"""Compare the live GHL custom-code source of each page with site/pages/<slug>.html (byte-exact).
Usage: python -I scripts/verify_pages.py [slug ...]   (no args = all pages in site/pages)"""
import json, os, random, re, sys, urllib.request
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site', 'pages')
slugs = sys.argv[1:] or sorted(f[:-5] for f in os.listdir(ROOT) if f.endswith('.html'))
bad = 0
for slug in slugs:
    url = 'https://bac101.rs/%s?v=%d' % (slug, random.randint(1, 10**9))
    html = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})).read().decode('utf-8')
    data = json.loads(re.search(r'id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.S).group(1))
    live = [s for s in data if isinstance(s, str) and len(s) > 800 and ('<style' in s or '<div' in s) and 'fbq(' not in s]
    want = open(os.path.join(ROOT, slug + '.html'), encoding='utf-8').read()
    if any(s == want for s in live):
        print('OK      ', slug)
    else:
        bad += 1
        best = max(live, key=len) if live else ''
        i = next((k for k in range(min(len(best), len(want))) if best[k] != want[k]), min(len(best), len(want)))
        print('MISMATCH', slug, 'live=%d file=%d first diff at %d: live %r / file %r' % (len(best), len(want), i, best[i:i+40], want[i:i+40]))
sys.exit(1 if bad else 0)

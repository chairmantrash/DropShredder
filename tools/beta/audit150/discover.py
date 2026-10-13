"""Bounded public URL discovery; source labels never enter the extension."""
import concurrent.futures
import datetime
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "audit150-discovery"
OUT.mkdir(exist_ok=True)
PART = int(os.environ.get("AUDIT_PART", "0"))
PARTS = 4
POOL = ROOT / "tools/beta/audit150/seed-pool.json"
PRIVATE = re.compile(r"/(?:cart|checkout|account|login|signin|sign-in|payment|admin|wp-admin)(?:/|$)", re.I)
PRODUCT = re.compile(r"/(?:products?|item|items|p)/[^/]+|(?:\.html?|index\.php)(?:\?|$)", re.I)
BLOCKED = re.compile(r"verify you are human|robot check|access denied|domain (?:is )?for sale|buy this domain|sedo parking|website suspended|account suspended|checking your browser|just a moment", re.I)


def public_url(value):
    u = urllib.parse.urlsplit(value)
    if u.scheme not in ["http", "https"] or not u.hostname or u.username or u.password or u.port not in [None, 80, 443] or PRIVATE.search(u.path):
        raise ValueError("Not an authorized public commerce URL")
    if any(not ipaddress.ip_address(a[4][0]).is_global for a in socket.getaddrinfo(u.hostname, u.port or 443, type=socket.SOCK_STREAM)):
        raise ValueError("Nonpublic address refused")
    return u


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        public_url(newurl)
        if urllib.parse.urlsplit(req.full_url).hostname.removeprefix("www.") != urllib.parse.urlsplit(newurl).hostname.removeprefix("www."):
            raise ValueError("Cross-merchant redirect refused")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links = []; self.text = []; self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ["script", "style"]: self.skip += 1
        if tag == "a":
            self.links.extend(v for k, v in attrs if k == "href" and v)
    def handle_endtag(self, tag):
        if tag in ["script", "style"]: self.skip = max(0, self.skip - 1)
    def handle_data(self, data):
        if not self.skip: self.text.append(data)


def fetch(seed):
    row = {**seed, "startedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "status": "UNAVAILABLE", "targets": []}
    try:
        public_url(seed["url"])
        request = urllib.request.Request(seed["url"], headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/156.0.0.0 Safari/537.36"})
        with urllib.request.build_opener(SafeRedirect).open(request, timeout=9) as response:
            row["httpStatus"] = response.status; row["finalUrl"] = response.url
            if "html" not in response.headers.get("Content-Type", ""): raise ValueError("Not HTML")
            payload = response.read(1_500_001)
            if len(payload) > 1_500_000: raise ValueError("HTML exceeds discovery bound")
        html = payload.decode("utf-8", errors="replace")
        parser = Links(); parser.feed(html)
        text = " ".join(parser.text)
        row["htmlSha256"] = hashlib.sha256(payload).hexdigest()
        row["title"] = re.sub("<.*?>", "", (re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S) or ["", ""])[1])[:250]
        if BLOCKED.search(text[:15000]) or BLOCKED.search(row["title"]): raise ValueError("Challenge, parked or suspended page")
        host = urllib.parse.urlsplit(row["finalUrl"]).hostname.removeprefix("www.")
        urls = set()
        for href in parser.links:
            u = urllib.parse.urlsplit(urllib.parse.urljoin(row["finalUrl"], href))
            if u.scheme not in ["http", "https"] or not u.hostname or u.hostname.removeprefix("www.") != host or PRIVATE.search(u.path) or not PRODUCT.search(u.path): continue
            query = urllib.parse.urlencode([(k, v) for k, v in urllib.parse.parse_qsl(u.query) if k in ["products_id", "product_id", "id", "pid", "item", "main_page"]])
            urls.add(urllib.parse.urlunsplit((u.scheme, u.netloc, u.path, query, "")))
        # Availability/selection only. Genuine browser checks commerce again.
        commerce = bool(urls or re.search(r'"@type"\s*:\s*"Product"', html, re.I)) and bool(re.search(r"[$€£¥]|\b(?:USD|EUR|GBP|JPY|add to cart|warenkorb|acheter|comprar|winkelwagen)\b", text, re.I))
        if not commerce: raise ValueError("Current commerce identity unconfirmed")
        row["status"] = "CURRENT_COMMERCE_LEAD"
        selected = sorted(urls, key=lambda x: hashlib.sha256(x.encode()).hexdigest())[:5]
        if not selected: selected = [row["finalUrl"]]
        row["targets"] = [{"url": u, "sourceIds": seed["sourceIds"], "sourceSeedUrl": seed["url"], "host": host, "discoveryTitle": row["title"], "discoveryKind": "observed product link" if urls else "observed public commerce homepage"} for u in selected]
    except Exception as error:
        row["error"] = str(error)[:500]
    row["finishedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return row


if sys.argv[1:] == ["combine"]:
    records = []; seen = set(); per_host = {}; targets = []
    for part in range(PARTS): records.extend(json.loads((OUT / f"discovery-{part}.json").read_text())["records"])
    records.sort(key=lambda r: hashlib.sha256(r["url"].encode()).hexdigest())
    for row in records:
        for target in row["targets"]:
            if target["url"] in seen or per_host.get(target["host"], 0) >= 5: continue
            seen.add(target["url"]); per_host[target["host"]] = per_host.get(target["host"], 0) + 1
            targets.append({"id": f"AUDIT-{len(targets)+1:04}", **target})
    result = {"frozenAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "poolSha256": hashlib.sha256(POOL.read_bytes()).hexdigest(), "sourceCommit": os.environ.get("AUDIT_HEAD"), "targets": targets, "counts": {"seeds": len(records), "leads": sum(r["status"] == "CURRENT_COMMERCE_LEAD" for r in records), "hosts": len(per_host), "pages": len(targets)}}
    (OUT / "frozen-targets.json").write_text(json.dumps(result, indent=2) + "\n")
    (OUT / "discovery-all.json").write_text(json.dumps({"records": records}, indent=2) + "\n")
    print(json.dumps({**result["counts"], "manifestSha256": hashlib.sha256((OUT / "frozen-targets.json").read_bytes()).hexdigest()}))
else:
    seeds = json.loads(POOL.read_text())["seeds"]
    seeds = [r for i, r in enumerate(seeds) if i % PARTS == PART]
    records = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        for row in executor.map(fetch, seeds):
            records.append(row)
            if len(records) % 50 == 0: print(f"part={PART} checked={len(records)} commerce={sum(r['status']=='CURRENT_COMMERCE_LEAD' for r in records)}", flush=True)
            (OUT / f"discovery-{PART}.json").write_text(json.dumps({"part": PART, "poolSha256": hashlib.sha256(POOL.read_bytes()).hexdigest(), "records": records}, indent=2) + "\n")
    print(json.dumps({"part": PART, "seeds": len(records), "commerce": sum(r["status"] == "CURRENT_COMMERCE_LEAD" for r in records)}))

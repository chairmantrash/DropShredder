#!/usr/bin/env python3
"""Inventory Lua protected calls and JS exception handlers in tracked source.

Usage: python3 scripts/audit-protected-calls.py
Run from the repository root; no network or dependencies required.
"""
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXTENSIONS = {".lua", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"}
EXCLUDED = {"node_modules", ".git", ".output", "dist", "build", "coverage"}
PATTERNS = {
    "lua_pcall": re.compile(r"\bpcall\s*\("),
    "lua_xpcall": re.compile(r"\bxpcall\s*\("),
    "js_try": re.compile(r"\btry\s*\{"),
    "js_catch": re.compile(r"\bcatch\s*(?:\([^)]*\))?\s*\{"),
    "js_catch_optional": re.compile(r"\.catch\s*\("),
}
def tracked_files():
    try:
        data = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT)
        return [ROOT / p.decode() for p in data.split(b"\0") if p]
    except (OSError, subprocess.CalledProcessError):
        return list(ROOT.rglob("*"))

def main():
    occurrences = []
    scanned = 0
    for path in tracked_files():
        if path.suffix.lower() not in EXTENSIONS or any(x in EXCLUDED for x in path.relative_to(ROOT).parts):
            continue
        if not path.is_file():
            continue
        scanned += 1
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except (UnicodeError, OSError):
            continue
        for number, line in enumerate(lines, 1):
            for name, pattern in PATTERNS.items():
                for _ in pattern.finditer(line):
                    occurrences.append({"file": path.relative_to(ROOT).as_posix(), "line": number, "kind": name, "excerpt": line.strip()[:180]})
    counts = Counter(item["kind"] for item in occurrences)
    print(json.dumps({"scanned_files": scanned, "counts": {key: counts[key] for key in PATTERNS}, "occurrences": occurrences}, indent=2))
    print("NOTE: lexical matches may include comments/strings; inspect each hit before classification.", file=__import__("sys").stderr)

if __name__ == "__main__":
    main()

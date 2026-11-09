"""Typographic clean-up for generated or hand-written HTML: curly quotes and apostrophes.
Only visible text is touched (never tags, attributes, <script>, <style>, <pre>, <code>).
Usage: python3 _tools/typeset.py file.html [...]   (idempotent)"""
import re, sys

SKIP = ("script", "style", "pre", "code", "textarea")
TAG = re.compile(r"(<!--.*?-->|<[^>]+>)", re.S)

def _fix(text, prev):
    out = []
    for ch in text:
        if ch in "\"'":
            opening = prev in ("", " ", "\n", "\t", "(", "[", "—", "–", "“", "‘")
            if ch == '"':
                ch = "“" if opening else "”"
            else:
                ch = "‘" if opening else "’"
        out.append(ch)
        prev = ch
    return "".join(out), prev

def typeset(html):
    parts, skip, prev = TAG.split(html), 0, ""
    for i, part in enumerate(parts):
        if i % 2:                                   # a tag or comment
            m = re.match(r"<(/?)([a-zA-Z0-9]+)", part)
            if m and m.group(2).lower() in SKIP and not part.endswith("/>"):
                skip += -1 if m.group(1) else 1
                skip = max(skip, 0)
            elif m and m.group(2).lower() in ("p", "div", "li", "h1", "h2", "h3", "br", "td", "th", "dd", "dt", "figcaption", "blockquote"):
                prev = ""                           # a new block starts: next quote opens
            continue
        if skip or i == 0 and not part.strip():
            continue
        # leave the <head> alone: only fix text after <body>
        parts[i], prev = _fix(part.replace("&quot;", '"'), prev)
    return "".join(parts)

def typeset_file(path):
    s = open(path, encoding="utf-8").read()
    b = s.find("<body")
    if b < 0:
        return False
    new = s[:b] + typeset(s[b:])
    if new != s:
        open(path, "w", encoding="utf-8").write(new)
    return new != s

if __name__ == "__main__":
    for f in sys.argv[1:]:
        print(("fixed  " if typeset_file(f) else "ok     ") + f)

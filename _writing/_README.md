# Writing workflow

Posts appear in the **Writing** window on the home page (and get their own page at `/writing/<name>.html`).

1. Copy `example-post.md` to a new file, e.g. `_writing/my-first-post.md` (the file name becomes the URL).
2. Edit the front matter:
   - `title`, `date` (YYYY-MM-DD) and `summary` (one or two sentences, shown in the list and link previews)
   - `category:` **tech** (notes on IT, security and systems) or **personal** (reflection on work, values, and life)
   - `tags:` optional, comma separated (searchable)
   - `draft: true` while it's unfinished; remove the line (or set `false`) to publish.
3. Put images in `images/writing/` and reference them as `![Alt text](/images/writing/name.png)`.
4. Build:  `pip install markdown` (once), then `python3 _tools/build_writing.py`
   Preview drafts locally with `--include-drafts` (never commit that build).
5. Commit `_writing/`, `writing/`, `index.html`, `feed.xml`, `sitemap.xml`, `images/writing/` and push.

The build only rewrites the part of `index.html` between the `writing:` comment markers, so the rest of the page is safe.
Folders starting with an underscore are not published by GitHub Pages, so this file and the script stay private.

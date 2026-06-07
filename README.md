# emilianocar.com

Personal site for Emiliano Carrizosa — developer & IT specialist. Static HTML/CSS,
no build step, served via GitHub Pages on the custom domain in `CNAME`.

## Structure

```
index.html        Home (hero, about, services, work, experience, skills, contact)
about.html        Full profile / long-form background
*.html            Seven project case studies, linked from the Work section of index.html
css/
  minimal.css     Theme for index.html + about.html
  project.css     Theme for the project case-study pages (self-contained)
  style.css       LEGACY — unused, kept for reference only. Safe to delete.
images/           Photos and project screenshots
CNAME             Custom domain (emilianocar.com) — do not remove
```

The Work section in `index.html` links to each project page:

| Page                                    | Project                          |
| --------------------------------------- | -------------------------------- |
| `access-control-system.html`            | Access Control & Audit System    |
| `operational-security-assessment.html`  | Infrastructure Security Audit    |
| `air-gapped-llm.html`                    | Private AI Processing Environment|
| `endpoint-security.html`                | Multi-Layer Endpoint Security    |
| `os-migration.html`                     | Secure Cross-Platform OS Migration|
| `grapheneos.html`                        | Mobile Device Security Hardening |
| `android-mdm.html`                       | Multi-Layer Mobile Device Management |

## Two CSS systems, one look

The site uses two stylesheets that share the same visual language ("Minimal Edition" —
bold editorial monochrome, Archivo + JetBrains Mono, hairline rules, sharp corners,
faint film-grain overlay). They are kept separate only because the page types use
different markup vocabularies:

- **`minimal.css`** styles the home and profile pages (`.hero`, `.section`, `.split`,
  `.rows`, `.svc-list`, `.meta-block`, etc.).
- **`project.css`** styles the case-study pages (`.project-header`, `.content`,
  `.section-box`, `.info-grid`/`.info-card`, `.arch-layer`, `.layer-card`,
  `.phase-card`, `.tech-table`, `.code-block`, etc.). It is self-contained: it
  redefines the theme tokens and base styles so the project pages do **not** load
  `minimal.css` or the legacy `style.css`.

If you change a color, font, or spacing value, change it in **both** files' `:root`
blocks so the two halves of the site stay in sync.

## Design tokens (identical in both stylesheets)

```
--bg        #0A0A0A   page background
--bg-soft   #131313   raised surfaces (cards, boxes)
--text      #F4F2ED   primary text (warm off-white)
--dim       #B8B6B0   body copy
--mute      #6E6C66   labels, meta, mono eyebrows
--line      rgba(244,242,237,0.14)   hairline borders
--sans      'Archivo'          display + body
--mono      'JetBrains Mono'   labels, tags, code, eyebrows
```

Fonts load from Google Fonts (`Archivo` 400–900, `JetBrains Mono` 400–500). Every page
includes the same `<link>` preconnect + stylesheet in its `<head>`.

## Voice

First person, plainspoken, confident. Project write-ups read as "I built / I designed
/ I found," lead with what the thing does and why it matters, and close with one honest
takeaway — not an exhaustive breakdown of every detail. Keep new content in that voice.

## Conventions for project pages

- Nav matches the home nav (`.nav` with Work / Services / About / Contact → `index.html#...`).
- Each page opens with `.project-header` (mono back-link, mono meta line, big uppercase
  `.project-title`, `.project-subtitle`, tag chips) and a hairline divider.
- The footer is full-width and sits **outside** `.container`, matching the home page.
- A small scroll-reveal script at the bottom adds `.reveal` to content blocks; anything
  it doesn't match simply shows immediately, so it's safe to omit.

## Deploy

Push to the GitHub Pages branch. Plain static files, so a build is typically live within
~1–2 minutes; allow up to ~10 for CDN/cache. Hard-refresh (Cmd/Ctrl+Shift+R) to bypass a
stale browser copy. Keep `CNAME` in the repo or the custom domain config is dropped.

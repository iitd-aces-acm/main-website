# ACES-ACM — Society Website Boilerplate

Multi-page static site for **ACES-ACM**, the student society of the Department
of Computer Science & Engineering at IIT Delhi. Same visual design as the
original single-page site, but split into dedicated pages with **all content
driven by JSON files**. Edit the files in `data/` and the pages re-render — no
HTML editing needed.

The CSE Research Symposium is treated as one (flagship) event under the society,
not as the whole site.

## Structure

```
boilerplate/
├── index.html          landing page (a bit of everything)
├── events.html         upcoming + past events (sorted by date)
├── team.html           faculty, organisers, volunteers
├── gallery.html        photo gallery (+ per-event view)
├── css/
│   └── styles.css      all styling (shared across pages)
├── js/
│   └── main.js         render engine: loads JSON, builds nav/footer + page content
├── data/               ← EDIT THESE to change content
│   ├── site.json       brand, nav links, footer (shared on every page)
│   ├── home.json
│   ├── events.json
│   ├── team.json
│   └── gallery.json
└── assets/             drop images here (logos, poster, photos)
```

## How content flows

Each HTML page is a thin shell. It sets `<body data-page="...">` and contains
empty mount points (`<div id="...-mount">`). On load, `js/main.js`:

1. fetches `data/site.json` → renders the shared **navbar** and **footer**
2. reads `data-page` → fetches that page's JSON → renders its sections

To add a speaker, event, gallery photo, etc., just add an object to the array
in the relevant JSON file. To change nav links or footer, edit `site.json`.

### Events and gallery

- **Dates:** each event in `events.json` needs a `"date"` as `YYYY-MM-DD`, or
  `YYYY-MM` if only the month is known. The page sorts events into Upcoming and
  Past Events by that date automatically, so nothing needs moving by hand.
  Optional: `"dateLabel"` to show different text (e.g. `"April 4–5, 2026"`),
  `"time"`, `"venue"`, `"desc"`, `"image"`, and `"badge"` (e.g. `"Flagship"`).
- **Event photos:** give an event an `"id"`, then tag its photos in
  `gallery.json` with the same `"event"` value. The event card links to
  `gallery.html?event=<id>`, which shows only those photos. Events with no tagged
  photos aren't clickable.

### Theme (light / night mode)

Colours live in `css/styles.css`: light mode in `:root`, night mode in
`[data-theme="dark"]`. The moon/sun button in the navbar switches between them and
remembers the choice (localStorage); first-time visitors get their OS setting.
`--accent` is the button/fill blue and `--accent-text` is blue used as text (lighter
at night so it stays readable on dark cards).

## Running it

Because the site loads JSON with `fetch()`, it must be served over HTTP —
opening the `.html` files directly with `file://` will fail (browser CORS).

```bash
# from inside the boilerplate/ folder
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static host works too (GitHub Pages, Netlify, Vercel, nginx, …).

## Assets

`assets/` is currently empty. Add your images and update the paths in the JSON:

- `site.json` → `brand.logos` (navbar logos; each can be a path, or `{ "src": ..., "dark": ... }` to use a different image in night mode)
- `home.json` → `hero.poster` (poster beside the title; empty shows a placeholder)
- `home.json` → `whatWeDo.photos` (list of up to 4 images beside the What We Do links; 1 fills the slot, 2–4 make a collage)
- `team.json` / `home.json` speakers → `image` per person
- `gallery.json` → `image` per item (empty string shows a placeholder tile)

All content is **filler** — replace it with the real thing.

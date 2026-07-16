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
├── about.html          about page
├── events.html         events + full two-day schedule
├── team.html           faculty, organisers, volunteers
├── gallery.html        filterable photo gallery
├── calendar.html       key dates
├── newsletter.html     signup + past issues
├── css/
│   └── styles.css      all styling (shared across pages)
├── js/
│   └── main.js         render engine: loads JSON, builds nav/footer + page content
├── data/               ← EDIT THESE to change content
│   ├── site.json       brand, nav links, footer, socials (shared on every page)
│   ├── home.json
│   ├── about.json
│   ├── events.json
│   ├── team.json
│   ├── gallery.json
│   ├── calendar.json
│   └── newsletter.json
└── assets/             drop images here (logos, poster, photos)
```

## How content flows

Each HTML page is a thin shell. It sets `<body data-page="...">` and contains
empty mount points (`<div id="...-mount">`). On load, `js/main.js`:

1. fetches `data/site.json` → renders the shared **navbar** and **footer**
2. reads `data-page` → fetches that page's JSON → renders its sections

To add a speaker, event, gallery photo, etc., just add an object to the array
in the relevant JSON file. To change nav links or footer, edit `site.json`.

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

- `site.json` → `brand.logos` (navbar logos)
- `home.json` → `hero.image` (poster)
- `team.json` / `home.json` speakers → `image` per person
- `gallery.json` → `image` per item (empty string shows a placeholder tile)

All content is **filler** — replace it with the real thing.

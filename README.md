# TreePage

Source for [Andrew Erbs's site](https://lordofthetrees.github.io/).
It's a Jekyll site on GitHub Pages, with Netlify serverless functions
for contact forms and privacy-conscious visitor analytics.

## Stack

- **Jekyll**, statically hosted on GitHub Pages
- **Netlify Functions** (Node) for the contact/feedback forms and analytics
  ingestion, backed by **Supabase**
- **GitHub Actions**: CI on every PR (Jekyll build, ESLint, `node --test`),
  plus a weekly workflow that pulls and aggregates analytics data

## Features

- Project and document showcase, driven by `_data/`
- Blog (`_posts/`)
- Photo gallery, sourced live from the repo via the GitHub Contents API
- Contact and anonymous feedback forms, with shared abuse guards (honeypot,
  size limits, a global send budget)
- A public analytics dashboard — see [`docs/analytics.md`](docs/analytics.md)
  for the design decisions behind it, several of which look like bugs and
  are not

## Local setup

Prerequisites: Ruby 3.3.0 (see `.ruby-version`), RubyGems, and a C compiler
for native gem extensions. Node 22+ if you're touching the Netlify functions.

```
git clone https://github.com/LordOfTheTrees/lordofthetrees.github.io.git
cd lordofthetrees.github.io
bundle install
bundle exec jekyll serve --host 0.0.0.0 --port 4000
```

Then open `http://localhost:4000/`. The site is served from the domain root.

For the Netlify functions and their tests:

```
npm install
npm run lint
npm test
```

The functions need `SUPABASE_URL` and `SUPABASE_ANON_KEY` to actually reach
a database; the Jekyll site runs fine without them.

## Repo layout

- `_data/projects.yml`, `_data/documents.yml` — the project and document
  showcase content
- `_posts/` — blog posts
- `netlify/functions/` — the serverless functions; `netlify/lib/form-guard.js`
  holds the abuse-guard logic shared by the two email-sending functions
- `assets/js/` — browser-side code (`util.js` loads first on every page as
  `window.TreePage`)
- `_sass/` — all styling; no inline `<style>` blocks
- `tests/` — Node's built-in test runner over the functions and shared JS

## Photography thumbnails

Full-size photos stay in `assets/images/photography/`. The gallery grid and the
homepage banner load JPEGs from `assets/images/photography-thumbs/` (800px on
the long side, about 100 KB). The lightbox still opens the original. Thumbnails
live in that sibling folder so the GitHub contents listing of the originals
does not treat them as extra photos.

After adding or replacing a photo, generate its thumbnail and commit it:

```
npm run photos:thumbs
```

CI runs `npm run photos:thumbs:check` and fails if a thumbnail is missing,
stale, larger than 800px on the long side, or over about 120 KB.

## Documentation

- [`docs/analytics.md`](docs/analytics.md) — how visitor tracking works, the
  published data contract, and the design decisions behind it. **Read this before
  changing the analytics functions, the sync workflow, or the dashboard.** Several
  choices there look like bugs and are deliberate.
- [`docs/telemetry.md`](docs/telemetry.md) — first-party product events
  (`public.treepage_events`). Separate from the visits table.
- [`AGENTS.md`](AGENTS.md) — build, serve, and lint/test commands.

## Deployment

The Jekyll site deploys to GitHub Pages on every push to `main`. The
Netlify functions deploy from the same repo via Netlify, configured in
`netlify.toml`.

## License

Apache 2.0

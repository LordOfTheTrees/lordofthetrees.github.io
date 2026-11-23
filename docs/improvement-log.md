---
layout: default
permalink: /docs/improvement-log.html
sitemap: false
title: Improvement log
description: "Dated record of site improvements, the baseline they started from, and the pre/post checks that follow."
redirect_from:
  - /TreePage/docs/improvement-log.html
---

# Improvement log

Newest entries are first. This is a record of what changed and what to measure. It is not a running A/B test. Active split tests, if any, live in `_data/experiments.yml`.

## 2026-11-23

Review: [issue #20](https://github.com/LordOfTheTrees/lordofthetrees.github.io/issues/20). Traffic is about 3 to 10 visitors a day, too thin to split. `_data/experiments.yml` stays empty. This entry is the pre/post record for `entity_and_hire_path`.

### Baseline

Pulled 2026-11-23, before this change.

- Google had indexed 3 of 15 HTML sitemap URLs: `/`, `/pages/about/`, and `/pages/projects/`. The other 12, including every post, were unknown to Google.
- Search Console, root property, last 7 days and last 28 days: 2 impressions and 0 clicks.
- Telemetry for the prior 7 days: 0 `substack_link_click` events and 0 `substack_subscribe_submit` events.
- The homepage had no hire, consulting, or advisory path. The hero linked only to LinkedIn and GitHub.
- The Netlify functions host also serves a full copy of the site, and Google had crawled it.

### Discovery and indexing

**Person entity.** Every page that uses the default layout now includes a standalone schema.org `Person` block (`_includes/person-jsonld.html`) with `@id` `https://lordofthetrees.github.io/#person`. It carries the name, url, profile image, job title, Raleigh NC postal address, Yale School of Management (MBA, 2026), Penn State (B.S. Computer Engineering and Philosophy, 2016), Navy Surface Warfare Officer service from 2016 to 2024, the `knowsAbout` topics, and `sameAs` links from `_config.yml`. jekyll-seo-tag 2.8 writes its own author object with `@type`, `name`, and `url` only. Putting `@id` on that object would mean another string replace of the plugin output, so the plugin output is unchanged, including the existing `sameAs` injection. The standalone block is the entity with `@id`.

**`/llms.txt`.** A plain-text file at the site root, in the llmstxt.org shape: a short factual summary, then links to About, Projects, Writing, Contact, and each post. jekyll-sitemap 1.4 only emits static `.htm`, `.html`, `.xhtml`, and `.pdf` files, so a `.txt` file is already outside the sitemap. A `sitemap: false` default on `llms.txt` keeps it out if that filter changes.

**Internal links.** The homepage About section links to `/pages/about/`. The homepage nav links to `/pages/contact/`. Each post ends with a Related writing block: up to three other posts that share a category, filled out with newer posts when fewer than three match, plus a link to `/pages/posts/`. The QB series nav is unchanged. Related writing skips posts with `sitemap: false`, so the thin welcome note is not pushed as a recommendation.

**Sitemap.** `/posts/welcome/` has `sitemap: false` rather than a noindex tag. It is a short 2025 placeholder, it is not indexed yet, and the review asked to drop it from the sitemap. The URL still resolves, and the posts archive can still list it. noindex would also hide it after a crawl from that archive; sitemap exclusion is the smaller change and matches the request. PDFs under `assets/documents/` are excluded with a jekyll-sitemap default (`sitemap: false` on that path). After this change the HTML sitemap set is 14 URLs: the welcome post is the one HTML URL removed from the previous 15.

**lastmod.** jekyll-sitemap emits `<lastmod>` for posts from `last_modified_at` or `date`. Posts already have `date`, so they already emitted lastmod. Pages only emit lastmod from `last_modified_at`. The HTML pages that stay in the sitemap now set `last_modified_at: 2026-11-23`.

**Headings.** `/pages/projects/` had two `h1` elements: the layout title and a markdown "My Projects". That markdown heading is now an `h2`, so the page has one `h1`. `/pages/about/` now has `h2` sections for Background, What I work on, and Elsewhere. The sentences under them are unchanged.

**Netlify duplicate.** `netlify.toml` sets `X-Robots-Tag: noindex` on `/*` so the functions host does not compete with the GitHub Pages canonical. The functions directory and the function source are unchanged. The header does not change a function's status code or body. If Netlify also attaches it to `/.netlify/functions/*`, crawlers can skip those JSON URLs; the endpoints still respond.

### Hire path

The homepage ends with a Work with me section: applied AI systems that ship (OctagonELO, Combat Cognition), analytics and measurement (the quarterback evaluation framework), and product strategy for data-heavy tools. One button goes to `/pages/contact/` with `utm_source=lordofthetrees`, `utm_medium=site`, and `utm_campaign=work_with_me`. The homepage nav has a Contact item. The top of `/pages/contact/` now says what to write about, what to include, and that LinkedIn is the fastest route. The contact form, its honeypot, and the anonymous feedback link are the same.

This copy is new. Read it before treating the wording as final.

### Attribution and page weight

Clickable Substack links now carry `utm_source=lordofthetrees`, `utm_medium=site`, and a placement campaign:

- Homepage text link beside the subscribe box: `home_alt`
- `llms.txt`: `llms`

`sameAs` and `author.links` stay the canonical `https://treeflow.substack.com` URL. A campaign query on an identity URL would make the Person entity point at a different address.

The subscribe form still posts to `https://treeflow.substack.com/api/v1/free?nojs=true` with the email field only. That path is not a documented Substack API. A probe from this environment got HTTP 403 for both the plain URL and the same URL with UTM query parameters, which is edge blocking, not proof the API accepts the extra parameters. A hidden field would also change the POST body. Either change could drop a real subscription, so the form action is unchanged. `home_subscribe` is unused for that reason. `track.js` still classifies a `substack.com` host as `substack_link_click`; the UTM query is not part of the host check. The form submit still matches `treeflow.substack.com` in the action.

Homepage images in `assets/images/home/` are still 1600x1000 JPEGs. `scripts/generate-home-images.js` writes an 800px JPEG and an 800px WebP next to each one (`name-800.jpg`, `name-800.webp`). The existing 1600 WebP files stay in place. The picture element uses those widths with `srcset` and `sizes`, and keeps the `width` and `height` attributes. The first selected-work card stays `loading="eager"`. The other home images stay `loading="lazy"`. The hero portrait is unchanged. `npm run photos:thumbs:check` still only looks at `assets/images/photography-thumbs/`. `npm run home:images:check` checks the 800px variants.

### Experiment

Pre/post only. No variant split.

- key: `entity_and_hire_path`
- hypothesis: Person schema, llms.txt, and internal links get >=10 of 14 HTML sitemap URLs indexed and >=20 weekly impressions in Google Search Console; the Work with me section produces the first contact-page views and UTM-attributed Substack clicks
- start: merge date (target 2026-11-24)
- check: 2026-12-21
- baseline: 3 of 15 indexed, 2 impressions and 0 clicks in 7 and 28 days, 0 Substack clicks and submits

If fewer than 10 HTML URLs are indexed on the check date, the gap is off-site authority, not another on-page pass.

### Check next week

Around 2026-11-30, before the formal check:

- Search Console: whether the sitemap has left "pending", and whether indexed HTML URLs have moved past 3.
- Telemetry: any `page_view` whose path is `/pages/contact/`, and any `substack_link_click`. UTM fields on those events are the campaign, not a stored query string. Paths are stored without the query.
- The Netlify host as a referring URL. Recrawl is slow; noindex will not show up the day it ships.
- The Work with me and contact sentences, in case the wording should be tighter.

Do not start a split test on this traffic.

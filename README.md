# FRAME OF MIND

**Stories don't end at the credits.**

A static, single-page archive of the films, TV shows, and anime that changed the way I see things — and the characters, scenes, and ideas I keep carrying.

Built with plain HTML5, CSS3, and vanilla JavaScript. No build step, no backend, no database. It runs directly from the VS Code Live Server extension.

## Run it

1. Open the project folder in VS Code.
2. Right-click `index.html` → **Open with Live Server**.
3. The archive opens at `http://127.0.0.1:5500`.

Any static file server works too (e.g. `python -m http.server`).

## Edit the collection

All media data lives in one file: `data/media.js`. It is a plain JavaScript array of objects — edit it and refresh the browser.

Each entry looks like this:

```js
{
  id: "neon-genesis-evangelion",        // unique slug, also used for deep links (#story/<id>)
  title: "Neon Genesis Evangelion",
  category: "anime",                    // 'movie' | 'tv' | 'anime'
  year: 1995,
  poster: "images/uploads/your-poster.webp", // path inside images/
  summary: "Short description",
  character: "Favourite character",
  scene: "Memorable scene or quote",
  lesson: "What I learned",
  thinking: "How it affects my thinking",
  takeaway: "Personal takeaway",
  featured: true,                       // mark as featured on the home page
  status: "published"                   // 'published' shows it; 'draft' hides it
}
```

Tips:

- `id` must be unique and URL-safe. It is what makes `/#story/<id>` deep links work.
- To add a new poster, drop the image into `images/uploads/` and set `poster` to its path (e.g. `images/uploads/my-poster.jpg`). JPEG, PNG, and WebP are supported.
- Set `status: "draft"` to keep an entry out of the public archive without deleting it.
- `featured: true` adds the "Featured" badge and surfaces it on the featured wall.

## Change the logo

The site logo is `images/logo.svg` (the file you provided, kept byte-for-byte). To swap it, replace that file with your new logo and keep the filename. The nav and footer scale it to fit; its original proportions are preserved (`aspect-ratio: auto` on an `<img>`).

## Structure

```
index.html            public archive (Home, Collection, About)
404.html              custom 404 page
css/style.css         design system, layout, responsive rules
css/404.css           404 styles
js/main.js            bootstrapping: nav, filters, search, counters
js/media.js           cards, story dialog, deep links
js/ui.js              shared DOM helpers
js/404.js             404 page chrome
data/media.js         the collection (single source of truth)
images/               poster art and brand assets
images/uploads/       uploaded posters
```

## Features

- Home, Collection, and About sections with a hero tagline.
- Category filters (All / Movies / TV Shows / Anime) with live counts.
- Instant title search with empty states.
- Story dialog with poster, title, category, year, summary, favourite character, scene/quote, lessons, thinking, and personal takeaway.
- Deep links such as `/#story/arrival` that survive refresh and work with the browser Back button.
- Featured entries, responsive layout, reduced-motion support, keyboard-friendly dialogs, and a skip link.
- Custom 404 page.

## Notes

- No admin dashboard, authentication, uploads API, or backend exists. All edits happen in `data/media.js`.
- The collection is filtered to `status: "published"` on load, so drafts never appear publicly.
- The original 24 entries (titles, posters, years, categories, reflections, quotes, lessons, thinking, and takeaways) are preserved in `data/media.js`.

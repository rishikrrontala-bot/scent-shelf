# Scent Shelf

A small web app for keeping track of a perfume collection: your shelf, a wishlist, and fragrances you blend yourself.

- Bottle cards filled to how much is left, colored by scent family
- Search by name, house or note; filter by family; sort by most worn, rating, running low
- Top / heart / base note pyramid, seasons, rating and optional notes
- "Wore it today" wear log
- **My blends**: formula builder (drops / ml / g with % share), optional note per ingredient, strength, resting time countdown and versioning

It's a single `index.html` with no build step. Your collection is saved in your browser's local storage, so it stays on that device.

## Perfume lookup

Type a perfume name and tap **Look up** to fill in the house, family, concentration, bottle size, notes and seasons automatically.

Lookups go through `api/lookup.js`, a Vercel serverless function that calls Google Gemini (free tier). The Gemini key is stored only as the `GEMINI_KEY` environment variable on Vercel. It is never in this repo or in the page. The function only answers perfume searches and only accepts requests from this site.

// Perfume lookup for Scent Shelf (Vercel serverless function).
// The Google Gemini key lives only in the GEMINI_KEY environment variable on Vercel — never in this repo or the page.
const FAMILIES = ["Floral","Woody","Amber","Fresh","Citrus","Gourmand","Aromatic","Chypre","Leather","Musky"];
const CONCS = ["Parfum","Extrait","EDP","EDT","EDC","Oil"];
const SEASONS = ["Spring","Summer","Fall","Winter"];
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

function allowed(origin) {
  return origin === "https://rishikrrontala-bot.github.io"
    || /^https:\/\/scent-shelf[a-z0-9-]*\.vercel\.app$/.test(origin)
    || origin === "http://localhost:3000";
}

module.exports = async (req, res) => {
  const origin = req.headers.origin || "";
  if (!allowed(origin)) return res.status(403).json({ error: "Not allowed" });
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  if (!process.env.GEMINI_KEY) return res.status(500).json({ error: "Lookup is not configured" });

  const q = String((req.body && req.body.q) || "").trim();
  if (q.length < 2 || q.length > 120) return res.status(400).json({ error: "Search must be 2–120 characters" });

  const prompt = `You are a fragrance reference. Find real, commercially released perfumes matching this search: ${JSON.stringify(q)}
Reply with only a JSON array of up to 3 best matches, most likely first. Each item:
{"name": string, "house": string, "year": number or null,
 "family": one of ${JSON.stringify(FAMILIES)},
 "conc": one of ${JSON.stringify(CONCS)},
 "size": most common bottle size in ml (number),
 "top": comma-separated top notes, "heart": comma-separated heart notes, "base": comma-separated base notes,
 "seasons": subset of ${JSON.stringify(SEASONS)}}
If nothing real matches, reply [].`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    });
    if (r.status === 429) return res.status(429).json({ error: "busy" });
    if (!r.ok) { console.error("gemini error", r.status, (await r.text()).slice(0, 300)); return res.status(502).json({ error: "lookup_failed" }); }
    const data = await r.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
    let list = JSON.parse(text);
    if (!Array.isArray(list)) list = [];
    res.setHeader("Cache-Control", "public, s-maxage=86400");
    return res.status(200).json({ results: list.filter(x => x && x.name).slice(0, 3) });
  } catch (e) {
    console.error("lookup error", e && e.message);
    return res.status(502).json({ error: "lookup_failed" });
  }
};

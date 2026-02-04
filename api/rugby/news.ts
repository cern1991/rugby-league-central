export const config = {
  runtime: "nodejs",
};

type RequestLike = {
  query?: Record<string, string | string[]>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: any) => void;
};

const getQueryValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&ndash;|&mdash;/gi, "-")
    .replace(/&#(\d+);/g, (_, code) => {
      const parsed = Number.parseInt(code, 10);
      return Number.isNaN(parsed) ? "" : String.fromCharCode(parsed);
    });

const padBase64 = (value: string) => {
  let padded = value;
  while (padded.length % 4 !== 0) {
    padded += "=";
  }
  return padded;
};

const decodeGoogleNewsLink = (link?: string | null) => {
  if (!link) return link;
  try {
    const url = new URL(link);
    if (!url.hostname.endsWith("news.google.com")) {
      return link;
    }
    const articleMatch = url.pathname.match(/\/articles\/([^/?]+)/);
    if (!articleMatch?.[1]) return link;
    const encodedPayload = padBase64(articleMatch[1].replace(/-/g, "+").replace(/_/g, "/"));
    const decoded = Buffer.from(encodedPayload, "base64").toString("utf8");
    const httpLinks = decoded.match(/https?:\/\/[^\s"']+/g);
    if (httpLinks?.length) {
      const cleaned = httpLinks
        .map((candidate) => candidate.replace(/\u0000/g, "").trim())
        .filter(Boolean);
      return cleaned.find((candidate) => !candidate.includes("/amp/")) || cleaned[0];
    }
    return link;
  } catch {
    return link;
  }
};

const normalizeNewsArticleUrl = (link?: string | null) =>
  decodeGoogleNewsLink(link) || link || "";

const fetchGoogleNewsRss = async (query: string) => {
  const encoded = encodeURIComponent(query);
  const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-AU&gl=AU&ceid=AU:en`;
  const response = await fetch(rssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      "Accept-Language": "en-AU,en;q=0.9",
    },
  });
  if (!response.ok) return [];
  const rssText = await response.text();
  const itemMatches = rssText.match(/<item>([\s\S]*?)<\/item>/g) || [];
  const items = [];
  for (const itemXml of itemMatches.slice(0, 12)) {
    const rawTitle = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "";
    const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
    const rawSource = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "News";
    if (!rawTitle || !link) continue;
    items.push({
      id: Buffer.from(link).toString("base64").slice(0, 20),
      title: decodeHtmlEntities(rawTitle),
      link: normalizeNewsArticleUrl(link),
      pubDate,
      source: decodeHtmlEntities(rawSource),
      league: query,
      image: null,
    });
  }
  return items;
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  try {
    const league = getQueryValue(req.query?.league) || "NRL";
    let searchQuery = "rugby league";
    const leagueLower = league.toLowerCase();
    if (leagueLower.includes("super")) {
      searchQuery = "Super League rugby";
    } else if (leagueLower.includes("nrl") || leagueLower.includes("national")) {
      searchQuery = "NRL rugby league";
    }

    const apiKey =
      process.env.NEWSDATA_API_KEY ||
      process.env.NEWS_DATA_API_KEY ||
      process.env.NEWS_API_KEY ||
      "";

    if (apiKey) {
      const params = new URLSearchParams({
        apikey: apiKey,
        q: searchQuery,
        language: "en",
        country: "au,gb,fr,nz",
        category: "sports",
      });

      const response = await fetch(`https://newsdata.io/api/1/latest?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        const items = results
          .slice(0, 10)
          .map((item: any) => {
            const link = normalizeNewsArticleUrl(item.link || item.url || "");
            const title = decodeHtmlEntities(item.title || item.description || "Rugby League update");
            return {
              id: Buffer.from(link || title).toString("base64").slice(0, 20),
              title,
              link,
              pubDate: item.pubDate || item.pubDateTZ || item.published_at || new Date().toISOString(),
              source: item.source_id || item.source_name || item.source || "News",
              league,
              image: item.image_url || item.image || null,
            };
          })
          .filter((item: any) => item.title && item.link);
        if (items.length > 0) {
          return res.status(200).json({ response: items });
        }
      }
    }

    const rssItems = await fetchGoogleNewsRss(searchQuery);
    return res.status(200).json({ response: rssItems });
  } catch (error: any) {
    console.error("Serverless news error:", error);
    return res.status(500).json({ message: error?.message || "Failed to load news", response: [] });
  }
}

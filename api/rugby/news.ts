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

    if (!apiKey) {
      return res.status(200).json({ response: [] });
    }

    const params = new URLSearchParams({
      apikey: apiKey,
      q: searchQuery,
      language: "en",
      country: "au,gb,fr,nz",
      category: "sports",
    });

    const response = await fetch(`https://newsdata.io/api/1/latest?${params.toString()}`);
    if (!response.ok) {
      return res.status(200).json({ response: [] });
    }
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

    return res.status(200).json({ response: items });
  } catch (error: any) {
    console.error("Serverless news error:", error);
    return res.status(500).json({ message: error?.message || "Failed to load news", response: [] });
  }
}

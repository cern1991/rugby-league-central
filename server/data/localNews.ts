export interface LocalNewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  league: string;
  image?: string;
}

const makeId = (title: string) => Buffer.from(title).toString("base64").slice(0, 20);

const today = new Date().toISOString();

const makeItem = (league: string, title: string, link: string, source: string, image?: string): LocalNewsItem => ({
  id: makeId(`${league}-${title}`),
  title,
  link,
  pubDate: today,
  source,
  league,
  image,
});

export const LOCAL_NEWS_BY_LEAGUE: Record<string, LocalNewsItem[]> = {
  NRL: [
    makeItem(
      "NRL",
      "Latest NRL headlines",
      "https://news.google.com/search?q=NRL%20rugby%20league",
      "Google News",
      "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=800&q=80"
    ),
    makeItem(
      "NRL",
      "NRL team updates and match prep",
      "https://news.google.com/search?q=NRL%20teams%20rugby%20league",
      "Google News",
      "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=80"
    ),
    makeItem(
      "NRL",
      "NRL injury and squad news",
      "https://news.google.com/search?q=NRL%20injury%20news",
      "Google News",
      "https://images.unsplash.com/photo-1431327924506-0c33329a274d?auto=format&fit=crop&w=800&q=80"
    ),
  ],
  "Super League": [
    makeItem(
      "Super League",
      "Latest Super League headlines",
      "https://news.google.com/search?q=Super%20League%20rugby",
      "Google News",
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80"
    ),
    makeItem(
      "Super League",
      "Super League team news",
      "https://news.google.com/search?q=Super%20League%20team%20news",
      "Google News",
      "https://images.unsplash.com/photo-1499438075715-fc23ef376ab9?auto=format&fit=crop&w=800&q=80"
    ),
    makeItem(
      "Super League",
      "Super League match updates",
      "https://news.google.com/search?q=Super%20League%20match%20news",
      "Google News",
      "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=800&q=80"
    ),
  ],
};

export function getLocalNewsFallback(league?: string): LocalNewsItem[] {
  if (!league) {
    return [...LOCAL_NEWS_BY_LEAGUE.NRL, ...LOCAL_NEWS_BY_LEAGUE["Super League"]];
  }
  const normalized = league.toLowerCase();
  if (normalized.includes("super")) {
    return LOCAL_NEWS_BY_LEAGUE["Super League"];
  }
  return LOCAL_NEWS_BY_LEAGUE.NRL;
}

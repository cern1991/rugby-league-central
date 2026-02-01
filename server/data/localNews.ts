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
      "Broncos unveil refreshed leadership group for 2026 tilt",
      "https://example.com/nrl/broncos-leadership",
      "Rugby League Central",
      "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=800&q=80"
    ),
    makeItem(
      "NRL",
      "Titans backline battle heats up during preseason hit-out",
      "https://example.com/nrl/titans-backline",
      "RLC Insider",
      "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=80"
    ),
    makeItem(
      "NRL",
      "Rabbitohs focus on defence in high-intensity camp",
      "https://example.com/nrl/rabbitohs-defence",
      "League Watch",
      "https://images.unsplash.com/photo-1431327924506-0c33329a274d?auto=format&fit=crop&w=800&q=80"
    ),
  ],
  "Super League": [
    makeItem(
      "Super League",
      "Wigan confirm trial dates ahead of title defence",
      "https://example.com/sl/wigan-trials",
      "Super League Hub",
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80"
    ),
    makeItem(
      "Super League",
      "Hull KR integrate new halves pairing in warm-up clash",
      "https://example.com/sl/hullkr-halves",
      "East Hull Times",
      "https://images.unsplash.com/photo-1499438075715-fc23ef376ab9?auto=format&fit=crop&w=800&q=80"
    ),
    makeItem(
      "Super League",
      "French contingent arrive for Catalans pre-season",
      "https://example.com/sl/catalans-preseason",
      "Perpignan Press",
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

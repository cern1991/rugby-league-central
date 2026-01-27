import type { NewsItem } from "@shared/schema";

const defaultDate = new Date().toISOString();

const createItem = (
  league: string,
  title: string,
  link: string,
  source: string,
  image?: string
): NewsItem => ({
  title,
  link,
  source,
  league,
  pubDate: defaultDate,
  image,
});

const FALLBACK_NEWS_BY_LEAGUE: Record<string, NewsItem[]> = {
  NRL: [
    createItem(
      "NRL",
      "Broncos unveil refreshed leadership group for 2026 tilt",
      "https://example.com/nrl/broncos-leadership",
      "Rugby League Central",
      "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=800&q=80"
    ),
    createItem(
      "NRL",
      "Titans backline battle heats up during preseason hit-out",
      "https://example.com/nrl/titans-backline",
      "RLC Insider",
      "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=80"
    ),
    createItem(
      "NRL",
      "Rabbitohs focus on defence in high-intensity camp",
      "https://example.com/nrl/rabbitohs-defence",
      "League Watch",
      "https://images.unsplash.com/photo-1431327924506-0c33329a274d?auto=format&fit=crop&w=800&q=80"
    ),
  ],
  "Super League": [
    createItem(
      "Super League",
      "Wigan confirm trial dates ahead of title defence",
      "https://example.com/sl/wigan-trials",
      "Super League Hub",
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80"
    ),
    createItem(
      "Super League",
      "Hull KR integrate new halves pairing in warm-up clash",
      "https://example.com/sl/hullkr-halves",
      "East Hull Times",
      "https://images.unsplash.com/photo-1499438075715-fc23ef376ab9?auto=format&fit=crop&w=800&q=80"
    ),
    createItem(
      "Super League",
      "French contingent arrive for Catalans pre-season",
      "https://example.com/sl/catalans-preseason",
      "Perpignan Press",
      "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=800&q=80"
    ),
  ],
  Championship: [
    createItem(
      "Championship",
      "Featherstone target fast start with squad refresh",
      "https://example.com/champ/featherstone",
      "Championship Weekly",
      "https://images.unsplash.com/photo-1521410804344-26f2fe60c336?auto=format&fit=crop&w=800&q=80"
    ),
    createItem(
      "Championship",
      "York secure dual-registration options for 2026",
      "https://example.com/champ/york-dual",
      "Knights News",
      "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=800&q=80"
    ),
    createItem(
      "Championship",
      "New coach outlines bold plan for Widnes revival",
      "https://example.com/champ/widnes-plan",
      "Halton Herald",
      "https://images.unsplash.com/photo-1434648957308-5e6a859697e8?auto=format&fit=crop&w=800&q=80"
    ),
  ],
};

export function getNewsFallbackForLeague(league?: string): NewsItem[] {
  if (!league) {
    return [...FALLBACK_NEWS_BY_LEAGUE.NRL, ...FALLBACK_NEWS_BY_LEAGUE["Super League"]];
  }
  const normalized = league.toLowerCase();
  if (normalized.includes("super")) {
    return FALLBACK_NEWS_BY_LEAGUE["Super League"];
  }
  if (normalized.includes("champ")) {
    return FALLBACK_NEWS_BY_LEAGUE.Championship;
  }
  return FALLBACK_NEWS_BY_LEAGUE.NRL;
}


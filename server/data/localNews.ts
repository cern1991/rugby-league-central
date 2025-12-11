export interface LocalNewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  league: string;
}

const makeId = (title: string) => Buffer.from(title).toString("base64").slice(0, 20);

const today = new Date().toISOString();

const makeItem = (league: string, title: string, link: string, source: string): LocalNewsItem => ({
  id: makeId(`${league}-${title}`),
  title,
  link,
  pubDate: today,
  source,
  league,
});

export const LOCAL_NEWS_BY_LEAGUE: Record<string, LocalNewsItem[]> = {
  NRL: [
    makeItem("NRL", "Broncos unveil refreshed leadership group for 2026 tilt", "https://example.com/nrl/broncos-leadership", "Rugby League Central"),
    makeItem("NRL", "Titans backline battle heats up during preseason hit-out", "https://example.com/nrl/titans-backline", "RLC Insider"),
    makeItem("NRL", "Rabbitohs focus on defence in high-intensity camp", "https://example.com/nrl/rabbitohs-defence", "League Watch"),
  ],
  "Super League": [
    makeItem("Super League", "Wigan confirm trial dates ahead of title defence", "https://example.com/sl/wigan-trials", "Super League Hub"),
    makeItem("Super League", "Hull KR integrate new halves pairing in warm-up clash", "https://example.com/sl/hullkr-halves", "East Hull Times"),
    makeItem("Super League", "French contingent arrive for Catalans pre-season", "https://example.com/sl/catalans-preseason", "Perpignan Press"),
  ],
  Championship: [
    makeItem("Championship", "Featherstone target fast start with squad refresh", "https://example.com/champ/featherstone", "Championship Weekly"),
    makeItem("Championship", "York secure dual-registration options for 2026", "https://example.com/champ/york-dual", "Knights News"),
    makeItem("Championship", "New coach outlines bold plan for Widnes revival", "https://example.com/champ/widnes-plan", "Halton Herald"),
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
  if (normalized.includes("champ")) {
    return LOCAL_NEWS_BY_LEAGUE["Championship"];
  }
  return LOCAL_NEWS_BY_LEAGUE.NRL;
}

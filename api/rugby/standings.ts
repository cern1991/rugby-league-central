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

const SPORTSDB_API_BASE = "https://www.thesportsdb.com/api/v1/json/3";

const LEAGUE_IDS: Record<string, string> = {
  nrl: "4416",
  "super league": "4415",
};

const getQueryValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const normalizeLeagueName = (value?: string | string[]) =>
  (getQueryValue(value) || "NRL").toLowerCase();

async function fetchFromSportsDB(endpoint: string) {
  const res = await fetch(`${SPORTSDB_API_BASE}${endpoint}`);
  if (!res.ok) {
    throw new Error(`SportsDB request failed: ${res.status}`);
  }
  return res.json();
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  try {
    const leagueParam = normalizeLeagueName(req.query?.league);
    const leagueId = leagueParam.includes("super")
      ? LEAGUE_IDS["super league"]
      : LEAGUE_IDS.nrl;

    const data = await fetchFromSportsDB(`/lookuptable.php?l=${leagueId}`);
    if (Array.isArray(data?.table)) {
      const standings = data.table.map((t: any) => ({
        position: Number(t.intRank) || 0,
        team: {
          id: Number(t.idTeam) || 0,
          name: t.strTeam,
          logo: t.strBadge || null,
        },
        games: {
          played: Number(t.intPlayed) || 0,
          win: Number(t.intWin) || 0,
          draw: Number(t.intDraw) || 0,
          lose: Number(t.intLoss) || 0,
        },
        points: {
          for: Number(t.intGoalsFor) || 0,
          against: Number(t.intGoalsAgainst) || 0,
          difference: Number(t.intGoalDifference) || 0,
        },
        pts: Number(t.intPoints) || 0,
        form: (t.strForm || "").replace(/\s+/g, ""),
      }));

      return res.status(200).json({ response: standings });
    }

    return res.status(200).json({ response: [] });
  } catch (error: any) {
    console.error("Serverless standings error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to load standings",
      response: [],
    });
  }
}

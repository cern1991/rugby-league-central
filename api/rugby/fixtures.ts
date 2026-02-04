import {
  buildNrlFixturesFromLocalData,
  buildSuperLeagueFixturesFromLocalData,
  CURRENT_SEASON,
} from "../../server/lib/localData";

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
    const season = getQueryValue(req.query?.season) || CURRENT_SEASON;

    if (leagueParam.includes("super")) {
      return res.status(200).json({ response: buildSuperLeagueFixturesFromLocalData() });
    }

    if (leagueParam.includes("nrl")) {
      return res.status(200).json({ response: buildNrlFixturesFromLocalData() });
    }

    // For non-current seasons fall back to SportsDB season endpoint
    const leagueId = leagueParam.includes("super") ? "4415" : "4416";
    const seasonData = await fetchFromSportsDB(`/eventsseason.php?id=${leagueId}&s=${season}`);

    if (Array.isArray(seasonData?.events)) {
      const events = seasonData.events
        .filter((event: any) => (event.strSport || "").toLowerCase().includes("rugby"))
        .map((event: any) => ({
          id: event.idEvent,
          date: event.dateEvent,
          time: event.strTime,
          teams: {
            home: {
              id: event.idHomeTeam,
              name: event.strHomeTeam,
              logo: event.strHomeTeamBadge || null,
            },
            away: {
              id: event.idAwayTeam,
              name: event.strAwayTeam,
              logo: event.strAwayTeamBadge || null,
            },
          },
          scores: {
            home: event.intHomeScore !== null ? Number(event.intHomeScore) : null,
            away: event.intAwayScore !== null ? Number(event.intAwayScore) : null,
          },
          venue: event.strVenue,
          status: {
            long: event.strStatus || (event.intHomeScore !== null ? "Match Finished" : "Not Started"),
            short: event.strStatus === "Match Finished" ? "FT" : event.strStatus || "NS",
          },
          round: event.intRound,
          league: {
            id: leagueId,
            name: leagueParam.includes("super") ? "Super League" : "NRL",
          },
        }));

      return res.status(200).json({ response: events });
    }

    return res.status(200).json({ response: [] });
  } catch (error: any) {
    console.error("Serverless fixtures error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to load fixtures",
      response: [],
    });
  }
}

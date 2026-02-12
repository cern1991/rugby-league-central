import {
  buildNrlFixturesFromLocalData,
  buildSuperLeagueFixturesFromLocalData,
  CURRENT_SEASON,
} from "../../server/lib/localData.js";

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
    const isSuperLeague = leagueParam.includes("super");
    const leagueId = isSuperLeague ? "4415" : "4416";
    const leagueName = isSuperLeague ? "Super League" : "NRL";

    // Attempt live season feed first, then fall back to local fixtures.
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
            short:
              event.strStatus === "Match Finished"
                ? "FT"
                : event.strStatus === "After Extra Time"
                  ? "AET"
                  : event.strStatus === "Not Started"
                    ? "NS"
                    : event.strStatus || "NS",
          },
          round: event.intRound,
          league: {
            id: leagueId,
            name: leagueName,
          },
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50);

      if (events.length > 0) {
        return res.status(200).json({ response: events });
      }
    }

    if (isSuperLeague) {
      return res.status(200).json({ response: buildSuperLeagueFixturesFromLocalData() });
    }
    return res.status(200).json({ response: buildNrlFixturesFromLocalData() });
  } catch (error: any) {
    console.error("Serverless fixtures error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to load fixtures",
      response: [],
    });
  }
}

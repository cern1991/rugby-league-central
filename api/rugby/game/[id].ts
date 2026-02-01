import {
  LEAGUE_IDS,
  findLocalGameById,
} from "../../../server/lib/localData";

type RequestLike = {
  query: {
    id?: string | string[];
  };
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: any) => void;
};

const SPORTSDB_API_BASE = "https://www.thesportsdb.com/api/v1/json/3";

const getQueryValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

async function fetchFromSportsDB(endpoint: string) {
  const res = await fetch(`${SPORTSDB_API_BASE}${endpoint}`);
  if (!res.ok) {
    throw new Error(`SportsDB request failed: ${res.status}`);
  }
  return res.json();
}

function isRugbyEvent(event: any) {
  if (!event) return false;
  const sport = (event.strSport || "").toLowerCase();
  if (sport.includes("rugby")) return true;
  if (event.idLeague && Object.values(LEAGUE_IDS).includes(String(event.idLeague))) {
    return true;
  }
  if (event.strLeague) {
    const leagueName = event.strLeague.toLowerCase();
    return leagueName.includes("nrl") || leagueName.includes("super league");
  }
  return false;
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  try {
    const rawId = getQueryValue(req.query.id);
    if (!rawId) {
      return res.status(400).json({ message: "Match id is required", response: [] });
    }

    let decodedId = rawId;
    try {
      decodedId = decodeURIComponent(rawId);
    } catch {
      decodedId = rawId;
    }

    const localMatch = findLocalGameById(decodedId);
    if (localMatch) {
      return res.status(200).json({ response: [localMatch] });
    }

    const eventData = await fetchFromSportsDB(`/lookupevent.php?id=${encodeURIComponent(decodedId)}`);
    const event = Array.isArray(eventData?.events) ? eventData.events[0] : null;
    if (!event || !isRugbyEvent(event)) {
      return res.status(200).json({ response: [] });
    }

    return res.status(200).json({
      response: [
        {
          id: event.idEvent,
          date: event.dateEvent,
          time: event.strTime,
          homeTeam: {
            id: event.idHomeTeam,
            name: event.strHomeTeam,
            logo: event.strHomeTeamBadge,
            score: event.intHomeScore,
          },
          awayTeam: {
            id: event.idAwayTeam,
            name: event.strAwayTeam,
            logo: event.strAwayTeamBadge,
            score: event.intAwayScore,
          },
          venue: event.strVenue,
          status: event.strStatus || (event.intHomeScore !== null ? "FT" : null),
          round: event.intRound,
          league: event.strLeague,
          season: event.strSeason,
          description: event.strDescriptionEN,
          video: event.strVideo,
        },
      ],
    });
  } catch (error: any) {
    console.error("Serverless match error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to load match",
      response: [],
    });
  }
}

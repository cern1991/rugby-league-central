import {
  CURRENT_SEASON,
  LEAGUE_IDS,
  findLocalTeamMeta,
  getLocalFixturesForTeam,
  mapLocalFixtureToGame,
  resolveTeamIdentifier,
} from "../../../../server/lib/localData";

type RequestLike = {
  query: Record<string, string | string[]>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: any) => void;
};

const getQueryValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default function handler(req: RequestLike, res: ResponseLike) {
  try {
    const rawId = getQueryValue(req.query.id);
    if (!rawId) {
      return res.status(400).json({ message: "Team id is required", response: [] });
    }

    const resolvedId = resolveTeamIdentifier(rawId);
    if (!resolvedId) {
      return res.status(200).json({ response: [] });
    }

    const teamInfo = findLocalTeamMeta(resolvedId);
    const requestedSeason = getQueryValue(req.query.season) || CURRENT_SEASON;

    if (!teamInfo || requestedSeason !== CURRENT_SEASON) {
      return res.status(200).json({ response: [] });
    }

    const fixtures = getLocalFixturesForTeam(resolvedId, teamInfo.league);
    if (!fixtures || fixtures.length === 0) {
      return res.status(200).json({ response: [] });
    }

    const leagueName = (teamInfo.league || "NRL").toLowerCase().includes("super")
      ? "Super League"
      : "NRL";
    const leagueId = String(LEAGUE_IDS[leagueName] || LEAGUE_IDS["NRL"] || "0");

    const mapped = fixtures
      .map((fixture) => mapLocalFixtureToGame(fixture, leagueName, leagueId))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    return res.status(200).json({ response: mapped });
  } catch (error: any) {
    console.error("Serverless team games error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to load team fixtures",
      response: [],
    });
  }
}

import type { Game } from "../../shared/schema";
import { LOCAL_TEAMS, type LocalTeamInfo } from "../../shared/localTeams";
import { NRL_2026_FIXTURES_BY_TEAM, type LocalFixture } from "../../server/data/localFixtures";
import { SUPER_LEAGUE_MASTER_FIXTURES } from "../../server/data/localSuperLeagueFixtures";

const CURRENT_SEASON = "2026";
const LEAGUE_IDS: Record<string, number> = { nrl: 4416, "super league": 4415 };

const normalizeLeague = (value?: string) => (value || "NRL").toLowerCase();
const normalizeName = (value?: string) => value?.trim().toLowerCase() ?? "";
const simplify = (value?: string) => normalizeName(value).replace(/[^a-z0-9]/g, "");

const findLocalTeamByFragment = (name: string): LocalTeamInfo | undefined => {
  if (!name) return undefined;
  const normalized = normalizeName(name);
  const simplified = simplify(name);
  return LOCAL_TEAMS.find((team) => {
    const teamName = normalizeName(team.name);
    const simplifiedTeam = simplify(team.name);
    return (
      teamName === normalized ||
      teamName.includes(normalized) ||
      normalized.includes(teamName) ||
      simplifiedTeam === simplified ||
      simplifiedTeam.includes(simplified)
    );
  });
};

const createMatchId = (league: string, fixture: LocalFixture) => {
  const safeHome = simplify(fixture.homeTeam) || "home";
  const safeAway = simplify(fixture.awayTeam) || "away";
  return `local-${league}-${fixture.matchNumber}-${safeHome}-${safeAway}`;
};

const mapLocalFixtureToGame = (fixture: LocalFixture, leagueName: string): Game => {
  const leagueKey = normalizeLeague(leagueName);
  const leagueId = LEAGUE_IDS[leagueKey] ?? 0;
  const home = findLocalTeamByFragment(fixture.homeTeam);
  const away = findLocalTeamByFragment(fixture.awayTeam);
  const kickoff = new Date(fixture.dateUtc);

  return {
    id: createMatchId(leagueKey, fixture),
    date: fixture.dateUtc.split("T")[0],
    time: fixture.dateUtc.split("T")[1] || "",
    week: fixture.roundNumber ? `Round ${fixture.roundNumber}` : undefined,
    timestamp: kickoff.getTime(),
    league: {
      id: leagueId,
      name: leagueName,
      season: CURRENT_SEASON,
      logo: home?.league === "Super League" ? home?.logo ?? undefined : home?.league === "NRL" ? home?.logo ?? undefined : undefined,
    },
    teams: {
      home: {
        id: home?.id || fixture.homeTeam,
        name: home?.name || fixture.homeTeam,
        logo: home?.logo || null,
      },
      away: {
        id: away?.id || fixture.awayTeam,
        name: away?.name || fixture.awayTeam,
        logo: away?.logo || null,
      },
    },
    scores: { home: null, away: null },
    venue: fixture.location,
    status: { long: "Not Started", short: "NS" },
  };
};

const buildNrlFixturesFromLocalData = () => {
  const dedup = new Map<string, LocalFixture>();
  Object.values(NRL_2026_FIXTURES_BY_TEAM).forEach((fixtures) => {
    fixtures.forEach((fixture) => {
      const dateKey = fixture.dateUtc.split("T")[0];
      const key = `${dateKey}-${simplify(fixture.homeTeam)}-${simplify(fixture.awayTeam)}`;
      const existing = dedup.get(key);
      if (!existing || existing.dateUtc > fixture.dateUtc) {
        dedup.set(key, fixture);
      }
    });
  });

  return Array.from(dedup.values())
    .map((fixture) => mapLocalFixtureToGame(fixture, "NRL"))
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
};

const buildSuperLeagueFixturesFromLocalData = () =>
  SUPER_LEAGUE_MASTER_FIXTURES.map((fixture) => mapLocalFixtureToGame(fixture, "Super League")).sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
  );

export default function handler(req: any, res: any) {
  try {
    const { league, season } = req.query as { league?: string; season?: string };
    const normalizedLeague = normalizeLeague(league);
    const requestedSeason = season || CURRENT_SEASON;

    let fixtures: Game[] = [];

    if (requestedSeason === CURRENT_SEASON) {
      if (normalizedLeague.includes("super")) {
        fixtures = buildSuperLeagueFixturesFromLocalData();
      } else {
        fixtures = buildNrlFixturesFromLocalData();
      }
    }

    return res.status(200).json({ response: fixtures });
  } catch (error: any) {
    console.error("Serverless fixtures error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to load fixtures",
      stack: error?.stack,
    });
  }
}

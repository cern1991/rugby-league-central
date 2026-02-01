import type { Game } from "../../shared/schema";
import { LOCAL_TEAMS, type LocalTeamInfo } from "../../shared/localTeams";
import { NRL_2026_FIXTURES_BY_TEAM, type LocalFixture } from "../../shared/localFixtures";
import {
  SUPER_LEAGUE_FIXTURES_BY_TEAM,
  SUPER_LEAGUE_MASTER_FIXTURES,
} from "../../shared/localSuperLeagueFixtures";

const LEAGUE_IDS: Record<string, string> = {
  NRL: "4416",
  "Super League": "4415",
};

export const CURRENT_SEASON = "2026";
const LOCAL_GAME_ID_PREFIX = "local-";

const normalizeTeamSlug = (value?: string | number | null) =>
  (value ?? "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const LOCAL_TEAM_INDEX_BY_ID = LOCAL_TEAMS.reduce<Map<string, LocalTeamInfo>>((acc, team) => {
  acc.set(String(team.id), team);
  return acc;
}, new Map());

const LOCAL_TEAM_INDEX_BY_SLUG = LOCAL_TEAMS.reduce<Map<string, LocalTeamInfo>>((acc, team) => {
  const slug = normalizeTeamSlug(team.name);
  if (slug) {
    acc.set(slug, team);
  }
  return acc;
}, new Map());

export const findLocalTeamMeta = (identifier?: string | number | null): LocalTeamInfo | undefined => {
  if (identifier === undefined || identifier === null) return undefined;
  const idKey = String(identifier);
  if (LOCAL_TEAM_INDEX_BY_ID.has(idKey)) {
    return LOCAL_TEAM_INDEX_BY_ID.get(idKey);
  }
  const slug = normalizeTeamSlug(idKey);
  return LOCAL_TEAM_INDEX_BY_SLUG.get(slug);
};

export const resolveTeamIdentifier = (identifier?: string | number | null): string | null => {
  if (identifier === undefined || identifier === null) return null;
  const match = findLocalTeamMeta(identifier);
  return match ? String(match.id) : String(identifier);
};

const toBase64Url = (value: string) =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value: string) => {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
};

const createLocalMatchId = (leagueName: string, matchNumber: number, homeTeam: string, awayTeam: string) => {
  const payload = JSON.stringify({ leagueName, matchNumber, homeTeam, awayTeam });
  return `${LOCAL_GAME_ID_PREFIX}${toBase64Url(payload)}`;
};

const usesPlaceholderKickoffTime = (fixture: LocalFixture) => fixture.dateUtc.includes("T12:00:00");

const shouldReplaceFixture = (current: LocalFixture, candidate: LocalFixture) => {
  const currentPlaceholder = usesPlaceholderKickoffTime(current);
  const candidatePlaceholder = usesPlaceholderKickoffTime(candidate);
  if (currentPlaceholder !== candidatePlaceholder) {
    return currentPlaceholder && !candidatePlaceholder;
  }
  const candidateTime = new Date(candidate.dateUtc).getTime();
  const currentTime = new Date(current.dateUtc).getTime();
  return candidateTime < currentTime;
};

const mapLocalFixtureToGame = (fixture: LocalFixture, leagueName: string, leagueId: string): Game & {
  matchNumber: number;
  legacyId: string;
} => {
  const homeTeam = findLocalTeamMeta(fixture.homeTeam);
  const awayTeam = findLocalTeamMeta(fixture.awayTeam);
  const encodedId = createLocalMatchId(leagueName, fixture.matchNumber, fixture.homeTeam, fixture.awayTeam);

  return {
    id: encodedId,
    date: fixture.dateUtc.split("T")[0],
    time: fixture.dateUtc.split("T")[1] || "",
    timestamp: new Date(fixture.dateUtc).getTime(),
    week: fixture.roundNumber ? `Round ${fixture.roundNumber}` : undefined,
    status: {
      long: "Not Started",
      short: "NS",
    },
    league: {
      id: Number(leagueId),
      name: leagueName,
      logo: homeTeam?.logo || awayTeam?.logo || null,
      season: CURRENT_SEASON,
    },
    country: homeTeam?.country || awayTeam?.country,
    teams: {
      home: {
        id: homeTeam ? String(homeTeam.id) : fixture.homeTeam,
        name: fixture.homeTeam,
        logo: homeTeam?.logo || null,
      },
      away: {
        id: awayTeam ? String(awayTeam.id) : fixture.awayTeam,
        name: fixture.awayTeam,
        logo: awayTeam?.logo || null,
      },
    },
    scores: { home: null, away: null },
    legacyId: `${LOCAL_GAME_ID_PREFIX}${leagueName}-${fixture.matchNumber}-${fixture.homeTeam}-${fixture.awayTeam}`,
    matchNumber: fixture.matchNumber,
  } as Game & { matchNumber: number; legacyId: string };
};

const buildFixturesFromLocalMap = (fixturesByTeam: Record<string, LocalFixture[]>, leagueName: string) => {
  const leagueId = LEAGUE_IDS[leagueName];
  if (!leagueId) return [] as ReturnType<typeof mapLocalFixtureToGame>[];
  const dedup = new Map<string, LocalFixture>();
  Object.values(fixturesByTeam).forEach((fixtures) => {
    fixtures.forEach((fixture) => {
      const dateKey = fixture.dateUtc.split("T")[0];
      const key = `${dateKey}-${fixture.homeTeam}-${fixture.awayTeam}`;
      const existing = dedup.get(key);
      if (!existing || shouldReplaceFixture(existing, fixture)) {
        dedup.set(key, fixture);
      }
    });
  });

  return Array.from(dedup.values())
    .map((fixture) => mapLocalFixtureToGame(fixture, leagueName, leagueId))
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
};

export const buildNrlFixturesFromLocalData = () => buildFixturesFromLocalMap(NRL_2026_FIXTURES_BY_TEAM, "NRL");

export const buildSuperLeagueFixturesFromLocalData = () => {
  const leagueId = LEAGUE_IDS["Super League"];
  if (!leagueId) return [] as ReturnType<typeof mapLocalFixtureToGame>[];
  return SUPER_LEAGUE_MASTER_FIXTURES.map((fixture) =>
    mapLocalFixtureToGame(fixture, "Super League", leagueId)
  ).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
};

export const getLocalFixturesForTeam = (teamId: string, leagueName?: string) => {
  const leagueLower = leagueName?.toLowerCase() || "";
  if (leagueLower.includes("super")) {
    return SUPER_LEAGUE_FIXTURES_BY_TEAM[teamId];
  }
  return NRL_2026_FIXTURES_BY_TEAM[teamId];
};

const transformLocalGameForMatchDetail = (game: any) => {
  if (!game) return null;
  return {
    id: game.id,
    date: game.date,
    time: game.time,
    venue: game.venue,
    status: game.status?.long || "Not Started",
    round: game.week,
    league: game.league?.name || "Rugby League",
    season: game.league?.season ? String(game.league.season) : CURRENT_SEASON,
    homeTeam: {
      id: String(game.teams?.home?.id || ""),
      name: game.teams?.home?.name || "",
      logo: game.teams?.home?.logo || null,
      score: game.scores?.home ?? null,
    },
    awayTeam: {
      id: String(game.teams?.away?.id || ""),
      name: game.teams?.away?.name || "",
      logo: game.teams?.away?.logo || null,
      score: game.scores?.away ?? null,
    },
    description: null,
  };
};

export const findLocalGameById = (eventId: string) => {
  if (!eventId?.startsWith(LOCAL_GAME_ID_PREFIX)) {
    return null;
  }
  const combinedFixtures = [...buildNrlFixturesFromLocalData(), ...buildSuperLeagueFixturesFromLocalData()];

  const directMatch = combinedFixtures.find((fixture: any) => fixture.id === eventId || fixture.legacyId === eventId);
  if (directMatch) {
    return transformLocalGameForMatchDetail(directMatch);
  }
  return null;
};

const LOCAL_GAME_SEARCH_CACHE = (() => {
  const dedup = new Map<string, any>();
  [...buildNrlFixturesFromLocalData(), ...buildSuperLeagueFixturesFromLocalData()].forEach((game) => {
    if (!dedup.has(game.id)) {
      dedup.set(game.id, game);
    }
  });
  return Array.from(dedup.values());
})();

export const searchGames = (query: string) => {
  if (!query) return [];
  const normalized = query.toLowerCase();
  return LOCAL_GAME_SEARCH_CACHE.filter((game) => {
    const home = game.teams?.home?.name?.toLowerCase() || "";
    const away = game.teams?.away?.name?.toLowerCase() || "";
    const league = game.league?.name?.toLowerCase() || "";
    const venue = game.venue?.toLowerCase() || "";
    return (
      home.includes(normalized) ||
      away.includes(normalized) ||
      league.includes(normalized) ||
      venue.includes(normalized)
    );
  }).map((game) => ({
    id: game.id,
    league: game.league?.name || "Rugby League",
    homeTeam: game.teams?.home?.name || "",
    awayTeam: game.teams?.away?.name || "",
    date: game.date,
    time: game.time,
    venue: game.venue,
    round: game.week,
  }));
};

export {
  LEAGUE_IDS,
  LOCAL_GAME_ID_PREFIX,
  mapLocalFixtureToGame,
  transformLocalGameForMatchDetail,
};

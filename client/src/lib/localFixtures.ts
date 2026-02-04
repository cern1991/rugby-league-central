import type { Game } from "@shared/schema";
import { NRL_2026_FIXTURES_BY_TEAM, type LocalFixture } from "@shared/localFixtures";
import { SUPER_LEAGUE_MASTER_FIXTURES } from "@shared/localSuperLeagueFixtures";
import { SUPER_LEAGUE_FIXTURES_BY_TEAM } from "@shared/localSuperLeagueFixtures";
import { LOCAL_TEAMS } from "@shared/localTeams";

const LEAGUE_IDS: Record<string, string> = {
  NRL: "4416",
  "Super League": "4415",
};
const CURRENT_SEASON = "2026";
const LOCAL_GAME_ID_PREFIX = "local-";

type LocalGame = Game & {
  matchNumber: number;
  legacyId: string;
};

const normalizeName = (value?: string | null) =>
  (value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

function findTeamMetaByName(name?: string | null) {
  if (!name) return undefined;
  const normalized = normalizeName(name);
  return LOCAL_TEAMS.find((team) => {
    const teamName = team.name.toLowerCase();
    const simplifiedTeam = teamName.replace(/[^a-z]/g, "");
    const simplifiedInput = normalized.replace(/[^a-z]/g, "");
    return (
      teamName === normalized ||
      teamName.includes(normalized) ||
      normalized.includes(teamName) ||
      simplifiedTeam === simplifiedInput ||
      simplifiedTeam.includes(simplifiedInput)
    );
  });
}

const toBase64Url = (value: string) => {
  const encoded = typeof window !== "undefined"
    ? btoa(unescape(encodeURIComponent(value)))
    : Buffer.from(value, "utf8").toString("base64");
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value: string) => {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const decoded = typeof window !== "undefined"
    ? decodeURIComponent(escape(atob(base64)))
    : Buffer.from(base64, "base64").toString("utf8");
  return decoded;
};

function createLocalMatchId(leagueName: string, matchNumber: number, homeTeam: string, awayTeam: string) {
  const payload = JSON.stringify({ leagueName, matchNumber, homeTeam, awayTeam });
  return `${LOCAL_GAME_ID_PREFIX}${toBase64Url(payload)}`;
}

function createLegacyLocalMatchId(
  leagueName: string,
  matchNumber: number,
  homeTeam: string,
  awayTeam: string
) {
  return `${LOCAL_GAME_ID_PREFIX}${leagueName}-${matchNumber}-${homeTeam}-${awayTeam}`;
}

function decodeLocalMatchId(matchId: string) {
  if (!matchId.startsWith(LOCAL_GAME_ID_PREFIX)) {
    return null;
  }
  const encoded = matchId.slice(LOCAL_GAME_ID_PREFIX.length);
  try {
    const json = fromBase64Url(encoded);
    return JSON.parse(json) as {
      leagueName: string;
      matchNumber: number;
      homeTeam: string;
      awayTeam: string;
    };
  } catch {
    return null;
  }
}

function decodeLegacyLocalMatchId(matchId: string) {
  if (!matchId.startsWith(LOCAL_GAME_ID_PREFIX)) {
    return null;
  }
  const withoutPrefix = matchId.slice(LOCAL_GAME_ID_PREFIX.length);
  const parts = withoutPrefix.split("-");
  if (parts.length < 4) {
    return null;
  }
  const leagueName = parts[0];
  const matchNumber = parseInt(parts[1], 10);
  if (Number.isNaN(matchNumber)) {
    return null;
  }
  const homeParts = parts.slice(2, parts.length - 1);
  const homeTeam = homeParts.join("-") || parts[2];
  const awayTeam = parts[parts.length - 1];
  return { leagueName, matchNumber, homeTeam, awayTeam };
}

const normalizeNameForComparison = (value: string) =>
  value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const namesMatch = (a: string, b: string) => {
  const normA = normalizeNameForComparison(a);
  const normB = normalizeNameForComparison(b);
  return normA === normB || normA.includes(normB) || normB.includes(normA);
};

function mapLocalFixtureToGame(fixture: LocalFixture, leagueName: string, leagueId: string): LocalGame {
  const homeTeam = findTeamMetaByName(fixture.homeTeam);
  const awayTeam = findTeamMetaByName(fixture.awayTeam);
  const homeName = homeTeam?.name || fixture.homeTeam;
  const awayName = awayTeam?.name || fixture.awayTeam;
  const datePart = fixture.dateUtc.split("T")[0];
  const timePart = fixture.dateUtc.split("T")[1] || "";
  const timestamp = Date.parse(fixture.dateUtc) || undefined;
  const legacyId = createLegacyLocalMatchId(leagueName, fixture.matchNumber, fixture.homeTeam, fixture.awayTeam);

  return {
    id: createLocalMatchId(leagueName, fixture.matchNumber, fixture.homeTeam, fixture.awayTeam),
    date: datePart,
    time: timePart,
    timestamp,
    week: fixture.roundNumber ? `Round ${fixture.roundNumber}` : undefined,
    status: { long: "Not Started", short: "NS" },
    league: {
      id: Number(leagueId),
      name: leagueName,
      logo: homeTeam?.logo || awayTeam?.logo || undefined,
      season: CURRENT_SEASON,
    },
    country: homeTeam?.country || awayTeam?.country,
    teams: {
      home: {
        id: homeTeam ? String(homeTeam.id) : fixture.homeTeam,
        name: homeName,
        logo: homeTeam?.logo || null,
      },
      away: {
        id: awayTeam ? String(awayTeam.id) : fixture.awayTeam,
        name: awayName,
        logo: awayTeam?.logo || null,
      },
    },
    scores: { home: null, away: null },
    matchNumber: fixture.matchNumber,
    legacyId,
  };
}

function buildFixturesFromLocalMap(fixturesByTeam: Record<string, LocalFixture[]>, leagueName: string) {
  const leagueId = LEAGUE_IDS[leagueName];
  if (!leagueId) return [] as Game[];
  const dedup = new Map<string, LocalFixture>();
  Object.values(fixturesByTeam).forEach((fixtures) => {
    fixtures.forEach((fixture) => {
      const dateKey = fixture.dateUtc.split("T")[0];
      const key = `${dateKey}-${fixture.homeTeam}-${fixture.awayTeam}`;
      if (!dedup.has(key)) {
        dedup.set(key, fixture);
      }
    });
  });

  return Array.from(dedup.values())
    .map((fixture) => mapLocalFixtureToGame(fixture, leagueName, leagueId))
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

export function getLocalFixturesForLeague(leagueId?: string) {
  const normalized = leagueId?.toLowerCase() || "nrl";
  if (normalized.includes("super")) {
    const leagueName = "Super League";
    const leagueKey = LEAGUE_IDS[leagueName];
    return SUPER_LEAGUE_MASTER_FIXTURES.map((fixture) =>
      mapLocalFixtureToGame(fixture, leagueName, leagueKey)
    ).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }
  return buildFixturesFromLocalMap(NRL_2026_FIXTURES_BY_TEAM, "NRL");
}

export function findLocalMatchById(matchId?: string | null) {
  if (!matchId) return undefined;
  const allMatches = [
    ...getLocalFixturesForLeague("NRL"),
    ...getLocalFixturesForLeague("Super League"),
  ];

  const directMatch = allMatches.find((game) => game.id === matchId || game.legacyId === matchId);
  if (directMatch) return directMatch;

  const decoded = decodeLocalMatchId(matchId);
  if (decoded) {
    return allMatches.find((game) =>
      game.matchNumber === decoded.matchNumber &&
      namesMatch(game.teams.home?.name || "", decoded.homeTeam) &&
      namesMatch(game.teams.away?.name || "", decoded.awayTeam)
    );
  }

  const legacy = decodeLegacyLocalMatchId(matchId);
  if (legacy) {
    return allMatches.find((game) =>
      game.matchNumber === legacy.matchNumber &&
      namesMatch(game.teams.home?.name || "", legacy.homeTeam) &&
      namesMatch(game.teams.away?.name || "", legacy.awayTeam)
    );
  }

  return undefined;
}

export function getLocalFixturesForTeam(teamId?: string | number | null, leagueHint?: string) {
  if (!teamId) return [] as Game[];
  const teamKey = String(teamId);
  const normalizedLeague = leagueHint?.toLowerCase() || "";

  const nrlFixtures = NRL_2026_FIXTURES_BY_TEAM[teamKey];
  if (nrlFixtures && nrlFixtures.length > 0) {
    return nrlFixtures
      .map((fixture) => mapLocalFixtureToGame(fixture, "NRL", LEAGUE_IDS.NRL))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  const superFixtures = SUPER_LEAGUE_FIXTURES_BY_TEAM[teamKey];
  if (superFixtures && superFixtures.length > 0) {
    return superFixtures
      .map((fixture) => mapLocalFixtureToGame(fixture, "Super League", LEAGUE_IDS["Super League"]))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  if (normalizedLeague.includes("super")) {
    return getLocalFixturesForLeague("Super League");
  }
  if (normalizedLeague.includes("nrl")) {
    return getLocalFixturesForLeague("NRL");
  }
  return [] as Game[];
}

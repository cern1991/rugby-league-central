import { LOCAL_TEAMS } from "../../../shared/localTeams.js";
import { LOCAL_TEAM_ROSTERS } from "../../../server/data/localRosters.js";
import {
  SUPER_LEAGUE_SQUADS,
  type SuperLeaguePlayer,
} from "../../../server/data/localSuperLeagueSquads.js";
import { SUPER_LEAGUE_TEAM_ID_BY_CODE } from "../../../shared/localSuperLeagueFixtures.js";

export const config = {
  runtime: "nodejs",
};

type RequestLike = {
  query: Record<string, string | string[]>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: any) => void;
};

const getQueryValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const getFallbackPlayerImage = (name: string) => {
  const encoded = encodeURIComponent(name || "Player");
  return `https://ui-avatars.com/api/?name=${encoded}&background=random&color=ffffff`;
};

const WIKIPEDIA_HEADERS = {
  "User-Agent": "RugbyLeagueCentral/1.0 (rugbyleaguecentral.com)",
  Accept: "application/json",
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&ndash;|&mdash;/gi, "-")
    .replace(/&#(\d+);/g, (_, code) => {
      const parsed = Number.parseInt(code, 10);
      return Number.isNaN(parsed) ? "" : String.fromCharCode(parsed);
    });

const stripTags = (value: string) =>
  decodeHtmlEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());

const extractClubHistoryFromHtml = (html: string) => {
  const headerMatch = html.match(
    /<tr[^>]*>\s*<th[^>]*>\s*(Senior career|Club career)\s*<\/th>[\s\S]*?<\/tr>/i
  );
  if (!headerMatch) return null;
  const startIndex = headerMatch.index ?? 0;
  const tableSection = html.slice(startIndex);
  const rows = tableSection.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const results: Array<{ years: string; club: string }> = [];
  for (const row of rows) {
    if (row.match(/Senior career|Club career|Representative career|National team/i)) {
      continue;
    }
    const headerCell = row.match(/<th[^>]*>([\s\S]*?)<\/th>/i)?.[1];
    const dataCells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (!headerCell || dataCells.length === 0) {
      continue;
    }
    const years = decodeHtmlEntities(stripTags(headerCell).trim());
    const clubRaw = decodeHtmlEntities(stripTags(dataCells[0]).trim());
    const club = clubRaw.replace(/\s*\([^)]*\)/g, "").trim();
    if (!years || !club) continue;
    results.push({ years, club });
  }
  return results.length > 0 ? results : null;
};

const fetchWikipediaSummary = async (name: string) => {
  if (typeof fetch !== "function") return null;
  try {
    const slug = encodeURIComponent(name.replace(/\s+/g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
    const response = await fetch(url, { headers: WIKIPEDIA_HEADERS });
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.type === "disambiguation") return null;
    const extract: string | null = data?.extract || data?.description || null;
    if (!extract) return null;
    let summary = extract.length > 1200 ? `${extract.slice(0, 1200)}…` : extract;

    let clubHistory: Array<{ years: string; club: string }> | null = null;
    if (summary.length < 600) {
      const params = new URLSearchParams({
        action: "query",
        prop: "extracts",
        exintro: "1",
        explaintext: "1",
        exsentences: "4",
        redirects: "1",
        format: "json",
        titles: name,
      });
      const extractUrl = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
      const extractResponse = await fetch(extractUrl, { headers: WIKIPEDIA_HEADERS });
      if (extractResponse.ok) {
        const extractData = await extractResponse.json();
        const pages = extractData?.query?.pages || {};
        const page = Object.values(pages)[0] as any;
        if (page?.extract) {
          const expanded = page.extract.length > 1600 ? `${page.extract.slice(0, 1600)}…` : page.extract;
          if (expanded.length > summary.length) {
            summary = expanded;
          }
        }
      }
    }
    const htmlUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${slug}`;
    const htmlResponse = await fetch(htmlUrl, {
      headers: { ...WIKIPEDIA_HEADERS, Accept: "text/html" },
    });
    if (htmlResponse.ok) {
      const html = await htmlResponse.text();
      clubHistory = extractClubHistoryFromHtml(html);
    }
    return { summary, clubHistory };
  } catch {
    return null;
  }
};

const fallbackPositionFromNumber = (raw?: number | string | null) => {
  if (raw === null || raw === undefined) return null;
  const num = typeof raw === "string" ? parseInt(raw, 10) : raw;
  if (!Number.isFinite(num)) return null;
  switch (num) {
    case 1:
      return "Fullback";
    case 2:
    case 5:
      return "Wing";
    case 3:
    case 4:
      return "Centre";
    case 6:
      return "Stand-off";
    case 7:
      return "Halfback";
    case 8:
    case 10:
      return "Prop";
    case 9:
      return "Hooker";
    case 11:
    case 12:
      return "Second-row";
    case 13:
      return "Loose forward";
    default:
      return null;
  }
};

const findTeamById = (id?: string | null) =>
  id ? LOCAL_TEAMS.find((team) => String(team.id) === String(id)) : undefined;

const SUPER_LEAGUE_SQUADS_BY_TEAM_ID = Object.entries(SUPER_LEAGUE_SQUADS).reduce<
  Record<string, { season: number; players: SuperLeaguePlayer[]; team_code: string; team_name: string }[]>
>((acc, [code, squads]) => {
  const teamId = SUPER_LEAGUE_TEAM_ID_BY_CODE[code];
  if (teamId) {
    acc[teamId] = squads as any;
  }
  return acc;
}, {});

export default async function handler(req: RequestLike, res: ResponseLike) {
  try {
    const id = getQueryValue(req.query.id);
    if (!id) {
      return res.status(400).json({ message: "Player ID is required" });
    }

    if (id.startsWith("SL-")) {
      const [, teamId, rawNumber] = id.split("-");
      const team = findTeamById(teamId);
      const squads = SUPER_LEAGUE_SQUADS_BY_TEAM_ID[teamId] || [];
      const squad = squads.find((entry) => entry.season === 2026) || squads[0];
      const match = squad?.players?.find((player, index) => {
        const number = player.squad_number ?? index + 1;
        return String(number) === rawNumber;
      });
      if (match) {
        const position =
          match.position ||
          fallbackPositionFromNumber(rawNumber) ||
          "Utility";
        const wiki = await fetchWikipediaSummary(match.name);
        return res.status(200).json({
          response: {
            id,
            name: match.name,
            position,
            team: team?.name || squad?.team_name || "Club",
            teamId: team?.id || teamId,
            teamLogo: team?.logo || null,
            league: team?.league || "Super League",
            nationality: match.nationality || team?.country?.name || "England",
            nationalitySecondary: match.nationality_secondary || null,
            image: getFallbackPlayerImage(match.name),
            description:
              wiki?.summary ||
              `${match.name} plays ${position} for ${team?.name || squad?.team_name || "their club"}.`,
            clubHistory: wiki?.clubHistory || null,
            socials: {},
            stats: {},
          },
        });
      }
    }

    for (const [teamId, roster] of Object.entries(LOCAL_TEAM_ROSTERS)) {
      const match = roster.find((player) => player.id === id);
      if (match) {
        const team = findTeamById(teamId);
        const wiki = await fetchWikipediaSummary(match.name);
        return res.status(200).json({
          response: {
            id,
            name: match.name,
            position: match.position || "Utility",
            team: team?.name || "Club",
            teamId: team?.id || teamId,
            teamLogo: team?.logo || null,
            league: team?.league || "NRL",
            nationality: team?.country?.name || "Australia",
            nationalitySecondary: null,
            image: getFallbackPlayerImage(match.name),
            description:
              wiki?.summary ||
              `${match.name} plays ${match.position || "Utility"} for ${team?.name || "their club"}.`,
            clubHistory: wiki?.clubHistory || null,
            socials: {},
            stats: {},
          },
        });
      }
    }

    return res.status(404).json({ message: "Player not found" });
  } catch (error: any) {
    console.error("Serverless player detail error:", error);
    return res.status(500).json({ message: error?.message || "Failed to load player" });
  }
}

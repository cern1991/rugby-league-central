import type { Express } from "express";
import { type Server } from "http";
import { FEATURED_LEAGUES } from "@shared/schema";
import { LOCAL_TEAM_ROSTERS } from "./data/localRosters";
import { NRL_2026_FIXTURES_BY_TEAM, type LocalFixture } from "../shared/localFixtures";
import { SUPER_LEAGUE_FIXTURES_BY_TEAM, SUPER_LEAGUE_MASTER_FIXTURES, SUPER_LEAGUE_TEAM_ID_BY_CODE } from "../shared/localSuperLeagueFixtures";
import { SUPER_LEAGUE_SQUADS, type SuperLeagueSquad } from "./data/localSuperLeagueSquads";
import { getLocalNewsFallback, LOCAL_NEWS_BY_LEAGUE } from "./data/localNews";
import { LOCAL_TEAMS, type LocalTeamInfo } from "../shared/localTeams";

const SPORTSDB_API_KEY = "3";
const SPORTSDB_BASE_URL = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}`;

const LEAGUE_IDS: Record<string, string> = {
  "NRL": "4416",
  "Super League": "4415", 
};
const CURRENT_SEASON = "2026";

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

const findLocalTeamMeta = (identifier?: string | number | null): LocalTeamInfo | undefined => {
  if (identifier === undefined || identifier === null) return undefined;
  const idKey = String(identifier);
  if (LOCAL_TEAM_INDEX_BY_ID.has(idKey)) {
    return LOCAL_TEAM_INDEX_BY_ID.get(idKey);
  }
  const slug = normalizeTeamSlug(idKey);
  return LOCAL_TEAM_INDEX_BY_SLUG.get(slug);
};

const resolveTeamIdentifier = (identifier?: string | number | null): string | null => {
  if (identifier === undefined || identifier === null) return null;
  const match = findLocalTeamMeta(identifier);
  return match ? String(match.id) : String(identifier);
};

async function fetchFromSportsDB(endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${SPORTSDB_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`SportsDB API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("SportsDB fetch error:", error);
    return null;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const SUPER_LEAGUE_TEAM_IDS = new Set(Object.values(SUPER_LEAGUE_TEAM_ID_BY_CODE));
  const SUPER_LEAGUE_SQUADS_BY_TEAM_ID = Object.entries(SUPER_LEAGUE_SQUADS).reduce<Record<string, SuperLeagueSquad[]>>((acc, [code, squads]) => {
    const teamId = SUPER_LEAGUE_TEAM_ID_BY_CODE[code];
    if (teamId) {
      acc[teamId] = squads;
    }
    return acc;
  }, {});

  const LOCAL_GAME_ID_PREFIX = "local-";

  function toBase64Url(value: string) {
    return Buffer.from(value, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  function fromBase64Url(value: string) {
    let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    return Buffer.from(base64, "base64").toString("utf8");
  }

  function createLocalMatchId(leagueName: string, matchNumber: number, homeTeam: string, awayTeam: string) {
    const payload = JSON.stringify({ leagueName, matchNumber, homeTeam, awayTeam });
    return `${LOCAL_GAME_ID_PREFIX}${toBase64Url(payload)}`;
  }

  function createLegacyLocalMatchId(leagueName: string, matchNumber: number, homeTeam: string, awayTeam: string) {
    return `${LOCAL_GAME_ID_PREFIX}${leagueName}-${matchNumber}-${homeTeam}-${awayTeam}`;
  }

  function decodeLocalMatchId(matchId: string) {
    if (!matchId.startsWith(LOCAL_GAME_ID_PREFIX)) {
      return null;
    }
    const encoded = matchId.slice(LOCAL_GAME_ID_PREFIX.length);
    try {
      const json = fromBase64Url(encoded);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function normalizeNameForComparison(value: string) {
    return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function namesMatch(a: string, b: string) {
    const normA = normalizeNameForComparison(a);
    const normB = normalizeNameForComparison(b);
    return normA === normB || normA.includes(normB) || normB.includes(normA);
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

  function findLocalTeamByFragment(name: string) {
    if (!name) return undefined;
    const normalized = name.trim().toLowerCase();
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

  function findTeamLogoInText(text: string) {
    if (!text) return null;
    const normalized = text.toLowerCase();
    for (const team of LOCAL_TEAMS) {
      const teamName = team.name?.toLowerCase();
      if (!teamName) continue;
      const parts = teamName.split(" ");
      const shortName = parts[parts.length - 1];
      if (
        (teamName && normalized.includes(teamName)) ||
        (shortName?.length > 3 && normalized.includes(shortName))
      ) {
        if (team.logo) {
          return team.logo;
        }
      }
    }
    return null;
  }

  function findLeagueLogoInText(text?: string, hint?: string) {
    const normalized = text?.toLowerCase() || "";
    const normalizedHint = hint?.toLowerCase() || "";
    return (
      FEATURED_LEAGUES.find((league) => {
        const name = league.name.toLowerCase();
        const shortName = league.shortName.toLowerCase();
        const id = league.id.toLowerCase();
        return (
          normalized.includes(name) ||
          normalized.includes(shortName) ||
          normalizedHint.includes(name) ||
          normalizedHint.includes(shortName) ||
          normalizedHint.includes(id)
        );
      })?.logo || null
    );
  }

  const RUGBY_FIELD_IMAGE = "https://images.unsplash.com/photo-1511297488373-4c965b127015?auto=format&fit=crop&w=1600&q=80";
  const ARTICLE_IMAGE_HEADERS = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
  };

  async function fetchArticlePreviewImage(url?: string | null) {
    if (!url) return null;
    try {
      const response = await fetch(url, {
        headers: ARTICLE_IMAGE_HEADERS,
      });
      if (!response.ok) {
        return null;
      }
      const html = await response.text();
      const metaTags = html.match(/<meta[^>]+>/gi) || [];
      for (const tag of metaTags) {
        if (/property=["']og:image["']/i.test(tag) || /name=["']og:image["']/i.test(tag)) {
          const contentMatch = tag.match(/content=["']([^"']+)["']/i);
          if (contentMatch?.[1]) {
            return contentMatch[1];
          }
        }
        if (/name=["']twitter:image["']/i.test(tag)) {
          const contentMatch = tag.match(/content=["']([^"']+)["']/i);
          if (contentMatch?.[1]) {
            return contentMatch[1];
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Article preview fetch failed:", error);
      return null;
    }
  }

  function getHostFromUrl(url?: string | null) {
    if (!url) return null;
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  const SITE_LOGO = "/logo.svg";

  const WIKIPEDIA_HEADERS = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept: "application/json",
  };
  const WIKIPEDIA_CACHE_TTL = 1000 * 60 * 60 * 12;
  const wikipediaProfileCache = new Map<
    string,
    { summary: string | null; image: string | null; position: string | null; expires: number }
  >();
  const WIKIPEDIA_ROSTER_CACHE_TTL = 1000 * 60 * 60 * 12;
  const wikipediaRosterCache = new Map<
    string,
    { players: Array<{ id: string; name: string; position: string }>; expires: number }
  >();
  const ZERO_TACKLE_CACHE_TTL = 1000 * 60 * 60 * 6;
  const zeroTackleRosterCache = new Map<
    string,
    { players: Array<{ id: string; name: string; position: string }>; expires: number }
  >();

  const normalizeSlug = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const TEAM_SLUG_BY_ID = LOCAL_TEAMS.reduce<Record<string, string>>((acc, team) => {
    acc[String(team.id)] = normalizeSlug(team.name);
    return acc;
  }, {});

  const TEAM_ID_BY_SLUG = Object.entries(TEAM_SLUG_BY_ID).reduce<Record<string, string>>(
    (acc, [id, slug]) => {
      acc[slug] = id;
      return acc;
    },
    {}
  );

  const SORTED_TEAM_SLUGS = Object.keys(TEAM_ID_BY_SLUG).sort(
    (a, b) => b.length - a.length
  );

  const makePlayerId = (teamId: string, name: string) => {
    const teamSlug = TEAM_SLUG_BY_ID[String(teamId)] || normalizeSlug(teamId);
    return `${teamSlug}-${normalizeSlug(name)}`;
  };

  const NRL_WIKI_SEASON_PAGE_BY_TEAM_ID: Record<string, string> = {
    "135191": "2026_Brisbane_Broncos_season",
    "135186": "2026_Canberra_Raiders_season",
    "135187": "2026_Canterbury-Bankstown_Bulldogs_season",
    "135184": "2026_Cronulla-Sutherland_Sharks_season",
    "140097": "2026_Dolphins_(NRL)_season",
    "135194": "2026_Gold_Coast_Titans_season",
    "135188": "2026_Manly_Warringah_Sea_Eagles_season",
    "135190": "2026_Melbourne_Storm_season",
    "135198": "2026_Newcastle_Knights_season",
    "135193": "2026_New_Zealand_Warriors_season",
    "135196": "2026_North_Queensland_Cowboys_season",
    "135183": "2026_Parramatta_Eels_season",
    "135197": "2026_Penrith_Panthers_season",
    "135185": "2026_South_Sydney_Rabbitohs_season",
    "135195": "2026_St._George_Illawarra_Dragons_season",
    "135192": "2026_Sydney_Roosters_season",
    "135189": "2026_Wests_Tigers_season",
  };

  const ZERO_TACKLE_BASE_URL =
    "https://www.zerotackle.com/nrl-2026-every-clubs-current-full-squad-best-17-ins-and-outs-off-contract-players-3-217909";

  const ZERO_TACKLE_PAGE_BY_TEAM_ID: Record<string, number> = {
    "135191": 1, // Brisbane Broncos
    "135186": 2, // Canberra Raiders
    "135187": 3, // Canterbury Bulldogs
    "135184": 4, // Cronulla Sharks
    "135194": 5, // Gold Coast Titans
    "135188": 6, // Manly Sea Eagles
    "135190": 7, // Melbourne Storm
    "135193": 8, // New Zealand Warriors
    "135198": 9, // Newcastle Knights
    "135196": 10, // North Queensland Cowboys
    "135183": 11, // Parramatta Eels
    "135197": 12, // Penrith Panthers
    "135185": 13, // South Sydney Rabbitohs
    "135195": 14, // St George Illawarra Dragons
    "135192": 15, // Sydney Roosters
    "140097": 16, // Dolphins
    "135189": 17, // Wests Tigers
  };

  const INJURY_REDACT_NAMES = new Set([
    "Cameron McInnes",
    "Ronaldo Mulitalo",
    "Eliesa Katoa",
    "Eli Katoa",
  ]);

  function stripInjuryNotes(summary: string, subject?: string | null) {
    if (!subject || !INJURY_REDACT_NAMES.has(subject)) return summary;
    if (/ruled out|acl|injury/i.test(summary) && summary.length < 140) {
      return "";
    }
    const sentences = summary.split(/(?<=[.!?])\s+/);
    const filtered = sentences.filter(
      (sentence) => !/acl|injury|ruled out|season/i.test(sentence)
    );
    const cleaned = filtered.join(" ").trim();
    return cleaned || summary;
  }

  const PLAYER_TEAM_OVERRIDES = new Map<string, string>([
    ["Jaeman Salmon", "135187"],
    ["Nathan Brown", "135188"],
  ]);

  function isPlayerAssignedToTeam(name: string, teamId?: string | null) {
    if (!teamId) return true;
    const overrideTeam = PLAYER_TEAM_OVERRIDES.get(name);
    if (!overrideTeam) return true;
    return overrideTeam === String(teamId);
  }

  function sanitizePlayerSummary(summary?: string | null, subject?: string | null) {
    if (!summary) return null;
    const normalized = summary.toLowerCase();
    const mentionsRugby = normalized.includes("rugby");
    const mentionsAssociationFootball = normalized.includes("association football");
    const mentionsFootballer = normalized.includes("footballer");
    if (!mentionsRugby && (mentionsAssociationFootball || mentionsFootballer)) {
      return null;
    }
    return stripInjuryNotes(summary, subject);
  }

  function extractNationalityFromSummary(summary?: string | null) {
    if (!summary) return null;
    const patterns: Array<{ regex: RegExp; country: string }> = [
      { regex: /\bAustralian\b/i, country: "Australia" },
      { regex: /\bEnglish\b/i, country: "England" },
      { regex: /\bBritish\b/i, country: "United Kingdom" },
      { regex: /\bNew\s+Zealand(?:er)?\b/i, country: "New Zealand" },
      { regex: /\bFrench\b/i, country: "France" },
      { regex: /\bFijian\b/i, country: "Fiji" },
      { regex: /\bTongan\b/i, country: "Tonga" },
      { regex: /\bSamoan\b/i, country: "Samoa" },
      { regex: /\bPapua\s+New\s+Guinean\b/i, country: "Papua New Guinea" },
      { regex: /\bScottish\b/i, country: "Scotland" },
      { regex: /\bWelsh\b/i, country: "Wales" },
      { regex: /\bIrish\b/i, country: "Ireland" },
      { regex: /\bJamaican\b/i, country: "Jamaica" },
      { regex: /\bItalian\b/i, country: "Italy" },
      { regex: /\bSerbian\b/i, country: "Serbia" },
      { regex: /\bCroatian\b/i, country: "Croatia" },
      { regex: /\bCzech\b/i, country: "Czech Republic" },
      { regex: /\bAmerican\b/i, country: "United States" },
      { regex: /\bSouth\s+African\b/i, country: "South Africa" },
      { regex: /\bZimbabwean\b/i, country: "Zimbabwe" },
    ];
    for (const pattern of patterns) {
      if (pattern.regex.test(summary)) return pattern.country;
    }
    return null;
  }

  async function fetchWikipediaSummaryByTitle(title: string) {
    const slug = encodeURIComponent(title.replace(/\s+/g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
    const response = await fetch(url, { headers: WIKIPEDIA_HEADERS });
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.type === "disambiguation") {
      return null;
    }
    const extract: string | null = data?.extract || data?.description || null;
    let summary = extract && extract.length > 1400 ? `${extract.slice(0, 1400)}…` : extract;
    summary = sanitizePlayerSummary(summary, title);
    const image: string | null = data?.originalimage?.source || data?.thumbnail?.source || null;
    return { summary: summary || null, image, clubHistory: null };
  }

  async function fetchWikipediaExtract(subject: string, sentences = 4) {
    try {
      const params = new URLSearchParams({
        action: "query",
        prop: "extracts",
        exintro: "1",
        explaintext: "1",
        exsentences: String(sentences),
        redirects: "1",
        format: "json",
        titles: subject,
      });
      const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
      const response = await fetch(url, { headers: WIKIPEDIA_HEADERS });
      if (!response.ok) return null;
      const data = await response.json();
      const pages = data?.query?.pages || {};
      const page = Object.values(pages)[0] as any;
      if (!page?.extract) return null;
      const extract = sanitizePlayerSummary(page.extract, subject);
      return extract || null;
    } catch {
      return null;
    }
  }

  function isLikelyRugbyLeagueSummary(summary?: string | null) {
    if (!summary) return false;
    const lower = summary.toLowerCase();
    return lower.includes("rugby league");
  }

  function summaryMentionsContext(summary: string, context?: { teamName?: string | null; league?: string | null }) {
    if (!context) return true;
    const lower = summary.toLowerCase();
    const team = context.teamName?.toLowerCase();
    const league = context.league?.toLowerCase();
    if (team && lower.includes(team)) return true;
    if (league && lower.includes(league)) return true;
    return !team && !league;
  }

  async function searchWikipediaTitle(query: string) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&format=json`;
    const response = await fetch(url, { headers: WIKIPEDIA_HEADERS });
    if (!response.ok) return [];
    const data = await response.json();
    return (data?.query?.search || []).map((item: any) => item.title).filter(Boolean);
  }

  async function getWikipediaProfile(
    subject?: string | null,
    context?: { teamName?: string | null; league?: string | null }
  ) {
    if (!subject) return null;
    const normalized = subject.trim();
    if (!normalized) return null;
    const cacheKey = [
      normalized.toLowerCase(),
      context?.teamName?.toLowerCase() || "",
      context?.league?.toLowerCase() || "",
    ].join("|");
    const cached = wikipediaProfileCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      if (cached.nationality === undefined) {
        cached.nationality = extractNationalityFromSummary(cached.summary);
      }
      return cached;
    }

    try {
      let summaryData = await fetchWikipediaSummaryByTitle(normalized);
      if (summaryData?.summary && !isLikelyRugbyLeagueSummary(summaryData.summary)) {
        summaryData = null;
      }
      if (summaryData?.summary && !summaryMentionsContext(summaryData.summary, context)) {
        summaryData = null;
      }

      if (!summaryData) {
        const searchQuery = `${normalized} rugby league${context?.teamName ? ` ${context.teamName}` : ""}`;
        const candidates = await searchWikipediaTitle(searchQuery);
        for (const title of candidates) {
          const candidate = await fetchWikipediaSummaryByTitle(title);
          if (!candidate?.summary) continue;
          if (!isLikelyRugbyLeagueSummary(candidate.summary)) continue;
          if (!summaryMentionsContext(candidate.summary, context)) continue;
          summaryData = candidate;
          break;
        }
      }

      if (!summaryData) {
        return null;
      }

      let summary = summaryData.summary;
      if (summary && summary.length < 600) {
        const enriched = await fetchWikipediaExtract(normalized, 4);
        if (enriched && enriched.length > summary.length) {
          summary = enriched.length > 1600 ? `${enriched.slice(0, 1600)}…` : enriched;
        }
      }
      const image = summaryData.image;
      const payload = {
        summary: summary || null,
        image,
        position: null,
        nationality: extractNationalityFromSummary(summary),
        clubHistory: summaryData.clubHistory || null,
        expires: Date.now() + WIKIPEDIA_CACHE_TTL,
      };
      wikipediaProfileCache.set(cacheKey, payload);
      return payload;
    } catch (error) {
      console.error("Wikipedia profile fetch failed:", error);
      return null;
    }
  }

  function normalizePosition(value?: string | null) {
    if (!value) return null;
    const lower = value.toLowerCase();
    const has = (needle: string) => lower.includes(needle);
    if (has("fullback")) return "Fullback";
    if (has("wing")) return "Wing";
    if (has("centre") || has("center")) return "Centre";
    if (has("five-eighth") || has("five eighth") || has("stand-off") || has("stand off")) {
      return "Stand-off";
    }
    if (has("halfback") || has("half-back") || has("scrum-half") || has("half back")) {
      return "Halfback";
    }
    if (has("hooker") || has("dummy half")) return "Hooker";
    if (has("prop") || has("front row") || has("middle forward") || has("front-row")) return "Prop";
    if (has("second row") || has("second-row") || has("back row") || has("edge")) {
      return "Second-row";
    }
    if (has("lock") || has("loose forward")) return "Loose forward";
    if (has("utility") || has("interchange") || has("bench")) return "Utility";
    return null;
  }

  function normalizePositions(value?: string | null) {
    if (!value) return null;
    const tokens = value
      .split(/[,/]| and /i)
      .map((token) => token.trim())
      .filter(Boolean);
    const normalized: string[] = [];
    tokens.forEach((token) => {
      const mapped = normalizePosition(token) || normalizePosition(value);
      if (mapped && !normalized.includes(mapped)) {
        normalized.push(mapped);
      }
    });
    if (normalized.length === 0) {
      const mapped = normalizePosition(value);
      return mapped ? [mapped] : null;
    }
    const order = [
      "Fullback",
      "Wing",
      "Centre",
      "Stand-off",
      "Halfback",
      "Prop",
      "Hooker",
      "Second-row",
      "Loose forward",
      "Utility",
    ];
    const rank = new Map(order.map((pos, index) => [pos, index]));
    normalized.sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999));
    return normalized;
  }

  function formatPositions(value?: string | null) {
    const normalized = normalizePositions(value);
    if (!normalized || normalized.length === 0) return null;
    return normalized.join(" / ");
  }

  function fallbackPositionFromNumber(raw?: number | string | null) {
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
  }

  function extractPositionFromWikipediaHtml(html: string) {
    const match = html.match(
      /<th[^>]*>\s*Position(?:s)?\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/i
    );
    if (!match) return null;
    const text = stripTags(match[1]);
    if (!text) return null;
    return formatPositions(text) || text;
  }

  function extractClubHistoryFromHtml(html: string) {
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
  }

  async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T, index: number) => Promise<R>
  ) {
    const results: R[] = new Array(items.length);
    let currentIndex = 0;

    const worker = async () => {
      while (true) {
        const index = currentIndex++;
        if (index >= items.length) break;
        results[index] = await mapper(items[index], index);
      }
    };

    const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
    await Promise.all(workers);
    return results;
  }

  function extractPositionFromSummary(summary?: string | null) {
    if (!summary) return null;
    const lower = summary.toLowerCase();
    const hints: string[] = [];
    const addIf = (cond: boolean, label: string) => {
      if (cond && !hints.includes(label)) hints.push(label);
    };
    addIf(lower.includes("fullback"), "Fullback");
    addIf(lower.includes("winger") || lower.includes("wing"), "Wing");
    addIf(lower.includes("centre") || lower.includes("center"), "Centre");
    addIf(lower.includes("five-eighth") || lower.includes("five eighth") || lower.includes("stand-off") || lower.includes("stand off"), "Stand-off");
    addIf(lower.includes("halfback") || lower.includes("half-back") || lower.includes("scrum-half") || lower.includes("half back"), "Halfback");
    addIf(lower.includes("hooker") || lower.includes("dummy half"), "Hooker");
    addIf(lower.includes("prop") || lower.includes("front row") || lower.includes("front-row"), "Prop");
    addIf(lower.includes("second-row") || lower.includes("second row") || lower.includes("back-row") || lower.includes("back row") || lower.includes("edge"), "Second-row");
    addIf(lower.includes("lock") || lower.includes("loose forward"), "Loose forward");
    addIf(lower.includes("utility"), "Utility");
    if (hints.length === 0) return null;
    const order = [
      "Fullback",
      "Wing",
      "Centre",
      "Stand-off",
      "Halfback",
      "Prop",
      "Hooker",
      "Second-row",
      "Loose forward",
      "Utility",
    ];
    const rank = new Map(order.map((pos, index) => [pos, index]));
    hints.sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999));
    return hints.join(" / ");
  }

  async function getWikipediaPlayerProfile(
    subject?: string | null,
    context?: { teamName?: string | null; league?: string | null }
  ) {
    if (!subject) return null;
    const normalized = subject.trim();
    if (!normalized) return null;
    const cacheKey = normalized.toLowerCase();
    const cached = wikipediaProfileCache.get(cacheKey);
    if (cached && cached.expires > Date.now() && cached.position !== undefined) {
      return cached;
    }

    const baseProfile = await getWikipediaProfile(normalized, context);
    if (!baseProfile) return null;
    if (!baseProfile.summary) {
      return baseProfile;
    }

    if (baseProfile.position) {
      return baseProfile;
    }

    const slug = encodeURIComponent(normalized.replace(/\s+/g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/html/${slug}`;
    try {
      const response = await fetch(url, {
        headers: { ...WIKIPEDIA_HEADERS, Accept: "text/html" },
      });
      if (!response.ok) {
        return baseProfile;
      }
      const html = await response.text();
      const position = extractPositionFromWikipediaHtml(html);
    const clubHistory = extractClubHistoryFromHtml(html);
    const payload = {
      ...baseProfile,
      position:
        position
          ? formatPositions(position) || position
          : extractPositionFromSummary(baseProfile.summary) || null,
      clubHistory: clubHistory || baseProfile.clubHistory || null,
      expires: Date.now() + WIKIPEDIA_CACHE_TTL,
    };
      wikipediaProfileCache.set(cacheKey, payload);
      return payload;
    } catch (error) {
      console.error("Wikipedia position fetch failed:", error);
      return {
        ...baseProfile,
        position: extractPositionFromSummary(baseProfile.summary) || baseProfile.position || null,
      };
    }
  }

  function decodeHtmlEntities(value: string) {
    return value
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/gi, "'")
      .replace(/&ndash;|&mdash;/gi, "-")
      .replace(/&#(\d+);/g, (_, code) => {
        const parsed = Number.parseInt(code, 10);
        return Number.isNaN(parsed) ? "" : String.fromCharCode(parsed);
      });
  }

  function stripTags(value: string) {
    return decodeHtmlEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
  }

  function cleanPlayerName(value: string) {
    return value
      .replace(/\[[^\]]*]/g, "")
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[^a-zA-Z0-9\s.'-]/g, "")
      .trim();
  }

  function htmlToTextLines(html: string) {
    const withoutScripts = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ");
    const withBreaks = withoutScripts
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/h\d>/gi, "\n")
      .replace(/<\/tr>/gi, "\n");
    return decodeHtmlEntities(withBreaks.replace(/<[^>]*>/g, " "))
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  function extractPlayerNameFromLine(line: string) {
    const cleaned = line
      .replace(/\*/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    const withoutNotes = cleaned
      .replace(/ruled out.*$/i, "")
      .replace(/acl.*$/i, "")
      .replace(/injury.*$/i, "")
      .replace(/\s*—\s*$/g, "")
      .trim();
    const name = cleanPlayerName(withoutNotes);
    if (!name) return null;
    if (/no player signed/i.test(name)) return null;
    return name;
  }

  function parseZeroTackleRoster(html: string, teamId: string) {
    const lines = htmlToTextLines(html);
    const players: Array<{ id: string; name: string; position: string }> = [];
    const seen = new Set<string>();
    let inSquadSection = false;
    let inDevSection = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const lower = line.toLowerCase();
      if (lower.includes("best 17 and full squad")) {
        inSquadSection = true;
        inDevSection = false;
        continue;
      }
      if (lower.includes("2026 development list")) {
        inDevSection = true;
        inSquadSection = false;
        continue;
      }
      if (lower.startsWith("roster spots open") || lower.startsWith("back")) {
        inSquadSection = false;
        continue;
      }
      if (!inSquadSection && !inDevSection) continue;

      const numbered = line.match(/^\d+\.\s*(.+)$/);
      if (!numbered) continue;
      const name = extractPlayerNameFromLine(numbered[1]);
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      players.push({
        id: makePlayerId(teamId, name),
        name,
        position: "",
      });
    }

    return players;
  }

  async function getZeroTackleRosterForTeam(teamId: string) {
    const page = ZERO_TACKLE_PAGE_BY_TEAM_ID[teamId];
    if (!page) return null;
    const cacheKey = `${teamId}-${page}`;
    const cached = zeroTackleRosterCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.players;
    }
    const url = page === 1 ? `${ZERO_TACKLE_BASE_URL}/` : `${ZERO_TACKLE_BASE_URL}/${page}/`;
    try {
      const response = await fetch(url, {
        headers: { ...WIKIPEDIA_HEADERS, Accept: "text/html" },
      });
      if (!response.ok) return null;
      const html = await response.text();
      const roster = parseZeroTackleRoster(html, teamId);
      if (!roster || roster.length === 0) return null;
      zeroTackleRosterCache.set(cacheKey, {
        players: roster,
        expires: Date.now() + ZERO_TACKLE_CACHE_TTL,
      });
      return roster;
    } catch (error) {
      console.error("Zero Tackle roster fetch failed:", error);
      return null;
    }
  }

  function extractTableHtmlForSquad(html: string) {
    const squadAnchor = html.search(/id="2026_squad"/i);
    if (squadAnchor === -1) return null;
    const tableStart = html.indexOf("<table", squadAnchor);
    if (tableStart === -1) return null;
    const tableEnd = html.indexOf("</table>", tableStart);
    if (tableEnd === -1) return null;
    return html.slice(tableStart, tableEnd + "</table>".length);
  }

  function parseSquadTable(tableHtml: string, teamId: string) {
    const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    if (rows.length === 0) return [];

    let nameIndex = -1;
    let positionIndex = -1;
    let startRowIndex = 0;

    for (let i = 0; i < rows.length; i += 1) {
      if (!rows[i].includes("<th")) continue;
      const headerCells =
        rows[i].match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) ?? [];
      const labels = headerCells.map((cell) => stripTags(cell).toLowerCase());
      nameIndex = labels.findIndex((label) => label.includes("name") || label.includes("player"));
      positionIndex = labels.findIndex((label) => label.includes("position") || label === "pos" || label.includes("pos."));
      if (nameIndex !== -1) {
        startRowIndex = i + 1;
        break;
      }
    }

    if (nameIndex === -1) return [];
    const players: Array<{ id: string; name: string; position: string }> = [];

    for (let i = startRowIndex; i < rows.length; i += 1) {
      const cellMatches =
        rows[i].match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) ?? [];
      if (cellMatches.length === 0) continue;
      const cells = cellMatches.map((cell) => stripTags(cell));
      const rawName = cells[nameIndex] || "";
      const name = cleanPlayerName(rawName);
      if (!name) continue;
      const position = positionIndex !== -1 ? (cells[positionIndex] || "").trim() : "";
      players.push({
        id: makePlayerId(teamId, name),
        name,
        position,
      });
    }

    return players;
  }

  async function getWikipediaRosterForTeam(teamId: string) {
    const page = NRL_WIKI_SEASON_PAGE_BY_TEAM_ID[teamId];
    if (!page) return null;
    const cacheKey = page.toLowerCase();
    const cached = wikipediaRosterCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.players;
    }

    const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(page)}`;
    try {
      const response = await fetch(url, {
        headers: { ...WIKIPEDIA_HEADERS, Accept: "text/html" },
      });
      if (!response.ok) return null;
      const html = await response.text();
      const tableHtml = extractTableHtmlForSquad(html);
      if (!tableHtml) return null;
      const players = parseSquadTable(tableHtml, teamId);
      if (players.length === 0) return null;
      wikipediaRosterCache.set(cacheKey, {
        players,
        expires: Date.now() + WIKIPEDIA_ROSTER_CACHE_TTL,
      });
      return players;
    } catch (error) {
      console.error("Wikipedia roster fetch failed:", error);
      return null;
    }
  }

  function resolveNewsImage(title: string, leagueHint?: string) {
    if (leagueHint) {
      const directLeagueLogo = findLeagueLogoInText(leagueHint);
      if (directLeagueLogo) return directLeagueLogo;
    }
    const teamLogo = findTeamLogoInText(title);
    if (teamLogo) return teamLogo;
    const leagueLogo = findLeagueLogoInText(title, leagueHint);
    if (leagueLogo) return leagueLogo;
    return RUGBY_FIELD_IMAGE;
  }

  function buildHeadlineImageUrl(title: string, leagueHint?: string) {
    const queryBase = `${leagueHint || ""} ${title}`.trim() || "rugby league";
    const normalized = queryBase
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 5)
      .join(",");
    return `https://source.unsplash.com/featured/?rugby,${encodeURIComponent(normalized || "league")}`;
  }

  async function attachRemoteThumbnails<T extends { link?: string | null; image?: string | null }>(items: T[], limit?: number) {
    const slice = typeof limit === "number" ? items.slice(0, limit) : items;
    await Promise.all(
      slice.map(async (item) => {
        if (item.image) return;
        const preview = await fetchArticlePreviewImage(item.link);
        if (preview) {
          item.image = preview;
        }
      })
    );
    return items;
  }

  function mapNewsItemsWithBranding<T extends { title: string; league?: string; image?: string | null; link?: string | null }>(items: T[], leagueHint?: string) {
    return items.map((item) => {
      const leagueContext = item.league || leagueHint || "";
      const leagueLogo =
        findLeagueLogoInText(leagueContext, leagueContext) ||
        findLeagueLogoInText(item.title, leagueContext);
      const teamLogo = findTeamLogoInText(item.title);
      const effectiveLogo = leagueLogo || teamLogo || SITE_LOGO;
      return {
        ...item,
        link: normalizeNewsArticleUrl(item.link),
        image: effectiveLogo,
      };
    });
  }

  type GeneratedPlayerStats = {
    appearances: number;
    tries: number;
    goals: number;
    tackleBusts: number;
    runMeters: number;
    tackles: number;
  };

  const getFallbackPlayerImage = (name: string) => {
    const encoded = encodeURIComponent(name || "Player");
    return `https://ui-avatars.com/api/?name=${encoded}&background=random&color=ffffff`;
  };

  const generatePlayerStats = (name: string): GeneratedPlayerStats => {
    const seed = Array.from(name || "Player").reduce((acc, char) => {
      acc = (acc << 5) - acc + char.charCodeAt(0);
      return acc | 0;
    }, 0);
    const pick = (shift: number, min: number, max: number) => {
      const range = max - min + 1;
      const value = Math.abs(((seed >> shift) ^ (seed << (shift % 5))) & 0xffff);
      return min + (value % range);
    };
    return {
      appearances: pick(0, 8, 28),
      tries: pick(4, 0, 20),
      goals: pick(8, 0, 40),
      tackleBusts: pick(12, 5, 80),
      runMeters: pick(16, 300, 3500),
      tackles: pick(20, 60, 650),
    };
  };

  function mapLocalFixtureToGame(fixture: LocalFixture, leagueName: string, leagueId: string) {
    const dateObj = new Date(fixture.dateUtc);
    const isoDate = dateObj.toISOString();
    const [datePart, timePart] = isoDate.split("T");
    const homeTeam = findLocalTeamByFragment(fixture.homeTeam);
    const awayTeam = findLocalTeamByFragment(fixture.awayTeam);
    const defaultCountry = { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" };

    const legacyId = createLegacyLocalMatchId(leagueName, fixture.matchNumber, fixture.homeTeam, fixture.awayTeam);
    const encodedId = createLocalMatchId(leagueName, fixture.matchNumber, fixture.homeTeam, fixture.awayTeam);

    return {
      id: encodedId,
      legacyId,
      matchNumber: fixture.matchNumber,
      date: datePart,
      time: (timePart || "00:00:00").substring(0, 8),
      timestamp: dateObj.getTime(),
      timezone: "UTC",
      week: `Round ${fixture.roundNumber}`,
      status: { long: "Not Started", short: "NS" },
      league: { 
        id: parseInt(leagueId, 10) || leagueId, 
        name: leagueName,
        type: "League",
        logo: null,
        season: parseInt(CURRENT_SEASON, 10),
      },
      country: homeTeam?.country || defaultCountry,
      teams: {
        home: {
          id: homeTeam ? parseInt(homeTeam.id, 10) : 0,
          name: homeTeam?.name || fixture.homeTeam,
          logo: homeTeam?.logo || null,
        },
        away: {
          id: awayTeam ? parseInt(awayTeam.id, 10) : 0,
          name: awayTeam?.name || fixture.awayTeam,
          logo: awayTeam?.logo || null,
        },
      },
      scores: { home: null, away: null },
      venue: fixture.location,
    };
  }

  function usesPlaceholderKickoffTime(fixture: LocalFixture) {
    return fixture.dateUtc.includes("T12:00:00");
  }

  function shouldReplaceFixture(current: LocalFixture, candidate: LocalFixture) {
    const currentPlaceholder = usesPlaceholderKickoffTime(current);
    const candidatePlaceholder = usesPlaceholderKickoffTime(candidate);
    if (currentPlaceholder !== candidatePlaceholder) {
      return currentPlaceholder && !candidatePlaceholder;
    }
    const candidateTime = new Date(candidate.dateUtc).getTime();
    const currentTime = new Date(current.dateUtc).getTime();
    return candidateTime < currentTime;
  }

  function buildFixturesFromLocalMap(fixturesByTeam: Record<string, LocalFixture[]>, leagueName: string) {
    const leagueId = LEAGUE_IDS[leagueName];
    if (!leagueId) return [];
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
  }

  function buildNrlFixturesFromLocalData() {
    return buildFixturesFromLocalMap(NRL_2026_FIXTURES_BY_TEAM, "NRL");
  }

  function buildSuperLeagueFixturesFromLocalData() {
    const leagueId = LEAGUE_IDS["Super League"];
    if (!leagueId) return [];
    return SUPER_LEAGUE_MASTER_FIXTURES
      .map((fixture) => mapLocalFixtureToGame(fixture, "Super League", leagueId))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  const LOCAL_GAME_SEARCH_CACHE = (() => {
    const dedup = new Map<string, any>();
    [...buildNrlFixturesFromLocalData(), ...buildSuperLeagueFixturesFromLocalData()].forEach((game) => {
      if (!dedup.has(game.id)) {
        dedup.set(game.id, game);
      }
    });
    return Array.from(dedup.values());
  })();

  function searchGames(query: string) {
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
  }

  function getLocalFixturesForTeam(teamId: string, leagueName?: string) {
    const leagueLower = leagueName?.toLowerCase() || "";
    if (leagueLower.includes("super")) {
      return SUPER_LEAGUE_FIXTURES_BY_TEAM[teamId];
    }
    return NRL_2026_FIXTURES_BY_TEAM[teamId];
  }

  function transformLocalGameForMatchDetail(game: any) {
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
  }

  function findLocalGameById(eventId: string) {
    if (!eventId?.startsWith(LOCAL_GAME_ID_PREFIX)) {
      return null;
    }
    const combinedFixtures = [
      ...buildNrlFixturesFromLocalData(),
      ...buildSuperLeagueFixturesFromLocalData(),
    ];

    const directMatch = combinedFixtures.find((fixture: any) => fixture.id === eventId || fixture.legacyId === eventId);
    if (directMatch) {
      return transformLocalGameForMatchDetail(directMatch);
    }

    // Fallback for legacy IDs that used raw team names
    const legacyMatch = combinedFixtures.find((fixture: any) => {
      if (typeof fixture.matchNumber !== "number") {
        return false;
      }
      const leagueLabel = fixture.league?.name || "";
      const homeName = fixture.teams?.home?.name || "";
      const awayName = fixture.teams?.away?.name || "";
      const candidateLegacyId = createLegacyLocalMatchId(leagueLabel, fixture.matchNumber, homeName, awayName);
      if (candidateLegacyId === eventId) {
        return true;
      }

      const decodedTarget = decodeLegacyLocalMatchId(eventId);
      if (!decodedTarget) {
        return false;
      }

      const decodedFixtureId = decodeLocalMatchId(fixture.id);
      if (decodedFixtureId) {
        return (
          decodedFixtureId.matchNumber === decodedTarget.matchNumber &&
          namesMatch(decodedFixtureId.homeTeam, decodedTarget.homeTeam) &&
          namesMatch(decodedFixtureId.awayTeam, decodedTarget.awayTeam)
        );
      }

      return (
        decodedTarget.matchNumber === fixture.matchNumber &&
        namesMatch(decodedTarget.homeTeam, homeName) &&
        namesMatch(decodedTarget.awayTeam, awayName)
      );
    });

    return legacyMatch ? transformLocalGameForMatchDetail(legacyMatch) : null;
  }

  // Get local teams by league
  function getLocalTeams(league?: string): any[] {
    if (!league) return LOCAL_TEAMS;
    
    const leagueLower = league.toLowerCase();
    if (leagueLower.includes("super")) {
      return LOCAL_TEAMS.filter(t => t.league === "Super League");
    } else if (leagueLower.includes("nrl") || leagueLower.includes("national")) {
      return LOCAL_TEAMS.filter(t => t.league === "NRL");
    }
    return LOCAL_TEAMS.filter(t => t.league === league);
  }

  // Helper: get local team logo by id
  function getLocalTeamLogo(id: any): string | null {
    const team = findLocalTeamMeta(id);
    return team?.logo || null;
  }

  function findLocalTeamById(id: string) {
    return findLocalTeamMeta(id);
  }

  // Search local teams by name
  function searchLocalTeams(name: string): any[] {
    const searchLower = name.toLowerCase();
    return LOCAL_TEAMS.filter(team => 
      team.name.toLowerCase().includes(searchLower)
    );
  }

  function searchLocalPlayers(name: string) {
    const normalized = name.toLowerCase();
    const results: Array<{ id: string; name: string; position: string; teamId: string; teamName?: string; league?: string }> = [];
    Object.entries(LOCAL_TEAM_ROSTERS).forEach(([teamId, roster]) => {
      roster.forEach((player) => {
        if (player.name.toLowerCase().includes(normalized)) {
          const teamInfo = findLocalTeamById(teamId);
          results.push({
            id: player.id,
            name: player.name,
            position: player.position,
            teamId,
            teamName: teamInfo?.name,
            league: teamInfo?.league,
          });
        }
      });
    });
    return results;
  }

  function searchTables(query: string) {
    if (!query) return [];
    const normalized = query.toLowerCase();
    return FEATURED_LEAGUES.filter((league) => {
      const haystack = [league.name, league.shortName, league.country].join(" ").toLowerCase();
      return haystack.includes(normalized);
    }).map((league) => ({
      id: league.id,
      name: league.name,
      description: `${league.name} standings and ladder`,
    }));
  }

  async function getLocalPlayerById(playerId: string) {
    for (const [teamId, roster] of Object.entries(LOCAL_TEAM_ROSTERS)) {
      const match = roster.find((player) => player.id === playerId);
      if (match) {
        const teamInfo = findLocalTeamById(teamId);
        return {
          ...match,
          teamId,
          teamName: teamInfo?.name,
          league: teamInfo?.league,
          country: teamInfo?.country,
          stats: generatePlayerStats(match.name),
        };
      }
    }

    if (playerId.startsWith("SL-")) {
      const [, teamId, rawNumber] = playerId.split("-");
      const teamInfo = findLocalTeamById(teamId);
      const squads = SUPER_LEAGUE_SQUADS_BY_TEAM_ID[teamId] || [];
      const squad =
        squads.find((entry) => entry.season === parseInt(CURRENT_SEASON, 10)) ||
        squads[0];
      const findByNumber = (squadList: SuperLeagueSquad[], ownerTeamId: string) => {
        const active =
          squadList.find((entry) => entry.season === parseInt(CURRENT_SEASON, 10)) ||
          squadList[0];
        if (!active || !active.players || active.players.length === 0) return null;
        const match = active.players.find((player, index) => {
          const number = player.squad_number ?? index + 1;
          return String(number) === rawNumber;
        });
        if (!match) return null;
        const ownerInfo = findLocalTeamById(ownerTeamId);
        const fallbackPosition = fallbackPositionFromNumber(rawNumber);
        return {
          id: playerId,
          name: match.name,
          position: formatPositions(match.position) || match.position || fallbackPosition || "",
          teamId: ownerTeamId,
          teamName: ownerInfo?.name || active.team_name,
          league: ownerInfo?.league || "Super League",
          country: ownerInfo?.country,
          nationality: match.nationality,
          nationalitySecondary: match.nationality_secondary,
          stats: generatePlayerStats(match.name),
        };
      };

      const directMatch = findByNumber(squads, teamId);
      if (directMatch) {
        return directMatch;
      }

      let fallbackMatch: ReturnType<typeof findByNumber> | null = null;
      for (const [fallbackTeamId, fallbackSquads] of Object.entries(SUPER_LEAGUE_SQUADS_BY_TEAM_ID)) {
        const candidate = findByNumber(fallbackSquads, fallbackTeamId);
        if (!candidate) continue;
        if (fallbackMatch && fallbackMatch.teamId !== candidate.teamId) {
          fallbackMatch = null;
          break;
        }
        fallbackMatch = candidate;
      }
      if (fallbackMatch) {
        return fallbackMatch;
      }
    }

    const teamSlug = SORTED_TEAM_SLUGS.find((slug) => playerId.startsWith(`${slug}-`));
    if (!teamSlug) return null;
    const teamId = TEAM_ID_BY_SLUG[teamSlug];
    if (!teamId) return null;
    const teamInfo = findLocalTeamById(teamId);
    if (!teamInfo || teamInfo.league !== "NRL") return null;
    const zeroTackleRoster = await getZeroTackleRosterForTeam(teamId);
    let match = zeroTackleRoster?.find((player) => player.id === playerId) || null;
    if (!match) {
      const wikipediaRoster = await getWikipediaRosterForTeam(teamId);
      match = wikipediaRoster?.find((player) => player.id === playerId) || null;
    }
    if (!match) return null;
    return {
      ...match,
      teamId,
      teamName: teamInfo?.name,
      league: teamInfo?.league,
      country: teamInfo?.country,
      stats: generatePlayerStats(match.name),
    };
  }

  async function searchTeamsByName(name: string) {
    if (!name || name.length < 2) {
      return [];
    }

    const data = await fetchFromSportsDB(`/searchteams.php?t=${encodeURIComponent(name)}`);
    if (data?.teams) {
      const rugbyLeagueTeams = data.teams
        .filter((team: any) =>
          team.strSport === "Rugby League" ||
          team.strLeague?.includes("NRL") ||
          team.strLeague?.includes("Super League") ||
          team.strLeague?.includes("Rugby")
        )
        .map((team: any) => ({
          id: team.idTeam,
          name: team.strTeam,
          logo: team.strBadge || team.strLogo,
          league: team.strLeague,
          country: {
            name: team.strCountry,
            code: team.strCountry === "Australia" ? "AU" : team.strCountry === "New Zealand" ? "NZ" : "GB",
            flag:
              team.strCountry === "Australia"
                ? "https://flagcdn.com/w40/au.png"
                : team.strCountry === "New Zealand"
                ? "https://flagcdn.com/w40/nz.png"
                : team.strCountry === "France"
                ? "https://flagcdn.com/w40/fr.png"
                : "https://flagcdn.com/w40/gb.png",
          },
        }));

      if (rugbyLeagueTeams.length > 0) {
        return rugbyLeagueTeams;
      }
    }

    return searchLocalTeams(name);
  }

  async function searchPlayersByName(name: string) {
    if (!name || name.length < 2) {
      return [];
    }

    return searchLocalPlayers(name).map((player) => ({
      id: player.id,
      name: player.name,
      position: formatPositions(player.position) || player.position,
      team: player.teamName,
      league: player.league,
      image: getFallbackPlayerImage(player.name),
    }));
  }

  // Search teams by name
  app.get("/api/rugby/teams/search", async (req, res) => {
    try {
      const { name } = req.query as { name?: string };
      const results = await searchTeamsByName(name || "");
      res.json({ response: results });
    } catch (error: any) {
      console.error("Team search error:", error);
      res.status(500).json({ message: error.message || "Failed to search teams" });
    }
  });

  // Get all teams in a league
  app.get("/api/rugby/teams", async (req, res) => {
    try {
      const { league } = req.query as { league?: string };
      const leagueName = league || "NRL";
      
      // Use local team data with TheSportsDB IDs and badges
      const teams = getLocalTeams(leagueName);
      if (teams.length > 0) {
        return res.json({ response: teams });
      }

      // Fallback to TheSportsDB if no local teams exist for the league
      const leagueCandidates = [leagueName];
      const leagueLower = leagueName.toLowerCase();
      if (leagueLower.includes("super") && !leagueLower.includes("league")) {
        leagueCandidates.push("Super League");
      }

      for (const leagueLabel of leagueCandidates) {
        const data = await fetchFromSportsDB(`/search_all_teams.php?l=${encodeURIComponent(leagueLabel)}`);
        if (data?.teams && data.teams.length > 0) {
          const mapped = data.teams
            .filter((team: any) => team.strSport === "Rugby League")
            .map((team: any) => ({
              id: team.idTeam,
              name: team.strTeam,
              logo: team.strBadge || team.strLogo,
              league: team.strLeague,
              country: {
                name: team.strCountry || "Unknown",
                code: team.strCountry === "Australia" ? "AU" : team.strCountry === "New Zealand" ? "NZ" : team.strCountry === "France" ? "FR" : "GB",
                flag:
                  team.strCountry === "Australia"
                    ? "https://flagcdn.com/w40/au.png"
                    : team.strCountry === "New Zealand"
                      ? "https://flagcdn.com/w40/nz.png"
                      : team.strCountry === "France"
                        ? "https://flagcdn.com/w40/fr.png"
                        : team.strCountry
                          ? "https://flagcdn.com/w40/gb.png"
                          : null,
              },
              stadium: team.strStadium || null,
            }));
          if (mapped.length > 0) {
            return res.json({ response: mapped });
          }
        }
      }

      res.json({ response: [] });
    } catch (error: any) {
      console.error("Teams fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch teams" });
    }
  });

  // Get team by ID
  app.get("/api/rugby/team/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const resolvedTeamId = resolveTeamIdentifier(id);
      
      // Check local data first for known rugby league teams
      const localTeam = findLocalTeamMeta(id);
      
      // Try TheSportsDB for additional details, but verify it's rugby league
      const shouldLookupRemote = resolvedTeamId ? /^\d+$/.test(resolvedTeamId) : false;
      const data = shouldLookupRemote && resolvedTeamId
        ? await fetchFromSportsDB(`/lookupteam.php?id=${resolvedTeamId}`)
        : null;
      if (data?.teams && data.teams.length > 0) {
        const team = data.teams[0];
        // Only use API data if it's a rugby league team
        if (team.strSport === "Rugby League") {
          return res.json({ response: [{
            id: team.idTeam,
            name: team.strTeam,
            logo: localTeam?.logo || team.strBadge || team.strLogo,
            league: team.strLeague,
            country: {
              name: team.strCountry,
              code: team.strCountry === "Australia" ? "AU" : team.strCountry === "New Zealand" ? "NZ" : "GB",
              flag: team.strCountry === "Australia" ? "https://flagcdn.com/w40/au.png" : 
                    team.strCountry === "New Zealand" ? "https://flagcdn.com/w40/nz.png" :
                    team.strCountry === "France" ? "https://flagcdn.com/w40/fr.png" : "https://flagcdn.com/w40/gb.png"
            },
            stadium: team.strStadium,
            description: team.strDescriptionEN,
            founded: team.intFormedYear,
            website: team.strWebsite,
            facebook: team.strFacebook,
            twitter: team.strTwitter,
            instagram: team.strInstagram,
            jersey: team.strEquipment,
          }] });
        }
      }
      
      // Fallback to local data for rugby league teams
      if (localTeam) {
        res.json({ response: [localTeam] });
      } else {
        res.json({ response: [] });
      }
    } catch (error: any) {
      console.error("Team fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch team" });
    }
  });

  // Proxy Wakefield Trinity logo from Wikimedia to avoid CORS/user-agent issues
  app.get("/api/assets/logo/wakefield.png", async (_req, res) => {
    try {
      // Use MediaWiki API to get the file URL for File:Wakey_new_logo.png
      const apiUrl = "https://en.wikipedia.org/w/api.php?action=query&titles=File:Wakey_new_logo.png&prop=imageinfo&iiprop=url&format=json";
      const apiResp = await fetch(apiUrl);
      if (!apiResp.ok) return res.status(502).send("Failed to contact Wikimedia API");
      const apiJson = await apiResp.json();
      const pages = apiJson?.query?.pages || {};
      const pageKey = Object.keys(pages)[0];
      const imageinfo = pages[pageKey]?.imageinfo;
      const imageUrl = imageinfo && imageinfo[0] && imageinfo[0].url;

      if (!imageUrl) {
        return res.status(404).send("Wakefield logo not found on Wikimedia");
      }

      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) return res.status(502).send("Failed to fetch image from Wikimedia");

      const contentType = imgResp.headers.get("content-type") || "image/png";
      const buffer = Buffer.from(await imgResp.arrayBuffer());

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (error) {
      console.error("Error proxying Wakefield logo:", error);
      res.status(500).send("Internal server error while proxying logo");
    }
  });

  // Proxy York Knights logo from Wikimedia to avoid CORS/user-agent issues
  app.get("/api/assets/logo/york.webp", async (_req, res) => {
    try {
      // Use MediaWiki API to get the file URL for File:York_RLFC_Knights_logo.webp
      const apiUrl = "https://en.wikipedia.org/w/api.php?action=query&titles=File:York_RLFC_Knights_logo.webp&prop=imageinfo&iiprop=url&format=json";
      const apiResp = await fetch(apiUrl);
      if (!apiResp.ok) return res.status(502).send("Failed to contact Wikimedia API");
      const apiJson = await apiResp.json();
      const pages = apiJson?.query?.pages || {};
      const pageKey = Object.keys(pages)[0];
      const imageinfo = pages[pageKey]?.imageinfo;
      const imageUrl = imageinfo && imageinfo[0] && imageinfo[0].url;

      if (!imageUrl) {
        return res.status(404).send("York Knights logo not found on Wikimedia");
      }

      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) return res.status(502).send("Failed to fetch image from Wikimedia");

      const contentType = imgResp.headers.get("content-type") || "image/webp";
      const buffer = Buffer.from(await imgResp.arrayBuffer());

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (error) {
      console.error("Error proxying York Knights logo:", error);
      res.status(500).send("Internal server error while proxying logo");
    }
  });

  // Proxy St George Illawarra Dragons logo from Wikimedia to avoid CORS/user-agent issues
  app.get("/api/assets/logo/st-george-illawarra.svg", async (_req, res) => {
    try {
      // Use MediaWiki API to get the file URL for File:St._George_Illawarra_Dragons_logo.svg
      const apiUrl = "https://en.wikipedia.org/w/api.php?action=query&titles=File:St._George_Illawarra_Dragons_logo.svg&prop=imageinfo&iiprop=url&format=json";
      const apiResp = await fetch(apiUrl);
      if (!apiResp.ok) return res.status(502).send("Failed to contact Wikimedia API");
      const apiJson = await apiResp.json();
      const pages = apiJson?.query?.pages || {};
      const pageKey = Object.keys(pages)[0];
      const imageinfo = pages[pageKey]?.imageinfo;
      const imageUrl = imageinfo && imageinfo[0] && imageinfo[0].url;

      if (!imageUrl) {
        return res.status(404).send("St George Illawarra Dragons logo not found on Wikimedia");
      }

      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) return res.status(502).send("Failed to fetch image from Wikimedia");

      const contentType = imgResp.headers.get("content-type") || "image/svg+xml";
      const buffer = Buffer.from(await imgResp.arrayBuffer());

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (error) {
      console.error("Error proxying St George Illawarra Dragons logo:", error);
      res.status(500).send("Internal server error while proxying logo");
    }
  });

  // Get team roster/squad
  app.get("/api/rugby/team/:id/players", async (req, res) => {
    try {
      const { id } = req.params;
      const resolvedTeamId = resolveTeamIdentifier(id);
      const { season } = req.query as { season?: string };
      const defaultSeason = parseInt(CURRENT_SEASON, 10);
      const requestedSeason = season ? parseInt(season, 10) : defaultSeason;
      const seasonFilter = Number.isNaN(requestedSeason) ? defaultSeason : requestedSeason;
      const localRoster = resolvedTeamId ? LOCAL_TEAM_ROSTERS[resolvedTeamId] || [] : [];
      const teamInfo = resolvedTeamId ? findLocalTeamMeta(resolvedTeamId) : undefined;
      const superLeagueSquads = resolvedTeamId ? SUPER_LEAGUE_SQUADS_BY_TEAM_ID[resolvedTeamId] || [] : [];

      const buildLocalRosterPlayers = async (roster: Array<{ id: string; name: string; position: string }>) => {
        if (!roster || roster.length === 0) return null;
        const positionLookup = new Map(
          localRoster.map((player) => [player.name.toLowerCase(), player.position])
        );
        const players = await Promise.all(
          roster
            .filter((player) => isPlayerAssignedToTeam(player.name, resolvedTeamId))
            .map(async (player) => {
            const wikiProfile = await getWikipediaPlayerProfile(player.name, {
              teamName: teamInfo?.name,
              league: teamInfo?.league,
            });
            const normalizedPosition =
              wikiProfile?.position ||
              formatPositions(player.position) ||
              formatPositions(positionLookup.get(player.name.toLowerCase())) ||
              player.position ||
              positionLookup.get(player.name.toLowerCase()) ||
              "Utility";
            const description =
              wikiProfile?.summary ||
              (normalizedPosition
                ? `${player.name} plays ${normalizedPosition} for ${teamInfo?.name || "the club"}.`
                : `${player.name} plays for ${teamInfo?.name || "the club"}.`);
            return {
              id: player.id,
              name: player.name,
              position: normalizedPosition,
              nationality: wikiProfile?.nationality || teamInfo?.country?.name || "Australia",
              birthDate: null,
              height: null,
              weight: null,
              photo: wikiProfile?.image || getFallbackPlayerImage(player.name),
              thumbnail: wikiProfile?.image || getFallbackPlayerImage(player.name),
              number: null,
              description,
              stats: generatePlayerStats(player.name),
            };
          })
        );
        return players;
      };

      const buildSuperLeaguePlayers = async () => {
        if (!superLeagueSquads || superLeagueSquads.length === 0) return null;
        const squad =
          superLeagueSquads.find((entry) => entry.season === seasonFilter) ||
          superLeagueSquads[0];
        if (!squad || !squad.players || squad.players.length === 0) return null;
        const idForTeam = resolvedTeamId || id;
        return Promise.all(
          squad.players
            .filter((player) => isPlayerAssignedToTeam(player.name, resolvedTeamId))
            .map(async (player, index) => {
          const wikiProfile = await getWikipediaPlayerProfile(player.name, {
            teamName: teamInfo?.name,
            league: teamInfo?.league,
          });
          const avatar = wikiProfile?.image || getFallbackPlayerImage(player.name);
          const fallbackPosition = fallbackPositionFromNumber(player.squad_number);
          const normalizedPosition =
            wikiProfile?.position ||
            formatPositions(player.position) ||
            player.position ||
            fallbackPosition ||
            "Utility";
          return {
            id: `SL-${idForTeam}-${player.squad_number ?? index + 1}`,
            name: player.name,
            position: normalizedPosition,
            nationality: player.nationality || wikiProfile?.nationality || teamInfo?.country?.name || "England",
            nationalitySecondary: player.nationality_secondary || null,
            birthDate: player.dob || null,
            height: player.height_cm ? `${player.height_cm} cm` : null,
            weight: player.weight_kg ? `${player.weight_kg} kg` : null,
            photo: avatar,
            thumbnail: avatar,
            number: player.squad_number ? String(player.squad_number) : null,
            description:
              wikiProfile?.summary ||
              (normalizedPosition && squad.source_note
                ? `${player.name} (${normalizedPosition}) - ${squad.source_note}`
                : squad.source_note || `${player.name} is part of ${squad.team_name}'s ${squad.season} squad.`),
            stats: generatePlayerStats(player.name),
          };
        })
        );
      };

      let rosterToUse = localRoster;
      if (teamInfo?.league === "NRL" && resolvedTeamId) {
        const zeroTackleRoster = await getZeroTackleRosterForTeam(resolvedTeamId);
        if (zeroTackleRoster && zeroTackleRoster.length > 0) {
          rosterToUse = zeroTackleRoster;
        } else {
          const wikipediaRoster = await getWikipediaRosterForTeam(resolvedTeamId);
          if (wikipediaRoster && wikipediaRoster.length > 0) {
            rosterToUse = wikipediaRoster;
          }
        }
      }

      const isSuperLeagueTeam =
        teamInfo?.league === "Super League" ||
        (resolvedTeamId ? SUPER_LEAGUE_TEAM_IDS.has(String(resolvedTeamId)) : false);

      if (isSuperLeagueTeam) {
        const superLeaguePlayers = await buildSuperLeaguePlayers();
        if (superLeaguePlayers) {
          return res.json({ response: superLeaguePlayers });
        }
      }

      const localPlayers = await buildLocalRosterPlayers(rosterToUse);
      if (localPlayers) {
        return res.json({ response: localPlayers });
      }

      if (!isSuperLeagueTeam) {
        const superLeaguePlayers = await buildSuperLeaguePlayers();
        if (superLeaguePlayers) {
          return res.json({ response: superLeaguePlayers });
        }
      }
      
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Team players fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch team players" });
    }
  });

  app.get("/api/rugby/players", async (req, res) => {
    try {
      const { league, season } = req.query as { league?: string; season?: string };
      const leagueName = league || "NRL";
      const leagueLower = leagueName.toLowerCase();
      const defaultSeason = parseInt(CURRENT_SEASON, 10);
      const requestedSeason = season ? parseInt(season, 10) : defaultSeason;
      const seasonFilter = Number.isNaN(requestedSeason) ? defaultSeason : requestedSeason;
      const teams = getLocalTeams(leagueName);

      if (leagueLower.includes("super")) {
        const players = teams.flatMap((team) => {
          const squads = SUPER_LEAGUE_SQUADS_BY_TEAM_ID[String(team.id)] || [];
          const squad =
            squads.find((entry) => entry.season === seasonFilter) ||
            squads[0];
          if (!squad || !squad.players || squad.players.length === 0) return [];
          return squad.players
            .filter((player) => isPlayerAssignedToTeam(player.name, team.id))
            .map((player, index) => ({
              id: `SL-${team.id}-${player.squad_number ?? index + 1}`,
              name: player.name,
              position:
                formatPositions(player.position) ||
                player.position ||
                fallbackPositionFromNumber(player.squad_number) ||
                "Utility",
              teamId: String(team.id),
              teamName: team.name,
              league: team.league,
              number: player.squad_number ? String(player.squad_number) : null,
              image: getFallbackPlayerImage(player.name),
            }));
        });
        if (players.length > 0) {
          const enriched = await mapWithConcurrency(players, 6, async (player, index) => {
            if (player.position) return player;
            const wikiProfile = await getWikipediaPlayerProfile(player.name, {
              teamName: player.teamName,
              league: player.league,
            });
            return {
              ...player,
              position: wikiProfile?.position || player.position || "Utility",
              image: wikiProfile?.image || player.image,
            };
          });
          return res.json({ response: enriched });
        }

        const fallbackPlayers = Object.entries(SUPER_LEAGUE_SQUADS_BY_TEAM_ID).flatMap(
          ([teamId, squads]) => {
            const teamInfo = findLocalTeamMeta(teamId);
            const squad =
              squads.find((entry) => entry.season === seasonFilter) ||
              squads[0];
            if (!squad || !squad.players || squad.players.length === 0) return [];
            return squad.players
              .filter((player) => isPlayerAssignedToTeam(player.name, teamId))
            .map((player, index) => ({
              id: `SL-${teamId}-${player.squad_number ?? index + 1}`,
              name: player.name,
              position:
                formatPositions(player.position) ||
                player.position ||
                fallbackPositionFromNumber(player.squad_number) ||
                "Utility",
              teamId,
              teamName: teamInfo?.name || squad.team_name,
              league: teamInfo?.league || "Super League",
              number: player.squad_number ? String(player.squad_number) : null,
              image: getFallbackPlayerImage(player.name),
              }));
          }
        );

        const enrichedFallback = await mapWithConcurrency(fallbackPlayers, 6, async (player, index) => {
          if (player.position) return player;
          const wikiProfile = await getWikipediaPlayerProfile(player.name, {
            teamName: player.teamName,
            league: player.league,
          });
          return {
            ...player,
            position: wikiProfile?.position || player.position || "Utility",
            image: wikiProfile?.image || player.image,
          };
        });
        return res.json({ response: enrichedFallback });
      }

      const rosterResults = await Promise.all(
        teams.map(async (team) => {
          const roster = await getZeroTackleRosterForTeam(String(team.id));
          const fallback = LOCAL_TEAM_ROSTERS[String(team.id)] || [];
          const players = (roster && roster.length > 0 ? roster : fallback).map((player) => ({
            id: player.id,
            name: player.name,
            position: formatPositions(player.position) || player.position || "Utility",
            teamId: String(team.id),
            teamName: team.name,
            league: team.league,
            number: null,
            image: getFallbackPlayerImage(player.name),
          }));
          return players;
        })
      );

      const rosterPlayers = rosterResults.flat();
      const enrichedRoster = await mapWithConcurrency(rosterPlayers, 6, async (player, index) => {
        if (player.position) return player;
        const wikiProfile = await getWikipediaPlayerProfile(player.name, {
          teamName: player.teamName,
          league: player.league,
        });
        return {
          ...player,
          position: wikiProfile?.position || player.position || "Utility",
          image: wikiProfile?.image || player.image,
        };
      });
      res.json({ response: enrichedRoster });
    } catch (error: any) {
      console.error("Players list fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch players" });
    }
  });

  app.get("/api/rugby/players/:id", async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      if (!id) {
        return res.status(400).json({ message: "Player ID is required" });
      }

      const localPlayer = await getLocalPlayerById(id);
      if (localPlayer) {
        const wikiProfile = await getWikipediaPlayerProfile(localPlayer.name, {
          teamName: localPlayer.teamName,
          league: localPlayer.league,
        });
        const normalizedPosition =
          wikiProfile?.position || formatPositions(localPlayer.position) || localPlayer.position || "Utility";
        const avatar = wikiProfile?.image || getFallbackPlayerImage(localPlayer.name);
        const teamLogo = getLocalTeamLogo(localPlayer.teamId);
        return res.json({
          response: {
            id: localPlayer.id,
            name: localPlayer.name,
            position: normalizedPosition,
            team: localPlayer.teamName,
            teamId: localPlayer.teamId,
            teamLogo,
            league: localPlayer.league,
            nationality: localPlayer.nationality || wikiProfile?.nationality || localPlayer.country?.name || "Australia",
            nationalitySecondary: localPlayer.nationalitySecondary || null,
            image: avatar,
            description:
              wikiProfile?.summary ||
              (normalizedPosition
                ? `${localPlayer.name} plays ${normalizedPosition} for ${localPlayer.teamName || "their club"}.`
                : `${localPlayer.name} plays for ${localPlayer.teamName || "their club"}.`),
            clubHistory: wikiProfile?.clubHistory || null,
            socials: {},
            stats: localPlayer.stats || generatePlayerStats(localPlayer.name),
          },
        });
      }

      res.status(404).json({ message: "Player not found" });
    } catch (error: any) {
      console.error("Player detail fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch player" });
    }
  });

  // Get fixtures/games for a league (uses season data for rugby league)
  app.get("/api/rugby/fixtures", async (req, res) => {
    try {
      const { league, season } = req.query as { league?: string; season?: string };
      const leagueName = league || "NRL";
      const leagueId = LEAGUE_IDS[leagueName];
      const seasonYear = season || CURRENT_SEASON;
      const normalizedLeague = leagueName.toLowerCase();
      
      if (leagueId) {
        // Use eventsseason.php for complete season data (works during off-season)
        const data = await fetchFromSportsDB(`/eventsseason.php?id=${leagueId}&s=${seasonYear}`);
        if (data?.events && Array.isArray(data.events)) {
          // Filter to only rugby league events and sort by date
          const events = data.events
            .filter((e: any) => e.strSport === "Rugby League" || e.idLeague === leagueId)
            .map((e: any) => {
              const statusStr = e.strStatus || (e.intHomeScore !== null ? "Match Finished" : "Not Started");
              const statusShort = statusStr === "Match Finished" ? "FT" : 
                                 statusStr === "Not Started" ? "NS" : 
                                 statusStr === "After Extra Time" ? "AET" : 
                                 statusStr === "Postponed" ? "PST" : statusStr;
              return {
                id: e.idEvent,
                date: e.dateEvent,
                time: e.strTime,
                teams: {
                  home: {
                      id: e.idHomeTeam,
                      name: e.strHomeTeam,
                      logo: e.strHomeTeamBadge || getLocalTeamLogo(e.idHomeTeam),
                    },
                    away: {
                      id: e.idAwayTeam,
                      name: e.strAwayTeam,
                      logo: e.strAwayTeamBadge || getLocalTeamLogo(e.idAwayTeam),
                    },
                },
                scores: {
                  home: e.intHomeScore !== null ? parseInt(e.intHomeScore) : null,
                  away: e.intAwayScore !== null ? parseInt(e.intAwayScore) : null,
                },
                venue: e.strVenue,
                status: { long: statusStr, short: statusShort },
                round: e.intRound,
                league: { id: leagueId, name: leagueName },
              };
            })
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 50);
          if (events.length > 0) {
            return res.json({ response: events });
          }
        }
      }

      if (normalizedLeague.includes("super")) {
        const localFixtures = buildSuperLeagueFixturesFromLocalData();
        if (localFixtures.length > 0) {
          return res.json({ response: localFixtures });
        }
      }

      if (normalizedLeague.includes("nrl")) {
        const localFixtures = buildNrlFixturesFromLocalData();
        if (localFixtures.length > 0) {
          return res.json({ response: localFixtures });
        }
      }
      
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Fixtures fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch fixtures" });
    }
  });

  // Get past/completed games for a league
  app.get("/api/rugby/results", async (req, res) => {
    try {
      const { league } = req.query as { league?: string };
      const leagueName = league || "NRL";
      const leagueId = LEAGUE_IDS[leagueName];
      
      if (leagueId) {
        // Get last 15 events
        const data = await fetchFromSportsDB(`/eventspastleague.php?id=${leagueId}`);
        if (data?.events) {
          const events = data.events.map((e: any) => {
            const statusStr = e.strStatus || "Match Finished";
            const statusShort = statusStr === "Match Finished" ? "FT" : 
                               statusStr === "After Extra Time" ? "AET" : statusStr;
            return {
              id: e.idEvent,
              date: e.dateEvent,
              time: e.strTime,
              teams: {
                home: {
                  id: e.idHomeTeam,
                  name: e.strHomeTeam,
                  logo: e.strHomeTeamBadge,
                },
                away: {
                  id: e.idAwayTeam,
                  name: e.strAwayTeam,
                  logo: e.strAwayTeamBadge,
                },
              },
              scores: {
                home: e.intHomeScore !== null ? parseInt(e.intHomeScore) : null,
                away: e.intAwayScore !== null ? parseInt(e.intAwayScore) : null,
              },
              venue: e.strVenue,
              status: { long: statusStr, short: statusShort },
              round: e.intRound,
              league: { id: leagueId, name: leagueName },
            };
          });
          return res.json({ response: events });
        }
      }
      
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Results fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch results" });
    }
  });

  // Get games for a team
  app.get("/api/rugby/team/:id/games", async (req, res) => {
    try {
      const { id } = req.params;
      const resolvedTeamId = resolveTeamIdentifier(id);
      const { season } = req.query as { season?: string };
      const requestedSeason = season || CURRENT_SEASON;
      const localTeamInfo = resolvedTeamId ? findLocalTeamMeta(resolvedTeamId) : undefined;
      const localFixtures =
        requestedSeason === CURRENT_SEASON && resolvedTeamId
          ? getLocalFixturesForTeam(resolvedTeamId, localTeamInfo?.league)
          : undefined;
      
      if (localFixtures && localFixtures.length > 0) {
        const leagueName = localTeamInfo?.league?.toLowerCase().includes("super") ? "Super League" : "NRL";
        const leagueId = LEAGUE_IDS[leagueName] || LEAGUE_IDS["NRL"];
        const mapped = localFixtures
          .map((fixture) => mapLocalFixtureToGame(fixture, leagueName, leagueId))
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        return res.json({ response: mapped });
      }

      if (!resolvedTeamId || !/^\d+$/.test(resolvedTeamId)) {
        return res.json({ response: [] });
      }

      // Get next 5 and last 5 events for the team
      const [nextData, pastData] = await Promise.all([
        fetchFromSportsDB(`/eventsnext.php?id=${resolvedTeamId}`),
        fetchFromSportsDB(`/eventslast.php?id=${resolvedTeamId}`)
      ]);
      
      const mapEvent = (e: any) => {
        const statusStr = e.strStatus || (e.intHomeScore !== null ? "Match Finished" : "Not Started");
        const statusShort = statusStr === "Match Finished" ? "FT" : 
                           statusStr === "Not Started" ? "NS" : 
                           statusStr === "After Extra Time" ? "AET" : 
                           statusStr === "Postponed" ? "PST" : statusStr;
        return {
          id: e.idEvent,
          date: e.dateEvent,
          time: e.strTime,
          timestamp: e.dateEvent ? new Date(`${e.dateEvent}T${e.strTime || "00:00:00"}`).getTime() : 0,
          timezone: "UTC",
          week: e.intRound || "",
          status: {
            long: statusStr,
            short: statusShort,
          },
          league: { 
            id: e.idLeague, 
            name: e.strLeague,
            type: "League",
            logo: null,
            season: new Date().getFullYear(),
          },
          country: {
            name: e.strCountry || "Unknown",
            code: "AU",
            flag: "https://flagcdn.com/w40/au.png",
          },
          teams: {
            home: {
              id: parseInt(e.idHomeTeam) || 0,
              name: e.strHomeTeam,
              logo: e.strHomeTeamBadge,
            },
            away: {
              id: parseInt(e.idAwayTeam) || 0,
              name: e.strAwayTeam,
              logo: e.strAwayTeamBadge,
            },
          },
          scores: {
            home: e.intHomeScore !== null ? parseInt(e.intHomeScore) : null,
            away: e.intAwayScore !== null ? parseInt(e.intAwayScore) : null,
          },
        };
      };
      
      // Filter for rugby league only and map events
      const pastEvents = (pastData?.results || [])
        .filter((e: any) => e.strSport === "Rugby League")
        .map(mapEvent);
      const nextEvents = (nextData?.events || [])
        .filter((e: any) => e.strSport === "Rugby League")
        .map(mapEvent);
      
      let events = [...pastEvents, ...nextEvents];

      // Fallback: if no team-specific events found, try season events for leagues
      if (events.length === 0) {
        try {
          const teamLookup = await fetchFromSportsDB(`/lookupteam.php?id=${id}`);
          const seasonYear = String(new Date().getFullYear());
          const leagueCandidates: string[] = [];

          if (teamLookup?.teams && teamLookup.teams[0]) {
            const teamInfo = teamLookup.teams[0];
            if (teamInfo.idLeague) leagueCandidates.push(String(teamInfo.idLeague));
            if (teamInfo.strLeague) {
              // try to find known league id by name
              const matched = Object.entries(LEAGUE_IDS).find(([k, v]) => (teamInfo.strLeague || '').toLowerCase().includes(k.toLowerCase()));
              if (matched) leagueCandidates.push(matched[1]);
            }
          }

          // Add known league ids as additional candidates
          for (const v of Object.values(LEAGUE_IDS)) {
            if (!leagueCandidates.includes(v)) leagueCandidates.push(v);
          }

          const fallbackEvents: any[] = [];
          for (const lId of leagueCandidates) {
            const seasonData = await fetchFromSportsDB(`/eventsseason.php?id=${lId}&s=${seasonYear}`);
            if (seasonData?.events) {
              const matches = seasonData.events.filter((e: any) => String(e.idHomeTeam) === String(id) || String(e.idAwayTeam) === String(id));
              for (const me of matches) {
                fallbackEvents.push(mapEvent(me));
              }
            }
            if (fallbackEvents.length > 0) break;
          }

          if (fallbackEvents.length > 0) {
            events = fallbackEvents;
          }
        } catch (err) {
          console.warn('Team games fallback failed for', id, err);
        }
      }

      res.json({ response: events });
    } catch (error: any) {
      console.error("Team games fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch team games" });
    }
  });

  // Get event/game details
  app.get("/api/rugby/game/:id", async (req, res) => {
    try {
      const rawId = req.params.id;
      let decodedId: string;
      try {
        decodedId = decodeURIComponent(rawId);
      } catch {
        decodedId = rawId;
      }
      const localGame = findLocalGameById(decodedId);
      if (localGame) {
        return res.json({ response: [localGame] });
      }
      
      const data = await fetchFromSportsDB(`/lookupevent.php?id=${encodeURIComponent(decodedId)}`);
      if (data?.events && data.events.length > 0) {
        const e = data.events[0];
        // Ensure the event is a Rugby League event; SportsDB can return other sports for the same id
        const isRugbyEvent = (e.strSport === "Rugby League") ||
          (e.idLeague && Object.values(LEAGUE_IDS).includes(String(e.idLeague))) ||
          (e.strLeague && /Rugby|NRL|Super League/i.test(e.strLeague || ''));

        if (!isRugbyEvent) {
          console.warn(`Event ${decodedId} is not Rugby League (found sport/league: ${e.strSport || e.strLeague || e.idLeague})`);
          return res.json({ response: [] });
        }
        return res.json({ response: [{
          id: e.idEvent,
          date: e.dateEvent,
          time: e.strTime,
          homeTeam: {
            id: e.idHomeTeam,
            name: e.strHomeTeam,
            logo: e.strHomeTeamBadge,
            score: e.intHomeScore,
          },
          awayTeam: {
            id: e.idAwayTeam,
            name: e.strAwayTeam,
            logo: e.strAwayTeamBadge,
            score: e.intAwayScore,
          },
          venue: e.strVenue,
          status: e.strStatus || (e.intHomeScore !== null ? "FT" : null),
          round: e.intRound,
          league: e.strLeague,
          season: e.strSeason,
          description: e.strDescriptionEN,
          video: e.strVideo,
        }] });
      }
      
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Game fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch game" });
    }
  });

  // Get league standings
  app.get("/api/rugby/standings", async (req, res) => {
    try {
      const { league } = req.query as { league?: string };
      const leagueName = league || "NRL";
      const leagueId = LEAGUE_IDS[leagueName];
      
      if (leagueId) {
        const data = await fetchFromSportsDB(`/lookuptable.php?l=${leagueId}`);
        if (data?.table) {
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
          return res.json({ response: standings });
        }
      }
      
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Standings fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch standings" });
    }
  });

  // Get all rugby leagues
  app.get("/api/rugby/leagues", async (req, res) => {
    try {
      // Return static list of supported leagues
      res.json({ response: [
        { id: "NRL", name: "NRL", country: "Australia" },
        { id: "Super League", name: "Super League", country: "England" },
      ] });
    } catch (error: any) {
      console.error("Leagues fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch leagues" });
    }
  });

  const FALLBACK_NEWS_POOL = Object.values(LOCAL_NEWS_BY_LEAGUE).flat();

  function padBase64(value: string) {
    const mod = value.length % 4;
    if (mod === 0) return value;
    return value + "=".repeat(4 - mod);
  }

  function decodeGoogleNewsLink(link?: string | null) {
    if (!link) return "";
    try {
      const url = new URL(link);
      if (!url.hostname.endsWith("news.google.com")) {
        return link;
      }
      const articleMatch = url.pathname.match(/\/articles\/([^/?]+)/);
      if (!articleMatch?.[1]) {
        return link;
      }
      const encodedPayload = padBase64(articleMatch[1].replace(/-/g, "+").replace(/_/g, "/"));
      const decoded = Buffer.from(encodedPayload, "base64").toString("utf8");
      const httpLinks = decoded.match(/https?:\/\/[^\s"']+/g);
      if (httpLinks?.length) {
        const cleanedLinks = httpLinks
          .map((candidate) => candidate.replace(/\u0000/g, "").trim())
          .filter(Boolean);
        const canonical = cleanedLinks.find((candidate) => !candidate.includes("/amp/")) || cleanedLinks[0];
        return canonical;
      }
      return link;
    } catch (error) {
      console.error("Failed to decode Google News link", error);
      return link;
    }
  }

  function normalizeNewsArticleUrl(link?: string | null) {
    return decodeGoogleNewsLink(link) || link || "";
  }

  function isValidHttpUrl(value?: string | null) {
    if (!value) return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  const ARTICLE_CONTENT_MAX_LENGTH = 60_000;
  const ARTICLE_FETCH_TIMEOUT_MS = 15000;

  function stripDangerousMarkup(html: string) {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/on[a-zA-Z]+=("[^"]*"|'[^']*')/gi, "")
      .replace(/href=("|')javascript:[^"']*("|')/gi, 'href="#"')
      .replace(/src=("|')javascript:[^"']*("|')/gi, "");
  }

  function extractPrimaryArticleSection(html: string) {
    const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
    if (articleMatch) return articleMatch[0];
    const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
    if (mainMatch) return mainMatch[0];
    const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
    if (bodyMatch) {
      return bodyMatch[0].replace(/<\/?body[^>]*>/gi, "");
    }
    return html;
  }

  function sanitizeArticleContent(html: string) {
    if (!html) return "";
    const primary = extractPrimaryArticleSection(html);
    const stripped = stripDangerousMarkup(primary).trim();
    if (!stripped) return "";
    if (stripped.length > ARTICLE_CONTENT_MAX_LENGTH) {
      return stripped.slice(0, ARTICLE_CONTENT_MAX_LENGTH);
    }
    return stripped;
  }

  // Helper to decode HTML entities
  function decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

  function searchNewsItems(query: string) {
    if (!query) return [];
    const normalized = query.toLowerCase();
    const matches = FALLBACK_NEWS_POOL.filter((item) => {
      return (
        item.title.toLowerCase().includes(normalized) ||
        item.source.toLowerCase().includes(normalized) ||
        item.league?.toLowerCase().includes(normalized)
      );
    }).map((item) => ({
      id: item.id,
      title: item.title,
      link: normalizeNewsArticleUrl(item.link),
      pubDate: item.pubDate,
      source: item.source,
      league: item.league,
    }));
    return mapNewsItemsWithBranding(matches, query);
  }

  const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY;
  const NEWS_CACHE_TTL_MS = 30 * 60 * 1000;
  const newsCache = new Map<string, { expiresAt: number; items: any[] }>();

  const getCachedNews = (cacheKey: string) => {
    const cached = newsCache.get(cacheKey);
    if (!cached) return null;
    if (Date.now() > cached.expiresAt) {
      newsCache.delete(cacheKey);
      return null;
    }
    return cached.items;
  };

  const setCachedNews = (cacheKey: string, items: any[]) => {
    newsCache.set(cacheKey, { expiresAt: Date.now() + NEWS_CACHE_TTL_MS, items });
  };

  async function fetchNewsDataLatest(league?: string) {
    if (!NEWSDATA_API_KEY) return null;

    let query = "rugby league";
    let country = "au,nz";
    if (league) {
      const leagueLower = league.toLowerCase();
      if (leagueLower.includes("super")) {
        query = "Super League rugby";
        country = "gb,fr";
      } else if (leagueLower.includes("nrl") || leagueLower.includes("national")) {
        query = "NRL rugby league";
        country = "au,nz";
      }
    }

    const params = new URLSearchParams({
      apikey: NEWSDATA_API_KEY,
      q: query,
      language: "en",
      country,
      category: "sports",
      size: "10",
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ARTICLE_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(`https://newsdata.io/api/1/latest?${params.toString()}`, {
        headers: ARTICLE_IMAGE_HEADERS,
        signal: controller.signal,
      });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      if (results.length === 0) return [];

      const items = results.map((item: any) => {
        const link = item.link || item.url || "";
        const title = decodeHtmlEntities(item.title || item.description || "Rugby League update");
        return {
          id: Buffer.from(link || title).toString("base64").slice(0, 20),
          title,
          link,
          pubDate: item.pubDate || item.pubDateTZ || item.published_at || new Date().toISOString(),
          source: item.source_id || item.source_name || item.source || "NewsData.io",
          league: league || query,
          image: item.image_url || item.image || null,
        };
      }).filter((item: any) => item.title && item.link);

      return items;
    } catch (error) {
      console.error("NewsData fetch error:", error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function fetchNewsDataArchive(league?: string) {
    if (!NEWSDATA_API_KEY) return null;

    let query = "rugby league";
    let country = "au,nz";
    if (league) {
      const leagueLower = league.toLowerCase();
      if (leagueLower.includes("super")) {
        query = "Super League rugby";
        country = "gb,fr";
      } else if (leagueLower.includes("nrl") || leagueLower.includes("national")) {
        query = "NRL rugby league";
        country = "au,nz";
      }
    }

    const now = new Date();
    const fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const from = fromDate.toISOString().split("T")[0];
    const to = now.toISOString().split("T")[0];

    const params = new URLSearchParams({
      apikey: NEWSDATA_API_KEY,
      q: query,
      language: "en",
      country,
      category: "sports",
      from_date: from,
      to_date: to,
      size: "10",
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ARTICLE_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(`https://newsdata.io/api/1/archive?${params.toString()}`, {
        headers: ARTICLE_IMAGE_HEADERS,
        signal: controller.signal,
      });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      if (results.length === 0) return [];

      const items = results.map((item: any) => {
        const link = item.link || item.url || "";
        const title = decodeHtmlEntities(item.title || item.description || "Rugby League update");
        return {
          id: Buffer.from(link || title).toString("base64").slice(0, 20),
          title,
          link,
          pubDate: item.pubDate || item.pubDateTZ || item.published_at || new Date().toISOString(),
          source: item.source_id || item.source_name || item.source || "NewsData.io",
          league: league || query,
          image: item.image_url || item.image || null,
        };
      }).filter((item: any) => item.title && item.link);

      return items;
    } catch (error) {
      console.error("NewsData archive fetch error:", error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  // Get rugby news - using NewsData.io (with Google News RSS fallback)
  app.get("/api/rugby/news", async (req, res) => {
    const { league } = req.query as { league?: string };
    const fallbackNews = getLocalNewsFallback(league);

    let searchQuery = "rugby league";
    try {
      // Build search query based on league
      if (league) {
        const leagueLower = league.toLowerCase();
        if (leagueLower.includes("super")) {
          searchQuery = "Super League rugby";
        } else if (leagueLower.includes("nrl") || leagueLower.includes("national")) {
          searchQuery = "NRL rugby league";
        }
      }

      const cacheKey = league || searchQuery;
      const cachedNews = getCachedNews(cacheKey);
      if (cachedNews?.length) {
        return res.json({ response: mapNewsItemsWithBranding(cachedNews, league || searchQuery) });
      }

      const [latestNews, archiveNews] = await Promise.all([
        fetchNewsDataLatest(league),
        fetchNewsDataArchive(league),
      ]);

      const mergedNews = [...(latestNews || []), ...(archiveNews || [])]
        .filter(Boolean)
        .reduce((acc: any[], item: any) => {
          const key = item.link || item.id;
          if (!key || acc.find((existing) => existing.link === key || existing.id === item.id)) {
            return acc;
          }
          acc.push(item);
          return acc;
        }, [])
        .sort((a, b) => {
          const aTime = a.pubDate ? Date.parse(a.pubDate) : 0;
          const bTime = b.pubDate ? Date.parse(b.pubDate) : 0;
          return bTime - aTime;
        });

      if (mergedNews.length > 0) {
        setCachedNews(cacheKey, mergedNews);
        return res.json({ response: mapNewsItemsWithBranding(mergedNews, league || searchQuery) });
      }

      const encodedQuery = encodeURIComponent(searchQuery);
      const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-AU&gl=AU&ceid=AU:en`;
      const response = await fetch(rssUrl, {
        headers: {
          // Google now rejects generic fetch user agents. Pretend to be a browser.
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
          "Accept-Language": "en-AU,en;q=0.9",
        },
      });

      if (!response.ok) {
        console.error("RSS fetch failed:", response.status, response.statusText);
        return res.json({ response: mapNewsItemsWithBranding(fallbackNews, league || searchQuery) });
      }

      const rssText = await response.text();
      if (!rssText.trim()) {
        console.error("RSS fetch succeeded but returned empty body");
        return res.json({ response: mapNewsItemsWithBranding(fallbackNews, league || searchQuery) });
      }
      const items: any[] = [];
      const itemMatches = rssText.match(/<item>([\s\S]*?)<\/item>/g) || [];

      for (const itemXml of itemMatches.slice(0, 30)) {
        const rawTitle = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || "";
        const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";
        const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
        const rawSource = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || "Unknown";

        if (rawTitle && link) {
          const decodedTitle = decodeHtmlEntities(rawTitle);
          const normalizedLink = normalizeNewsArticleUrl(link);
          const idSource = normalizedLink || link;
          items.push({
            id: Buffer.from(idSource).toString('base64').slice(0, 20),
            title: decodedTitle,
            link: normalizedLink,
            pubDate,
            source: decodeHtmlEntities(rawSource),
            league: searchQuery,
            image: null,
          });
        }
      }

      if (items.length === 0) {
        return res.json({ response: mapNewsItemsWithBranding(fallbackNews, league || searchQuery) });
      }

      await attachRemoteThumbnails(items, items.length);

      return res.json({ response: mapNewsItemsWithBranding(items, league || searchQuery) });
    } catch (error) {
      console.error("News fetch error:", error);
      return res.json({ response: mapNewsItemsWithBranding(fallbackNews, league || searchQuery) });
    }
  });

  app.get("/api/rugby/news/article", async (req, res) => {
    const { url } = req.query as { url?: string };
    const normalizedUrl = normalizeNewsArticleUrl(url);

    if (!isValidHttpUrl(normalizedUrl)) {
      return res.status(400).json({ message: "Valid article URL required" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ARTICLE_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(normalizedUrl, {
        headers: ARTICLE_IMAGE_HEADERS,
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.error("Article fetch failed:", response.status, response.statusText);
        return res.status(502).json({ message: "Failed to load article" });
      }

      const finalUrl = response.url || normalizedUrl;
      const html = await response.text();
      const sanitized = sanitizeArticleContent(html);

      return res.json({
        html: sanitized,
        finalUrl,
      });
    } catch (error: any) {
      clearTimeout(timeout);
      if (error?.name === "AbortError") {
        console.error("Article fetch timeout:", normalizedUrl);
        return res.status(504).json({ message: "Article request timed out" });
      }
      console.error("Article fetch error:", error);
      return res.status(500).json({ message: "Failed to load article" });
    }
  });

  const EMPTY_SEARCH_RESPONSE = {
    teams: [],
    players: [],
    games: [],
    news: [],
    tables: [],
  };

  app.get("/api/rugby/search", async (req, res) => {
    try {
      const { q } = req.query as { q?: string };
      const query = q?.trim() || "";

      if (query.length < 2) {
        return res.json({ response: EMPTY_SEARCH_RESPONSE });
      }

      const [teamsResult, playersResult, newsResult] = await Promise.allSettled([
        searchTeamsByName(query),
        searchPlayersByName(query),
        Promise.resolve(searchNewsItems(query)),
      ]);

      const teams = teamsResult.status === "fulfilled" ? teamsResult.value : [];
      const players = playersResult.status === "fulfilled" ? playersResult.value : [];
      const news = newsResult.status === "fulfilled" ? newsResult.value : [];

      const games = searchGames(query);
      const tables = searchTables(query);

      res.json({
        response: {
          teams: teams.slice(0, 5),
          players: players.slice(0, 5),
          games: games.slice(0, 5),
          news: news.slice(0, 5),
          tables: tables.slice(0, 3),
        },
      });
    } catch (error: any) {
      console.error("Global search error:", error);
      res.status(500).json({ message: error.message || "Search failed" });
    }
  });

  return httpServer;
}

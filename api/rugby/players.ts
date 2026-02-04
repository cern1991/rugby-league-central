import { LOCAL_TEAMS, type LocalTeamInfo } from "../../shared/localTeams";
import { LOCAL_TEAM_ROSTERS } from "../../server/data/localRosters";
import {
  SUPER_LEAGUE_SQUADS,
  type SuperLeaguePlayer,
} from "../../server/data/localSuperLeagueSquads";
import { SUPER_LEAGUE_TEAM_ID_BY_CODE } from "../../shared/localSuperLeagueFixtures";

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

const getLocalTeams = (teams: LocalTeamInfo[], league?: string) => {
  if (!league) return teams;
  const leagueLower = league.toLowerCase();
  if (leagueLower.includes("super")) {
    return teams.filter((team) => team.league === "Super League");
  }
  if (leagueLower.includes("nrl") || leagueLower.includes("national")) {
    return teams.filter((team) => team.league === "NRL");
  }
  return teams.filter((team) => team.league === league);
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

const SUPER_LEAGUE_SQUADS_BY_TEAM_ID = Object.entries(SUPER_LEAGUE_SQUADS).reduce<
  Record<string, { season: number; players: SuperLeaguePlayer[]; team_code: string; team_name: string }[]>
>((acc, [code, squads]) => {
  const teamId = SUPER_LEAGUE_TEAM_ID_BY_CODE[code];
  if (teamId) {
    acc[teamId] = squads as any;
  }
  return acc;
}, {});

export default function handler(req: RequestLike, res: ResponseLike) {
  try {
    const league = getQueryValue(req.query.league) || "NRL";
    const leagueLower = league.toLowerCase();
    const teams = getLocalTeams(LOCAL_TEAMS, league);

    if (leagueLower.includes("super")) {
      const players = teams.flatMap((team) => {
        const squads = SUPER_LEAGUE_SQUADS_BY_TEAM_ID[String(team.id)] || [];
        const squad = squads.find((entry) => entry.season === 2026) || squads[0];
        if (!squad || !squad.players || squad.players.length === 0) return [];
        return squad.players.map((player, index) => ({
          id: `SL-${team.id}-${player.squad_number ?? index + 1}`,
          name: player.name,
          position:
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
      return res.status(200).json({ response: players });
    }

    const players = teams.flatMap((team) => {
      const roster = LOCAL_TEAM_ROSTERS[String(team.id)] || [];
      return roster.map((player) => ({
        id: player.id,
        name: player.name,
        position: player.position || "Utility",
        teamId: String(team.id),
        teamName: team.name,
        league: team.league,
        number: null,
        image: getFallbackPlayerImage(player.name),
      }));
    });

    return res.status(200).json({ response: players });
  } catch (error: any) {
    console.error("Serverless players error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to load players",
      response: [],
    });
  }
}

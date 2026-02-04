import { LOCAL_TEAMS } from "../../../shared/localTeams";
import { LOCAL_TEAM_ROSTERS } from "../../../server/data/localRosters";
import {
  SUPER_LEAGUE_SQUADS,
  type SuperLeaguePlayer,
} from "../../../server/data/localSuperLeagueSquads";
import { SUPER_LEAGUE_TEAM_ID_BY_CODE } from "../../../shared/localSuperLeagueFixtures";

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

export default function handler(req: RequestLike, res: ResponseLike) {
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
            image: getFallbackPlayerImage(match.name),
            description: `${match.name} plays ${position} for ${team?.name || squad?.team_name || "their club"}.`,
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
            image: getFallbackPlayerImage(match.name),
            description: `${match.name} plays ${match.position || "Utility"} for ${team?.name || "their club"}.`,
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

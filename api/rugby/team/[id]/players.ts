import {
  findLocalTeamMeta,
  resolveTeamIdentifier,
} from "../../../../server/lib/localData";
import { LOCAL_TEAM_ROSTERS } from "../../../../server/data/localRosters";
import {
  SUPER_LEAGUE_SQUADS,
  type SuperLeaguePlayer,
} from "../../../../server/data/localSuperLeagueSquads";
import { SUPER_LEAGUE_TEAM_ID_BY_CODE } from "../../../../shared/localSuperLeagueFixtures";

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

const generatePlayerStats = (name: string) => {
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

const SUPER_LEAGUE_SQUADS_BY_TEAM_ID = Object.entries(SUPER_LEAGUE_SQUADS).reduce<
  Record<string, { season: number; players: SuperLeaguePlayer[]; team_code: string; team_name: string; source_note?: string }[]>
>((acc, [code, squads]) => {
  const teamId = SUPER_LEAGUE_TEAM_ID_BY_CODE[code];
  if (teamId) {
    acc[teamId] = squads as any;
  }
  return acc;
}, {});

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

    const localRoster = LOCAL_TEAM_ROSTERS[resolvedId] || [];
    if (localRoster.length > 0) {
      const players = localRoster.map((player) => {
        const avatar = getFallbackPlayerImage(player.name);
        return {
          id: player.id,
          name: player.name,
          position: player.position,
          nationality: teamInfo?.country?.name || "Australia",
          birthDate: null,
          height: null,
          weight: null,
          photo: avatar,
          thumbnail: avatar,
          number: null,
          description: `${player.name} plays ${player.position} for ${teamInfo?.name || "the club"}.`,
          stats: generatePlayerStats(player.name),
        };
      });
      return res.status(200).json({ response: players });
    }

    const squads = SUPER_LEAGUE_SQUADS_BY_TEAM_ID[resolvedId] || [];
    const squad =
      squads.find((entry) => entry.season === 2026) ||
      squads[0];

    if (squad && squad.players && squad.players.length > 0) {
      const players = squad.players.map((player, index) => {
        const avatar = getFallbackPlayerImage(player.name);
        return {
          id: `SL-${resolvedId}-${player.squad_number ?? index + 1}`,
          name: player.name,
          position: player.position || "Player",
          nationality: player.nationality || teamInfo?.country?.name || "England",
          birthDate: player.dob || null,
          height: player.height_cm ? `${player.height_cm} cm` : null,
          weight: player.weight_kg ? `${player.weight_kg} kg` : null,
          photo: avatar,
          thumbnail: avatar,
          number: player.squad_number ? String(player.squad_number) : null,
          description:
            player.position && squad.source_note
              ? `${player.name} (${player.position}) - ${squad.source_note}`
              : squad.source_note || `${player.name} is part of ${squad.team_name}'s ${squad.season} squad.`,
          stats: generatePlayerStats(player.name),
        };
      });
      return res.status(200).json({ response: players });
    }

    return res.status(200).json({ response: [] });
  } catch (error: any) {
    console.error("Serverless team players error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to load team players",
      response: [],
    });
  }
}

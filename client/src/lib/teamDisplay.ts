import { LOCAL_TEAMS } from "@shared/localTeams";

const NRL_FULL_NAME_BY_ID: Record<string, string> = {
  "135187": "Canterbury-Bankstown Bulldogs",
  "135184": "Cronulla-Sutherland Sharks",
  "135188": "Manly Warringah Sea Eagles",
};

const TEAM_NAME_BY_ID = LOCAL_TEAMS.reduce<Record<string, string>>((acc, team) => {
  acc[String(team.id)] = team.name;
  return acc;
}, {});

export const normalizeLeagueKey = (league?: string | null) =>
  league && league.toLowerCase().includes("super") ? "super" : "nrl";

export const getDisplayTeamName = (teamId?: string | null, fallback?: string | null, league?: string | null) => {
  if (teamId && normalizeLeagueKey(league) === "nrl") {
    if (NRL_FULL_NAME_BY_ID[teamId]) {
      return NRL_FULL_NAME_BY_ID[teamId];
    }
  }
  if (fallback) return fallback;
  if (teamId && TEAM_NAME_BY_ID[teamId]) return TEAM_NAME_BY_ID[teamId];
  return "Club";
};

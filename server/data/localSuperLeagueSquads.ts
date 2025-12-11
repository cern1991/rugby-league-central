export interface SuperLeaguePlayer {
  name: string;
  position?: string;
  squad_number?: number;
  dob?: string;
  nationality?: string;
  height_cm?: number;
  weight_kg?: number;
}

export interface SuperLeagueSquad {
  team_code: string;
  team_name: string;
  season: number;
  players: SuperLeaguePlayer[];
  source_note?: string;
}

export const SUPER_LEAGUE_SQUADS: Record<string, SuperLeagueSquad[]> = {
  WIG: [
    {
      team_code: "WIG",
      team_name: "Wigan Warriors",
      season: 2026,
      players: [
        { name: "Jai Field", position: "Fullback", squad_number: 1 },
        { name: "Abbas Miski", position: "Wing", squad_number: 2 },
        { name: "Adam Keighran", position: "Centre", squad_number: 3 },
        { name: "Jake Wardle", position: "Centre", squad_number: 4 },
        { name: "Liam Marshall", position: "Wing", squad_number: 5 },
        { name: "Bevan French", position: "Stand-off", squad_number: 6 },
        { name: "Harry Smith", position: "Scrum-half", squad_number: 7 },
        { name: "Ethan Havard", position: "Prop", squad_number: 8 },
        { name: "Brad O’Neill", position: "Hooker", squad_number: 9 },
        { name: "Luke Thompson", position: "Prop", squad_number: 10 },
        { name: "Junior Nsemba", position: "Second-row", squad_number: 11 },
        { name: "Liam Farrell", position: "Second-row", squad_number: 12 },
        { name: "Kaide Ellis", position: "Loose forward", squad_number: 13 },
      ],
      source_note: "Initial list based on 2025 squad numbers. Update once Wigan publish the confirmed 2026 roster.",
    },
    {
      team_code: "WIG",
      team_name: "Wigan Warriors",
      season: 2025,
      players: [
        { name: "Jai Field", position: "Fullback", squad_number: 1 },
        // Add remaining 2025 players from official list
      ],
      source_note: "Seeded from 2025 Wigan squad (incomplete).",
    },
  ],
  LEEDS: [
    { team_code: "LEEDS", team_name: "Leeds Rhinos", season: 2026, players: [] },
    {
      team_code: "LEEDS",
      team_name: "Leeds Rhinos",
      season: 2025,
      players: [
        { name: "Lachlan Miller", position: "Fullback", squad_number: 1 },
        // Add remaining 2025 players as data becomes available
      ],
    },
  ],
  STH: [
    { team_code: "STH", team_name: "St Helens", season: 2026, players: [] },
    { team_code: "STH", team_name: "St Helens", season: 2025, players: [] },
  ],
  HKR: [
    { team_code: "HKR", team_name: "Hull KR", season: 2026, players: [] },
    { team_code: "HKR", team_name: "Hull KR", season: 2025, players: [] },
  ],
  HULL: [
    { team_code: "HULL", team_name: "Hull FC", season: 2026, players: [] },
    { team_code: "HULL", team_name: "Hull FC", season: 2025, players: [] },
  ],
  CAT: [
    { team_code: "CAT", team_name: "Catalans Dragons", season: 2026, players: [] },
    { team_code: "CAT", team_name: "Catalans Dragons", season: 2025, players: [] },
  ],
  WARR: [
    { team_code: "WARR", team_name: "Warrington Wolves", season: 2026, players: [] },
    { team_code: "WARR", team_name: "Warrington Wolves", season: 2025, players: [] },
  ],
  WAKE: [
    { team_code: "WAKE", team_name: "Wakefield Trinity", season: 2026, players: [] },
    { team_code: "WAKE", team_name: "Wakefield Trinity", season: 2025, players: [] },
  ],
  BRAD: [
    { team_code: "BRAD", team_name: "Bradford Bulls", season: 2026, players: [] },
    { team_code: "BRAD", team_name: "Bradford Bulls", season: 2025, players: [] },
  ],
  CAST: [
    { team_code: "CAST", team_name: "Castleford Tigers", season: 2026, players: [] },
    { team_code: "CAST", team_name: "Castleford Tigers", season: 2025, players: [] },
  ],
  LEIGH: [
    { team_code: "LEIGH", team_name: "Leigh Leopards", season: 2026, players: [] },
    { team_code: "LEIGH", team_name: "Leigh Leopards", season: 2025, players: [] },
  ],
  HUDD: [
    { team_code: "HUDD", team_name: "Huddersfield Giants", season: 2026, players: [] },
    { team_code: "HUDD", team_name: "Huddersfield Giants", season: 2025, players: [] },
  ],
  TOUL: [
    { team_code: "TOUL", team_name: "Toulouse Olympique", season: 2026, players: [] },
    { team_code: "TOUL", team_name: "Toulouse Olympique", season: 2025, players: [] },
  ],
  YORK: [
    { team_code: "YORK", team_name: "York Knights", season: 2026, players: [] },
    { team_code: "YORK", team_name: "York Knights", season: 2025, players: [] },
  ],
};

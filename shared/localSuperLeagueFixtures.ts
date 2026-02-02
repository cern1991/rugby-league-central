import { LocalFixture } from "./localFixtures";

interface SuperLeagueMatch {
  date: string;
  day: string;
  home_code: string;
  away_code: string | null;
  kickoff_local: string | null;
  venue: string;
  notes: string | null;
}

interface SuperLeagueRound {
  round: number;
  matches: SuperLeagueMatch[];
}

export interface SuperLeagueTeamMeta {
  code: string;
  name: string;
  country: string;
  homeVenue: string;
  sportsDbId: string;
}

export const SUPER_LEAGUE_TEAMS: SuperLeagueTeamMeta[] = [
  { code: "BRAD", name: "Bradford Bulls", country: "England", homeVenue: "Bartercard Odsal Stadium", sportsDbId: "137398" },
  { code: "CAST", name: "Castleford Tigers", country: "England", homeVenue: "OneBore Stadium", sportsDbId: "135211" },
  { code: "CAT", name: "Catalans Dragons", country: "France", homeVenue: "Stade Gilbert Brutus", sportsDbId: "135212" },
  { code: "HUDD", name: "Huddersfield Giants", country: "England", homeVenue: "ACCU Stadium", sportsDbId: "135213" },
  { code: "HULL", name: "Hull FC", country: "England", homeVenue: "MKM Stadium", sportsDbId: "135214" },
  { code: "HKR", name: "Hull Kingston Rovers", country: "England", homeVenue: "Sewell Group Craven Park", sportsDbId: "135215" },
  { code: "LEEDS", name: "Leeds Rhinos", country: "England", homeVenue: "AMT Headingley Stadium", sportsDbId: "135216" },
  { code: "LEIGH", name: "Leigh Leopards", country: "England", homeVenue: "Progress With Unity Stadium", sportsDbId: "137396" },
  { code: "STH", name: "St Helens", country: "England", homeVenue: "BrewDog Stadium", sportsDbId: "135218" },
  { code: "TOUL", name: "Toulouse Olympique", country: "France", homeVenue: "Stade Ernest-Wallon", sportsDbId: "137395" },
  { code: "WAKE", name: "Wakefield Trinity", country: "England", homeVenue: "DIY Kitchens Stadium", sportsDbId: "135221" },
  { code: "WARR", name: "Warrington Wolves", country: "England", homeVenue: "Halliwell Jones Stadium", sportsDbId: "135220" },
  { code: "WIG", name: "Wigan Warriors", country: "England", homeVenue: "Brick Community Stadium", sportsDbId: "135222" },
  { code: "YORK", name: "York Knights", country: "England", homeVenue: "LNER Community Stadium", sportsDbId: "137405" },
];

const SUPER_LEAGUE_TEAM_NAME_BY_KEY = SUPER_LEAGUE_TEAMS.reduce<Record<string, string>>((acc, team) => {
  acc[normalizeTeamKey(team.name)] = team.name;
  return acc;
}, {});

const SUPER_LEAGUE_TEAM_ALIASES: Record<string, string> = {
  hullkr: "Hull Kingston Rovers",
};

function normalizeTeamKey(name: string) {
  return name?.toLowerCase().replace(/[^a-z0-9]+/g, "") || "";
}

function canonicalizeSuperLeagueTeamName(name: string) {
  if (!name) return name;
  const key = normalizeTeamKey(name);
  if (SUPER_LEAGUE_TEAM_ALIASES[key]) {
    return SUPER_LEAGUE_TEAM_ALIASES[key];
  }
  if (SUPER_LEAGUE_TEAM_NAME_BY_KEY[key]) {
    return SUPER_LEAGUE_TEAM_NAME_BY_KEY[key];
  }
  const partial = SUPER_LEAGUE_TEAMS.find((team) => {
    const teamKey = normalizeTeamKey(team.name);
    return teamKey.includes(key) || key.includes(teamKey);
  });
  return partial ? partial.name : name;
}

function usesDefaultKickoffTime(fixture: LocalFixture) {
  return fixture.dateUtc.includes(`T${DEFAULT_KICKOFF}:00`);
}

function shouldPreferFixture(current: LocalFixture, candidate: LocalFixture) {
  const currentDefault = usesDefaultKickoffTime(current);
  const candidateDefault = usesDefaultKickoffTime(candidate);
  if (currentDefault !== candidateDefault) {
    return currentDefault && !candidateDefault;
  }
  const candidateTime = new Date(candidate.dateUtc).getTime();
  const currentTime = new Date(current.dateUtc).getTime();
  return candidateTime < currentTime;
}

export const SUPER_LEAGUE_TEAM_ID_BY_CODE = SUPER_LEAGUE_TEAMS.reduce<Record<string, string>>((acc, team) => {
  acc[team.code] = team.sportsDbId;
  return acc;
}, {});

const RAW_ROUNDS_2026: SuperLeagueRound[] = [
  {
    round: 1,
    matches: [
      { date: "2026-02-12", day: "Thursday", home_code: "YORK", away_code: "HKR", kickoff_local: "20:00", venue: "LNER Community Stadium", notes: null },
      { date: "2026-02-13", day: "Friday", home_code: "WARR", away_code: "STH", kickoff_local: "20:00", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-02-13", day: "Friday", home_code: "LEIGH", away_code: "LEEDS", kickoff_local: "20:00", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-02-13", day: "Friday", home_code: "CAT", away_code: "HUDD", kickoff_local: "19:00", venue: "Stade Gilbert Brutus", notes: "7pm CET" },
      { date: "2026-02-14", day: "Saturday", home_code: "HULL", away_code: "BRAD", kickoff_local: "17:30", venue: "MKM Stadium", notes: null },
      { date: "2026-02-14", day: "Saturday", home_code: "WAKE", away_code: "TOUL", kickoff_local: "20:00", venue: "DIY Kitchens Stadium", notes: null },
      { date: "2026-02-15", day: "Sunday", home_code: "CAST", away_code: "WIG", kickoff_local: "15:00", venue: "OneBore Stadium", notes: null },
    ],
  },
  {
    round: 3,
    matches: [
      { date: "2026-02-26", day: "Thursday", home_code: "WIG", away_code: "LEIGH", kickoff_local: "20:00", venue: "Brick Community Stadium", notes: null },
      { date: "2026-02-27", day: "Friday", home_code: "CAST", away_code: "HUDD", kickoff_local: "20:00", venue: "OneBore Stadium", notes: null },
      { date: "2026-02-27", day: "Friday", home_code: "HULL", away_code: "YORK", kickoff_local: "20:00", venue: "MKM Stadium", notes: null },
      { date: "2026-02-28", day: "Saturday", home_code: "HKR", away_code: "LEEDS", kickoff_local: null, venue: "Allegiant Stadium, Las Vegas", notes: "Time TBC (Las Vegas)" },
      { date: "2026-02-28", day: "Saturday", home_code: "CAT", away_code: "STH", kickoff_local: "18:00", venue: "Stade Gilbert Brutus", notes: "6pm UK / 7pm CET" },
      { date: "2026-02-28", day: "Saturday", home_code: "WARR", away_code: "WAKE", kickoff_local: "17:30", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-03-01", day: "Sunday", home_code: "BRAD", away_code: "TOUL", kickoff_local: "15:00", venue: "Bartercard Odsal Stadium", notes: null },
    ],
  },
  {
    round: 5,
    matches: [
      { date: "2026-03-19", day: "Thursday", home_code: "WIG", away_code: "YORK", kickoff_local: "20:00", venue: "Brick Community Stadium", notes: null },
      { date: "2026-03-20", day: "Friday", home_code: "WAKE", away_code: "LEIGH", kickoff_local: "20:00", venue: "DIY Kitchens Stadium", notes: null },
      { date: "2026-03-20", day: "Friday", home_code: "BRAD", away_code: "HUDD", kickoff_local: "20:00", venue: "Bartercard Odsal Stadium", notes: null },
      { date: "2026-03-20", day: "Friday", home_code: "TOUL", away_code: "STH", kickoff_local: "18:00", venue: "Stade Ernest-Wallon", notes: "6pm UK / 7pm CET" },
      { date: "2026-03-21", day: "Saturday", home_code: "CAT", away_code: "HKR", kickoff_local: "17:30", venue: "Stade Gilbert Brutus", notes: "5:30pm UK / 6:30pm CET" },
      { date: "2026-03-21", day: "Saturday", home_code: "WARR", away_code: "CAST", kickoff_local: "15:00", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-03-22", day: "Sunday", home_code: "HULL", away_code: "LEEDS", kickoff_local: "15:00", venue: "MKM Stadium", notes: null },
    ],
  },
  {
    round: 6,
    matches: [
      { date: "2026-03-26", day: "Thursday", home_code: "CAST", away_code: "BRAD", kickoff_local: "20:00", venue: "OneBore Stadium", notes: null },
      { date: "2026-03-27", day: "Friday", home_code: "HKR", away_code: "STH", kickoff_local: "20:00", venue: "Sewell Group Craven Park", notes: null },
      { date: "2026-03-27", day: "Friday", home_code: "YORK", away_code: "WAKE", kickoff_local: "20:00", venue: "LNER Community Stadium", notes: null },
      { date: "2026-03-28", day: "Saturday", home_code: "WIG", away_code: "HUDD", kickoff_local: "15:00", venue: "Brick Community Stadium", notes: null },
      { date: "2026-03-28", day: "Saturday", home_code: "LEIGH", away_code: "TOUL", kickoff_local: "17:30", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-03-29", day: "Sunday", home_code: "LEEDS", away_code: "WARR", kickoff_local: "17:30", venue: "AMT Headingley Stadium", notes: null },
      { date: "2026-03-29", day: "Sunday", home_code: "HULL", away_code: "CAT", kickoff_local: "15:00", venue: "MKM Stadium", notes: null },
    ],
  },
  {
    round: 7,
    matches: [
      { date: "2026-04-03", day: "Friday", home_code: "STH", away_code: "WIG", kickoff_local: null, venue: "BrewDog Stadium", notes: "Time TBC" },
      { date: "2026-04-03", day: "Friday", home_code: "HKR", away_code: "HULL", kickoff_local: null, venue: "Sewell Group Craven Park", notes: "Time TBC" },
      { date: "2026-04-03", day: "Friday", home_code: "BRAD", away_code: "LEEDS", kickoff_local: "20:00", venue: "Bartercard Odsal Stadium", notes: null },
      { date: "2026-04-04", day: "Saturday", home_code: "CAT", away_code: "TOUL", kickoff_local: "18:00", venue: "Stade Gilbert Brutus", notes: "6pm UK / 7pm CET" },
      { date: "2026-04-04", day: "Saturday", home_code: "HUDD", away_code: "YORK", kickoff_local: "15:00", venue: "ACCU Stadium", notes: null },
      { date: "2026-04-04", day: "Saturday", home_code: "WARR", away_code: "LEIGH", kickoff_local: "15:00", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-04-05", day: "Sunday", home_code: "CAST", away_code: "WAKE", kickoff_local: "15:00", venue: "OneBore Stadium", notes: null },
    ],
  },
  {
    round: 8,
    matches: [
      { date: "2026-04-16", day: "Thursday", home_code: "HULL", away_code: "STH", kickoff_local: "20:00", venue: "MKM Stadium", notes: null },
      { date: "2026-04-17", day: "Friday", home_code: "TOUL", away_code: "HKR", kickoff_local: "18:00", venue: "Stade Ernest-Wallon", notes: "6pm UK / 7pm CET" },
      { date: "2026-04-17", day: "Friday", home_code: "HUDD", away_code: "LEEDS", kickoff_local: "20:00", venue: "ACCU Stadium", notes: null },
      { date: "2026-04-17", day: "Friday", home_code: "YORK", away_code: "LEIGH", kickoff_local: "20:00", venue: "LNER Community Stadium", notes: null },
      { date: "2026-04-18", day: "Saturday", home_code: "WAKE", away_code: "BRAD", kickoff_local: "15:00", venue: "DIY Kitchens Stadium", notes: null },
      { date: "2026-04-18", day: "Saturday", home_code: "CAT", away_code: "WARR", kickoff_local: "18:00", venue: "Stade Gilbert Brutus", notes: "6pm UK / 7pm CET" },
      { date: "2026-04-19", day: "Sunday", home_code: "WIG", away_code: "CAST", kickoff_local: "15:00", venue: "Brick Community Stadium", notes: null },
    ],
  },
  {
    round: 9,
    matches: [
      { date: "2026-04-23", day: "Thursday", home_code: "YORK", away_code: "TOUL", kickoff_local: "20:00", venue: "LNER Community Stadium", notes: null },
      { date: "2026-04-23", day: "Thursday", home_code: "LEIGH", away_code: "HUDD", kickoff_local: "20:00", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-04-24", day: "Friday", home_code: "LEEDS", away_code: "CAT", kickoff_local: "20:00", venue: "AMT Headingley Stadium", notes: null },
      { date: "2026-04-24", day: "Friday", home_code: "WARR", away_code: "WIG", kickoff_local: "20:00", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-04-24", day: "Friday", home_code: "CAST", away_code: "HULL", kickoff_local: "20:00", venue: "OneBore Stadium", notes: null },
      { date: "2026-04-25", day: "Saturday", home_code: "BRAD", away_code: "HKR", kickoff_local: "15:00", venue: "Bartercard Odsal Stadium", notes: null },
      { date: "2026-04-25", day: "Saturday", home_code: "STH", away_code: "WAKE", kickoff_local: "17:30", venue: "BrewDog Stadium", notes: null },
    ],
  },
  {
    round: 10,
    matches: [
      { date: "2026-04-30", day: "Thursday", home_code: "HKR", away_code: "CAST", kickoff_local: "20:00", venue: "Sewell Group Craven Park", notes: null },
      { date: "2026-05-01", day: "Friday", home_code: "LEEDS", away_code: "WAKE", kickoff_local: "20:00", venue: "AMT Headingley Stadium", notes: null },
      { date: "2026-05-01", day: "Friday", home_code: "STH", away_code: "YORK", kickoff_local: "20:00", venue: "BrewDog Stadium", notes: null },
      { date: "2026-05-02", day: "Saturday", home_code: "CAT", away_code: "LEIGH", kickoff_local: "18:00", venue: "Stade Gilbert Brutus", notes: "6pm UK / 7pm CET" },
      { date: "2026-05-02", day: "Saturday", home_code: "WIG", away_code: "BRAD", kickoff_local: "15:00", venue: "Brick Community Stadium", notes: null },
      { date: "2026-05-02", day: "Saturday", home_code: "HUDD", away_code: "WARR", kickoff_local: "20:00", venue: "ACCU Stadium", notes: null },
      { date: "2026-05-03", day: "Sunday", home_code: "HULL", away_code: "TOUL", kickoff_local: "15:00", venue: "MKM Stadium", notes: null },
    ],
  },
  {
    round: 11,
    matches: [
      { date: "2026-05-14", day: "Thursday", home_code: "HUDD", away_code: "STH", kickoff_local: "20:00", venue: "ACCU Stadium", notes: null },
      { date: "2026-05-15", day: "Friday", home_code: "WIG", away_code: "LEEDS", kickoff_local: "20:00", venue: "Brick Community Stadium", notes: null },
      { date: "2026-05-15", day: "Friday", home_code: "WAKE", away_code: "CAT", kickoff_local: "20:00", venue: "DIY Kitchens Stadium", notes: null },
      { date: "2026-05-16", day: "Saturday", home_code: "YORK", away_code: "CAST", kickoff_local: "15:00", venue: "LNER Community Stadium", notes: null },
      { date: "2026-05-16", day: "Saturday", home_code: "LEIGH", away_code: "HKR", kickoff_local: "17:30", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-05-16", day: "Saturday", home_code: "TOUL", away_code: "WARR", kickoff_local: "18:00", venue: "Stade Ernest-Wallon", notes: "6pm UK / 7pm CET" },
      { date: "2026-05-17", day: "Sunday", home_code: "BRAD", away_code: "HULL", kickoff_local: "15:00", venue: "Bartercard Odsal Stadium", notes: null },
    ],
  },
  {
    round: 12,
    matches: [
      { date: "2026-05-21", day: "Thursday", home_code: "HKR", away_code: "WIG", kickoff_local: "20:00", venue: "Sewell Group Craven Park", notes: null },
      { date: "2026-05-22", day: "Friday", home_code: "LEIGH", away_code: "HULL", kickoff_local: "20:00", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-05-22", day: "Friday", home_code: "LEEDS", away_code: "HUDD", kickoff_local: "20:00", venue: "AMT Headingley Stadium", notes: null },
      { date: "2026-05-23", day: "Saturday", home_code: "CAST", away_code: "STH", kickoff_local: "15:00", venue: "OneBore Stadium", notes: null },
      { date: "2026-05-23", day: "Saturday", home_code: "TOUL", away_code: "WAKE", kickoff_local: "18:00", venue: "Stade Ernest-Wallon", notes: "6pm UK / 7pm CET" },
      { date: "2026-05-23", day: "Saturday", home_code: "YORK", away_code: "CAT", kickoff_local: "20:00", venue: "LNER Community Stadium", notes: null },
      { date: "2026-05-24", day: "Sunday", home_code: "WARR", away_code: "BRAD", kickoff_local: "15:00", venue: "Halliwell Jones Stadium", notes: null },
    ],
  },
  {
    round: 13,
    matches: [
      { date: "2026-06-04", day: "Thursday", home_code: "LEEDS", away_code: "STH", kickoff_local: "20:00", venue: "AMT Headingley Stadium", notes: null },
      { date: "2026-06-05", day: "Friday", home_code: "WARR", away_code: "HULL", kickoff_local: "20:00", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-06-05", day: "Friday", home_code: "BRAD", away_code: "YORK", kickoff_local: "20:00", venue: "Bartercard Odsal Stadium", notes: null },
      { date: "2026-06-05", day: "Friday", home_code: "CAST", away_code: "LEIGH", kickoff_local: "20:00", venue: "OneBore Stadium", notes: null },
      { date: "2026-06-06", day: "Saturday", home_code: "WAKE", away_code: "HKR", kickoff_local: "17:30", venue: "DIY Kitchens Stadium", notes: null },
      { date: "2026-06-06", day: "Saturday", home_code: "HUDD", away_code: "TOUL", kickoff_local: "15:00", venue: "ACCU Stadium", notes: null },
      { date: "2026-06-06", day: "Saturday", home_code: "CAT", away_code: "WIG", kickoff_local: "18:30", venue: "Stade Jean Bouin, Paris", notes: "7:30pm CET" },
    ],
  },
  {
    round: 14,
    matches: [
      { date: "2026-06-11", day: "Thursday", home_code: "STH", away_code: "WARR", kickoff_local: "20:00", venue: "BrewDog Stadium", notes: null },
      { date: "2026-06-12", day: "Friday", home_code: "WAKE", away_code: "WIG", kickoff_local: "20:00", venue: "DIY Kitchens Stadium", notes: null },
      { date: "2026-06-12", day: "Friday", home_code: "TOUL", away_code: "LEEDS", kickoff_local: "18:00", venue: "Stade Ernest-Wallon", notes: "6pm UK / 7pm CET" },
      { date: "2026-06-12", day: "Friday", home_code: "HKR", away_code: "YORK", kickoff_local: "20:00", venue: "Sewell Group Craven Park", notes: null },
      { date: "2026-06-13", day: "Saturday", home_code: "HULL", away_code: "HUDD", kickoff_local: "15:00", venue: "MKM Stadium", notes: null },
      { date: "2026-06-13", day: "Saturday", home_code: "CAT", away_code: "CAST", kickoff_local: "18:00", venue: "Stade Gilbert Brutus", notes: "6pm UK / 7pm CET" },
      { date: "2026-06-14", day: "Sunday", home_code: "BRAD", away_code: "LEIGH", kickoff_local: "15:00", venue: "Bartercard Odsal Stadium", notes: null },
    ],
  },
  {
    round: 15,
    matches: [
      { date: "2026-06-18", day: "Thursday", home_code: "WARR", away_code: "LEEDS", kickoff_local: "20:00", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-06-19", day: "Friday", home_code: "HKR", away_code: "LEIGH", kickoff_local: "20:00", venue: "Sewell Group Craven Park", notes: null },
      { date: "2026-06-19", day: "Friday", home_code: "HULL", away_code: "WAKE", kickoff_local: "20:00", venue: "MKM Stadium", notes: null },
      { date: "2026-06-20", day: "Saturday", home_code: "YORK", away_code: "WIG", kickoff_local: "15:00", venue: "LNER Community Stadium", notes: null },
      { date: "2026-06-20", day: "Saturday", home_code: "CAST", away_code: "TOUL", kickoff_local: "20:00", venue: "OneBore Stadium", notes: null },
      { date: "2026-06-20", day: "Saturday", home_code: "CAT", away_code: "BRAD", kickoff_local: "18:00", venue: "Stade Gilbert Brutus", notes: "6pm UK / 7pm CET" },
      { date: "2026-06-21", day: "Sunday", home_code: "STH", away_code: "HUDD", kickoff_local: "15:00", venue: "BrewDog Stadium", notes: null },
    ],
  },
  {
    round: 16,
    matches: [
      { date: "2026-06-25", day: "Thursday", home_code: "WARR", away_code: "CAT", kickoff_local: "20:00", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-06-26", day: "Friday", home_code: "LEEDS", away_code: "HKR", kickoff_local: "20:00", venue: "AMT Headingley Stadium", notes: null },
      { date: "2026-06-26", day: "Friday", home_code: "CAST", away_code: "YORK", kickoff_local: "20:00", venue: "OneBore Stadium", notes: null },
      { date: "2026-06-27", day: "Saturday", home_code: "HULL", away_code: "WIG", kickoff_local: "15:00", venue: "MKM Stadium", notes: null },
      { date: "2026-06-27", day: "Saturday", home_code: "BRAD", away_code: "STH", kickoff_local: "20:00", venue: "Bartercard Odsal Stadium", notes: null },
      { date: "2026-06-27", day: "Saturday", home_code: "TOUL", away_code: "LEIGH", kickoff_local: "18:00", venue: "Stade Ernest-Wallon", notes: "6pm UK / 7pm CET" },
      { date: "2026-06-28", day: "Sunday", home_code: "WAKE", away_code: "HUDD", kickoff_local: "15:00", venue: "DIY Kitchens Stadium", notes: null },
    ],
  },
  {
    round: 17,
    matches: [
      { date: "2026-07-04", day: "Saturday", home_code: "CAT", away_code: "TOUL", kickoff_local: null, venue: "Magic Weekend", notes: "Time TBC" },
      { date: "2026-07-04", day: "Saturday", home_code: "HUDD", away_code: "YORK", kickoff_local: null, venue: "Magic Weekend", notes: "Time TBC" },
      { date: "2026-07-04", day: "Saturday", home_code: "HKR", away_code: "HULL", kickoff_local: null, venue: "Magic Weekend", notes: "Time TBC" },
      { date: "2026-07-04", day: "Saturday", home_code: "LEIGH", away_code: "WARR", kickoff_local: null, venue: "Magic Weekend", notes: "Time TBC" },
      { date: "2026-07-05", day: "Sunday", home_code: "WAKE", away_code: "CAST", kickoff_local: null, venue: "Magic Weekend", notes: "Time TBC" },
      { date: "2026-07-05", day: "Sunday", home_code: "LEEDS", away_code: "BRAD", kickoff_local: null, venue: "Magic Weekend", notes: "Time TBC" },
      { date: "2026-07-05", day: "Sunday", home_code: "WIG", away_code: "STH", kickoff_local: null, venue: "Magic Weekend", notes: "Time TBC" },
    ],
  },
  {
    round: 18,
    matches: [
      { date: "2026-07-09", day: "Thursday", home_code: "YORK", away_code: "HULL", kickoff_local: "20:00", venue: "LNER Community Stadium", notes: null },
      { date: "2026-07-10", day: "Friday", home_code: "WIG", away_code: "WARR", kickoff_local: "20:00", venue: "Brick Community Stadium", notes: null },
      { date: "2026-07-10", day: "Friday", home_code: "HUDD", away_code: "BRAD", kickoff_local: "20:00", venue: "ACCU Stadium", notes: null },
      { date: "2026-07-11", day: "Saturday", home_code: "CAT", away_code: "LEEDS", kickoff_local: "20:00", venue: "Stade Gilbert Brutus", notes: "8pm UK / 9pm CET" },
      { date: "2026-07-11", day: "Saturday", home_code: "HKR", away_code: "WAKE", kickoff_local: "17:30", venue: "Sewell Group Craven Park", notes: null },
      { date: "2026-07-11", day: "Saturday", home_code: "LEIGH", away_code: "CAST", kickoff_local: "15:00", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-07-12", day: "Sunday", home_code: "STH", away_code: "TOUL", kickoff_local: "15:00", venue: "BrewDog Stadium", notes: null },
    ],
  },
  {
    round: 19,
    matches: [
      { date: "2026-07-16", day: "Thursday", home_code: "BRAD", away_code: "WAKE", kickoff_local: "20:00", venue: "Bartercard Odsal Stadium", notes: null },
      { date: "2026-07-17", day: "Friday", home_code: "STH", away_code: "CAT", kickoff_local: "20:00", venue: "BrewDog Stadium", notes: null },
      { date: "2026-07-17", day: "Friday", home_code: "HUDD", away_code: "WIG", kickoff_local: "20:00", venue: "ACCU Stadium", notes: null },
      { date: "2026-07-18", day: "Saturday", home_code: "HULL", away_code: "LEIGH", kickoff_local: "17:30", venue: "MKM Stadium", notes: null },
      { date: "2026-07-18", day: "Saturday", home_code: "WARR", away_code: "HKR", kickoff_local: "15:00", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-07-18", day: "Saturday", home_code: "TOUL", away_code: "YORK", kickoff_local: "20:00", venue: "Stade Ernest-Wallon", notes: "8pm UK / 9pm CET" },
      { date: "2026-07-19", day: "Sunday", home_code: "CAST", away_code: "LEEDS", kickoff_local: "15:00", venue: "OneBore Stadium", notes: null },
    ],
  },
  {
    round: 20,
    matches: [
      { date: "2026-07-23", day: "Thursday", home_code: "HULL", away_code: "HKR", kickoff_local: "20:00", venue: "MKM Stadium", notes: null },
      { date: "2026-07-24", day: "Friday", home_code: "WIG", away_code: "STH", kickoff_local: "20:00", venue: "Brick Community Stadium", notes: null },
      { date: "2026-07-24", day: "Friday", home_code: "WAKE", away_code: "CAST", kickoff_local: "20:00", venue: "DIY Kitchens Stadium", notes: null },
      { date: "2026-07-25", day: "Saturday", home_code: "YORK", away_code: "HUDD", kickoff_local: "15:00", venue: "LNER Community Stadium", notes: null },
      { date: "2026-07-25", day: "Saturday", home_code: "LEIGH", away_code: "WARR", kickoff_local: "17:30", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-07-25", day: "Saturday", home_code: "TOUL", away_code: "CAT", kickoff_local: "20:00", venue: "Stade Ernest-Wallon", notes: "8pm UK / 9pm CET" },
      { date: "2026-07-26", day: "Sunday", home_code: "LEEDS", away_code: "BRAD", kickoff_local: "15:00", venue: "AMT Headingley Stadium", notes: null },
    ],
  },
  {
    round: 21,
    matches: [
      { date: "2026-07-30", day: "Thursday", home_code: "HUDD", away_code: "HULL", kickoff_local: "20:00", venue: "ACCU Stadium", notes: null },
      { date: "2026-07-31", day: "Friday", home_code: "LEIGH", away_code: "WIG", kickoff_local: "20:00", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-07-31", day: "Friday", home_code: "HKR", away_code: "BRAD", kickoff_local: "20:00", venue: "Sewell Group Craven Park", notes: null },
      { date: "2026-07-31", day: "Friday", home_code: "LEEDS", away_code: "TOUL", kickoff_local: "20:00", venue: "AMT Headingley Stadium", notes: null },
      { date: "2026-08-01", day: "Saturday", home_code: "YORK", away_code: "STH", kickoff_local: "17:30", venue: "LNER Community Stadium", notes: null },
      { date: "2026-08-01", day: "Saturday", home_code: "CAST", away_code: "WARR", kickoff_local: "15:00", venue: "OneBore Stadium", notes: null },
      { date: "2026-08-01", day: "Saturday", home_code: "CAT", away_code: "WAKE", kickoff_local: "20:00", venue: "Stade Gilbert Brutus", notes: "8pm UK / 9pm CET" },
    ],
  },
  {
    round: 22,
    matches: [
      { date: "2026-08-07", day: "Friday", home_code: "WAKE", away_code: "LEEDS", kickoff_local: "20:00", venue: "DIY Kitchens Stadium", notes: null },
      { date: "2026-08-07", day: "Friday", home_code: "CAST", away_code: "HKR", kickoff_local: "20:00", venue: "OneBore Stadium", notes: null },
      { date: "2026-08-07", day: "Friday", home_code: "LEIGH", away_code: "YORK", kickoff_local: "20:00", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-08-08", day: "Saturday", home_code: "STH", away_code: "HULL", kickoff_local: "20:00", venue: "BrewDog Stadium", notes: null },
      { date: "2026-08-08", day: "Saturday", home_code: "BRAD", away_code: "WARR", kickoff_local: "15:00", venue: "Bartercard Odsal Stadium", notes: null },
      { date: "2026-08-08", day: "Saturday", home_code: "WIG", away_code: "TOUL", kickoff_local: "17:30", venue: "Brick Community Stadium", notes: null },
      { date: "2026-08-09", day: "Sunday", home_code: "HUDD", away_code: "CAT", kickoff_local: "15:00", venue: "ACCU Stadium", notes: null },
    ],
  },
  {
    round: 23,
    matches: [
      { date: "2026-08-13", day: "Thursday", home_code: "LEEDS", away_code: "LEIGH", kickoff_local: "20:00", venue: "AMT Headingley Stadium", notes: null },
      { date: "2026-08-14", day: "Friday", home_code: "HULL", away_code: "CAST", kickoff_local: "20:00", venue: "MKM Stadium", notes: null },
      { date: "2026-08-14", day: "Friday", home_code: "HKR", away_code: "CAT", kickoff_local: "20:00", venue: "Sewell Group Craven Park", notes: null },
      { date: "2026-08-14", day: "Friday", home_code: "WARR", away_code: "YORK", kickoff_local: "20:00", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-08-15", day: "Saturday", home_code: "TOUL", away_code: "HUDD", kickoff_local: "20:00", venue: "Stade Ernest-Wallon", notes: "8pm UK / 9pm CET" },
      { date: "2026-08-15", day: "Saturday", home_code: "BRAD", away_code: "WIG", kickoff_local: "15:00", venue: "Bartercard Odsal Stadium", notes: null },
      { date: "2026-08-15", day: "Saturday", home_code: "WAKE", away_code: "STH", kickoff_local: "17:30", venue: "DIY Kitchens Stadium", notes: null },
    ],
  },
  {
    round: 24,
    matches: [
      { date: "2026-08-20", day: "Thursday", home_code: "HKR", away_code: "TOUL", kickoff_local: "20:00", venue: "Sewell Group Craven Park", notes: null },
      { date: "2026-08-21", day: "Friday", home_code: "WIG", away_code: "WAKE", kickoff_local: "20:00", venue: "Brick Community Stadium", notes: null },
      { date: "2026-08-21", day: "Friday", home_code: "LEIGH", away_code: "BRAD", kickoff_local: "20:00", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-08-22", day: "Saturday", home_code: "STH", away_code: "CAST", kickoff_local: "15:00", venue: "BrewDog Stadium", notes: null },
      { date: "2026-08-22", day: "Saturday", home_code: "CAT", away_code: "HULL", kickoff_local: "20:00", venue: "Stade Gilbert Brutus", notes: "8pm UK / 9pm CET" },
      { date: "2026-08-23", day: "Sunday", home_code: "WARR", away_code: "HUDD", kickoff_local: "15:00", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-08-23", day: "Sunday", home_code: "YORK", away_code: "LEEDS", kickoff_local: "15:00", venue: "LNER Community Stadium", notes: null },
    ],
  },
  {
    round: 25,
    matches: [
      { date: "2026-08-27", day: "Thursday", home_code: "WIG", away_code: "HKR", kickoff_local: "20:00", venue: "Brick Community Stadium", notes: null },
      { date: "2026-08-28", day: "Friday", home_code: "CAST", away_code: "CAT", kickoff_local: "20:00", venue: "OneBore Stadium", notes: null },
      { date: "2026-08-28", day: "Friday", home_code: "STH", away_code: "LEEDS", kickoff_local: "20:00", venue: "BrewDog Stadium", notes: null },
      { date: "2026-08-28", day: "Friday", home_code: "HUDD", away_code: "LEIGH", kickoff_local: "20:00", venue: "ACCU Stadium", notes: null },
      { date: "2026-08-29", day: "Saturday", home_code: "TOUL", away_code: "BRAD", kickoff_local: "20:00", venue: "Stade Ernest-Wallon", notes: "8pm UK / 9pm CET" },
      { date: "2026-08-29", day: "Saturday", home_code: "HULL", away_code: "WARR", kickoff_local: "17:30", venue: "MKM Stadium", notes: null },
      { date: "2026-08-29", day: "Saturday", home_code: "WAKE", away_code: "YORK", kickoff_local: "15:00", venue: "DIY Kitchens Stadium", notes: null },
    ],
  },
  {
    round: 26,
    matches: [
      { date: "2026-09-03", day: "Thursday", home_code: "BRAD", away_code: "CAST", kickoff_local: "20:00", venue: "Bartercard Odsal Stadium", notes: null },
      { date: "2026-09-04", day: "Friday", home_code: "HKR", away_code: "HUDD", kickoff_local: "20:00", venue: "Sewell Group Craven Park", notes: null },
      { date: "2026-09-04", day: "Friday", home_code: "LEIGH", away_code: "STH", kickoff_local: "20:00", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-09-04", day: "Friday", home_code: "TOUL", away_code: "HULL", kickoff_local: "18:00", venue: "Stade Ernest-Wallon", notes: "6pm UK / 7pm CET" },
      { date: "2026-09-05", day: "Saturday", home_code: "LEEDS", away_code: "WIG", kickoff_local: "20:00", venue: "AMT Headingley Stadium", notes: null },
      { date: "2026-09-05", day: "Saturday", home_code: "CAT", away_code: "YORK", kickoff_local: "17:00", venue: "Stade Gilbert Brutus", notes: "5pm UK / 6pm CET" },
      { date: "2026-09-05", day: "Saturday", home_code: "WAKE", away_code: "WARR", kickoff_local: "15:00", venue: "DIY Kitchens Stadium", notes: null },
    ],
  },
  {
    round: 27,
    matches: [
      { date: "2026-09-11", day: "Friday", home_code: "HUDD", away_code: "CAST", kickoff_local: "20:00", venue: "ACCU Stadium", notes: null },
      { date: "2026-09-11", day: "Friday", home_code: "LEEDS", away_code: "HULL", kickoff_local: "20:00", venue: "AMT Headingley Stadium", notes: null },
      { date: "2026-09-11", day: "Friday", home_code: "LEIGH", away_code: "WAKE", kickoff_local: "20:00", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-09-11", day: "Friday", home_code: "WARR", away_code: "TOUL", kickoff_local: "20:00", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-09-11", day: "Friday", home_code: "YORK", away_code: "BRAD", kickoff_local: "20:00", venue: "LNER Community Stadium", notes: null },
      { date: "2026-09-11", day: "Friday", home_code: "STH", away_code: "HKR", kickoff_local: "20:00", venue: "BrewDog Stadium", notes: null },
      { date: "2026-09-11", day: "Friday", home_code: "WIG", away_code: "CAT", kickoff_local: "20:00", venue: "Brick Community Stadium", notes: null },
    ],
  },
];

const DEFAULT_KICKOFF = "12:00";

function toUtc(date: string, localTime: string | null): string {
  const timeFragment = (localTime && localTime.trim().length > 0 ? localTime : DEFAULT_KICKOFF) + ":00";
  return new Date(`${date}T${timeFragment}Z`).toISOString();
}

function addFixtureToTeam(map: Record<string, LocalFixture[]>, teamId: string, fixture: LocalFixture) {
  if (!map[teamId]) {
    map[teamId] = [];
  }
  map[teamId].push(fixture);
}

export const SUPER_LEAGUE_FIXTURES_BY_TEAM: Record<string, LocalFixture[]> = (() => {
  const map: Record<string, LocalFixture[]> = {};
  const metaByCode = SUPER_LEAGUE_TEAMS.reduce<Record<string, SuperLeagueTeamMeta>>((acc, team) => {
    acc[team.code] = team;
    return acc;
  }, {});
  let matchCounter = 1;

  for (const round of RAW_ROUNDS_2026) {
    for (const match of round.matches) {
      if (!match.away_code) {
        continue;
      }

      const homeMeta = metaByCode[match.home_code];
      const awayMeta = metaByCode[match.away_code];
      if (!homeMeta || !awayMeta) {
        continue;
      }

      const homeTeamName = canonicalizeSuperLeagueTeamName(homeMeta.name);
      const awayTeamName = canonicalizeSuperLeagueTeamName(awayMeta.name);

      const fixture: LocalFixture = {
        matchNumber: matchCounter++,
        roundNumber: round.round,
        dateUtc: toUtc(match.date, match.kickoff_local),
        location: match.venue,
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
      };

      addFixtureToTeam(map, homeMeta.sportsDbId, fixture);
      addFixtureToTeam(map, awayMeta.sportsDbId, fixture);
    }
  }

  return map;
})();

function createFixtureKey(fixture: LocalFixture) {
  const dateKey = fixture.dateUtc.split("T")[0];
  const homeKey = normalizeTeamKey(fixture.homeTeam);
  const awayKey = normalizeTeamKey(fixture.awayTeam);
  return `${dateKey}-${homeKey}-${awayKey}`;
}

export const SUPER_LEAGUE_MASTER_FIXTURES: LocalFixture[] = (() => {
  const dedup = new Map<string, LocalFixture>();
  Object.values(SUPER_LEAGUE_FIXTURES_BY_TEAM).forEach((fixtures) => {
    fixtures.forEach((fixture) => {
      const canonicalFixture: LocalFixture = {
        ...fixture,
        homeTeam: canonicalizeSuperLeagueTeamName(fixture.homeTeam),
        awayTeam: canonicalizeSuperLeagueTeamName(fixture.awayTeam),
      };
      const key = createFixtureKey(canonicalFixture);
      const existing = dedup.get(key);
      if (!existing || shouldPreferFixture(existing, canonicalFixture)) {
        dedup.set(key, canonicalFixture);
      }
    });
  });
  return Array.from(dedup.values()).sort((a, b) => a.dateUtc.localeCompare(b.dateUtc));
})();

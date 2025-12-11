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
      { date: "2026-02-13", day: "Friday", home_code: "CAT", away_code: "HUDD", kickoff_local: "18:00", venue: "Stade Gilbert Brutus", notes: "6pm UK / 7pm CET" },
      { date: "2026-02-14", day: "Saturday", home_code: "HULL", away_code: "BRAD", kickoff_local: "17:30", venue: "MKM Stadium", notes: null },
      { date: "2026-02-14", day: "Saturday", home_code: "WAKE", away_code: "TOUL", kickoff_local: "20:00", venue: "DIY Kitchens Stadium", notes: null },
      { date: "2026-02-15", day: "Sunday", home_code: "CAST", away_code: "WIG", kickoff_local: "15:00", venue: "OneBore Stadium", notes: null },
    ],
  },
  {
    round: 2,
    matches: [
      { date: "2026-02-19", day: "Thursday", home_code: "HKR", away_code: null, kickoff_local: "19:30", venue: "MKM Stadium", notes: "World Club Challenge vs Brisbane Broncos (NRL)" },
      { date: "2026-02-20", day: "Friday", home_code: "BRAD", away_code: "CAT", kickoff_local: "20:00", venue: "Bartercard Odsal Stadium", notes: null },
      { date: "2026-02-20", day: "Friday", home_code: "LEEDS", away_code: "YORK", kickoff_local: "20:00", venue: "AMT Headingley Stadium", notes: null },
      { date: "2026-02-20", day: "Friday", home_code: "STH", away_code: "LEIGH", kickoff_local: "20:00", venue: "BrewDog Stadium", notes: null },
      { date: "2026-02-21", day: "Saturday", home_code: "WIG", away_code: "HULL", kickoff_local: "20:00", venue: "Brick Community Stadium", notes: null },
      { date: "2026-02-21", day: "Saturday", home_code: "TOUL", away_code: "CAST", kickoff_local: "18:00", venue: "Stade Ernest-Wallon", notes: "6pm UK / 7pm CET" },
      { date: "2026-02-22", day: "Sunday", home_code: "HUDD", away_code: "WAKE", kickoff_local: "15:00", venue: "ACCU Stadium", notes: null },
    ],
  },
  {
    round: 3,
    matches: [
      { date: "2026-02-26", day: "Thursday", home_code: "WIG", away_code: "LEIGH", kickoff_local: "20:00", venue: "Brick Community Stadium", notes: null },
      { date: "2026-02-27", day: "Friday", home_code: "CAST", away_code: "HUDD", kickoff_local: "20:00", venue: "OneBore Stadium", notes: null },
      { date: "2026-02-27", day: "Friday", home_code: "HULL", away_code: "YORK", kickoff_local: "20:00", venue: "MKM Stadium", notes: null },
      { date: "2026-02-28", day: "Saturday", home_code: "HKR", away_code: "LEEDS", kickoff_local: null, venue: "Allegiant Stadium, Las Vegas", notes: "Las Vegas fixture, time TBC" },
      { date: "2026-02-28", day: "Saturday", home_code: "CAT", away_code: "STH", kickoff_local: "18:00", venue: "Stade Gilbert Brutus", notes: "6pm UK / 7pm CET" },
      { date: "2026-02-28", day: "Saturday", home_code: "WARR", away_code: "WAKE", kickoff_local: "17:30", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-03-01", day: "Sunday", home_code: "BRAD", away_code: "TOUL", kickoff_local: "15:00", venue: "Bartercard Odsal Stadium", notes: null },
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

      const fixture: LocalFixture = {
        matchNumber: matchCounter++,
        roundNumber: round.round,
        dateUtc: toUtc(match.date, match.kickoff_local),
        location: match.venue,
        homeTeam: homeMeta.name,
        awayTeam: awayMeta.name,
      };

      addFixtureToTeam(map, homeMeta.sportsDbId, fixture);
      addFixtureToTeam(map, awayMeta.sportsDbId, fixture);
    }
  }

  return map;
})();

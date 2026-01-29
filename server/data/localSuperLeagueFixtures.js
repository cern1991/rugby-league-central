const SUPER_LEAGUE_TEAMS = [
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
  { code: "YORK", name: "York Knights", country: "England", homeVenue: "LNER Community Stadium", sportsDbId: "137405" }
];
const SUPER_LEAGUE_TEAM_NAME_BY_KEY = SUPER_LEAGUE_TEAMS.reduce((acc, team) => {
  acc[normalizeTeamKey(team.name)] = team.name;
  return acc;
}, {});
const SUPER_LEAGUE_TEAM_ALIASES = {
  hullkr: "Hull Kingston Rovers"
};
function normalizeTeamKey(name) {
  return (name == null ? void 0 : name.toLowerCase().replace(/[^a-z0-9]+/g, "")) || "";
}
function canonicalizeSuperLeagueTeamName(name) {
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
function usesDefaultKickoffTime(fixture) {
  return fixture.dateUtc.includes(`T${DEFAULT_KICKOFF}:00`);
}
function shouldPreferFixture(current, candidate) {
  const currentDefault = usesDefaultKickoffTime(current);
  const candidateDefault = usesDefaultKickoffTime(candidate);
  if (currentDefault !== candidateDefault) {
    return currentDefault && !candidateDefault;
  }
  const candidateTime = new Date(candidate.dateUtc).getTime();
  const currentTime = new Date(current.dateUtc).getTime();
  return candidateTime < currentTime;
}
const SUPER_LEAGUE_TEAM_ID_BY_CODE = SUPER_LEAGUE_TEAMS.reduce((acc, team) => {
  acc[team.code] = team.sportsDbId;
  return acc;
}, {});
function buildCustomTeamFixtures(teamName, fixtures, matchNumberOffset) {
  const canonicalTeamName = canonicalizeSuperLeagueTeamName(teamName);
  return fixtures.map((fixture, index) => {
    const opponentName = canonicalizeSuperLeagueTeamName(fixture.opponent);
    const homeTeam = fixture.home ? canonicalTeamName : opponentName;
    const awayTeam = fixture.home ? opponentName : canonicalTeamName;
    return {
      matchNumber: matchNumberOffset + index + 1,
      roundNumber: index + 1,
      dateUtc: toUtc(fixture.date, fixture.time),
      location: fixture.location,
      homeTeam,
      awayTeam
    };
  });
}
const RAW_ROUNDS_2026 = [
  {
    round: 1,
    matches: [
      { date: "2026-02-12", day: "Thursday", home_code: "YORK", away_code: "HKR", kickoff_local: "20:00", venue: "LNER Community Stadium", notes: null },
      { date: "2026-02-13", day: "Friday", home_code: "WARR", away_code: "STH", kickoff_local: "20:00", venue: "Halliwell Jones Stadium", notes: null },
      { date: "2026-02-13", day: "Friday", home_code: "LEIGH", away_code: "LEEDS", kickoff_local: "20:00", venue: "Progress With Unity Stadium", notes: null },
      { date: "2026-02-13", day: "Friday", home_code: "CAT", away_code: "HUDD", kickoff_local: "18:00", venue: "Stade Gilbert Brutus", notes: "6pm UK / 7pm CET" },
      { date: "2026-02-14", day: "Saturday", home_code: "HULL", away_code: "BRAD", kickoff_local: "17:30", venue: "MKM Stadium", notes: null },
      { date: "2026-02-14", day: "Saturday", home_code: "WAKE", away_code: "TOUL", kickoff_local: "20:00", venue: "DIY Kitchens Stadium", notes: null },
      { date: "2026-02-15", day: "Sunday", home_code: "CAST", away_code: "WIG", kickoff_local: "15:00", venue: "OneBore Stadium", notes: null }
    ]
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
      { date: "2026-02-22", day: "Sunday", home_code: "HUDD", away_code: "WAKE", kickoff_local: "15:00", venue: "ACCU Stadium", notes: null }
    ]
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
      { date: "2026-03-01", day: "Sunday", home_code: "BRAD", away_code: "TOUL", kickoff_local: "15:00", venue: "Bartercard Odsal Stadium", notes: null }
    ]
  }
];
const DEFAULT_KICKOFF = "12:00";
function toUtc(date, localTime) {
  const timeFragment = (localTime && localTime.trim().length > 0 ? localTime : DEFAULT_KICKOFF) + ":00";
  return (/* @__PURE__ */ new Date(`${date}T${timeFragment}Z`)).toISOString();
}
function addFixtureToTeam(map, teamId, fixture) {
  if (!map[teamId]) {
    map[teamId] = [];
  }
  map[teamId].push(fixture);
}
const SUPER_LEAGUE_FIXTURES_BY_TEAM = (() => {
  const map = {};
  const metaByCode = SUPER_LEAGUE_TEAMS.reduce((acc, team) => {
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
      const fixture = {
        matchNumber: matchCounter++,
        roundNumber: round.round,
        dateUtc: toUtc(match.date, match.kickoff_local),
        location: match.venue,
        homeTeam: homeTeamName,
        awayTeam: awayTeamName
      };
      addFixtureToTeam(map, homeMeta.sportsDbId, fixture);
      addFixtureToTeam(map, awayMeta.sportsDbId, fixture);
    }
  }
  return map;
})();
const WIGAN_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["WIG"];
const WIGAN_FIXTURES_2026 = (() => {
  if (!WIGAN_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-15", time: "15:00", opponent: "Castleford Tigers", home: false, location: "The Jungle, Castleford" },
    { date: "2026-02-21", time: "20:00", opponent: "Hull FC", home: true, location: "Brick Community Stadium, Wigan" },
    { date: "2026-02-26", time: "20:00", opponent: "Leigh Leopards", home: true, location: "Brick Community Stadium, Wigan" },
    { date: "2026-03-07", time: "17:00", opponent: "Toulouse Olympique", home: false, location: "Stade Ernest-Wallon, Toulouse" },
    { date: "2026-03-19", time: "20:00", opponent: "York Knights", home: true, location: "Brick Community Stadium, Wigan" },
    { date: "2026-03-28", time: "15:00", opponent: "Huddersfield Giants", home: true, location: "Brick Community Stadium, Wigan" },
    { date: "2026-04-03", time: "19:45", opponent: "St Helens", home: false, location: "BrewDog Stadium, St Helens" },
    { date: "2026-04-19", time: "15:00", opponent: "Castleford Tigers", home: true, location: "Brick Community Stadium, Wigan" },
    { date: "2026-04-24", time: "20:00", opponent: "Warrington Wolves", home: false, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-05-02", time: "15:00", opponent: "Bradford Bulls", home: true, location: "Brick Community Stadium, Wigan" },
    { date: "2026-05-15", time: "20:00", opponent: "Leeds Rhinos", home: true, location: "Brick Community Stadium, Wigan" },
    { date: "2026-05-21", time: "20:00", opponent: "Hull Kingston Rovers", home: false, location: "Sewell Group Craven Park, Hull" },
    { date: "2026-06-06", time: "18:30", opponent: "Catalans Dragons", home: false, location: "Stade Jean Bouin, Paris (Neutral)" },
    { date: "2026-06-12", time: "20:00", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-06-20", time: "15:00", opponent: "York Knights", home: false, location: "LNER Community Stadium, York" },
    { date: "2026-06-27", time: "15:00", opponent: "Hull FC", home: false, location: "MKM Stadium, Hull" },
    { date: "2026-07-05", time: "16:00", opponent: "St Helens", home: true, location: "Brick Community Stadium, Wigan" },
    { date: "2026-07-10", time: "20:00", opponent: "Warrington Wolves", home: true, location: "Brick Community Stadium, Wigan" },
    { date: "2026-07-12", time: null, opponent: "St Helens", home: false, location: "Magic Weekend (Venue TBC)" },
    { date: "2026-07-17", time: "20:00", opponent: "Huddersfield Giants", home: false, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-07-24", time: "20:00", opponent: "St Helens", home: true, location: "Brick Community Stadium, Wigan" },
    { date: "2026-07-31", time: "20:00", opponent: "Leigh Leopards", home: false, location: "Progress With Unity Stadium, Leigh" },
    { date: "2026-08-08", time: "17:30", opponent: "Toulouse Olympique", home: true, location: "Brick Community Stadium, Wigan" },
    { date: "2026-08-15", time: "15:00", opponent: "Bradford Bulls", home: false, location: "Bartercard Odsal Stadium, Bradford" }
  ];
  return buildCustomTeamFixtures("Wigan Warriors", fixtures, 1e3);
})();
if (WIGAN_TEAM_ID && WIGAN_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[WIGAN_TEAM_ID] = WIGAN_FIXTURES_2026;
}
const BRADFORD_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["BRAD"];
const BRADFORD_FIXTURES_2026 = (() => {
  if (!BRADFORD_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-14", time: "15:00", opponent: "Hull FC", home: false, location: "MKM Stadium, Hull" },
    { date: "2026-02-20", time: "20:00", opponent: "Catalans Dragons", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-03-01", time: "15:00", opponent: "Toulouse Olympique", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-03-07", time: "19:45", opponent: "St Helens", home: false, location: "BrewDog Stadium, St Helens" },
    { date: "2026-03-20", time: "20:00", opponent: "Huddersfield Giants", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-03-26", time: "20:00", opponent: "Castleford Tigers", home: false, location: "OneBore Stadium, Castleford" },
    { date: "2026-04-03", time: "20:00", opponent: "Leeds Rhinos", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-04-18", time: "17:30", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-04-25", time: "18:00", opponent: "Hull Kingston Rovers", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-05-02", time: "15:00", opponent: "Wigan Warriors", home: false, location: "Brick Community Stadium, Wigan" },
    { date: "2026-05-17", time: "15:00", opponent: "Hull FC", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-05-24", time: "15:00", opponent: "Warrington Wolves", home: false, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-06-05", time: "20:00", opponent: "York Knights", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-06-14", time: "15:00", opponent: "Leigh Leopards", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-06-20", time: "18:00", opponent: "Catalans Dragons", home: false, location: "Stade Gilbert Brutus, Perpignan" },
    { date: "2026-06-27", time: "15:00", opponent: "St Helens", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-07-05", time: null, opponent: "Leeds Rhinos", home: false, location: "Magic Weekend (Hill Dickinson Stadium)" },
    { date: "2026-07-10", time: "20:00", opponent: "Huddersfield Giants", home: false, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-07-16", time: "20:00", opponent: "Wakefield Trinity", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-07-26", time: "15:00", opponent: "Leeds Rhinos", home: false, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-07-31", time: "20:00", opponent: "Hull Kingston Rovers", home: false, location: "Sewell Group Craven Park, Hull" },
    { date: "2026-08-08", time: "17:30", opponent: "Warrington Wolves", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-08-15", time: "15:00", opponent: "Wigan Warriors", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-08-21", time: "20:00", opponent: "Leigh Leopards", home: false, location: "Leigh Sports Village, Leigh" },
    { date: "2026-08-29", time: "18:00", opponent: "Toulouse Olympique", home: false, location: "Stade Ernest-Wallon, Toulouse" },
    { date: "2026-09-03", time: "20:00", opponent: "Castleford Tigers", home: true, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-09-11", time: "20:00", opponent: "York Knights", home: false, location: "LNER Community Stadium, York" }
  ];
  return buildCustomTeamFixtures("Bradford Bulls", fixtures, 1100);
})();
if (BRADFORD_TEAM_ID && BRADFORD_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[BRADFORD_TEAM_ID] = BRADFORD_FIXTURES_2026;
}
const LEEDS_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["LEEDS"];
const LEEDS_FIXTURES_2026 = (() => {
  if (!LEEDS_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-14", time: "17:30", opponent: "Leigh Leopards", home: false, location: "Leigh Sports Village, Leigh" },
    { date: "2026-02-28", time: null, opponent: "Hull KR", home: false, location: "Allegiant Stadium, Las Vegas (Showcase)" },
    { date: "2026-03-08", time: "15:00", opponent: "Castleford Tigers", home: true, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-03-22", time: "15:00", opponent: "Hull FC", home: false, location: "MKM Stadium, Hull" },
    { date: "2026-03-29", time: "17:30", opponent: "Warrington Wolves", home: true, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-04-03", time: "20:00", opponent: "Bradford Bulls", home: false, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-04-17", time: "20:00", opponent: "Huddersfield Giants", home: false, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-04-24", time: "20:00", opponent: "Catalans Dragons", home: true, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-05-01", time: "20:00", opponent: "Wakefield Trinity", home: true, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-05-15", time: "20:00", opponent: "Wigan Warriors", home: false, location: "Brick Community Stadium, Wigan" },
    { date: "2026-05-22", time: "20:00", opponent: "Huddersfield Giants", home: true, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-06-04", time: "20:00", opponent: "St Helens", home: true, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-06-12", time: "19:00", opponent: "Toulouse Olympique", home: false, location: "Stade Ernest-Wallon, Toulouse" },
    { date: "2026-06-18", time: "20:00", opponent: "Warrington Wolves", home: false, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-06-26", time: "20:00", opponent: "Hull KR", home: true, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-07-05", time: null, opponent: "Bradford Bulls", home: true, location: "Magic Weekend (Venue TBC)" },
    { date: "2026-07-11", time: "20:00", opponent: "Catalans Dragons", home: false, location: "Stade Gilbert Brutus, Perpignan" },
    { date: "2026-07-19", time: "15:00", opponent: "Castleford Tigers", home: false, location: "OneBore Stadium, Castleford" },
    { date: "2026-07-26", time: "15:00", opponent: "Bradford Bulls", home: true, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-07-31", time: "20:00", opponent: "Toulouse Olympique", home: true, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-08-07", time: "20:00", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-08-13", time: "20:00", opponent: "Leigh Leopards", home: true, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-08-23", time: "15:00", opponent: "York Knights", home: false, location: "LNER Community Stadium, York" },
    { date: "2026-08-28", time: "20:00", opponent: "St Helens", home: false, location: "BrewDog Stadium, St Helens" },
    { date: "2026-09-05", time: "20:00", opponent: "Wigan Warriors", home: true, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-09-11", time: "20:00", opponent: "Hull FC", home: true, location: "AMT Headingley Stadium, Leeds" }
  ];
  return buildCustomTeamFixtures("Leeds Rhinos", fixtures, 1200);
})();
if (LEEDS_TEAM_ID && LEEDS_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[LEEDS_TEAM_ID] = LEEDS_FIXTURES_2026;
}
const WAKEFIELD_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["WAKE"];
const WAKEFIELD_FIXTURES_2026 = (() => {
  if (!WAKEFIELD_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-14", time: "20:00", opponent: "Toulouse Olympique", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-02-28", time: "17:30", opponent: "Warrington Wolves", home: false, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-03-05", time: "20:00", opponent: "Hull FC", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-03-20", time: "20:00", opponent: "Leigh Leopards", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-03-27", time: "20:00", opponent: "York Knights", home: false, location: "LNER Community Stadium, York" },
    { date: "2026-04-05", time: "15:00", opponent: "Castleford Tigers", home: false, location: "OneBore Stadium, Castleford" },
    { date: "2026-04-18", time: "15:00", opponent: "Bradford Bulls", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-04-25", time: "17:30", opponent: "St Helens", home: false, location: "BrewDog Stadium, St Helens" },
    { date: "2026-05-01", time: "20:00", opponent: "Leeds Rhinos", home: false, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-05-15", time: "20:00", opponent: "Catalans Dragons", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-05-23", time: "17:30", opponent: "Hull Kingston Rovers", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-06-12", time: "20:00", opponent: "Wigan Warriors", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-06-19", time: "20:00", opponent: "Hull FC", home: false, location: "MKM Stadium, Hull" },
    { date: "2026-06-28", time: "15:00", opponent: "Huddersfield Giants", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-07-05", time: null, opponent: "Castleford Tigers", home: true, location: "Magic Weekend (Venue TBC)" },
    { date: "2026-07-11", time: "17:30", opponent: "Hull Kingston Rovers", home: false, location: "Sewell Group Craven Park, Hull" },
    { date: "2026-07-16", time: "20:00", opponent: "Bradford Bulls", home: false, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-07-24", time: "20:00", opponent: "Castleford Tigers", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-08-01", time: "20:00", opponent: "Catalans Dragons", home: false, location: "Stade Gilbert Brutus, Perpignan" },
    { date: "2026-08-07", time: "20:00", opponent: "Leeds Rhinos", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-08-15", time: "17:30", opponent: "St Helens", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-08-21", time: "20:00", opponent: "Wigan Warriors", home: false, location: "Brick Community Stadium, Wigan" },
    { date: "2026-08-29", time: "15:00", opponent: "York Knights", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-09-05", time: "15:00", opponent: "Warrington Wolves", home: true, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-09-11", time: "20:00", opponent: "Leigh Leopards", home: false, location: "Leigh Sports Village, Leigh" }
  ];
  return buildCustomTeamFixtures("Wakefield Trinity", fixtures, 1300);
})();
if (WAKEFIELD_TEAM_ID && WAKEFIELD_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[WAKEFIELD_TEAM_ID] = WAKEFIELD_FIXTURES_2026;
}
const HUDDERSFIELD_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["HUDD"];
const HUDDERSFIELD_FIXTURES_2026 = (() => {
  if (!HUDDERSFIELD_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-13", time: "18:00", opponent: "Catalans Dragons", home: false, location: "Stade Gilbert Brutus, Perpignan" },
    { date: "2026-02-26", time: "20:00", opponent: "Bradford Bulls", home: true, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-03-07", time: "15:00", opponent: "St Helens", home: true, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-03-20", time: "20:00", opponent: "Bradford Bulls", home: false, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-03-28", time: "17:30", opponent: "Wigan Warriors", home: false, location: "Brick Community Stadium, Wigan" },
    { date: "2026-04-17", time: "20:00", opponent: "Leeds Rhinos", home: true, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-04-24", time: "20:00", opponent: "York Knights", home: true, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-05-08", time: "20:00", opponent: "Hull Kingston Rovers", home: false, location: "Sewell Group Craven Park, Hull" },
    { date: "2026-05-22", time: "20:00", opponent: "Leeds Rhinos", home: false, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-06-28", time: "15:00", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-07-05", time: null, opponent: "Hull FC", home: true, location: "Magic Weekend (Venue TBC)" },
    { date: "2026-07-10", time: "20:00", opponent: "Bradford Bulls", home: true, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-07-17", time: "20:00", opponent: "Wigan Warriors", home: true, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-08-07", time: "20:00", opponent: "York Knights", home: false, location: "LNER Community Stadium, York" },
    { date: "2026-08-14", time: "20:00", opponent: "Warrington Wolves", home: true, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-08-21", time: "20:00", opponent: "Catalans Dragons", home: true, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-09-03", time: "20:00", opponent: "Castleford Tigers", home: false, location: "OneBore Stadium, Castleford" },
    { date: "2026-09-11", time: "20:00", opponent: "Toulouse Olympique", home: true, location: "ACCU Stadium, Huddersfield" }
  ];
  return buildCustomTeamFixtures("Huddersfield Giants", fixtures, 1400);
})();
if (HUDDERSFIELD_TEAM_ID && HUDDERSFIELD_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[HUDDERSFIELD_TEAM_ID] = HUDDERSFIELD_FIXTURES_2026;
}
const TOULOUSE_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["TOUL"];
const TOULOUSE_FIXTURES_2026 = (() => {
  if (!TOULOUSE_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-14", time: "20:00", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-02-22", time: "15:00", opponent: "Bradford Bulls", home: true, location: "Stade Ernest-Wallon, Toulouse" },
    { date: "2026-03-07", time: "17:00", opponent: "Wigan Warriors", home: true, location: "Stade Ernest-Wallon, Toulouse" },
    { date: "2026-03-15", time: "17:30", opponent: "Hull FC", home: false, location: "MKM Stadium, Hull" },
    { date: "2026-04-05", time: "18:00", opponent: "Hull Kingston Rovers", home: true, location: "Stade Ernest-Wallon, Toulouse" },
    { date: "2026-04-24", time: "20:00", opponent: "Warrington Wolves", home: false, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-05-03", time: "15:00", opponent: "York Knights", home: true, location: "Stade Ernest-Wallon, Toulouse" },
    { date: "2026-05-15", time: "20:00", opponent: "St Helens", home: false, location: "BrewDog Stadium, St Helens" },
    { date: "2026-06-12", time: "19:00", opponent: "Leeds Rhinos", home: true, location: "Stade Ernest-Wallon, Toulouse" },
    { date: "2026-06-20", time: "18:30", opponent: "Catalans Dragons", home: false, location: "Stade Gilbert Brutus, Perpignan" },
    { date: "2026-07-05", time: null, opponent: "Warrington Wolves", home: true, location: "Magic Weekend (Venue TBC)" },
    { date: "2026-07-31", time: "20:00", opponent: "Leeds Rhinos", home: false, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-08-08", time: "17:30", opponent: "Wigan Warriors", home: false, location: "Brick Community Stadium, Wigan" },
    { date: "2026-08-15", time: "17:30", opponent: "Wakefield Trinity", home: true, location: "Stade Ernest-Wallon, Toulouse" },
    { date: "2026-08-29", time: "18:00", opponent: "Bradford Bulls", home: true, location: "Stade Ernest-Wallon, Toulouse" },
    { date: "2026-09-11", time: "20:00", opponent: "Huddersfield Giants", home: false, location: "ACCU Stadium, Huddersfield" }
  ];
  return buildCustomTeamFixtures("Toulouse Olympique", fixtures, 1500);
})();
if (TOULOUSE_TEAM_ID && TOULOUSE_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[TOULOUSE_TEAM_ID] = TOULOUSE_FIXTURES_2026;
}
const LEIGH_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["LEIGH"];
const LEIGH_FIXTURES_2026 = (() => {
  if (!LEIGH_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-14", time: "17:30", opponent: "Leeds Rhinos", home: true, location: "Leigh Sports Village, Leigh" },
    { date: "2026-02-26", time: "20:00", opponent: "Wigan Warriors", home: false, location: "Brick Community Stadium, Wigan" },
    { date: "2026-03-06", time: "20:00", opponent: "Warrington Wolves", home: true, location: "Leigh Sports Village, Leigh" },
    { date: "2026-03-20", time: "20:00", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-04-10", time: "20:00", opponent: "Hull FC", home: true, location: "Leigh Sports Village, Leigh" },
    { date: "2026-04-24", time: "20:00", opponent: "Hull Kingston Rovers", home: false, location: "Sewell Group Craven Park, Hull" },
    { date: "2026-05-03", time: "15:00", opponent: "Castleford Tigers", home: true, location: "Leigh Sports Village, Leigh" },
    { date: "2026-05-15", time: "20:00", opponent: "Huddersfield Giants", home: false, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-06-14", time: "15:00", opponent: "Bradford Bulls", home: false, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-06-26", time: "20:00", opponent: "York Knights", home: true, location: "Leigh Sports Village, Leigh" },
    { date: "2026-07-05", time: null, opponent: "St Helens", home: true, location: "Magic Weekend (Venue TBC)" },
    { date: "2026-07-10", time: "20:00", opponent: "Wigan Warriors", home: false, location: "Brick Community Stadium, Wigan" },
    { date: "2026-07-31", time: "20:00", opponent: "Wigan Warriors", home: true, location: "Leigh Sports Village, Leigh" },
    { date: "2026-08-13", time: "20:00", opponent: "Leeds Rhinos", home: false, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-08-21", time: "20:00", opponent: "Bradford Bulls", home: true, location: "Leigh Sports Village, Leigh" },
    { date: "2026-09-11", time: "20:00", opponent: "Wakefield Trinity", home: true, location: "Leigh Sports Village, Leigh" }
  ];
  return buildCustomTeamFixtures("Leigh Leopards", fixtures, 1600);
})();
if (LEIGH_TEAM_ID && LEIGH_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[LEIGH_TEAM_ID] = LEIGH_FIXTURES_2026;
}
const HULL_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["HULL"];
const HULL_FIXTURES_2026 = (() => {
  if (!HULL_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-14", time: "17:30", opponent: "Bradford Bulls", home: true, location: "MKM Stadium, Hull" },
    { date: "2026-02-26", time: "20:00", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-03-05", time: "20:00", opponent: "Wakefield Trinity", home: true, location: "MKM Stadium, Hull" },
    { date: "2026-03-15", time: "17:30", opponent: "Toulouse Olympique", home: true, location: "MKM Stadium, Hull" },
    { date: "2026-03-22", time: "15:00", opponent: "Leeds Rhinos", home: true, location: "MKM Stadium, Hull" },
    { date: "2026-04-10", time: "20:00", opponent: "Leigh Leopards", home: false, location: "Leigh Sports Village, Leigh" },
    { date: "2026-04-17", time: "20:00", opponent: "Castleford Tigers", home: true, location: "MKM Stadium, Hull" },
    { date: "2026-05-08", time: "20:00", opponent: "Huddersfield Giants", home: true, location: "MKM Stadium, Hull" },
    { date: "2026-05-17", time: "15:00", opponent: "Bradford Bulls", home: false, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-06-19", time: "20:00", opponent: "Wakefield Trinity", home: true, location: "MKM Stadium, Hull" },
    { date: "2026-06-27", time: "15:00", opponent: "Wigan Warriors", home: true, location: "MKM Stadium, Hull" },
    { date: "2026-07-05", time: null, opponent: "Huddersfield Giants", home: false, location: "Magic Weekend (Venue TBC)" },
    { date: "2026-07-11", time: "17:30", opponent: "Hull KR", home: true, location: "MKM Stadium, Hull" },
    { date: "2026-08-07", time: "20:00", opponent: "Castleford Tigers", home: false, location: "OneBore Stadium, Castleford" },
    { date: "2026-08-15", time: "15:00", opponent: "York Knights", home: true, location: "MKM Stadium, Hull" },
    { date: "2026-09-11", time: "20:00", opponent: "Leeds Rhinos", home: false, location: "AMT Headingley Stadium, Leeds" }
  ];
  return buildCustomTeamFixtures("Hull FC", fixtures, 1700);
})();
if (HULL_TEAM_ID && HULL_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[HULL_TEAM_ID] = HULL_FIXTURES_2026;
}
const HULLKR_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["HKR"];
const HULLKR_FIXTURES_2026 = (() => {
  if (!HULLKR_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-12", time: "20:00", opponent: "York Knights", home: false, location: "LNER Community Stadium, York" },
    { date: "2026-02-28", time: null, opponent: "Leeds Rhinos", home: true, location: "Las Vegas Showcase (Venue TBC)" },
    { date: "2026-03-06", time: "20:00", opponent: "Castleford Tigers", home: true, location: "Sewell Group Craven Park, Hull" },
    { date: "2026-03-13", time: "20:00", opponent: "Warrington Wolves", home: false, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-04-05", time: "18:00", opponent: "Toulouse Olympique", home: false, location: "Stade Ernest-Wallon, Toulouse" },
    { date: "2026-04-25", time: "18:00", opponent: "Bradford Bulls", home: false, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-05-08", time: "20:00", opponent: "Huddersfield Giants", home: true, location: "Sewell Group Craven Park, Hull" },
    { date: "2026-05-21", time: "20:00", opponent: "Wigan Warriors", home: true, location: "Sewell Group Craven Park, Hull" },
    { date: "2026-05-23", time: "17:30", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-06-26", time: "20:00", opponent: "Leeds Rhinos", home: false, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-07-05", time: null, opponent: "York Knights", home: true, location: "Magic Weekend (Venue TBC)" },
    { date: "2026-07-11", time: "17:30", opponent: "Hull FC", home: false, location: "MKM Stadium, Hull" },
    { date: "2026-07-31", time: "20:00", opponent: "Bradford Bulls", home: true, location: "Sewell Group Craven Park, Hull" },
    { date: "2026-08-08", time: "17:30", opponent: "St Helens", home: true, location: "Sewell Group Craven Park, Hull" },
    { date: "2026-08-21", time: "20:00", opponent: "Warrington Wolves", home: false, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-09-03", time: "20:00", opponent: "Castleford Tigers", home: true, location: "Sewell Group Craven Park, Hull" }
  ];
  return buildCustomTeamFixtures("Hull Kingston Rovers", fixtures, 1800);
})();
if (HULLKR_TEAM_ID && HULLKR_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[HULLKR_TEAM_ID] = HULLKR_FIXTURES_2026;
}
const ST_HELENS_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["STH"];
const ST_HELENS_FIXTURES_2026 = (() => {
  if (!ST_HELENS_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-13", time: "20:00", opponent: "Warrington Wolves", home: false, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-03-07", time: "15:00", opponent: "Huddersfield Giants", home: false, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-04-03", time: "19:45", opponent: "Wigan Warriors", home: true, location: "BrewDog Stadium, St Helens" },
    { date: "2026-04-25", time: "17:30", opponent: "Wakefield Trinity", home: true, location: "BrewDog Stadium, St Helens" },
    { date: "2026-05-15", time: "20:00", opponent: "Toulouse Olympique", home: true, location: "BrewDog Stadium, St Helens" },
    { date: "2026-06-04", time: "20:00", opponent: "Leeds Rhinos", home: false, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-07-05", time: null, opponent: "Leigh Leopards", home: false, location: "Magic Weekend (Venue TBC)" },
    { date: "2026-07-05", time: "16:00", opponent: "Wigan Warriors", home: false, location: "Brick Community Stadium, Wigan" },
    { date: "2026-07-24", time: "20:00", opponent: "Wigan Warriors", home: true, location: "BrewDog Stadium, St Helens" },
    { date: "2026-08-08", time: "17:30", opponent: "Hull KR", home: false, location: "Sewell Group Craven Park, Hull" },
    { date: "2026-08-15", time: "17:30", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-09-11", time: "20:00", opponent: "Catalans Dragons", home: true, location: "BrewDog Stadium, St Helens" }
  ];
  return buildCustomTeamFixtures("St Helens", fixtures, 1900);
})();
if (ST_HELENS_TEAM_ID && ST_HELENS_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[ST_HELENS_TEAM_ID] = ST_HELENS_FIXTURES_2026;
}
const WARRINGTON_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["WARR"];
const WARRINGTON_FIXTURES_2026 = (() => {
  if (!WARRINGTON_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-13", time: "20:00", opponent: "St Helens", home: true, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-02-28", time: "17:30", opponent: "Wakefield Trinity", home: true, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-03-06", time: "20:00", opponent: "Leigh Leopards", home: false, location: "Leigh Sports Village, Leigh" },
    { date: "2026-04-24", time: "20:00", opponent: "Toulouse Olympique", home: true, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-05-24", time: "15:00", opponent: "Bradford Bulls", home: true, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-06-18", time: "20:00", opponent: "Leeds Rhinos", home: true, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-07-05", time: null, opponent: "Toulouse Olympique", home: false, location: "Magic Weekend (Venue TBC)" },
    { date: "2026-07-10", time: "20:00", opponent: "Wigan Warriors", home: true, location: "Halliwell Jones Stadium, Warrington" },
    { date: "2026-08-14", time: "20:00", opponent: "Huddersfield Giants", home: false, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-09-05", time: "15:00", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" }
  ];
  return buildCustomTeamFixtures("Warrington Wolves", fixtures, 2e3);
})();
if (WARRINGTON_TEAM_ID && WARRINGTON_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[WARRINGTON_TEAM_ID] = WARRINGTON_FIXTURES_2026;
}
const CASTLEFORD_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["CAST"];
const CASTLEFORD_FIXTURES_2026 = (() => {
  if (!CASTLEFORD_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-15", time: "15:00", opponent: "Wigan Warriors", home: true, location: "OneBore Stadium, Castleford" },
    { date: "2026-03-26", time: "20:00", opponent: "Bradford Bulls", home: true, location: "OneBore Stadium, Castleford" },
    { date: "2026-04-05", time: "15:00", opponent: "Wakefield Trinity", home: true, location: "OneBore Stadium, Castleford" },
    { date: "2026-04-17", time: "20:00", opponent: "Hull FC", home: false, location: "MKM Stadium, Hull" },
    { date: "2026-05-03", time: "15:00", opponent: "Leigh Leopards", home: false, location: "Leigh Sports Village, Leigh" },
    { date: "2026-07-05", time: null, opponent: "Wakefield Trinity", home: false, location: "Magic Weekend (Venue TBC)" },
    { date: "2026-07-24", time: "20:00", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-08-07", time: "20:00", opponent: "Hull FC", home: true, location: "OneBore Stadium, Castleford" },
    { date: "2026-09-03", time: "20:00", opponent: "Huddersfield Giants", home: true, location: "OneBore Stadium, Castleford" }
  ];
  return buildCustomTeamFixtures("Castleford Tigers", fixtures, 2100);
})();
if (CASTLEFORD_TEAM_ID && CASTLEFORD_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[CASTLEFORD_TEAM_ID] = CASTLEFORD_FIXTURES_2026;
}
const CATALANS_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["CAT"];
const CATALANS_FIXTURES_2026 = (() => {
  if (!CATALANS_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-13", time: "18:00", opponent: "Huddersfield Giants", home: true, location: "Stade Gilbert Brutus, Perpignan" },
    { date: "2026-02-20", time: "20:00", opponent: "Bradford Bulls", home: false, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-04-24", time: "20:00", opponent: "Leeds Rhinos", home: false, location: "AMT Headingley Stadium, Leeds" },
    { date: "2026-05-15", time: "20:00", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-06-06", time: "18:30", opponent: "Wigan Warriors", home: true, location: "Stade Jean Bouin, Paris" },
    { date: "2026-06-20", time: "18:00", opponent: "Bradford Bulls", home: true, location: "Stade Gilbert Brutus, Perpignan" },
    { date: "2026-07-11", time: "20:00", opponent: "Leeds Rhinos", home: true, location: "Stade Gilbert Brutus, Perpignan" },
    { date: "2026-08-01", time: "20:00", opponent: "Wakefield Trinity", home: true, location: "Stade Gilbert Brutus, Perpignan" },
    { date: "2026-08-21", time: "20:00", opponent: "Huddersfield Giants", home: false, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-09-11", time: "20:00", opponent: "St Helens", home: false, location: "BrewDog Stadium, St Helens" }
  ];
  return buildCustomTeamFixtures("Catalans Dragons", fixtures, 2200);
})();
if (CATALANS_TEAM_ID && CATALANS_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[CATALANS_TEAM_ID] = CATALANS_FIXTURES_2026;
}
const YORK_TEAM_ID = SUPER_LEAGUE_TEAM_ID_BY_CODE["YORK"];
const YORK_FIXTURES_2026 = (() => {
  if (!YORK_TEAM_ID) return [];
  const fixtures = [
    { date: "2026-02-12", time: "20:00", opponent: "Hull KR", home: true, location: "LNER Community Stadium, York" },
    { date: "2026-03-27", time: "20:00", opponent: "Wakefield Trinity", home: true, location: "LNER Community Stadium, York" },
    { date: "2026-04-24", time: "20:00", opponent: "Huddersfield Giants", home: false, location: "ACCU Stadium, Huddersfield" },
    { date: "2026-05-03", time: "15:00", opponent: "Toulouse Olympique", home: false, location: "Stade Ernest-Wallon, Toulouse" },
    { date: "2026-06-05", time: "20:00", opponent: "Bradford Bulls", home: false, location: "Bartercard Odsal Stadium, Bradford" },
    { date: "2026-06-20", time: "15:00", opponent: "Wigan Warriors", home: true, location: "LNER Community Stadium, York" },
    { date: "2026-07-05", time: null, opponent: "Hull KR", home: false, location: "Magic Weekend (Venue TBC)" },
    { date: "2026-08-07", time: "20:00", opponent: "Huddersfield Giants", home: true, location: "LNER Community Stadium, York" },
    { date: "2026-08-29", time: "15:00", opponent: "Wakefield Trinity", home: false, location: "DIY Kitchens Stadium, Wakefield" },
    { date: "2026-09-11", time: "20:00", opponent: "Bradford Bulls", home: true, location: "LNER Community Stadium, York" }
  ];
  return buildCustomTeamFixtures("York Knights", fixtures, 2300);
})();
if (YORK_TEAM_ID && YORK_FIXTURES_2026.length > 0) {
  SUPER_LEAGUE_FIXTURES_BY_TEAM[YORK_TEAM_ID] = YORK_FIXTURES_2026;
}
function createFixtureKey(fixture) {
  const dateKey = fixture.dateUtc.split("T")[0];
  const homeKey = normalizeTeamKey(fixture.homeTeam);
  const awayKey = normalizeTeamKey(fixture.awayTeam);
  return `${dateKey}-${homeKey}-${awayKey}`;
}
const SUPER_LEAGUE_MASTER_FIXTURES = (() => {
  const dedup = /* @__PURE__ */ new Map();
  Object.values(SUPER_LEAGUE_FIXTURES_BY_TEAM).forEach((fixtures) => {
    fixtures.forEach((fixture) => {
      const canonicalFixture = {
        ...fixture,
        homeTeam: canonicalizeSuperLeagueTeamName(fixture.homeTeam),
        awayTeam: canonicalizeSuperLeagueTeamName(fixture.awayTeam)
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
export {
  SUPER_LEAGUE_FIXTURES_BY_TEAM,
  SUPER_LEAGUE_MASTER_FIXTURES,
  SUPER_LEAGUE_TEAMS,
  SUPER_LEAGUE_TEAM_ID_BY_CODE
};

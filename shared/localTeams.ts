export interface LocalTeamInfo {
  id: string;
  name: string;
  league: string;
  country: { name: string; code: string; flag: string | null };
  logo: string | null;
  stadium: string | null;
  founded: string | null;
  description: string | null;
  honours?: {
    premierships?: string[];
    minorPremierships?: string[];
    worldClubChallenge?: string[];
    superLeagueTitles?: string[];
    challengeCup?: string[];
    leagueLeadersShield?: string[];
  };
}

// Shared list of rugby league clubs we support locally so both the server and
// client can fall back gracefully when external APIs are unavailable.
export const LOCAL_TEAMS: LocalTeamInfo[] = [
  // NRL Teams (17 teams)
  {
    id: "135191",
    name: "Brisbane Broncos",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/dnj6uw1646347648.png",
    stadium: "Suncorp Stadium (Lang Park)",
    founded: "1988",
    description:
      "Australian professional rugby league club based in Brisbane, Queensland, competing in the NRL. Founded in 1988, they play home matches at Suncorp Stadium (Lang Park).",
    honours: {
      premierships: ['1992', '1993', '1997', '1998', '2000', '2006', '2025'],
      minorPremierships: ['1992', '1997', '1998', '2000'],
      worldClubChallenge: ['1992', '1997'],
    },
  },
  {
    id: "135186",
    name: "Canberra Raiders",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/wmlzo81646347671.png",
    stadium: "GIO Stadium (Canberra Stadium)",
    founded: "1981",
    description:
      "Australian professional rugby league club based in Canberra, Australian Capital Territory, competing in the NRL. Founded in 1981, they play home matches at GIO Stadium (Canberra Stadium).",
    honours: {
      premierships: ['1989', '1990', '1994'],
      minorPremierships: ['1990', '2025'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135187",
    name: "Canterbury Bulldogs",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c6/Canterbury-Bankstown_Bulldogs_logo_2026.svg/250px-Canterbury-Bankstown_Bulldogs_logo_2026.svg.png",
    stadium: "Accor Stadium (Stadium Australia)",
    founded: "1935",
    description:
      "Australian professional rugby league club based in Canterbury-Bankstown, Sydney, competing in the NRL. Founded in 1935, they play home matches at Accor Stadium (Stadium Australia).",
    honours: {
      premierships: ['1938', '1942', '1980', '1984', '1985', '1988', '1995', '2004'],
      minorPremierships: ['1938', '1942', '1947', '1984', '1993', '1994', '2012'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135184",
    name: "Cronulla Sharks",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/qn3n5r1552073088.png",
    stadium: "Ocean Protect Stadium (Shark Park)",
    founded: "1963",
    description:
      "Australian professional rugby league club based in the Sutherland Shire of Sydney, competing in the NRL. Founded in 1963, they play home matches at Ocean Protect Stadium (Shark Park).",
    honours: {
      premierships: ['2016'],
      minorPremierships: ['1988', '1999'],
      worldClubChallenge: [],
    },
  },
  {
    id: "140097",
    name: "Dolphins",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/ae/Dolphins_%28NRL%29_Logo.svg/250px-Dolphins_%28NRL%29_Logo.svg.png",
    stadium: "Suncorp Stadium (Lang Park)",
    founded: "2023",
    description:
      "Australian professional rugby league club based on the Redcliffe Peninsula north of Brisbane, competing in the NRL. Founded in 2023, they play home matches at Suncorp Stadium (Lang Park).",
    honours: {
      premierships: [],
      minorPremierships: [],
      worldClubChallenge: [],
    },
  },
  {
    id: "135194",
    name: "Gold Coast Titans",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/4qqmp81646347724.png",
    stadium: "Cbus Super Stadium (Robina Stadium)",
    founded: "2005",
    description:
      "Australian professional rugby league club based on the Gold Coast, Queensland, competing in the NRL. Founded in 2005, they play home matches at Cbus Super Stadium (Robina Stadium).",
    honours: {
      premierships: [],
      minorPremierships: [],
      worldClubChallenge: [],
    },
  },
  {
    id: "135188",
    name: "Manly Sea Eagles",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/1ok3661646347740.png",
    stadium: "4 Pines Park (Brookvale Oval)",
    founded: "1946",
    description:
      "Australian professional rugby league club based in Manly on Sydney's Northern Beaches, competing in the NRL. Founded in 1946, they play home matches at 4 Pines Park (Brookvale Oval).",
    honours: {
      premierships: ['1972', '1973', '1976', '1978', '1987', '1996', '2008', '2011'],
      minorPremierships: ['1971', '1972', '1973', '1976', '1983', '1987', '1995', '1996', '1997'],
      worldClubChallenge: ['2009'],
    },
  },
  {
    id: "135190",
    name: "Melbourne Storm",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/hpdn401646347751.png",
    stadium: "AAMI Park (Melbourne Rectangular Stadium)",
    founded: "1997",
    description:
      "Australian professional rugby league club based in Melbourne, Victoria, competing in the NRL. Founded in 1997, they play home matches at AAMI Park (Melbourne Rectangular Stadium).",
    honours: {
      premierships: ['1999', '2012', '2017', '2020'],
      minorPremierships: ['2011', '2016', '2017', '2019', '2021', '2024'],
      worldClubChallenge: ['2000', '2013', '2018'],
    },
  },
  {
    id: "135198",
    name: "Newcastle Knights",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/aes2o51646347790.png",
    stadium: "McDonald Jones Stadium (Newcastle International Sports Centre)",
    founded: "1987",
    description:
      "Australian professional rugby league club based in Newcastle, New South Wales, competing in the NRL. Founded in 1987, they play home matches at McDonald Jones Stadium (Newcastle International Sports Centre).",
    honours: {
      premierships: ['1997', '2001'],
      minorPremierships: [],
      worldClubChallenge: [],
    },
  },
  {
    id: "135193",
    name: "New Zealand Warriors",
    league: "NRL",
    country: { name: "New Zealand", code: "NZ", flag: "https://flagcdn.com/w40/nz.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/w8b9kw1646347767.png",
    stadium: "Go Media Stadium (Mount Smart Stadium)",
    founded: "1995",
    description:
      "New Zealand professional rugby league club based in Auckland, competing in the NRL. Founded in 1995, they play home matches at Go Media Stadium (Mount Smart Stadium).",
    honours: {
      premierships: [],
      minorPremierships: ['2002'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135196",
    name: "North Queensland Cowboys",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/q6xu7c1646347820.png",
    stadium: "Queensland Country Bank Stadium (North Queensland Stadium)",
    founded: "1992",
    description:
      "Australian professional rugby league club based in Townsville, Queensland, competing in the NRL. Founded in 1992, they play home matches at Queensland Country Bank Stadium (North Queensland Stadium).",
    honours: {
      premierships: ['2015'],
      minorPremierships: [],
      worldClubChallenge: [],
    },
  },
  {
    id: "135183",
    name: "Parramatta Eels",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/5tvma21646347846.png",
    stadium: "CommBank Stadium (Western Sydney Stadium)",
    founded: "1946",
    description:
      "Australian professional rugby league club based in Parramatta, Western Sydney, competing in the NRL. Founded in 1946, they play home matches at CommBank Stadium (Western Sydney Stadium).",
    honours: {
      premierships: ['1981', '1982', '1983', '1986'],
      minorPremierships: ['1977', '1982', '1986', '2001', '2005'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135197",
    name: "Penrith Panthers",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/239jb41552073712.png",
    stadium: "BlueBet Stadium (Penrith Stadium)",
    founded: "1966",
    description:
      "Australian professional rugby league club based in Penrith, Western Sydney, competing in the NRL. Founded in 1966, they play home matches at BlueBet Stadium (Penrith Stadium).",
    honours: {
      premierships: ['1991', '2003', '2021', '2022', '2023', '2024'],
      minorPremierships: ['1991', '2003', '2020', '2022', '2023'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135185",
    name: "South Sydney Rabbitohs",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/0m4unp1552072677.png",
    stadium: "Accor Stadium (Stadium Australia)",
    founded: "1908",
    description:
      "Australian professional rugby league club based in Redfern, Sydney, competing in the NRL. Founded in 1908, they play home matches at Accor Stadium (Stadium Australia).",
    honours: {
      premierships: ['1908', '1909', '1914', '1918', '1925', '1926', '1927', '1928', '1929', '1931', '1932', '1950', '1951', '1953', '1954', '1955', '1967', '1968', '1970', '1971', '2014'],
      minorPremierships: ['1908', '1909', '1914', '1918', '1925', '1926', '1927', '1929', '1932', '1949', '1950', '1951', '1953', '1968', '1969', '1970', '1989'],
      worldClubChallenge: ['2015'],
    },
  },
  {
    id: "135195",
    name: "St George Illawarra Dragons",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://en.wikipedia.org/wiki/Special:FilePath/St._George_Illawarra_Dragons_logo.svg",
    stadium: "WIN Stadium (Wollongong Showground)",
    founded: "1998",
    description:
      "Australian professional rugby league club based in the St George and Illawarra regions of New South Wales, competing in the NRL. Founded in 1998, they play home matches at WIN Stadium (Wollongong Showground).",
    honours: {
      premierships: ['2010'],
      minorPremierships: ['2009', '2010'],
      worldClubChallenge: ['2011'],
    },
  },
  {
    id: "135192",
    name: "Sydney Roosters",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/by299w1646347883.png",
    stadium: "Allianz Stadium (Sydney Football Stadium)",
    founded: "1908",
    description:
      "Australian professional rugby league club based in the Eastern Suburbs of Sydney, competing in the NRL. Founded in 1908, they play home matches at Allianz Stadium (Sydney Football Stadium).",
    honours: {
      premierships: ['1911', '1912', '1913', '1923', '1935', '1936', '1937', '1940', '1945', '1974', '1975', '2002', '2013', '2018', '2019'],
      minorPremierships: ['1912', '1913', '1923', '1931', '1934', '1935', '1936', '1937', '1940', '1941', '1945', '1974', '1975', '1980', '1981', '2004', '2013', '2014', '2015', '2018'],
      worldClubChallenge: ['1976', '2003', '2014', '2019', '2020'],
    },
  },
  {
    id: "135189",
    name: "Wests Tigers",
    league: "NRL",
    country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/cs6i6f1646347894.png",
    stadium: "Campbelltown Sports Stadium",
    founded: "1999",
    description:
      "Australian professional rugby league club based in the Inner West and South Western Sydney, competing in the NRL. Founded in 1999, they play home matches at Campbelltown Sports Stadium.",
    honours: {
      premierships: ['2005'],
      minorPremierships: [],
      worldClubChallenge: [],
    },
  },
  // Super League Teams (14 teams for 2026 season)
  {
    id: "137398",
    name: "Bradford Bulls",
    league: "Super League",
    country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" },
    logo: "https://www.thesportsdb.com/images/media/team/badge/mm5kx11764710149.png",
    stadium: "Bartercard Odsal Stadium (Odsal Stadium)",
    founded: "1863",
    description:
      "Professional rugby league club based in Bradford, West Yorkshire, competing in Super League. Established in 1863, they play home matches at Bartercard Odsal Stadium (Odsal Stadium).",
    honours: {
      superLeagueTitles: ['1997', '2001', '2003', '2005'],
      leagueLeadersShield: ['2003'],
      challengeCup: ['1943-44', '1946-47', '1948-49', '2000', '2003'],
      worldClubChallenge: ['2002', '2004', '2006'],
    },
  },
  {
    id: "135211",
    name: "Castleford Tigers",
    league: "Super League",
    country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" },
    logo: "https://www.thesportsdb.com/images/media/team/badge/euqty81761164375.png",
    stadium: "OneBore Stadium (Wheldon Road)",
    founded: "1926",
    description:
      "Professional rugby league club based in Castleford, West Yorkshire, competing in Super League. Established in 1926, they play home matches at OneBore Stadium (Wheldon Road).",
    honours: {
      superLeagueTitles: [],
      leagueLeadersShield: ['2017'],
      challengeCup: ['1934-35', '1968-69', '1969-70', '1985-86'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135212",
    name: "Catalans Dragons",
    league: "Super League",
    country: { name: "France", code: "FR", flag: "https://flagcdn.com/w40/fr.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/trvxyx1426937245.png",
    stadium: "Stade Gilbert Brutus",
    founded: "2006",
    description:
      "Professional rugby league club based in Perpignan, France, competing in Super League. Established in 2006, they play home matches at Stade Gilbert Brutus.",
    honours: {
      superLeagueTitles: [],
      leagueLeadersShield: ['2021'],
      challengeCup: ['2018'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135213",
    name: "Huddersfield Giants",
    league: "Super League",
    country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/pkyjh51641840642.png",
    stadium: "Accu Stadium (Kirklees Stadium)",
    founded: "1864",
    description:
      "Professional rugby league club based in Huddersfield, West Yorkshire, competing in Super League. Established in 1864, they play home matches at Accu Stadium (Kirklees Stadium).",
    honours: {
      superLeagueTitles: [],
      leagueLeadersShield: ['2013'],
      challengeCup: ['1912-13', '1914-15', '1919-20', '1932-33', '1944-45', '1952-53'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135214",
    name: "Hull FC",
    league: "Super League",
    country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" },
    logo: "https://www.thesportsdb.com/images/media/team/badge/qfgncj1761164505.png",
    stadium: "MKM Stadium (KCOM Stadium)",
    founded: "1865",
    description:
      "Professional rugby league club based in Hull, East Riding of Yorkshire, competing in Super League. Established in 1865, they play home matches at MKM Stadium (KCOM Stadium).",
    honours: {
      superLeagueTitles: [],
      leagueLeadersShield: [],
      challengeCup: ['1914', '1982', '2005', '2016', '2017'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135215",
    name: "Hull Kingston Rovers",
    league: "Super League",
    country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/23h83f1641840658.png",
    stadium: "Craven Park",
    founded: "1882",
    description:
      "Professional rugby league club based in Kingston upon Hull, East Riding of Yorkshire, competing in Super League. Established in 1882, they play home matches at Craven Park.",
    honours: {
      superLeagueTitles: ['2025'],
      leagueLeadersShield: ['2025'],
      challengeCup: ['1979-80', '2025'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135216",
    name: "Leeds Rhinos",
    league: "Super League",
    country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/ryqwvv1447875742.png",
    stadium: "AMT Headingley Stadium (Headingley Stadium)",
    founded: "1865",
    description:
      "Professional rugby league club based in Leeds, West Yorkshire, competing in Super League. Established in 1865, they play home matches at AMT Headingley Stadium (Headingley Stadium).",
    honours: {
      superLeagueTitles: ['2004', '2007', '2008', '2009', '2011', '2012', '2015', '2017'],
      leagueLeadersShield: ['2004', '2009', '2015'],
      challengeCup: ['1909-10', '1922-23', '1931-32', '1935-36', '1940-41', '1941-42', '1956-57', '1967-68', '1976-77', '1977-78', '1999', '2014', '2015', '2020'],
      worldClubChallenge: ['2005', '2008', '2012'],
    },
  },
  {
    id: "137396",
    name: "Leigh Leopards",
    league: "Super League",
    country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/qjmky21673549784.png",
    stadium: "Progress With Unity Stadium (Leigh Sports Village)",
    founded: "1878",
    description:
      "Professional rugby league club based in Leigh, Greater Manchester, competing in Super League. Established in 1878, they play home matches at Progress With Unity Stadium (Leigh Sports Village).",
    honours: {
      superLeagueTitles: [],
      leagueLeadersShield: [],
      challengeCup: ['1920-21', '1970-71', '2023'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135218",
    name: "St Helens",
    league: "Super League",
    country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/xolesg1706620870.png",
    stadium: "Totally Wicked Stadium (Langtree Park)",
    founded: "1873",
    description:
      "Professional rugby league club based in St Helens, Merseyside, competing in Super League. Established in 1873, they play home matches at Totally Wicked Stadium (Langtree Park).",
    honours: {
      superLeagueTitles: ['1996', '1999', '2000', '2002', '2006', '2014', '2019', '2020', '2021', '2022'],
      leagueLeadersShield: ['2005', '2006', '2007', '2008', '2014', '2018', '2019', '2022'],
      challengeCup: ['1955-56', '1960-61', '1965-66', '1971-72', '1975-76', '1996', '1997', '2001', '2004', '2006', '2007', '2008', '2021'],
      worldClubChallenge: ['2001', '2007', '2023'],
    },
  },
  {
    id: "137395",
    name: "Toulouse Olympique",
    league: "Super League",
    country: { name: "France", code: "FR", flag: "https://flagcdn.com/w40/fr.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/hkg34j1641840692.png",
    stadium: "Stade Ernest-Wallon",
    founded: "1937",
    description:
      "Professional rugby league club based in Toulouse, France, competing in Super League. Established in 1937, they play home matches at Stade Ernest-Wallon.",
    honours: {
      superLeagueTitles: [],
      leagueLeadersShield: [],
      challengeCup: [],
      worldClubChallenge: [],
    },
  },
  {
    id: "135221",
    name: "Wakefield Trinity",
    league: "Super League",
    country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" },
    logo: "https://en.wikipedia.org/wiki/Special:FilePath/Wakey_new_logo.png",
    stadium: "DIY Kitchens Stadium (Belle Vue)",
    founded: "1873",
    description:
      "Professional rugby league club based in Wakefield, West Yorkshire, competing in Super League. Established in 1873, they play home matches at DIY Kitchens Stadium (Belle Vue).",
    honours: {
      superLeagueTitles: [],
      leagueLeadersShield: [],
      challengeCup: ['1908-09', '1945-46', '1959-60', '1961-62', '1962-63'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135220",
    name: "Warrington Wolves",
    league: "Super League",
    country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/saimjk1656789616.png",
    stadium: "Halliwell Jones Stadium",
    founded: "1879",
    description:
      "Professional rugby league club based in Warrington, Cheshire, competing in Super League. Established in 1879, they play home matches at Halliwell Jones Stadium.",
    honours: {
      superLeagueTitles: [],
      leagueLeadersShield: ['2011', '2016'],
      challengeCup: ['1904-05', '1906-07', '1949-50', '1953-54', '1973-74', '2009', '2010', '2012', '2019'],
      worldClubChallenge: [],
    },
  },
  {
    id: "135222",
    name: "Wigan Warriors",
    league: "Super League",
    country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" },
    logo: "https://r2.thesportsdb.com/images/media/team/badge/vch5a71673549813.png",
    stadium: "Brick Community Stadium (DW Stadium)",
    founded: "1872",
    description:
      "Professional rugby league club based in Wigan, Greater Manchester, competing in Super League. Established in 1872, they play home matches at Brick Community Stadium (DW Stadium).",
    honours: {
      superLeagueTitles: ['1998', '2010', '2013', '2016', '2018', '2023', '2024'],
      leagueLeadersShield: ['2010', '2012', '2020', '2023', '2024'],
      challengeCup: ['1924', '1929', '1944', '1948', '1951', '1958', '1959', '1965', '1985', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995', '2002', '2011', '2013', '2022', '2024'],
      worldClubChallenge: ['1987', '1991', '1994', '2017', '2024'],
    },
  },
  {
    id: "137405",
    name: "York Knights",
    league: "Super League",
    country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" },
    logo: "https://en.wikipedia.org/wiki/Special:FilePath/York_RLFC_Knights_logo.webp",
    stadium: "LNER Community Stadium (York Community Stadium)",
    founded: "1901",
    description:
      "Professional rugby league club based in York, North Yorkshire, competing in Super League. Established in 1901, they play home matches at LNER Community Stadium (York Community Stadium).",
    honours: {
      superLeagueTitles: [],
      leagueLeadersShield: [],
      challengeCup: [],
      worldClubChallenge: [],
    },
  },
];

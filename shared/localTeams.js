const LOCAL_TEAMS = [
  // NRL Teams (17 teams)
  { id: "135191", name: "Brisbane Broncos", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/dnj6uw1646347648.png" },
  { id: "135186", name: "Canberra Raiders", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/wmlzo81646347671.png" },
  { id: "135187", name: "Canterbury Bulldogs", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c6/Canterbury-Bankstown_Bulldogs_logo_2026.svg/250px-Canterbury-Bankstown_Bulldogs_logo_2026.svg.png" },
  { id: "135184", name: "Cronulla Sharks", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/qn3n5r1552073088.png" },
  { id: "140097", name: "Dolphins", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/ae/Dolphins_%28NRL%29_Logo.svg/250px-Dolphins_%28NRL%29_Logo.svg.png" },
  { id: "135194", name: "Gold Coast Titans", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/4qqmp81646347724.png" },
  { id: "135188", name: "Manly Sea Eagles", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/1ok3661646347740.png" },
  { id: "135190", name: "Melbourne Storm", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/hpdn401646347751.png" },
  { id: "135198", name: "Newcastle Knights", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/aes2o51646347790.png" },
  { id: "135193", name: "New Zealand Warriors", league: "NRL", country: { name: "New Zealand", code: "NZ", flag: "https://flagcdn.com/w40/nz.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/w8b9kw1646347767.png" },
  { id: "135196", name: "North Queensland Cowboys", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/q6xu7c1646347820.png" },
  { id: "135183", name: "Parramatta Eels", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/5tvma21646347846.png" },
  { id: "135197", name: "Penrith Panthers", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/239jb41552073712.png" },
  { id: "135185", name: "South Sydney Rabbitohs", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/0m4unp1552072677.png" },
  { id: "135195", name: "St George Illawarra Dragons", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://en.wikipedia.org/wiki/Special:FilePath/St._George_Illawarra_Dragons_logo.svg" },
  { id: "135192", name: "Sydney Roosters", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/by299w1646347883.png" },
  { id: "135189", name: "Wests Tigers", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/cs6i6f1646347894.png" },
  // Super League Teams (14 teams for 2026 season)
  { id: "137398", name: "Bradford Bulls", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://www.thesportsdb.com/images/media/team/badge/mm5kx11764710149.png" },
  { id: "135211", name: "Castleford Tigers", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://www.thesportsdb.com/images/media/team/badge/euqty81761164375.png" },
  { id: "135212", name: "Catalans Dragons", league: "Super League", country: { name: "France", code: "FR", flag: "https://flagcdn.com/w40/fr.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/trvxyx1426937245.png" },
  { id: "135213", name: "Huddersfield Giants", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/pkyjh51641840642.png" },
  { id: "135214", name: "Hull FC", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://www.thesportsdb.com/images/media/team/badge/qfgncj1761164505.png" },
  { id: "135215", name: "Hull Kingston Rovers", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/23h83f1641840658.png" },
  { id: "135216", name: "Leeds Rhinos", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/ryqwvv1447875742.png" },
  { id: "137396", name: "Leigh Leopards", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/qjmky21673549784.png" },
  { id: "135218", name: "St Helens", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/xolesg1706620870.png" },
  { id: "137395", name: "Toulouse Olympique", league: "Super League", country: { name: "France", code: "FR", flag: "https://flagcdn.com/w40/fr.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/hkg34j1641840692.png" },
  { id: "135221", name: "Wakefield Trinity", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://en.wikipedia.org/wiki/Special:FilePath/Wakey_new_logo.png" },
  { id: "135220", name: "Warrington Wolves", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/saimjk1656789616.png" },
  { id: "135222", name: "Wigan Warriors", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/vch5a71673549813.png" },
  { id: "137405", name: "York Knights", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://en.wikipedia.org/wiki/Special:FilePath/York_RLFC_Knights_logo.webp" }
];
export {
  LOCAL_TEAMS
};

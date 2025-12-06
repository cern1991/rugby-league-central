import { Trophy, Timer, Calendar, Activity, Flame } from "lucide-react";

export type GameStatus = "Live" | "Final" | "Upcoming";

export type LeagueType = 
  | "NRL" 
  | "Super League" 
  | "State of Origin" 
  | "International"
  | "Championship"
  | "League 1"
  | "QLD Cup"
  | "NSW Cup"
  | "Elite One"
  | "PNG Digicel Cup"
  | "NZRL Premiership"
  | "Betfred Challenge Cup";

export interface LeagueInfo {
  id: LeagueType;
  name: string;
  country: string;
  tier: string;
  color: string;
}

export const LEAGUES: LeagueInfo[] = [
  { id: "NRL", name: "NRL", country: "Australia", tier: "Top Tier", color: "bg-green-600" },
  { id: "Super League", name: "Super League", country: "England", tier: "Top Tier", color: "bg-red-600" },
  { id: "State of Origin", name: "State of Origin", country: "Australia", tier: "Representative", color: "bg-sky-600" },
  { id: "International", name: "International", country: "World", tier: "Representative", color: "bg-yellow-600" },
  { id: "Championship", name: "Championship", country: "England", tier: "Second Tier", color: "bg-orange-600" },
  { id: "League 1", name: "League 1", country: "England", tier: "Third Tier", color: "bg-purple-600" },
  { id: "QLD Cup", name: "QLD Cup", country: "Australia", tier: "State League", color: "bg-red-800" },
  { id: "NSW Cup", name: "NSW Cup", country: "Australia", tier: "State League", color: "bg-sky-800" },
  { id: "Elite One", name: "Elite One Championship", country: "France", tier: "Top Tier", color: "bg-blue-700" },
  { id: "PNG Digicel Cup", name: "PNG Digicel Cup", country: "Papua New Guinea", tier: "Top Tier", color: "bg-red-700" },
  { id: "NZRL Premiership", name: "NZRL Premiership", country: "New Zealand", tier: "Top Tier", color: "bg-black" },
  { id: "Betfred Challenge Cup", name: "Challenge Cup", country: "England", tier: "Cup", color: "bg-amber-600" },
];

export interface Team {
  name: string;
  abbreviation: string;
  logoColor: string;
  score?: number;
}

export interface GameEvent {
  id: string;
  time: string;
  type: "try" | "goal" | "penalty" | "whistle" | "sub" | "video_ref";
  description: string;
  team?: "home" | "away";
  player?: string;
}

export interface PlayerStats {
  name: string;
  tries?: number;
  goals?: number;
  fieldGoals?: number;
}

export interface GameStats {
  possession: [number, number];
  completion: [number, number];
  errors: [number, number];
  tackles: [number, number];
}

export interface Game {
  id: string;
  league: LeagueType;
  status: GameStatus;
  time: string;
  homeTeam: Team;
  awayTeam: Team;
  isHot?: boolean;
  venue?: string;
  round?: string;
  timeline?: GameEvent[];
  homeScorers?: PlayerStats[];
  awayScorers?: PlayerStats[];
  stats?: GameStats;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  timestamp: string;
  imageUrl: string;
}

export const MOCK_GAMES: Game[] = [
  {
    id: "1",
    league: "NRL",
    status: "Live",
    time: "H2 58:00",
    isHot: true,
    venue: "BlueBet Stadium",
    round: "Round 1",
    homeTeam: { name: "Penrith Panthers", abbreviation: "PEN", logoColor: "bg-neutral-900 border border-pink-500 text-pink-500", score: 18 },
    awayTeam: { name: "Brisbane Broncos", abbreviation: "BRI", logoColor: "bg-yellow-900 border border-yellow-500 text-yellow-400", score: 12 },
    homeScorers: [
      { name: "B. To'o", tries: 1 },
      { name: "D. Edwards", tries: 1 },
      { name: "N. Cleary", goals: 3 }
    ],
    awayScorers: [
      { name: "R. Walsh", tries: 1 },
      { name: "E. Mam", tries: 1 },
      { name: "A. Reynolds", goals: 2 }
    ],
    stats: {
      possession: [52, 48],
      completion: [85, 78],
      errors: [4, 7],
      tackles: [142, 156]
    },
    timeline: [
      { id: "e1", time: "56'", type: "try", team: "home", player: "B. To'o", description: "Brian To'o dives over in the corner after a sweeping backline move!" },
      { id: "e2", time: "57'", type: "goal", team: "home", player: "N. Cleary", description: "Cleary nails the conversion from the sideline." },
      { id: "e3", time: "48'", type: "video_ref", team: "away", description: "Bunker Review: Possible obstruction in the lead up." },
      { id: "e4", time: "42'", type: "try", team: "away", player: "R. Walsh", description: "Reece Walsh slices through the defense with incredible speed!" },
      { id: "e5", time: "40'", type: "whistle", description: "Halftime: Panthers 12 - 12 Broncos" },
      { id: "e6", time: "24'", type: "try", team: "home", player: "D. Edwards", description: "Dylan Edwards supports up the middle to score under the posts." },
    ]
  },
  {
    id: "2",
    league: "Super League",
    status: "Live",
    time: "H1 32:00",
    venue: "DW Stadium",
    round: "Round 3",
    homeTeam: { name: "Wigan Warriors", abbreviation: "WIG", logoColor: "bg-red-700 text-white", score: 6 },
    awayTeam: { name: "St Helens", abbreviation: "STH", logoColor: "bg-white border border-red-600 text-red-600", score: 4 },
    timeline: [
       { id: "e1", time: "28'", type: "try", team: "home", player: "J. Field", description: "Jai Field dances through three defenders to score!" },
       { id: "e2", time: "15'", type: "penalty", team: "away", description: "Penalty Goal: Makinson slots it from 30m out." },
       { id: "e3", time: "5'", type: "penalty", team: "away", description: "Penalty Goal: Makinson adds another two." }
    ],
    homeScorers: [{ name: "J. Field", tries: 1 }, { name: "H. Smith", goals: 1 }],
    awayScorers: [{ name: "T. Makinson", goals: 2 }],
    stats: {
        possession: [60, 40],
        completion: [90, 85],
        errors: [2, 3],
        tackles: [80, 110]
    }
  },
  {
    id: "3",
    league: "NRL",
    status: "Upcoming",
    time: "Today 7:50 PM",
    venue: "AAMI Park",
    round: "Round 1",
    homeTeam: { name: "Melbourne Storm", abbreviation: "MEL", logoColor: "bg-purple-800 text-yellow-400" },
    awayTeam: { name: "Sydney Roosters", abbreviation: "SYD", logoColor: "bg-blue-900 border border-red-600 text-white" },
    timeline: [],
    stats: {
        possession: [50, 50],
        completion: [0, 0],
        errors: [0, 0],
        tackles: [0, 0]
    }
  },
  {
    id: "4",
    league: "International",
    status: "Final",
    time: "Final",
    venue: "Old Trafford",
    round: "Final",
    homeTeam: { name: "Australia", abbreviation: "AUS", logoColor: "bg-green-700 text-yellow-400", score: 30 },
    awayTeam: { name: "New Zealand", abbreviation: "NZL", logoColor: "bg-black border border-white text-white", score: 10 },
    timeline: [
        { id: "f1", time: "Full Time", type: "whistle", description: "Australia are World Champions!" }
    ],
    homeScorers: [{ name: "J. Tedesco", tries: 2 }, { name: "C. Murray", tries: 1 }, { name: "N. Cleary", goals: 5 }],
    awayScorers: [{ name: "J. Manu", tries: 2 }, { name: "S. Johnson", goals: 1 }],
    stats: {
        possession: [55, 45],
        completion: [88, 72],
        errors: [5, 12],
        tackles: [280, 310]
    }
  },
  {
    id: "5",
    league: "State of Origin",
    status: "Upcoming",
    time: "Wed 8:05 PM",
    venue: "Accor Stadium",
    round: "Game 1",
    homeTeam: { name: "New South Wales", abbreviation: "NSW", logoColor: "bg-sky-600 text-white" },
    awayTeam: { name: "Queensland", abbreviation: "QLD", logoColor: "bg-red-800 text-white" },
    timeline: [],
    stats: {
        possession: [50, 50],
        completion: [0, 0],
        errors: [0, 0],
        tackles: [0, 0]
    }
  },
  {
    id: "6",
    league: "Championship",
    status: "Live",
    time: "H2 45:00",
    venue: "Odsal Stadium",
    round: "Round 5",
    homeTeam: { name: "Bradford Bulls", abbreviation: "BRD", logoColor: "bg-red-700 border border-amber-400 text-amber-400", score: 22 },
    awayTeam: { name: "Featherstone Rovers", abbreviation: "FEV", logoColor: "bg-blue-800 text-white", score: 18 },
    homeScorers: [
      { name: "D. Miller", tries: 2 },
      { name: "J. Woods", goals: 3 }
    ],
    awayScorers: [
      { name: "C. Hall", tries: 1 },
      { name: "B. Bussey", tries: 1 },
      { name: "R. Finn", goals: 3 }
    ],
    timeline: [
      { id: "c1", time: "42'", type: "try", team: "home", player: "D. Miller", description: "Miller breaks through for his second of the afternoon!" }
    ],
    stats: {
      possession: [48, 52],
      completion: [82, 79],
      errors: [5, 6],
      tackles: [165, 158]
    }
  },
  {
    id: "7",
    league: "Championship",
    status: "Upcoming",
    time: "Sun 3:00 PM",
    venue: "Crown Oil Arena",
    round: "Round 5",
    homeTeam: { name: "Rochdale Hornets", abbreviation: "ROC", logoColor: "bg-blue-600 text-white" },
    awayTeam: { name: "Sheffield Eagles", abbreviation: "SHE", logoColor: "bg-yellow-500 text-black" },
    timeline: [],
    stats: { possession: [50, 50], completion: [0, 0], errors: [0, 0], tackles: [0, 0] }
  },
  {
    id: "8",
    league: "League 1",
    status: "Final",
    time: "Final",
    venue: "Cougar Park",
    round: "Round 4",
    homeTeam: { name: "Keighley Cougars", abbreviation: "KEI", logoColor: "bg-green-700 text-white", score: 34 },
    awayTeam: { name: "Workington Town", abbreviation: "WOR", logoColor: "bg-blue-900 text-white", score: 16 },
    homeScorers: [
      { name: "J. Miller", tries: 2 },
      { name: "C. Lyons", tries: 2 },
      { name: "B. Taylor", goals: 5 }
    ],
    awayScorers: [
      { name: "S. Brown", tries: 1 },
      { name: "M. Green", tries: 1 },
      { name: "D. Smith", goals: 2 }
    ],
    timeline: [],
    stats: { possession: [58, 42], completion: [85, 76], errors: [3, 8], tackles: [145, 180] }
  },
  {
    id: "9",
    league: "League 1",
    status: "Upcoming",
    time: "Sat 5:30 PM",
    venue: "Bloomfield Road",
    round: "Round 5",
    homeTeam: { name: "Oldham RLFC", abbreviation: "OLD", logoColor: "bg-red-600 text-white" },
    awayTeam: { name: "Hunslet RLFC", abbreviation: "HUN", logoColor: "bg-green-600 text-white" },
    timeline: [],
    stats: { possession: [50, 50], completion: [0, 0], errors: [0, 0], tackles: [0, 0] }
  },
  {
    id: "10",
    league: "QLD Cup",
    status: "Live",
    time: "H1 25:00",
    isHot: true,
    venue: "Browne Park",
    round: "Round 8",
    homeTeam: { name: "Central Queensland Capras", abbreviation: "CQC", logoColor: "bg-teal-600 text-white", score: 10 },
    awayTeam: { name: "Burleigh Bears", abbreviation: "BUR", logoColor: "bg-orange-600 text-white", score: 6 },
    homeScorers: [
      { name: "K. Davis", tries: 1 },
      { name: "T. Brown", tries: 1 },
      { name: "M. Lee", goals: 1 }
    ],
    awayScorers: [
      { name: "J. Riki", tries: 1 },
      { name: "S. Okunbor", goals: 1 }
    ],
    timeline: [
      { id: "q1", time: "22'", type: "try", team: "home", player: "T. Brown", description: "Brown crashes over from close range!" }
    ],
    stats: { possession: [55, 45], completion: [80, 82], errors: [3, 4], tackles: [75, 90] }
  },
  {
    id: "11",
    league: "QLD Cup",
    status: "Upcoming",
    time: "Sat 4:00 PM",
    venue: "Dolphins Stadium",
    round: "Round 8",
    homeTeam: { name: "Redcliffe Dolphins", abbreviation: "RED", logoColor: "bg-red-500 text-white" },
    awayTeam: { name: "Wynnum Manly Seagulls", abbreviation: "WYN", logoColor: "bg-blue-500 border border-red-500 text-white" },
    timeline: [],
    stats: { possession: [50, 50], completion: [0, 0], errors: [0, 0], tackles: [0, 0] }
  },
  {
    id: "12",
    league: "NSW Cup",
    status: "Live",
    time: "H2 52:00",
    venue: "Kogarah Oval",
    round: "Round 10",
    homeTeam: { name: "St George Illawarra Dragons", abbreviation: "SGI", logoColor: "bg-red-600 text-white", score: 24 },
    awayTeam: { name: "Parramatta Eels", abbreviation: "PAR", logoColor: "bg-blue-600 border border-yellow-400 text-yellow-400", score: 20 },
    homeScorers: [
      { name: "T. Ravalawa", tries: 2 },
      { name: "M. Hunt", goals: 4 }
    ],
    awayScorers: [
      { name: "B. Lane", tries: 2 },
      { name: "K. Dykes", goals: 2 }
    ],
    timeline: [],
    stats: { possession: [46, 54], completion: [78, 84], errors: [6, 4], tackles: [178, 160] }
  },
  {
    id: "13",
    league: "NSW Cup",
    status: "Upcoming",
    time: "Sun 1:00 PM",
    venue: "Leichardt Oval",
    round: "Round 10",
    homeTeam: { name: "Western Suburbs Magpies", abbreviation: "WSM", logoColor: "bg-black border border-white text-white" },
    awayTeam: { name: "Newcastle Knights", abbreviation: "NEW", logoColor: "bg-blue-700 border border-red-500 text-white" },
    timeline: [],
    stats: { possession: [50, 50], completion: [0, 0], errors: [0, 0], tackles: [0, 0] }
  },
  {
    id: "14",
    league: "Elite One",
    status: "Final",
    time: "Final",
    venue: "Stade Albert Domec",
    round: "Round 12",
    homeTeam: { name: "Catalans Dragons B", abbreviation: "CAT", logoColor: "bg-red-600 border border-yellow-400 text-yellow-400", score: 28 },
    awayTeam: { name: "Toulouse Olympique", abbreviation: "TOU", logoColor: "bg-black border border-red-500 text-white", score: 22 },
    homeScorers: [
      { name: "A. Garcia", tries: 2 },
      { name: "L. Gigot", tries: 1 },
      { name: "T. Langi", goals: 4 }
    ],
    awayScorers: [
      { name: "M. Jullien", tries: 2 },
      { name: "C. Mourgue", goals: 3 }
    ],
    timeline: [],
    stats: { possession: [52, 48], completion: [83, 79], errors: [4, 5], tackles: [210, 225] }
  },
  {
    id: "15",
    league: "Elite One",
    status: "Upcoming",
    time: "Sat 7:00 PM",
    venue: "Stade de la Mediterannee",
    round: "Round 13",
    homeTeam: { name: "AS Carcassonne", abbreviation: "CAR", logoColor: "bg-blue-800 border border-yellow-500 text-yellow-400" },
    awayTeam: { name: "Lezignan Sangliers", abbreviation: "LEZ", logoColor: "bg-black text-red-500" },
    timeline: [],
    stats: { possession: [50, 50], completion: [0, 0], errors: [0, 0], tackles: [0, 0] }
  },
  {
    id: "16",
    league: "PNG Digicel Cup",
    status: "Live",
    time: "H2 60:00",
    isHot: true,
    venue: "National Football Stadium",
    round: "Round 6",
    homeTeam: { name: "Lae Snax Tigers", abbreviation: "LAE", logoColor: "bg-orange-500 text-black", score: 26 },
    awayTeam: { name: "Rabaul Gurias", abbreviation: "RAB", logoColor: "bg-blue-700 text-white", score: 24 },
    homeScorers: [
      { name: "E. Komia", tries: 2 },
      { name: "J. Nidau", tries: 1 },
      { name: "N. Mondo", goals: 4 }
    ],
    awayScorers: [
      { name: "W. Botom", tries: 2 },
      { name: "K. Bai", tries: 1 },
      { name: "S. Philip", goals: 3 }
    ],
    timeline: [
      { id: "p1", time: "58'", type: "try", team: "home", player: "E. Komia", description: "Komia scores in the corner to give Tigers the lead!" }
    ],
    stats: { possession: [48, 52], completion: [76, 80], errors: [6, 5], tackles: [195, 188] }
  },
  {
    id: "17",
    league: "PNG Digicel Cup",
    status: "Upcoming",
    time: "Sun 2:00 PM",
    venue: "Sir John Guise Stadium",
    round: "Round 6",
    homeTeam: { name: "Hela Wigmen", abbreviation: "HEL", logoColor: "bg-red-700 text-yellow-400" },
    awayTeam: { name: "Port Moresby Vipers", abbreviation: "PMV", logoColor: "bg-green-600 text-white" },
    timeline: [],
    stats: { possession: [50, 50], completion: [0, 0], errors: [0, 0], tackles: [0, 0] }
  },
  {
    id: "18",
    league: "NZRL Premiership",
    status: "Final",
    time: "Final",
    venue: "Mount Smart Stadium",
    round: "Round 8",
    homeTeam: { name: "Auckland Vulcans", abbreviation: "AKL", logoColor: "bg-blue-800 text-white", score: 32 },
    awayTeam: { name: "Canterbury Bulls", abbreviation: "CAN", logoColor: "bg-red-600 text-white", score: 18 },
    homeScorers: [
      { name: "R. Tuimavave", tries: 2 },
      { name: "K. Maumalo", tries: 2 },
      { name: "C. Harris", goals: 4 }
    ],
    awayScorers: [
      { name: "B. Goodwin", tries: 1 },
      { name: "M. Frei", tries: 1 },
      { name: "T. Wright", goals: 3 }
    ],
    timeline: [],
    stats: { possession: [56, 44], completion: [88, 75], errors: [3, 7], tackles: [165, 195] }
  },
  {
    id: "19",
    league: "NZRL Premiership",
    status: "Upcoming",
    time: "Sat 5:00 PM",
    venue: "FMG Stadium Waikato",
    round: "Round 9",
    homeTeam: { name: "Waikato Mooloo", abbreviation: "WAI", logoColor: "bg-red-600 border border-yellow-400 text-yellow-400" },
    awayTeam: { name: "Wellington Orcas", abbreviation: "WEL", logoColor: "bg-black border border-yellow-500 text-yellow-400" },
    timeline: [],
    stats: { possession: [50, 50], completion: [0, 0], errors: [0, 0], tackles: [0, 0] }
  },
  {
    id: "20",
    league: "Betfred Challenge Cup",
    status: "Upcoming",
    time: "Sat 2:30 PM",
    venue: "Wembley Stadium",
    round: "Final",
    homeTeam: { name: "Leigh Leopards", abbreviation: "LEI", logoColor: "bg-red-600 text-white" },
    awayTeam: { name: "Hull FC", abbreviation: "HUL", logoColor: "bg-black border border-white text-white" },
    timeline: [],
    stats: { possession: [50, 50], completion: [0, 0], errors: [0, 0], tackles: [0, 0] }
  },
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Cleary Masterclass: Panthers Halfback Dominates in Return",
    summary: "Nathan Cleary showed no signs of rust as he guided the defending premiers to a crucial victory over their rivals.",
    category: "NRL",
    timestamp: "1 hour ago",
    imageUrl: "https://images.unsplash.com/photo-1599583238647-75059eb77508?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: "2",
    title: "World Club Challenge: Super League Champions Ready for Showdown",
    summary: "The stage is set for a massive clash between the hemispheres' best as Wigan prepares to host the NRL premiers.",
    category: "Super League",
    timestamp: "3 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: "3",
    title: "State of Origin: Team Lists Announced for Game I",
    summary: "Shock selections and big omissions headline the team announcements for the series opener.",
    category: "State of Origin",
    timestamp: "5 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1628891890463-8588041068aa?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: "4",
    title: "Transfer Market: Star Fullback Signs Huge Extension",
    summary: "One of the game's most electrifying talents has committed his future to the club with a new 5-year deal.",
    category: "NRL",
    timestamp: "10 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: "5",
    title: "Championship Showdown: Bradford Bulls Eye Promotion Push",
    summary: "The Bulls' impressive form continues as they secure a vital win over Featherstone in a thrilling encounter.",
    category: "Championship",
    timestamp: "2 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: "6",
    title: "PNG Digicel Cup: Tigers Edge Gurias in Thriller",
    summary: "A last-minute try seals the victory for Lae Snax Tigers in an action-packed match at National Football Stadium.",
    category: "PNG Digicel Cup",
    timestamp: "30 minutes ago",
    imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=1000",
  },
];

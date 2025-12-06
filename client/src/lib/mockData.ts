import { Trophy, Timer, Calendar, Activity, Flame } from "lucide-react";

export type GameStatus = "Live" | "Final" | "Upcoming";

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
  possession: [number, number]; // home, away
  completion: [number, number];
  errors: [number, number];
  tackles: [number, number];
}

export interface Game {
  id: string;
  league: "NRL" | "Super League" | "State of Origin" | "International";
  status: GameStatus;
  time: string;
  homeTeam: Team;
  awayTeam: Team;
  isHot?: boolean;
  // Detailed Data
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
];

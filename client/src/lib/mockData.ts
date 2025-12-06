import { Trophy, Timer, Calendar, Activity, Flame } from "lucide-react";

export type GameStatus = "Live" | "Final" | "Upcoming";

export interface Team {
  name: string;
  abbreviation: string;
  logoColor: string;
  score?: number;
}

export interface Game {
  id: string;
  league: "NRL" | "Super League" | "State of Origin" | "International";
  status: GameStatus;
  time: string; // e.g., "H2 15:00", "Final", "Today 7:00 PM"
  homeTeam: Team;
  awayTeam: Team;
  isHot?: boolean;
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
    time: "H2 15:32",
    isHot: true,
    homeTeam: { name: "Penrith Panthers", abbreviation: "PEN", logoColor: "bg-neutral-900 border border-pink-500 text-pink-500", score: 18 },
    awayTeam: { name: "Brisbane Broncos", abbreviation: "BRI", logoColor: "bg-yellow-900 border border-yellow-500 text-yellow-400", score: 12 },
  },
  {
    id: "2",
    league: "Super League",
    status: "Live",
    time: "H1 32:00",
    homeTeam: { name: "Wigan Warriors", abbreviation: "WIG", logoColor: "bg-red-700 text-white", score: 6 },
    awayTeam: { name: "St Helens", abbreviation: "STH", logoColor: "bg-white border border-red-600 text-red-600", score: 4 },
  },
  {
    id: "3",
    league: "NRL",
    status: "Upcoming",
    time: "Today 7:50 PM",
    homeTeam: { name: "Melbourne Storm", abbreviation: "MEL", logoColor: "bg-purple-800 text-yellow-400" },
    awayTeam: { name: "Sydney Roosters", abbreviation: "SYD", logoColor: "bg-blue-900 border border-red-600 text-white" },
  },
  {
    id: "4",
    league: "International",
    status: "Final",
    time: "Final",
    homeTeam: { name: "Australia", abbreviation: "AUS", logoColor: "bg-green-700 text-yellow-400", score: 30 },
    awayTeam: { name: "New Zealand", abbreviation: "NZL", logoColor: "bg-black border border-white text-white", score: 10 },
  },
  {
    id: "5",
    league: "State of Origin",
    status: "Upcoming",
    time: "Wed 8:05 PM",
    homeTeam: { name: "New South Wales", abbreviation: "NSW", logoColor: "bg-sky-600 text-white" },
    awayTeam: { name: "Queensland", abbreviation: "QLD", logoColor: "bg-red-800 text-white" },
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

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
  sport: "Basketball" | "Football" | "Soccer" | "Baseball";
  status: GameStatus;
  time: string; // e.g., "Q4 2:30", "Final", "Today 7:00 PM"
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
    sport: "Basketball",
    status: "Live",
    time: "Q4 4:12",
    isHot: true,
    homeTeam: { name: "Los Angeles Lakers", abbreviation: "LAL", logoColor: "bg-purple-600", score: 108 },
    awayTeam: { name: "Golden State Warriors", abbreviation: "GSW", logoColor: "bg-yellow-500", score: 105 },
  },
  {
    id: "2",
    sport: "Soccer",
    status: "Live",
    time: "72'",
    homeTeam: { name: "Manchester City", abbreviation: "MCI", logoColor: "bg-sky-400", score: 2 },
    awayTeam: { name: "Liverpool", abbreviation: "LIV", logoColor: "bg-red-600", score: 2 },
  },
  {
    id: "3",
    sport: "Football",
    status: "Upcoming",
    time: "Today 8:15 PM",
    homeTeam: { name: "Kansas City Chiefs", abbreviation: "KC", logoColor: "bg-red-600" },
    awayTeam: { name: "Baltimore Ravens", abbreviation: "BAL", logoColor: "bg-violet-800" },
  },
  {
    id: "4",
    sport: "Basketball",
    status: "Final",
    time: "Final",
    homeTeam: { name: "Boston Celtics", abbreviation: "BOS", logoColor: "bg-green-600", score: 112 },
    awayTeam: { name: "Miami Heat", abbreviation: "MIA", logoColor: "bg-red-500", score: 101 },
  },
  {
    id: "5",
    sport: "Soccer",
    status: "Final",
    time: "Final",
    homeTeam: { name: "Real Madrid", abbreviation: "RMA", logoColor: "bg-neutral-100 text-black", score: 3 },
    awayTeam: { name: "Barcelona", abbreviation: "BAR", logoColor: "bg-blue-700", score: 1 },
  },
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Star Player Breaks Season Scoring Record in Thrilling Overtime Victory",
    summary: "In a game for the ages, the veteran guard dropped 52 points to secure a crucial playoff seed.",
    category: "Basketball",
    timestamp: "2 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: "2",
    title: "Transfer Deadline Day: Top 5 Signings to Watch",
    summary: "As the window closes, clubs are scrambling to finalize deals. Here are the biggest moves happening right now.",
    category: "Soccer",
    timestamp: "4 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0565c71?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: "3",
    title: "Championship Sunday: Previewing the Big Matchup",
    summary: "Two defensive powerhouses collide this weekend. We break down the key stats and player matchups.",
    category: "Football",
    timestamp: "6 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1000",
  },
  {
    id: "4",
    title: "New League Rules Announced for Next Season",
    summary: "Officials have confirmed changes to overtime rules and roster limits starting next year.",
    category: "General",
    timestamp: "12 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1000",
  },
];

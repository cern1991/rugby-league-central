import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { LOCAL_TEAMS } from "@shared/localTeams";

export interface TeamTheme {
  id: string;
  name: string;
  league: string;
  previewColor: string;
  logo?: string | null;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const LOCAL_TEAM_LOGOS = LOCAL_TEAMS.reduce<Record<string, string | null>>((acc, team) => {
  const slug = slugify(team.name);
  if (!acc[slug]) {
    acc[slug] = team.logo;
  }
  return acc;
}, {});

const BASE_TEAM_THEMES: (Omit<TeamTheme, "logo"> & { logo?: string | null })[] = [
  { id: "default", name: "Default Dark", league: "System", previewColor: "bg-slate-900" },
  // NRL Teams (17 teams)
  { id: "brisbane-broncos", name: "Brisbane Broncos", league: "NRL", previewColor: "bg-yellow-500" },
  { id: "canberra-raiders", name: "Canberra Raiders", league: "NRL", previewColor: "bg-lime-500" },
  { id: "canterbury-bulldogs", name: "Canterbury Bulldogs", league: "NRL", previewColor: "bg-blue-600" },
  { id: "cronulla-sharks", name: "Cronulla Sharks", league: "NRL", previewColor: "bg-sky-400" },
  { id: "dolphins", name: "Dolphins", league: "NRL", previewColor: "bg-red-500" },
  { id: "gold-coast-titans", name: "Gold Coast Titans", league: "NRL", previewColor: "bg-cyan-400" },
  { id: "manly-sea-eagles", name: "Manly Sea Eagles", league: "NRL", previewColor: "bg-rose-800" },
  { id: "melbourne-storm", name: "Melbourne Storm", league: "NRL", previewColor: "bg-purple-500" },
  { id: "newcastle-knights", name: "Newcastle Knights", league: "NRL", previewColor: "bg-blue-700" },
  { id: "nz-warriors", name: "New Zealand Warriors", league: "NRL", previewColor: "bg-slate-600" },
  { id: "nth-qld-cowboys", name: "North Queensland Cowboys", league: "NRL", previewColor: "bg-yellow-600" },
  { id: "parramatta-eels", name: "Parramatta Eels", league: "NRL", previewColor: "bg-yellow-400" },
  { id: "penrith-panthers", name: "Penrith Panthers", league: "NRL", previewColor: "bg-pink-500" },
  { id: "south-sydney-rabbitohs", name: "South Sydney Rabbitohs", league: "NRL", previewColor: "bg-green-600" },
  { id: "st-george-dragons", name: "St George Illawarra Dragons", league: "NRL", previewColor: "bg-red-600" },
  { id: "sydney-roosters", name: "Sydney Roosters", league: "NRL", previewColor: "bg-red-500" },
  { id: "wests-tigers", name: "Wests Tigers", league: "NRL", previewColor: "bg-orange-500" },
  // Super League Teams (14 teams for 2026)
  { id: "bradford-bulls", name: "Bradford Bulls", league: "Super League", previewColor: "bg-amber-600" },
  { id: "castleford-tigers", name: "Castleford Tigers", league: "Super League", previewColor: "bg-amber-500" },
  { id: "catalans-dragons", name: "Catalans Dragons", league: "Super League", previewColor: "bg-amber-500" },
  { id: "huddersfield-giants", name: "Huddersfield Giants", league: "Super League", previewColor: "bg-blue-900" },
  { id: "hull-fc", name: "Hull FC", league: "Super League", previewColor: "bg-slate-800" },
  { id: "hull-kr", name: "Hull Kingston Rovers", league: "Super League", previewColor: "bg-red-700" },
  { id: "leeds-rhinos", name: "Leeds Rhinos", league: "Super League", previewColor: "bg-amber-400" },
  { id: "leigh-leopards", name: "Leigh Leopards", league: "Super League", previewColor: "bg-red-800" },
  { id: "st-helens", name: "St Helens", league: "Super League", previewColor: "bg-red-600" },
  { id: "toulouse-olympique", name: "Toulouse Olympique", league: "Super League", previewColor: "bg-red-500" },
  { id: "wakefield-trinity", name: "Wakefield Trinity", league: "Super League", previewColor: "bg-blue-500" },
  { id: "warrington-wolves", name: "Warrington Wolves", league: "Super League", previewColor: "bg-blue-400" },
  { id: "wigan-warriors", name: "Wigan Warriors", league: "Super League", previewColor: "bg-rose-600" },
  { id: "york-knights", name: "York Knights", league: "Super League", previewColor: "bg-blue-600" },
  // Championship Teams (13 teams for 2025)
  { id: "barrow-raiders", name: "Barrow Raiders", league: "Championship", previewColor: "bg-blue-800" },
  { id: "batley-bulldogs", name: "Batley Bulldogs", league: "Championship", previewColor: "bg-fuchsia-700" },
  { id: "doncaster", name: "Doncaster", league: "Championship", previewColor: "bg-blue-500" },
  { id: "featherstone-rovers", name: "Featherstone Rovers", league: "Championship", previewColor: "bg-blue-700" },
  { id: "halifax-panthers", name: "Halifax Panthers", league: "Championship", previewColor: "bg-blue-950" },
  { id: "hunslet", name: "Hunslet", league: "Championship", previewColor: "bg-green-700" },
  { id: "london-broncos", name: "London Broncos", league: "Championship", previewColor: "bg-blue-500" },
  { id: "oldham", name: "Oldham", league: "Championship", previewColor: "bg-red-700" },
  { id: "sheffield-eagles", name: "Sheffield Eagles", league: "Championship", previewColor: "bg-amber-500" },
  { id: "widnes-vikings", name: "Widnes Vikings", league: "Championship", previewColor: "bg-slate-700" },
  // State of Origin
  { id: "new-south-wales", name: "NSW Blues", league: "State of Origin", previewColor: "bg-sky-500" },
  { id: "queensland", name: "QLD Maroons", league: "State of Origin", previewColor: "bg-rose-800" },
  // International
  { id: "australia", name: "Australia", league: "International", previewColor: "bg-green-600" },
  { id: "new-zealand", name: "New Zealand", league: "International", previewColor: "bg-neutral-800" },
  { id: "england", name: "England", league: "International", previewColor: "bg-white" },
  { id: "fiji", name: "Fiji", league: "International", previewColor: "bg-sky-400" },
  { id: "samoa", name: "Samoa", league: "International", previewColor: "bg-blue-700" },
  { id: "tonga", name: "Tonga", league: "International", previewColor: "bg-red-700" },
  { id: "papua-new-guinea", name: "Papua New Guinea", league: "International", previewColor: "bg-red-600" },
];

export const TEAM_THEMES: TeamTheme[] = BASE_TEAM_THEMES.map((theme) => ({
  ...theme,
  logo: theme.logo ?? LOCAL_TEAM_LOGOS[theme.id] ?? null,
}));

export const AVAILABLE_TEAMS = [
  // NRL - All 17 teams
  { name: "Brisbane Broncos", league: "NRL", themeId: "brisbane-broncos" },
  { name: "Canberra Raiders", league: "NRL", themeId: "canberra-raiders" },
  { name: "Canterbury Bulldogs", league: "NRL", themeId: "canterbury-bulldogs" },
  { name: "Cronulla Sharks", league: "NRL", themeId: "cronulla-sharks" },
  { name: "Dolphins", league: "NRL", themeId: "dolphins" },
  { name: "Gold Coast Titans", league: "NRL", themeId: "gold-coast-titans" },
  { name: "Manly Sea Eagles", league: "NRL", themeId: "manly-sea-eagles" },
  { name: "Melbourne Storm", league: "NRL", themeId: "melbourne-storm" },
  { name: "Newcastle Knights", league: "NRL", themeId: "newcastle-knights" },
  { name: "New Zealand Warriors", league: "NRL", themeId: "nz-warriors" },
  { name: "North Queensland Cowboys", league: "NRL", themeId: "nth-qld-cowboys" },
  { name: "Parramatta Eels", league: "NRL", themeId: "parramatta-eels" },
  { name: "Penrith Panthers", league: "NRL", themeId: "penrith-panthers" },
  { name: "South Sydney Rabbitohs", league: "NRL", themeId: "south-sydney-rabbitohs" },
  { name: "St George Illawarra Dragons", league: "NRL", themeId: "st-george-dragons" },
  { name: "Sydney Roosters", league: "NRL", themeId: "sydney-roosters" },
  { name: "Wests Tigers", league: "NRL", themeId: "wests-tigers" },
  // Super League - 14 teams (2026 season)
  { name: "Bradford Bulls", league: "Super League", themeId: "bradford-bulls" },
  { name: "Castleford Tigers", league: "Super League", themeId: "castleford-tigers" },
  { name: "Catalans Dragons", league: "Super League", themeId: "catalans-dragons" },
  { name: "Huddersfield Giants", league: "Super League", themeId: "huddersfield-giants" },
  { name: "Hull FC", league: "Super League", themeId: "hull-fc" },
  { name: "Hull Kingston Rovers", league: "Super League", themeId: "hull-kr" },
  { name: "Leeds Rhinos", league: "Super League", themeId: "leeds-rhinos" },
  { name: "Leigh Leopards", league: "Super League", themeId: "leigh-leopards" },
  { name: "St Helens", league: "Super League", themeId: "st-helens" },
  { name: "Toulouse Olympique", league: "Super League", themeId: "toulouse-olympique" },
  { name: "Wakefield Trinity", league: "Super League", themeId: "wakefield-trinity" },
  { name: "Warrington Wolves", league: "Super League", themeId: "warrington-wolves" },
  { name: "Wigan Warriors", league: "Super League", themeId: "wigan-warriors" },
  { name: "York Knights", league: "Super League", themeId: "york-knights" },
  // Championship - 13 teams (2025 season)
  { name: "Barrow Raiders", league: "Championship", themeId: "barrow-raiders" },
  { name: "Batley Bulldogs", league: "Championship", themeId: "batley-bulldogs" },
  { name: "Doncaster", league: "Championship", themeId: "doncaster" },
  { name: "Featherstone Rovers", league: "Championship", themeId: "featherstone-rovers" },
  { name: "Halifax Panthers", league: "Championship", themeId: "halifax-panthers" },
  { name: "Hunslet", league: "Championship", themeId: "hunslet" },
  { name: "London Broncos", league: "Championship", themeId: "london-broncos" },
  { name: "Oldham", league: "Championship", themeId: "oldham" },
  { name: "Sheffield Eagles", league: "Championship", themeId: "sheffield-eagles" },
  { name: "Widnes Vikings", league: "Championship", themeId: "widnes-vikings" },
  // State of Origin
  { name: "NSW Blues", league: "State of Origin", themeId: "new-south-wales" },
  { name: "QLD Maroons", league: "State of Origin", themeId: "queensland" },
  // International
  { name: "Australia Kangaroos", league: "International", themeId: "australia" },
  { name: "New Zealand Kiwis", league: "International", themeId: "new-zealand" },
  { name: "England", league: "International", themeId: "england" },
  { name: "Fiji Bati", league: "International", themeId: "fiji" },
  { name: "Samoa", league: "International", themeId: "samoa" },
  { name: "Tonga", league: "International", themeId: "tonga" },
  { name: "Papua New Guinea Kumuls", league: "International", themeId: "papua-new-guinea" },
];

interface ThemeContextType {
  currentTheme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = "rlc-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const resolveThemePreference = (theme?: string | null) => {
    if (!theme || theme === "default" || theme === "light") {
      return "dark";
    }
    return theme;
  };

  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return resolveThemePreference(stored);
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  const setTheme = (theme: string) => {
    const resolved = resolveThemePreference(theme);
    setCurrentTheme(resolved);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, resolved);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

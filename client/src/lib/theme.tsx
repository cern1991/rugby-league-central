import { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuth } from "./auth";

export interface TeamTheme {
  id: string;
  name: string;
  league: string;
  previewColor: string;
}

export const TEAM_THEMES: TeamTheme[] = [
  { id: "default", name: "Default Blue", league: "System", previewColor: "bg-blue-500" },
  { id: "penrith-panthers", name: "Penrith Panthers", league: "NRL", previewColor: "bg-pink-500" },
  { id: "brisbane-broncos", name: "Brisbane Broncos", league: "NRL", previewColor: "bg-yellow-500" },
  { id: "melbourne-storm", name: "Melbourne Storm", league: "NRL", previewColor: "bg-purple-500" },
  { id: "sydney-roosters", name: "Sydney Roosters", league: "NRL", previewColor: "bg-red-500" },
  { id: "wigan-warriors", name: "Wigan Warriors", league: "Super League", previewColor: "bg-rose-600" },
  { id: "st-helens", name: "St Helens", league: "Super League", previewColor: "bg-red-600" },
  { id: "new-south-wales", name: "NSW Blues", league: "State of Origin", previewColor: "bg-sky-500" },
  { id: "queensland", name: "QLD Maroons", league: "State of Origin", previewColor: "bg-rose-800" },
  { id: "australia", name: "Australia", league: "International", previewColor: "bg-green-600" },
  { id: "new-zealand", name: "New Zealand", league: "International", previewColor: "bg-neutral-800" },
  { id: "catalans-dragons", name: "Catalans Dragons", league: "Super League", previewColor: "bg-amber-500" },
  { id: "leeds-rhinos", name: "Leeds Rhinos", league: "Super League", previewColor: "bg-amber-400" },
];

export const AVAILABLE_TEAMS = [
  { name: "Penrith Panthers", league: "NRL", themeId: "penrith-panthers" },
  { name: "Brisbane Broncos", league: "NRL", themeId: "brisbane-broncos" },
  { name: "Melbourne Storm", league: "NRL", themeId: "melbourne-storm" },
  { name: "Sydney Roosters", league: "NRL", themeId: "sydney-roosters" },
  { name: "South Sydney Rabbitohs", league: "NRL", themeId: "default" },
  { name: "Parramatta Eels", league: "NRL", themeId: "default" },
  { name: "Canterbury Bulldogs", league: "NRL", themeId: "default" },
  { name: "Cronulla Sharks", league: "NRL", themeId: "default" },
  { name: "Manly Sea Eagles", league: "NRL", themeId: "default" },
  { name: "Newcastle Knights", league: "NRL", themeId: "default" },
  { name: "Gold Coast Titans", league: "NRL", themeId: "default" },
  { name: "New Zealand Warriors", league: "NRL", themeId: "default" },
  { name: "Wigan Warriors", league: "Super League", themeId: "wigan-warriors" },
  { name: "St Helens", league: "Super League", themeId: "st-helens" },
  { name: "Leeds Rhinos", league: "Super League", themeId: "leeds-rhinos" },
  { name: "Catalans Dragons", league: "Super League", themeId: "catalans-dragons" },
  { name: "Warrington Wolves", league: "Super League", themeId: "default" },
  { name: "Hull FC", league: "Super League", themeId: "default" },
  { name: "Hull KR", league: "Super League", themeId: "default" },
  { name: "Castleford Tigers", league: "Super League", themeId: "default" },
  { name: "NSW Blues", league: "State of Origin", themeId: "new-south-wales" },
  { name: "QLD Maroons", league: "State of Origin", themeId: "queensland" },
  { name: "Australia Kangaroos", league: "International", themeId: "australia" },
  { name: "New Zealand Kiwis", league: "International", themeId: "new-zealand" },
  { name: "England", league: "International", themeId: "default" },
  { name: "Fiji", league: "International", themeId: "default" },
  { name: "Samoa", league: "International", themeId: "default" },
  { name: "Tonga", league: "International", themeId: "default" },
];

interface ThemeContextType {
  currentTheme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const currentTheme = user?.themePreference || "default";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  const setTheme = (theme: string) => {
    document.documentElement.setAttribute("data-theme", theme);
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

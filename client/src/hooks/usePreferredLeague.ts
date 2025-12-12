import { useCallback, useEffect, useState } from "react";
import { FEATURED_LEAGUES } from "@shared/schema";

const STORAGE_KEY = "rlc.preferredLeague";
const DEFAULT_LEAGUE =
  FEATURED_LEAGUES.find((league) => league.id === "NRL")?.id ||
  FEATURED_LEAGUES[0]?.id ||
  "NRL";
const VALID_LEAGUE_IDS = new Set(FEATURED_LEAGUES.map((league) => league.id));

function readStoredLeague() {
  if (typeof window === "undefined") return DEFAULT_LEAGUE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_LEAGUE_IDS.has(stored)) {
    return stored;
  }
  return DEFAULT_LEAGUE;
}

export function usePreferredLeague() {
  const [selectedLeague, setSelectedLeagueState] = useState<string>(() => readStoredLeague());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, selectedLeague);
  }, [selectedLeague]);

  const setSelectedLeague = useCallback((leagueId: string) => {
    setSelectedLeagueState(VALID_LEAGUE_IDS.has(leagueId) ? leagueId : DEFAULT_LEAGUE);
  }, []);

  return { selectedLeague, setSelectedLeague };
}

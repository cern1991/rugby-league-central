import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Game } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  const hour = match[1].padStart(2, "0");
  const minute = match[2];
  return `${hour}:${minute}`;
}

const normalizeName = (value?: string | null) =>
  (value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const TEAM_NAME_ALIASES: Record<string, string> = {
  hullkr: "hullkingstonrovers",
};

const normalizeTeamName = (value?: string | null) => {
  const normalized = normalizeName(value);
  return TEAM_NAME_ALIASES[normalized] || normalized;
};

const computeGameTimestamp = (game: Game) => {
  if (typeof game.timestamp === "number") return game.timestamp;
  if (!game.date) return Number.MAX_SAFE_INTEGER;
  const fallbackTime = game.time && game.time.length >= 5 ? game.time : "00:00:00";
  const date = new Date(`${game.date}T${fallbackTime}`);
  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
};

const hasBothLogos = (game: Game) =>
  Boolean(game.teams?.home?.logo && game.teams?.away?.logo);

/**
 * Deduplicate fixture lists that can contain multiple entries for the same
 * matchup (e.g. \"Hull KR\" vs \"Hull Kingston Rovers\").
 */
export function dedupeGames(games: Game[] = []) {
  const map = new Map<string, Game>();
  for (const game of games) {
    if (!game) continue;
    const key = [
      game.date || "unknown-date",
      normalizeTeamName(game.teams?.home?.name),
      normalizeTeamName(game.teams?.away?.name),
    ].join("|");

    const existing = map.get(key);
    if (!existing) {
      map.set(key, game);
      continue;
    }

    const candidateHasLogos = hasBothLogos(game);
    const existingHasLogos = hasBothLogos(existing);
    if (candidateHasLogos && !existingHasLogos) {
      map.set(key, game);
      continue;
    }

    if (computeGameTimestamp(game) < computeGameTimestamp(existing)) {
      map.set(key, game);
    }
  }

  return Array.from(map.values());
}

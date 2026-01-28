import type { Game } from "@shared/schema";
import {
  buildNrlFixturesFromLocalData,
  buildSuperLeagueFixturesFromLocalData,
  CURRENT_SEASON,
} from "../../server/lib/localData";

const normalizeLeague = (value?: string) => (value || "NRL").toLowerCase();

export default function handler(req: any, res: any) {
  try {
    const { league, season } = req.query as { league?: string; season?: string };
    const normalizedLeague = normalizeLeague(league);
    const requestedSeason = season || CURRENT_SEASON;

    let fixtures: Game[] = [];

    if (requestedSeason === CURRENT_SEASON) {
      if (normalizedLeague.includes("super")) {
        fixtures = buildSuperLeagueFixturesFromLocalData();
      } else {
        fixtures = buildNrlFixturesFromLocalData();
      }
    }

    return res.status(200).json({ response: fixtures });
  } catch (error: any) {
    console.error("Serverless fixtures error:", error);
    return res
      .status(500)
      .json({ message: error?.message || "Failed to load fixtures" });
  }
}

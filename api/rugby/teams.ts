import { LOCAL_TEAMS } from "../../shared/localTeams.js";

export const config = {
  runtime: "nodejs",
};

type RequestLike = {
  query: Record<string, string | string[]>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: any) => void;
};

const getQueryValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const getLocalTeams = (teams: Array<{ league: string }>, league?: string) => {
  if (!league) return teams;
  const leagueLower = league.toLowerCase();
  if (leagueLower.includes("super")) {
    return teams.filter((team) => team.league === "Super League");
  }
  if (leagueLower.includes("nrl") || leagueLower.includes("national")) {
    return teams.filter((team) => team.league === "NRL");
  }
  return teams.filter((team) => team.league === league);
};

export default function handler(req: RequestLike, res: ResponseLike) {
  try {
    const league = getQueryValue(req.query.league);
    const teams = getLocalTeams(LOCAL_TEAMS, league);
    return res.status(200).json({ response: teams });
  } catch (error: any) {
    console.error("Serverless teams error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to load teams",
      response: [],
    });
  }
}

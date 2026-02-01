import { FEATURED_LEAGUES } from "@shared/schema";

const SITE_LOGO = "/logo.svg";
function getLeagueLogoFromContext(context?: string) {
  if (!context) return SITE_LOGO;
  const normalized = context.toLowerCase();
  const match = FEATURED_LEAGUES.find((league) => {
    const id = league.id.toLowerCase();
    const name = league.name.toLowerCase();
    const shortName = league.shortName.toLowerCase();
    return (
      normalized.includes(id) ||
      normalized.includes(name) ||
      normalized.includes(shortName)
    );
  });
  return match?.logo || SITE_LOGO;
}

export function resolveNewsThumbnail(image?: string | null, league?: string) {
  const normalizedLeague = league?.toLowerCase() || "";
  if (normalizedLeague.includes("nrl")) {
    return getLeagueLogoFromContext("NRL");
  }
  if (normalizedLeague.includes("super")) {
    return getLeagueLogoFromContext("Super League");
  }
  return getLeagueLogoFromContext(league);
}

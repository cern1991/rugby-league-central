import { FEATURED_LEAGUES } from "@shared/schema";

const SITE_LOGO = "/logo.svg";
const GENERIC_GOOGLE_NEWS_PATTERNS = [
  /newsstatic\.google/i,
  /news\.google\./i,
  /googleusercontent/i,
];

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

function isGenericGoogleThumbnail(image?: string | null) {
  if (!image) return false;
  return GENERIC_GOOGLE_NEWS_PATTERNS.some((pattern) => pattern.test(image));
}

export function resolveNewsThumbnail(image?: string | null, league?: string) {
  if (image && !isGenericGoogleThumbnail(image)) {
    return image;
  }
  return getLeagueLogoFromContext(league);
}

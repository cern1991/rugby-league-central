import type { NewsItem } from "@shared/schema";

const ARTICLE_CACHE_PREFIX = "rlc.newsArticle:";

export function encodeNewsLink(link: string) {
  return encodeURIComponent(link);
}

export function decodeNewsLinkParam(param?: string) {
  if (!param) return "";
  try {
    return decodeURIComponent(param);
  } catch {
    return "";
  }
}

function getArticleCacheKey(link: string) {
  return `${ARTICLE_CACHE_PREFIX}${encodeNewsLink(link)}`;
}

export function cacheNewsArticle(link: string, article: NewsItem) {
  if (typeof window === "undefined" || !link) return;
  try {
    window.sessionStorage.setItem(getArticleCacheKey(link), JSON.stringify(article));
  } catch {
    // ignore storage errors
  }
}

export function getCachedNewsArticle(link: string): NewsItem | null {
  if (typeof window === "undefined" || !link) return null;
  try {
    const raw = window.sessionStorage.getItem(getArticleCacheKey(link));
    return raw ? (JSON.parse(raw) as NewsItem) : null;
  } catch {
    return null;
  }
}


import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { usePreferredLeague } from "@/hooks/usePreferredLeague";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { decodeNewsLinkParam, encodeNewsLink, getCachedNewsArticle, cacheNewsArticle } from "@/lib/news";
import type { NewsItem } from "@shared/schema";
import { ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";

interface ArticleContentResponse {
  html?: string;
  finalUrl?: string;
}

export default function NewsArticle() {
  const [, params] = useRoute("/news/article/:encoded");
  const encodedParam = params?.encoded ?? "";
  const articleUrl = useMemo(() => decodeNewsLinkParam(encodedParam), [encodedParam]);
  const { selectedLeague } = usePreferredLeague();

  const { data: newsData, isLoading } = useQuery<{ response: NewsItem[] }>({
    enabled: Boolean(selectedLeague),
    queryKey: ["news", selectedLeague],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/news?league=${encodeURIComponent(selectedLeague)}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const cached = useMemo(() => getCachedNewsArticle(articleUrl), [articleUrl]);
  const encodedArticleUrl = useMemo(() => encodeNewsLink(articleUrl || ""), [articleUrl]);

  const article = useMemo(() => {
    if (!articleUrl) return null;
    if (cached) return cached;
    const list = newsData?.response || [];
    return list.find((item) => encodeNewsLink(item.link) === encodeNewsLink(articleUrl)) || null;
  }, [articleUrl, cached, newsData]);

  useEffect(() => {
    if (article && articleUrl) {
      cacheNewsArticle(articleUrl, article);
    }
  }, [article, articleUrl]);

  const relatedArticles = useMemo(() => {
    const list = newsData?.response || [];
    return list
      .filter((item) => item.link && encodeNewsLink(item.link) !== encodedArticleUrl)
      .slice(0, 5);
  }, [newsData, encodedArticleUrl]);

  const displayTitle = article?.title || "News Article";
  const displaySource = article?.source || extractDomain(articleUrl) || "Source";
  const {
    data: articleContent,
    isLoading: articleLoading,
    isError: articleError,
  } = useQuery<ArticleContentResponse>({
    enabled: Boolean(articleUrl),
    queryKey: ["news-article", articleUrl],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/news/article?url=${encodeURIComponent(articleUrl)}`);
      if (!res.ok) throw new Error("Failed to load article");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Layout>
      <SEO
        title={`${displayTitle} | Rugby League News`}
        description={`Read the latest rugby league news article: ${displayTitle}`}
        type="article"
      />
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/news" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to News
          </Link>
          <span className="text-muted-foreground text-sm">{displaySource}</span>
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold mb-2">{displayTitle}</h1>
          {article?.pubDate && (
            <p className="text-sm text-muted-foreground">
              Published: {article.pubDate}
            </p>
          )}
        </div>

        <div className="bg-muted/20 border border-border rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            You're viewing this article directly on Rugby League Central.
            The content remains the property of {displaySource}. Please visit the original site to support their journalism.
          </p>
          {articleUrl && (
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Read on {displaySource}
            </a>
          )}
        </div>

        {article?.image && (
          <div className="rounded-2xl border border-border overflow-hidden bg-muted flex items-center justify-center">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-64 md:h-80 object-contain"
            />
          </div>
        )}

        <div className={relatedArticles.length > 0 ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" : ""}>
          <div>
            {!articleUrl ? (
              <div className="border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                <p>We couldn't determine the article link. Please return to the news list and try again.</p>
              </div>
            ) : articleLoading ? (
              <div className="border border-border rounded-xl p-6 space-y-4">
                <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                <div className="h-80 bg-muted animate-pulse rounded-xl" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
              </div>
            ) : articleError ? (
              <div className="border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                <p>We couldn't load the article preview. Please use the source link above.</p>
              </div>
            ) : (
              <ArticleFrame
                html={articleContent?.html}
                finalUrl={articleContent?.finalUrl || articleUrl}
                fallbackUrl={articleUrl}
              />
            )}
          </div>

          {relatedArticles.length > 0 && (
            <aside className="bg-card border border-border rounded-xl p-4 h-fit lg:sticky lg:top-28">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">More articles</p>
                  <h3 className="font-semibold text-lg">Keep reading</h3>
                </div>
              </div>
              <div className="space-y-4">
                {relatedArticles.map((item, index) => {
                  const encodedLink = encodeNewsLink(item.link);
                  return (
                    <Link
                      key={`${encodedLink}-${index}`}
                      href={`/news/article/${encodedLink}`}
                      className="block group"
                      onClick={() => cacheNewsArticle(item.link, item)}
                      aria-label={`Read article: ${item.title}`}
                    >
                      <div className="p-3 rounded-lg border border-border/60 hover:border-primary/50 transition-all bg-background/40 group-hover:bg-background/80">
                        <div className="flex gap-3">
                          {item.image && (
                            <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                              {item.title}
                            </p>
                            <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                              <span>{item.source || extractDomain(item.link)}</span>
                              {item.pubDate && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                  <span>{item.pubDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </aside>
          )}
        </div>
      </div>
    </Layout>
  );
}

function ArticleFrame({ html, finalUrl, fallbackUrl }: { html?: string; finalUrl: string; fallbackUrl: string }) {
  if (!html) {
    return (
      <div className="border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
        <p>This publisher blocks embedded previews. Please open the article directly: </p>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary font-medium mt-3 hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          View original article
        </a>
      </div>
    );
  }

  const doc = buildSrcDoc(html, finalUrl);

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="bg-muted/50 border-b border-border px-4 py-2 text-sm text-muted-foreground">
        Embedded article preview
      </div>
      <iframe
        srcDoc={doc}
        title="News article"
        className="w-full min-h-[70vh] bg-white"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
      />
      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
        Some publishers block embedding assets. Use the source link above if anything looks incorrect.
      </div>
    </div>
  );
}

function extractDomain(url?: string) {
  if (!url) return "";
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function buildSrcDoc(html: string, baseUrl?: string) {
  const baseTag = baseUrl ? `<base href="${escapeHtml(baseUrl)}">` : "";
  return `<!doctype html><html><head><meta charset="utf-8">${baseTag}<style>body{font-family:system-ui,sans-serif;padding:1.5rem;background:#fff;color:#111;} img{max-width:100%;height:auto;}</style></head><body>${html}</body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

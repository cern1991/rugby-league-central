import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Newspaper, RefreshCw } from "lucide-react";
import { NewsItem, FEATURED_LEAGUES } from "@shared/schema";
import LeagueFilter from "@/components/LeagueFilter";
import { Link } from "wouter";
import { encodeNewsLink, cacheNewsArticle } from "@/lib/news";
import { usePreferredLeague } from "@/hooks/usePreferredLeague";

export default function News() {
  const { selectedLeague, setSelectedLeague } = usePreferredLeague();

  const { data: newsData, isLoading, refetch, isFetching } = useQuery<{ response: NewsItem[] }>({
    queryKey: ["news", selectedLeague],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/news?league=${encodeURIComponent(selectedLeague)}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    refetchInterval: 300000,
  });

  const news = newsData?.response || [];
  const displayLeagueName = FEATURED_LEAGUES.find(l => l.id === selectedLeague)?.name || selectedLeague;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
              <Newspaper className="w-8 h-8 text-primary" />
              Rugby League News
            </h1>
            <p className="text-muted-foreground mt-1">Latest news from {displayLeagueName}</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className={cn(
              "flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors",
              isFetching && "opacity-50 cursor-not-allowed"
            )}
            data-testid="button-refresh"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* League Filter Buttons - Always Visible */}
        <LeagueFilter selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} />

        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <h3 className="font-bold mb-2 text-sm">Auto-Refresh</h3>
          <p className="text-sm text-muted-foreground">
            News is automatically updated every 5 minutes. Click refresh to get the latest articles now.
          </p>
        </div>

        <div>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-6">
                    <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : news.length > 0 ? (
              <div className="space-y-4">
                {news.map((item, index) => {
                  const encodedLink = item.link ? encodeNewsLink(item.link) : "";
                  const content = (
                    <article 
                      className={cn(
                        "group bg-card border border-border rounded-xl p-4 sm:p-6 transition-all",
                        item.link && "hover:border-primary/50 hover:shadow-lg cursor-pointer"
                      )}
                      data-testid={`card-news-${index}`}
                    >
                      <div className="flex gap-4">
                        {item.image && (
                          <div className="w-32 h-24 sm:w-40 sm:h-28 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h2 className="font-semibold text-lg line-clamp-3 mb-2">
                            {item.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{item.source}</span>
                            {item.pubDate && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                <span>{item.pubDate}</span>
                              </>
                            )}
                          </div>
                          {item.league && (
                            <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wide">{item.league}</p>
                          )}
                        </div>
                      </div>
                    </article>
                  );

                  if (!item.link) {
                    return (
                      <div key={index} className="contents">
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={index}
                      href={`/news/article/${encodedLink}`}
                      className="block"
                      onClick={() => cacheNewsArticle(item.link, item)}
                      aria-label={`Read article: ${item.title}`}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
                <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium text-lg mb-2">No News Available</h3>
                <p>Check back later for the latest {displayLeagueName} news</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
  );
}

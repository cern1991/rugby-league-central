import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Newspaper, ExternalLink, Filter, X, RefreshCw } from "lucide-react";
import { NewsItem, FEATURED_LEAGUES } from "@shared/schema";

export default function News() {
  const [selectedLeague, setSelectedLeague] = useState<string>("NRL");
  const [showFilters, setShowFilters] = useState(false);

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
          <div className="flex items-center gap-2">
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
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded-lg"
              data-testid="button-toggle-filters"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className={cn(
            "lg:col-span-1 space-y-4",
            showFilters ? "block" : "hidden lg:block"
          )}>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  News Source
                </h3>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden p-1 hover:bg-muted rounded"
                  data-testid="button-close-filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {FEATURED_LEAGUES.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => setSelectedLeague(league.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-all",
                      selectedLeague === league.id 
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    data-testid={`filter-league-${league.shortName.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <span className="text-lg">{league.icon}</span>
                    <div>
                      <div>{league.name}</div>
                      <div className="text-xs text-muted-foreground">{league.country}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold mb-3 text-sm">About</h3>
              <p className="text-sm text-muted-foreground">
                News is automatically updated every 5 minutes. Click refresh to get the latest articles now.
              </p>
            </div>
          </aside>

          <div className="lg:col-span-3">
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
                {news.map((item, index) => (
                  <a 
                    key={index} 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                    data-testid={`link-news-${index}`}
                  >
                    <article 
                      className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                      data-testid={`card-news-${index}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h2 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2 mb-3">
                            {item.title}
                          </h2>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{item.source}</span>
                            {item.pubDate && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                <span>{item.pubDate}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </article>
                  </a>
                ))}
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
      </div>
    </Layout>
  );
}

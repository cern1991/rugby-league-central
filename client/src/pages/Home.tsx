import { Layout } from "@/components/Layout";
import { GlobalSearch } from "@/components/GlobalSearch";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { cn, dedupeGames } from "@/lib/utils";
import { Link } from "wouter";
import { 
  Trophy, 
  ChevronRight, 
  Zap,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  Newspaper
} from "lucide-react";
import { format, parseISO } from "date-fns";
import LeagueFilter from "@/components/LeagueFilter";
import { FEATURED_LEAGUES } from "@shared/schema";
import { LOCAL_TEAMS } from "@shared/localTeams";
import { usePreferredLeague } from "@/hooks/usePreferredLeague";
import { encodeNewsLink, cacheNewsArticle } from "@/lib/news";

const DEFAULT_FIXTURE_SEASON = "2026";
const FEATURED_NEWS_LIMIT = 3;

interface Team {
  id: string;
  name: string;
  logo: string | null;
  league: string;
  country: { name: string };
}

interface Game {
  id: string;
  date: string;
  time: string;
  status: { long: string; short: string };
  league: { name: string };
  teams: {
    home: { id: string; name: string; logo: string | null };
    away: { id: string; name: string; logo: string | null };
  };
  scores: { home: number | null; away: number | null };
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  league?: string;
  image?: string;
}

export default function Home() {
  const { selectedLeague, setSelectedLeague } = usePreferredLeague();
  const [activeTab, setActiveTab] = useState<"teams" | "fixtures" | "news">("teams");
  const { data: teamsData, isLoading: teamsLoading } = useQuery<{ response: Team[] }>({
    queryKey: ["teams", selectedLeague],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/teams?league=${encodeURIComponent(selectedLeague)}`);
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });

  const { data: gamesData, isLoading: gamesLoading } = useQuery<{ response: Game[] }>({
    queryKey: ["fixtures", selectedLeague],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/fixtures?league=${encodeURIComponent(selectedLeague)}&season=${DEFAULT_FIXTURE_SEASON}`);
      if (!res.ok) throw new Error("Failed to fetch fixtures");
      return res.json();
    },
  });

  const { data: newsData, isLoading: newsLoading } = useQuery<{ response: NewsItem[] }>({
    queryKey: ["news", selectedLeague],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/news?league=${encodeURIComponent(selectedLeague)}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
  });

  const teams = teamsData?.response || [];
  const fallbackTeams = LOCAL_TEAMS.filter(team => team.league === selectedLeague);
  const resolvedTeams = useMemo(() => {
    const merged = [...(teamsData?.response || []), ...fallbackTeams];
    const unique = new Map<string, Team>();
    merged.forEach((team: any) => {
      if (team?.id && !unique.has(String(team.id))) {
        unique.set(String(team.id), team);
      }
    });
    return Array.from(unique.values());
  }, [teamsData, fallbackTeams]);
  const games = useMemo(() => dedupeGames(gamesData?.response || []), [gamesData]);
  const news = newsData?.response || [];
  const featuredNews = useMemo(() => news.slice(0, FEATURED_NEWS_LIMIT), [news]);
  
  const upcomingGames = games.filter(g => g.status.short === "NS" || g.status.short === "TBD");
  const completedGames = games.filter(g => g.status.short === "FT" || g.status.short === "AET");
  const liveGames = games.filter(g => g.status.short !== "FT" && g.status.short !== "AET" && g.status.short !== "NS" && g.status.short !== "TBD");

  const displayLeagueName = FEATURED_LEAGUES.find(l => l.id === selectedLeague)?.name || selectedLeague;

  return (
    <Layout>
      <SEO 
        title={`${displayLeagueName} Teams, Scores & News`}
        description={`Follow ${displayLeagueName} rugby league. Get live scores, fixtures, team news, and standings for all ${displayLeagueName} matches and competitions.`}
        keywords={`${displayLeagueName}, rugby league, ${displayLeagueName} scores, ${displayLeagueName} fixtures, ${displayLeagueName} news, ${displayLeagueName} teams, live rugby scores`}
      />
      <div className="space-y-8">
        
        {/* Hero Section */}
        <section className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border border-border/50 p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          
          <div className="relative max-w-3xl space-y-5">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-main-title">
              Rugby League Central
            </h1>
            <div id="hero-global-search" className="max-w-2xl">
              <GlobalSearch />
            </div>
          </div>

        </section>

        {/* League Selector */}
        <section className="bg-card border border-border rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Choose your league</p>
              <h2 className="font-display text-2xl font-bold">Follow a competition</h2>
            </div>
          </div>
          <LeagueFilter selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} />
        </section>

        {/* Featured News */}
        <section className="bg-card border border-border rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Top stories</p>
              <h2 className="font-display text-2xl font-bold">Headline Spotlight</h2>
            </div>
            <Link href="/news" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>

            {newsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: FEATURED_NEWS_LIMIT }).map((_, index) => (
                  <div key={index} className="animate-pulse bg-muted/40 rounded-xl h-32" />
                ))}
              </div>
            ) : featuredNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredNews.map((item, index) => {
                  const encodedLink = item.link ? encodeNewsLink(item.link) : "";
                  const cardContent = (
                    <article
                      className="group relative rounded-xl border border-border bg-gradient-to-b from-background to-card shadow-sm hover:shadow-lg transition-shadow p-4 space-y-3"
                      data-testid={`card-featured-news-${index}`}
                    >
                      <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wide">
                        {item.league || "Rugby League"}
                      </span>
                      <h3 className="font-semibold text-base leading-snug line-clamp-4">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="font-medium">{item.source || "Latest"}</span>
                        {item.pubDate && (
                          <>
                            <span>•</span>
                            <span>{item.pubDate}</span>
                          </>
                        )}
                      </p>
                    </article>
                  );

                  if (!item.link) {
                    return (
                      <div key={index} className="contents">
                        {cardContent}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={index}
                      href={`/news/article/${encodedLink}`}
                      onClick={() => cacheNewsArticle(item.link, item)}
                      aria-label={`Read article: ${item.title}`}
                    >
                      {cardContent}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>No featured news available right now. Check back later.</p>
              </div>
            )}
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filter Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            {/* Quick Stats */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold mb-3 text-sm">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teams</span>
                  <span className="font-medium" data-testid="stat-teams-count">{resolvedTeams.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upcoming</span>
                  <span className="font-medium" data-testid="stat-upcoming-count">{upcomingGames.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium" data-testid="stat-completed-count">{completedGames.length}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
              <div className="lg:hidden">
                <h2 className="font-display text-xl font-bold mb-2">{displayLeagueName}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Use the league picker near the top to explore teams, fixtures, and news.
                </p>
              </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 border-b border-border">
              <button 
                onClick={() => setActiveTab("teams")}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                  activeTab === "teams" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                data-testid="tab-teams"
              >
                <Trophy className="w-4 h-4" />
                Teams
              </button>
              <button 
                onClick={() => setActiveTab("fixtures")}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                  activeTab === "fixtures" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                data-testid="tab-fixtures"
              >
                <Calendar className="w-4 h-4" />
                Fixtures
              </button>
              <button 
                onClick={() => setActiveTab("news")}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                  activeTab === "news" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                data-testid="tab-news"
              >
                <Newspaper className="w-4 h-4" />
                News
              </button>
            </div>

            {/* Teams Tab */}
            {activeTab === "teams" && (
              <div>
                <div className="hidden lg:flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    {displayLeagueName} Teams
                  </h2>
                </div>

                {teamsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-card border border-border rounded-xl p-4">
                          <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-3" />
                          <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
                          <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : resolvedTeams.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {resolvedTeams.map((team) => (
                      <Link key={team.id} href={`/team/${team.id}`} data-testid={`link-team-${team.id}`}>
                        <div 
                          className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group text-center"
                          data-testid={`card-team-${team.id}`}
                        >
                          {team.logo ? (
                            <img 
                              src={team.logo} 
                              alt={team.name} 
                              className="w-16 h-16 object-contain mx-auto mb-3 group-hover:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3 text-lg font-bold text-primary">
                              {team.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {team.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {team.country?.name || displayLeagueName}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No teams found for this league</p>
                    <p className="text-sm mt-2">Try selecting a different league</p>
                  </div>
                )}
              </div>
            )}

            {/* Fixtures Tab */}
            {activeTab === "fixtures" && (
              <div className="space-y-6">
                
                {/* Live Games */}
                {liveGames.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      Live Now
                    </h3>
                    <div className="space-y-2">
                      {liveGames.map(game => (
                        <GameCard key={game.id} game={game} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Games */}
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Upcoming Fixtures
                  </h3>
                  {gamesLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-card border border-border rounded-lg p-4">
                          <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : upcomingGames.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingGames.map(game => (
                        <GameCard key={game.id} game={game} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">No upcoming fixtures found</p>
                  )}
                </div>

                {/* Completed Games */}
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Recent Results
                  </h3>
                  {gamesLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-card border border-border rounded-lg p-4">
                          <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : completedGames.length > 0 ? (
                    <div className="space-y-2">
                      {completedGames.map(game => (
                        <GameCard key={game.id} game={game} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">No recent results found</p>
                  )}
                </div>
              </div>
            )}

            {/* News Tab */}
            {activeTab === "news" && (
              <div>
                <div className="hidden lg:flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-primary" />
                    {displayLeagueName} News
                  </h2>
                </div>

                {newsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-4">
                        <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                        <div className="h-4 bg-muted rounded w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : news.length > 0 ? (
                  <div className="space-y-3">
                    {news.map((item, index) => {
                      const encodedLink = item.link ? encodeNewsLink(item.link) : "";
                      const card = (
                        <div 
                          className={cn(
                            "group bg-card border border-border rounded-xl p-4 transition-all",
                            item.link && "hover:border-primary/50 hover:shadow-lg cursor-pointer"
                          )}
                          data-testid={`card-news-${index}`}
                        >
                          <div className="flex gap-3">
                            {item.image && (
                              <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                                {item.title}
                              </h3>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="font-medium">{item.source}</span>
                                {item.pubDate && (
                                  <>
                                    <span>•</span>
                                    <span>{item.pubDate}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );

                      if (!item.link) {
                        return (
                          <div key={index} className="contents">
                            {card}
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
                          {card}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                    <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No news found for this league</p>
                    <p className="text-sm mt-2">Check back later for updates</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-6" data-testid="card-feature-live">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold">Live Coverage</h3>
                <p className="text-xs text-muted-foreground">Real-time updates</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Get instant score updates from matches across all leagues worldwide.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6" data-testid="card-feature-fixtures">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold">Full Fixtures</h3>
                <p className="text-xs text-muted-foreground">Complete schedules</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              View upcoming matches and past results for every team in the competition.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6" data-testid="card-feature-teams">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold">Team Profiles</h3>
                <p className="text-xs text-muted-foreground">Player rosters</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Explore detailed team pages with player information and match history.
            </p>
          </div>
        </section>

      </div>
    </Layout>
  );
}

function GameCard({ game }: { game: Game }) {
  const isFinished = game.status.short === "FT" || game.status.short === "AET";
  const isLive = game.status.short !== "FT" && game.status.short !== "AET" && game.status.short !== "NS" && game.status.short !== "TBD";
  const gameDate = game.date ? parseISO(game.date) : null;
  const matchHref = `/match/${encodeURIComponent(game.id)}`;

  return (
    <Link href={matchHref} data-testid={`link-game-${game.id}`}>
      <div 
        className={cn(
          "p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer group",
          isLive ? "bg-card border-red-500/50 ring-1 ring-red-500/10" : "bg-card border-border hover:border-primary/50"
        )}
        data-testid={`card-game-${game.id}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 text-center w-14">
              {gameDate && (
                <>
                  <div className="text-xs text-muted-foreground">{format(gameDate, "EEE")}</div>
                  <div className="font-bold text-sm">{format(gameDate, "d MMM")}</div>
                </>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {game.teams.home.logo && (
                  <img src={game.teams.home.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                )}
                <span className="font-medium text-sm truncate">{game.teams.home.name}</span>
                {isFinished && <span className="font-bold text-sm ml-auto">{game.scores.home}</span>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {game.teams.away.logo && (
                  <img src={game.teams.away.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                )}
                <span className="font-medium text-sm truncate">{game.teams.away.name}</span>
                {isFinished && <span className="font-bold text-sm ml-auto">{game.scores.away}</span>}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            {isLive && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            )}
            {!isLive && !isFinished && game.time && (
              <span className="text-xs text-muted-foreground">{game.time}</span>
            )}
            {isFinished && (
              <span className="text-xs text-muted-foreground">{game.status.long}</span>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}

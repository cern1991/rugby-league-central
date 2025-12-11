import { Layout } from "@/components/Layout";
import { TeamSearch } from "@/components/TeamSearch";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { 
  Trophy, 
  ChevronRight, 
  Filter, 
  Zap,
  Calendar,
  TrendingUp,
  X,
  Clock,
  CheckCircle,
  Newspaper,
  ExternalLink
} from "lucide-react";
import { format, parseISO } from "date-fns";
import LeagueFilter from "@/components/LeagueFilter";
import { FEATURED_LEAGUES } from "@shared/schema";

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
}

export default function Home() {
  const [selectedLeague, setSelectedLeague] = useState<string>("NRL");
  const [showFilters, setShowFilters] = useState(false);
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
      const res = await fetch(`/api/rugby/fixtures?league=${encodeURIComponent(selectedLeague)}`);
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
  const games = gamesData?.response || [];
  const news = newsData?.response || [];
  
  const upcomingGames = games.filter(g => g.status.short === "NS" || g.status.short === "TBD").slice(0, 10);
  const completedGames = games.filter(g => g.status.short === "FT" || g.status.short === "AET").slice(0, 10);
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
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border border-border/50 p-8 md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          
          <div className="relative max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                <Zap className="w-3 h-3" />
                Live Scores
              </span>
              <span className="text-xs text-muted-foreground">Updated in real-time</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="text-main-title">
              Rugby League Central
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6 max-w-xl">
              Your complete hub for NRL, Super League, and rugby league competitions worldwide. 
              Track scores, explore teams, and never miss a match.
            </p>

            <div className="max-w-md">
              <TeamSearch />
            </div>
          </div>

          <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 opacity-10 pointer-events-none">
            <Trophy className="w-32 h-32 md:w-48 md:h-48" />
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filter Sidebar */}
          <aside className={cn(
            "lg:col-span-1 space-y-4",
            showFilters ? "block" : "hidden lg:block"
          )}>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    Leagues
                  </h3>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden p-1 hover:bg-muted rounded"
                    data-testid="button-close-leagues"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <LeagueFilter selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold mb-3 text-sm">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teams</span>
                  <span className="font-medium" data-testid="stat-teams-count">{teams.length}</span>
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
            
            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between lg:hidden">
              <h2 className="font-display text-xl font-bold">{displayLeagueName}</h2>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded-lg"
                data-testid="button-toggle-leagues"
              >
                <Trophy className="w-4 h-4" />
                Leagues
              </button>
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
                ) : teams.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {teams.map((team) => (
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
                    {news.map((item, index) => (
                      <a 
                        key={index} 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                        data-testid={`link-news-${index}`}
                      >
                        <div 
                          className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                          data-testid={`card-news-${index}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2 mb-2">
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
                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      </a>
                    ))}
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

  return (
    <Link href={`/match/${game.id}`} data-testid={`link-game-${game.id}`}>
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

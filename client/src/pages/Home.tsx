import { Layout } from "@/components/Layout";
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
import { resolveNewsThumbnail } from "@/lib/branding";
import { getNewsFallbackForLeague } from "@/data/localNewsFallback";
import { getLocalFixturesForLeague } from "@/lib/localFixtures";

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
  week?: string;
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
      try {
        const res = await fetch(`/api/rugby/fixtures?league=${encodeURIComponent(selectedLeague)}&season=${DEFAULT_FIXTURE_SEASON}`);
        if (!res.ok) throw new Error("Failed to fetch fixtures");
        const data = await res.json();
        if (Array.isArray(data?.response) && data.response.length > 0) {
          return data;
        }
      } catch (error) {
        console.error("Fixtures fetch failed, using local fixtures:", error);
      }
      return { response: getLocalFixturesForLeague(selectedLeague) };
    },
  });

  const { data: newsData, isLoading: newsLoading } = useQuery<{ response: NewsItem[] }>({
    queryKey: ["news", selectedLeague],
    queryFn: async () => {
      const fallback = getNewsFallbackForLeague(selectedLeague);
      try {
        const res = await fetch(`/api/rugby/news?league=${encodeURIComponent(selectedLeague)}`);
        if (!res.ok) throw new Error("Failed to fetch news");
        const data = await res.json();
        if (Array.isArray(data?.response) && data.response.length > 0) {
          return data;
        }
        return { response: fallback };
      } catch (error) {
        console.error("News fetch failed, using fallback headlines:", error);
        return { response: fallback };
      }
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
  const news = newsData?.response || getNewsFallbackForLeague(selectedLeague);
  const featuredNews = useMemo(() => news.slice(0, FEATURED_NEWS_LIMIT), [news]);
  
  const upcomingGames = games.filter(g => g.status.short === "NS" || g.status.short === "TBD");
  const completedGames = games.filter(g => g.status.short === "FT" || g.status.short === "AET");
  const liveGames = games.filter(g => g.status.short !== "FT" && g.status.short !== "AET" && g.status.short !== "NS" && g.status.short !== "TBD");

  const displayLeagueName = FEATURED_LEAGUES.find(l => l.id === selectedLeague)?.name || selectedLeague;
  const heroHighlight = liveGames[0] ?? upcomingGames[0] ?? null;
  const leagueToggleOptions = useMemo(() => FEATURED_LEAGUES, []);
  const heroNews = featuredNews[0];
  const roundFixtures = useMemo(() => {
    const source =
      upcomingGames.length > 0
        ? upcomingGames
        : liveGames.length > 0
        ? liveGames
        : completedGames.length > 0
        ? completedGames.slice(-5)
        : [];

    if (source.length === 0) return [];

    const reference = source.find((game) => !!game.week) ?? source[0];
    if (reference?.week) {
      const sameRound = source.filter((game) => game.week === reference.week);
      if (sameRound.length > 0) {
        return sameRound;
      }
    }

    return source.slice(0, 5);
  }, [upcomingGames, liveGames, completedGames]);

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-background to-purple-500/20 border border-border/60 p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-80" />
          
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.7fr),minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
                Real-time coverage · {displayLeagueName}
              </div>
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white" data-testid="text-main-title">
                  Track every game, headline, and kickoff
                </h1>
                <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
                  Follow live scores, squads, fixtures, and breaking news from the NRL, Super League — all in one place.
                </p>
              </div>
              <div className="flex w-full flex-wrap justify-center gap-3">
                {leagueToggleOptions.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => setSelectedLeague(league.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                      selectedLeague === league.id
                        ? "border-primary bg-primary text-primary-foreground shadow-lg"
                        : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent"
                    )}
                    data-testid={`hero-league-${league.id.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <span className="h-12 w-12 rounded-xl bg-background/80 flex items-center justify-center ring-1 ring-border">
                      <img
                        src={league.logo || "/logo.svg"}
                        alt={`${league.name} logo`}
                        className="h-8 w-8 object-contain"
                        loading="lazy"
                      />
                    </span>
                    <div className="text-left">
                      <p
                        className={cn(
                          "text-xs uppercase tracking-wide",
                          selectedLeague === league.id ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        Follow
                      </p>
                      <p className="font-semibold text-base">{league.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card/80 border border-border rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>{roundFixtures[0]?.week || `${displayLeagueName} fixtures`}</span>
                <span>{roundFixtures.length} games</span>
              </div>

              {roundFixtures.length > 0 ? (
                <div className="space-y-3">
                  {roundFixtures.map((game) => {
                    const gameDate = game.date ? parseISO(game.date) : null;
                    const kickoffText = gameDate ? format(gameDate, "EEE d MMM • p") : "Time TBC";
                    const statusLabel = game.status.long || game.status.short || "Not started";
                    return (
                      <Link
                        key={game.id}
                        href={`/match/${encodeURIComponent(game.id)}`}
                        className="block rounded-2xl border border-border/50 bg-background/70 px-4 py-4 hover:border-primary/60 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                          <span>{statusLabel}</span>
                          <span>{kickoffText}</span>
                        </div>
                        <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-6">
                          <TeamBlip team={game.teams.home} score={game.scores.home} />
                          <div className="text-2xl font-bold text-muted-foreground/70">vs</div>
                          <TeamBlip team={game.teams.away} score={game.scores.away} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Waiting for the next kickoff. Select a league to see upcoming fixtures.
                </div>
              )}
            </div>
          </div>
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
                  const href = item.link || "";
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
                    <a
                      key={index}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Read article: ${item.title}`}
                    >
                      {cardContent}
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>No featured news available right now. Check back later.</p>
              </div>
            )}
        </section>

        {/* Main Content */}
        <div className="space-y-6">
            
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
                      const href = item.link || "";
                      const thumbnail = resolveNewsThumbnail(item.image, item.league);
                      const card = (
                        <div 
                          className={cn(
                            "group bg-card border border-border rounded-xl p-4 transition-all",
                            item.link && "hover:border-primary/50 hover:shadow-lg cursor-pointer"
                          )}
                          data-testid={`card-news-${index}`}
                        >
                          <div className="flex gap-3">
                            <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                              <img
                                src={thumbnail}
                                alt={item.title}
                                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>
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
                        <a
                          key={index}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                          aria-label={`Read article: ${item.title}`}
                        >
                          {card}
                        </a>
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

        {/* Info Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/live"
            className="block bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all"
            data-testid="card-feature-fixtures"
          >
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
          </Link>

          <Link
            href="/teams"
            className="block bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all"
            data-testid="card-feature-teams"
          >
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
          </Link>
        </section>

      </div>
    </Layout>
  );
}
function TeamBlip({ team, score }: { team: Game["teams"]["home"]; score: number | null }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 min-w-[140px]">
      {team.logo ? (
        <img src={team.logo} alt={team.name} className="h-12 object-contain" />
      ) : (
        <div className="w-12 h-12 bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground rounded-lg">
          {team.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold line-clamp-1">{team.name}</p>
        <p className="text-3xl font-display text-foreground">{score ?? "–"}</p>
      </div>
    </div>
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
              <span className="text-xs text-muted-foreground">{formatTime(game.time)}</span>
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

function formatTime(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/\b(\d{1,2}:\d{2})\b/);
  return match ? match[1] : trimmed;
}

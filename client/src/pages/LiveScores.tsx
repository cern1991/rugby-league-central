import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Zap, Clock, CheckCircle, Calendar, Filter, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Game, FEATURED_LEAGUES } from "@shared/schema";

export default function LiveScores() {
  const [selectedLeague, setSelectedLeague] = useState<string>("NRL");
  const [showFilters, setShowFilters] = useState(false);

  const { data: gamesData, isLoading } = useQuery<{ response: Game[] }>({
    queryKey: ["fixtures", selectedLeague],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/fixtures?league=${encodeURIComponent(selectedLeague)}`);
      if (!res.ok) throw new Error("Failed to fetch fixtures");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const games = gamesData?.response || [];
  const liveGames = games.filter(g => 
    g.status.short !== "FT" && g.status.short !== "AET" && 
    g.status.short !== "NS" && g.status.short !== "TBD" &&
    g.status.short !== "PST" && g.status.short !== "CANC"
  );
  const upcomingGames = games.filter(g => g.status.short === "NS" || g.status.short === "TBD");
  const completedGames = games.filter(g => g.status.short === "FT" || g.status.short === "AET");

  const displayLeagueName = FEATURED_LEAGUES.find(l => l.id === selectedLeague)?.name || selectedLeague;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
              <Zap className="w-8 h-8 text-primary" />
              Live Scores & Fixtures
            </h1>
            <p className="text-muted-foreground mt-1">Real-time scores and upcoming matches</p>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded-lg"
            data-testid="button-toggle-filters"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
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
                  League Filter
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
              <h3 className="font-bold mb-3 text-sm">Match Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Live</span>
                  <span className="font-medium text-red-500" data-testid="stat-live-count">{liveGames.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upcoming</span>
                  <span className="font-medium text-blue-500" data-testid="stat-upcoming-count">{upcomingGames.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium text-green-500" data-testid="stat-completed-count">{completedGames.length}</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3 space-y-8">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-6">
                    <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {liveGames.length > 0 && (
                  <section>
                    <h2 className="font-bold text-xl mb-4 flex items-center gap-2" data-testid="section-live">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      Live Now
                    </h2>
                    <div className="space-y-3">
                      {liveGames.map(game => (
                        <GameCard key={game.id} game={game} isLive />
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h2 className="font-bold text-xl mb-4 flex items-center gap-2" data-testid="section-upcoming">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Upcoming Fixtures
                  </h2>
                  {upcomingGames.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingGames.slice(0, 15).map(game => (
                        <GameCard key={game.id} game={game} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                      <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No upcoming fixtures for {displayLeagueName}</p>
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="font-bold text-xl mb-4 flex items-center gap-2" data-testid="section-results">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Recent Results
                  </h2>
                  {completedGames.length > 0 ? (
                    <div className="space-y-3">
                      {completedGames.slice(0, 15).map(game => (
                        <GameCard key={game.id} game={game} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                      <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No recent results for {displayLeagueName}</p>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function GameCard({ game, isLive }: { game: Game; isLive?: boolean }) {
  const isFinished = game.status.short === "FT" || game.status.short === "AET";
  const gameDate = game.date ? parseISO(game.date) : null;

  return (
    <Link href={`/match/${game.id}`} data-testid={`link-game-${game.id}`}>
      <div 
        className={cn(
          "p-4 rounded-xl border transition-all hover:shadow-lg cursor-pointer group",
          isLive ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50" :
          isFinished ? "bg-card border-border hover:border-primary/50" :
          "bg-card border-border hover:border-blue-500/50"
        )}
        data-testid={`card-game-${game.id}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 text-center w-20">
            {gameDate && (
              <div className="text-xs text-muted-foreground">
                <div className="font-medium">{format(gameDate, "EEE, MMM d")}</div>
                <div>{game.time || format(gameDate, "HH:mm")}</div>
              </div>
            )}
            {isLive && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded animate-pulse">
                LIVE
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {game.teams.home.logo ? (
                <img src={game.teams.home.logo} alt={game.teams.home.name} className="w-8 h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                  {game.teams.home.name.slice(0, 2)}
                </div>
              )}
              <span className="font-medium truncate flex-1">{game.teams.home.name}</span>
              <span className={cn(
                "text-xl font-bold w-8 text-center",
                isFinished && game.scores.home !== null && game.scores.away !== null && 
                game.scores.home > game.scores.away ? "text-green-500" : ""
              )}>
                {game.scores.home ?? "-"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {game.teams.away.logo ? (
                <img src={game.teams.away.logo} alt={game.teams.away.name} className="w-8 h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                  {game.teams.away.name.slice(0, 2)}
                </div>
              )}
              <span className="font-medium truncate flex-1">{game.teams.away.name}</span>
              <span className={cn(
                "text-xl font-bold w-8 text-center",
                isFinished && game.scores.home !== null && game.scores.away !== null && 
                game.scores.away > game.scores.home ? "text-green-500" : ""
              )}>
                {game.scores.away ?? "-"}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <span className={cn(
              "text-xs px-2 py-1 rounded font-medium",
              isLive ? "bg-red-500/20 text-red-500" :
              isFinished ? "bg-green-500/20 text-green-500" :
              "bg-blue-500/20 text-blue-500"
            )}>
              {game.status.short}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

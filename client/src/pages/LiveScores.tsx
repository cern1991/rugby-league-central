import { Layout } from "@/components/Layout";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn, dedupeGames, formatTime } from "@/lib/utils";
import { Link } from "wouter";
import { Zap, Clock, CheckCircle, Calendar } from "lucide-react";
import LeagueFilter from "@/components/LeagueFilter";
import { format, parseISO } from "date-fns";
import { Game, FEATURED_LEAGUES } from "@shared/schema";
import { usePreferredLeague } from "@/hooks/usePreferredLeague";
import { getLocalFixturesForLeague } from "@/lib/localFixtures";
import { LOCAL_TEAMS } from "@shared/localTeams";

const DEFAULT_FIXTURE_SEASON = "2026";

export default function LiveScores() {
  const { selectedLeague, setSelectedLeague } = usePreferredLeague();

  const { data: gamesData, isLoading } = useQuery<{ response: Game[] }>({
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
    refetchInterval: 60000,
  });

  const games = useMemo(
    () => dedupeGames(gamesData?.response || []),
    [gamesData],
  );
  const liveGames = games.filter(g => 
    g.status.short !== "FT" && g.status.short !== "AET" && 
    g.status.short !== "NS" && g.status.short !== "TBD" &&
    g.status.short !== "PST" && g.status.short !== "CANC"
  );
  const upcomingGames = games.filter(g => g.status.short === "NS" || g.status.short === "TBD");
  const completedGames = games.filter(g => g.status.short === "FT" || g.status.short === "AET");
  const groupedUpcoming = useMemo(() => groupGamesByRound(upcomingGames), [upcomingGames]);
  const groupedCompleted = useMemo(() => groupGamesByRound(completedGames), [completedGames]);

  const hasLiveGames = liveGames.length > 0;
  const displayLeagueName = FEATURED_LEAGUES.find(l => l.id === selectedLeague)?.name || selectedLeague;
  const pageTitle = hasLiveGames ? "Live Scores & Fixtures" : "Fixtures";
  const pageSubtitle = hasLiveGames
    ? "Real-time scores and upcoming matches"
    : "Full fixture list — live updates appear on match day";

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
            <Zap className="w-8 h-8 text-primary" />
            {pageTitle}
          </h1>
          <p className="text-muted-foreground mt-1">{pageSubtitle}</p>
        </div>

        {/* League Filter Buttons - Always Visible */}
        <LeagueFilter selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} />

        {/* Match Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 flex items-center gap-3">
            <div className="bg-red-500/10 rounded-lg p-2">
              <Zap className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Live Matches</p>
              <div className="text-xl sm:text-2xl font-bold text-red-500" data-testid="stat-live-count">{liveGames.length}</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 flex items-center gap-3">
            <div className="bg-blue-500/10 rounded-lg p-2">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Upcoming</p>
              <div className="text-xl sm:text-2xl font-bold text-blue-500" data-testid="stat-upcoming-count">{upcomingGames.length}</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 flex items-center gap-3">
            <div className="bg-green-500/10 rounded-lg p-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
              <div className="text-xl sm:text-2xl font-bold text-green-500" data-testid="stat-completed-count">{completedGames.length}</div>
            </div>
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-4 h-24" />
              ))}
            </div>
          ) : (
            <>
              {hasLiveGames && (
                <section className="mb-8">
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

              {!hasLiveGames && (
                <section className="mb-8 border border-dashed border-border rounded-xl p-6 bg-muted/20 text-sm text-muted-foreground">
                  Live scores appear automatically on match day. In the meantime, browse the full fixture list below.
                </section>
              )}

              <section className="mb-8">
                <h2 className="font-bold text-xl mb-4 flex items-center gap-2" data-testid="section-upcoming">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Upcoming Fixtures
                </h2>
                {upcomingGames.length > 0 ? (
                  <div className="space-y-6">
                    {groupedUpcoming.map((group) => (
                      <div key={group.label} className="space-y-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {group.label}
                        </div>
                        <div className="space-y-3">
                          {group.games.map((game) => (
                            <GameCard key={game.id} game={game} />
                          ))}
                        </div>
                      </div>
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
                  <div className="space-y-6">
                    {groupedCompleted.map((group) => (
                      <div key={group.label} className="space-y-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {group.label}
                        </div>
                        <div className="space-y-3">
                          {group.games.map((game) => (
                            <GameCard key={game.id} game={game} />
                          ))}
                        </div>
                      </div>
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
    </Layout>
  );
}

function GameCard({ game, isLive }: { game: Game; isLive?: boolean }) {
  const isFinished = game.status.short === "FT" || game.status.short === "AET";
  const gameDate = game.date ? parseISO(game.date) : null;
  const matchHref = `/match/${encodeURIComponent(game.id)}`;
  const leagueName = game.league?.name;
  const homeLogo = resolveTeamLogo(game.teams.home, leagueName);
  const awayLogo = resolveTeamLogo(game.teams.away, leagueName);

  return (
    <Link href={matchHref} data-testid={`link-game-${game.id}`}>
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
                <div>{game.time ? formatTime(game.time) : format(gameDate, "HH:mm")}</div>
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
              {homeLogo ? (
                <img src={homeLogo} alt={game.teams.home.name} className="w-8 h-8 object-contain" />
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
              {awayLogo ? (
                <img src={awayLogo} alt={game.teams.away.name} className="w-8 h-8 object-contain" />
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

const TEAM_LOGO_BY_LEAGUE = LOCAL_TEAMS.reduce<Record<string, Record<string, string | null>>>((acc, team) => {
  const leagueKey = team.league.toLowerCase().includes("super") ? "super" : "nrl";
  if (!acc[leagueKey]) acc[leagueKey] = {};
  const bucket = acc[leagueKey];
  const nameKey = team.name.toLowerCase();
  const normalized = nameKey.replace(/[^a-z0-9]+/g, "");
  bucket[nameKey] = team.logo || null;
  bucket[normalized] = team.logo || null;
  if (nameKey.includes("sea eagles")) {
    bucket["manly"] = team.logo || null;
    bucket["seaeagles"] = team.logo || null;
  }
  if (nameKey.includes("warriors")) bucket["warriors"] = team.logo || null;
  if (nameKey.includes("roosters")) bucket["roosters"] = team.logo || null;
  if (nameKey.includes("rabbitohs")) bucket["rabbitohs"] = team.logo || null;
  if (nameKey.includes("panthers")) bucket["panthers"] = team.logo || null;
  if (nameKey.includes("tigers")) bucket["tigers"] = team.logo || null;
  if (nameKey.includes("newcastle knights")) bucket["knights"] = team.logo || null;
  if (nameKey.includes("york knights")) bucket["york"] = team.logo || null;
  if (nameKey.includes("bulldogs")) bucket["bulldogs"] = team.logo || null;
  if (nameKey.includes("cowboys")) bucket["cowboys"] = team.logo || null;
  if (nameKey.includes("sharks")) bucket["sharks"] = team.logo || null;
  if (nameKey.includes("storm")) bucket["storm"] = team.logo || null;
  if (nameKey.includes("titans")) bucket["titans"] = team.logo || null;
  if (nameKey.includes("dolphins")) bucket["dolphins"] = team.logo || null;
  if (nameKey.includes("dragons")) bucket["dragons"] = team.logo || null;
  if (nameKey.includes("eels")) bucket["eels"] = team.logo || null;
  if (nameKey.includes("raiders")) bucket["raiders"] = team.logo || null;
  if (nameKey.includes("broncos")) bucket["broncos"] = team.logo || null;
  if (nameKey.includes("hull fc")) {
    bucket["hull fc"] = team.logo || null;
    bucket["hull"] = team.logo || null;
  }
  if (nameKey.includes("hull kr") || nameKey.includes("hull kingston rovers")) {
    bucket["hull kr"] = team.logo || null;
    bucket["hkr"] = team.logo || null;
  }
  return acc;
}, {});

function resolveTeamLogo(team: Game["teams"]["home"], leagueName?: string) {
  if (team.logo) return team.logo;
  const key = team.name.toLowerCase();
  const normalized = key.replace(/[^a-z0-9]+/g, "");
  const leagueKey = leagueName?.toLowerCase().includes("super") ? "super" : "nrl";
  const bucket = TEAM_LOGO_BY_LEAGUE[leagueKey] || {};
  return bucket[key] || bucket[normalized] || null;
}

function groupGamesByRound(games: Game[]) {
  const groups = new Map<string, Game[]>();
  games
    .slice()
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    .forEach((game) => {
      const label = game.week || (game.date ? format(parseISO(game.date), "EEE, MMM d") : "Fixtures");
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)?.push(game);
    });
  return Array.from(groups.entries()).map(([label, groupGames]) => ({ label, games: groupGames }));
}

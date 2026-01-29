import { useRoute, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar, Users, Trophy, MapPin, Clock, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { format, parseISO, isPast, isFuture, isToday } from "date-fns";
import { LOCAL_TEAMS } from "@shared/localTeams";

const DEFAULT_TEAM_SEASON = "2026";

interface Team {
  id: string;
  name: string;
  logo?: string | null;
  league?: string;
  country?: {
    name: string;
    code?: string;
    flag?: string | null;
  };
  stadium?: string | null;
  description?: string | null;
  founded?: string | null;
  website?: string | null;
}

interface Game {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  week: string;
  status: {
    long: string;
    short: string;
  };
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
    season: number;
  };
  country: {
    name: string;
    code: string;
    flag: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  scores: {
    home: number | null;
    away: number | null;
  };
}

interface PlayerStats {
  appearances: number;
  tries: number;
  goals: number;
  tackleBusts: number;
  runMeters: number;
  tackles: number;
}

interface Player {
  id: string;
  name: string;
  nationality: string;
  position: string;
  number: string;
  dateOfBirth: string;
  height: string;
  weight: string;
  thumbnail: string | null;
  description: string;
  stats?: PlayerStats;
}

interface ApiResponse<T> {
  response: T;
}

const slugify = (value: string) =>
  value
    ?.toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "";

export default function TeamPage() {
  const [match, params] = useRoute("/team/:id");
  const [activeTab, setActiveTab] = useState<"fixtures" | "players">("fixtures");

  const routeTeamId = params?.id || null;

  const fallbackTeam = useMemo(() => {
    if (!routeTeamId) return undefined;
    const exact = LOCAL_TEAMS.find((team) => String(team.id) === String(routeTeamId));
    if (exact) return exact;
    const normalized = slugify(routeTeamId);
    return LOCAL_TEAMS.find((team) => slugify(team.name) === normalized);
  }, [routeTeamId]);

  const fallbackTeamAsTeam = useMemo<Team | undefined>(() => {
    if (!fallbackTeam) return undefined;
    return {
      id: String(fallbackTeam.id),
      name: fallbackTeam.name,
      logo: fallbackTeam.logo,
      league: fallbackTeam.league,
      country: fallbackTeam.country,
    };
  }, [fallbackTeam]);

  const resolvedTeamId = fallbackTeam ? String(fallbackTeam.id) : routeTeamId;
  const numericTeamId = useMemo(() => {
    if (!resolvedTeamId) return null;
    return /^\d+$/.test(resolvedTeamId) ? Number(resolvedTeamId) : null;
  }, [resolvedTeamId]);

  const { data: teamData, isLoading: teamLoading, error: teamError } = useQuery<ApiResponse<Team[]>>({
    queryKey: ["team", resolvedTeamId],
    queryFn: async () => {
      if (!resolvedTeamId) {
        return { response: [] };
      }
      const res = await fetch(`/api/rugby/team/${encodeURIComponent(resolvedTeamId)}`);
      if (!res.ok) throw new Error("Failed to fetch team");
      return res.json();
    },
    enabled: !!resolvedTeamId,
  });

  const { data: gamesData, isLoading: gamesLoading } = useQuery<ApiResponse<Game[]>>({
    queryKey: ["team-games", resolvedTeamId],
    queryFn: async () => {
      if (!resolvedTeamId) {
        return { response: [] };
      }
      const res = await fetch(`/api/rugby/team/${encodeURIComponent(resolvedTeamId)}/games?season=${DEFAULT_TEAM_SEASON}`);
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json();
    },
    enabled: !!resolvedTeamId,
  });

  const { data: playersData, isLoading: playersLoading } = useQuery<ApiResponse<Player[]>>({
    queryKey: ["team-players", resolvedTeamId, activeTab === "players"],
    queryFn: async () => {
      if (!resolvedTeamId) {
        return { response: [] };
      }
      const res = await fetch(`/api/rugby/team/${encodeURIComponent(resolvedTeamId)}/players`);
      if (!res.ok) throw new Error("Failed to fetch players");
      return res.json();
    },
    enabled: !!resolvedTeamId && activeTab === "players",
  });

  if (!match || !routeTeamId) return null;

  const team = teamData?.response?.[0] || fallbackTeamAsTeam;
  const games = gamesData?.response || [];

  const validGames = games.filter(g => g && g.teams?.home && g.teams?.away && g.status && g.scores);
  const sortedGames = [...validGames].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const pastGames = sortedGames.filter(g => g.status?.short === "FT" || g.status?.short === "AET");
  const upcomingGames = sortedGames.filter(g => g.status?.short === "NS" || g.status?.short === "TBD");
  const liveGames = sortedGames.filter(g => 
    g.status?.short !== "FT" && 
    g.status?.short !== "AET" && 
    g.status?.short !== "NS" && 
    g.status?.short !== "TBD"
  );

  const teamStats = useMemo(() => {
    if (!numericTeamId) {
      return { wins: 0, losses: 0, draws: 0, avgFor: 0, avgAgainst: 0 };
    }

    const completed = pastGames.filter(game => {
      const isHome = game.teams.home?.id === numericTeamId;
      const isAway = game.teams.away?.id === numericTeamId;
      if (!isHome && !isAway) return false;
      const teamScore = isHome ? game.scores.home : game.scores.away;
      const oppScore = isHome ? game.scores.away : game.scores.home;
      return typeof teamScore === "number" && typeof oppScore === "number";
    });

    if (!completed.length) {
      return { wins: 0, losses: 0, draws: 0, avgFor: 0, avgAgainst: 0 };
    }

    const totals = completed.reduce(
      (acc, game) => {
        const isHome = game.teams.home?.id === numericTeamId;
        const teamScore = isHome ? game.scores.home! : game.scores.away!;
        const oppScore = isHome ? game.scores.away! : game.scores.home!;

        if (teamScore > oppScore) acc.wins += 1;
        else if (teamScore < oppScore) acc.losses += 1;
        else acc.draws += 1;

        acc.pointsFor += teamScore;
        acc.pointsAgainst += oppScore;
        return acc;
      },
      { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 }
    );

    return {
      wins: totals.wins,
      losses: totals.losses,
      draws: totals.draws,
      avgFor: totals.pointsFor / completed.length,
      avgAgainst: totals.pointsAgainst / completed.length,
    };
  }, [pastGames, numericTeamId]);

  if (teamLoading && !team) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if ((teamError || !team) && !fallbackTeamAsTeam) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-bold">Team not found</h2>
          <Link href="/" className="text-primary hover:underline mt-4" data-testid="link-back-home">
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-4" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </Link>

        <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
          
          <div className="relative p-8 flex flex-col md:flex-row items-center gap-6">
            {team.logo ? (
              <img 
                src={team.logo} 
                alt={team.name} 
                className="w-24 h-24 md:w-32 md:h-32 object-contain"
                data-testid="img-team-logo"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold">
                {team.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            
            <div className="text-center md:text-left flex-1">
              <h1 className="font-display text-4xl md:text-5xl font-bold" data-testid="text-team-name">
                {team.name}
              </h1>
              {team.country && (
                <div className="flex items-center gap-2 mt-2 justify-center md:justify-start text-muted-foreground">
                  {team.country.flag && (
                    <img src={team.country.flag} alt={team.country.name} className="w-5 h-4 object-cover" />
                  )}
                  <span>{team.country.name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4 text-center">
              <div className="p-4 rounded-xl bg-background/50 border border-border">
                <div className="text-2xl font-bold text-primary">{pastGames.length}</div>
                <div className="text-xs text-muted-foreground">Played</div>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border">
                <div className="text-2xl font-bold text-primary">{upcomingGames.length}</div>
                <div className="text-xs text-muted-foreground">Upcoming</div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Wins" value={teamStats.wins} accent="text-green-400" />
          <StatCard label="Losses" value={teamStats.losses} accent="text-red-400" />
          <StatCard label="Draws" value={teamStats.draws} accent="text-yellow-300" />
          <StatCard label="Avg Points For" value={teamStats.avgFor} isAverage />
          <StatCard label="Avg Points Against" value={teamStats.avgAgainst} isAverage />
        </section>

        <div className="flex items-center gap-1 border-b border-border">
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
            Fixtures & Results
          </button>
          <button 
            onClick={() => setActiveTab("players")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === "players" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            data-testid="tab-players"
          >
            <Users className="w-4 h-4" />
            Players
          </button>
        </div>

        {activeTab === "fixtures" && (
          <div className="space-y-6">
            {liveGames.length > 0 && (
              <div>
                <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Live Now
                </h3>
                <div className="space-y-3">
                  {liveGames.map(game => (
                    <GameCard key={game.id} game={game} teamId={numericTeamId ?? 0} />
                  ))}
                </div>
              </div>
            )}

            {upcomingGames.length > 0 && (
              <div>
                <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Upcoming Fixtures
                </h3>
                <div className="space-y-3">
                  {upcomingGames.map(game => (
                    <GameCard key={game.id} game={game} teamId={numericTeamId ?? 0} />
                  ))}
                </div>
              </div>
            )}

            {pastGames.length > 0 && (
              <div>
                <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  Recent Results
                </h3>
                <div className="space-y-3">
                  {pastGames.slice().reverse().map(game => (
                    <GameCard key={game.id} game={game} teamId={numericTeamId ?? 0} />
                  ))}
                </div>
              </div>
            )}

            {gamesLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            )}

            {!gamesLoading && games.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                No fixtures found for this season
              </div>
            )}
          </div>
        )}

        {activeTab === "players" && (
          <div className="space-y-4">
            {playersLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            )}

            {!playersLoading && playersData?.response && playersData.response.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {playersData.response.map((player) => {
                  return (
                    <Link key={player.id} href={`/player/${encodeURIComponent(player.id)}`}>
                      <div 
                        className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer group"
                        data-testid={`card-player-${player.id}`}
                      >
                        <div className="flex items-center gap-4">
                          {player.thumbnail ? (
                            <img 
                              src={player.thumbnail} 
                              alt={player.name} 
                              className="w-16 h-16 rounded-full object-cover object-center"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                              {player.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate group-hover:text-primary transition-colors">{player.name}</div>
                            {player.position && (
                              <div className="text-sm text-primary">{player.position}</div>
                            )}
                            {player.nationality && (
                              <div className="text-xs text-muted-foreground">{player.nationality}</div>
                            )}
                          </div>
                          {player.number && (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {player.number}
                            </div>
                          )}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs text-muted-foreground">
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="text-[11px] uppercase tracking-wide">Squad #</p>
                            <p className="text-base font-semibold text-foreground">
                              {player.number ?? "—"}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-2">
                            <p className="text-[11px] uppercase tracking-wide">Position</p>
                            <p className="text-base font-semibold text-foreground">
                              {player.position || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {!playersLoading && (!playersData?.response || playersData.response.length === 0) && (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No player data available</p>
                <p className="text-sm mt-2">Player rosters may not be available for all teams</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({
  label,
  value,
  accent,
  isAverage = false,
}: {
  label: string;
  value: number;
  accent?: string;
  isAverage?: boolean;
}) {
  const formatted = useMemo(() => {
    if (isAverage) {
      if (!Number.isFinite(value)) return "—";
      const rounded = Number(value.toFixed(1));
      return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
    }
    return value.toString();
  }, [value, isAverage]);

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-2xl font-bold", accent)}>{formatted}</p>
    </div>
  );
}

function GameCard({ game, teamId }: { game: Game; teamId: number }) {
  if (!game.teams?.home || !game.teams?.away || !game.scores || !game.status) {
    return null;
  }
  
  const isHome = game.teams.home.id === teamId;
  const opponent = isHome ? game.teams.away : game.teams.home;
  const ourScore = isHome ? game.scores.home : game.scores.away;
  const theirScore = isHome ? game.scores.away : game.scores.home;
  const isFinished = game.status.short === "FT" || game.status.short === "AET";
  const isLive = !isFinished && game.status.short !== "NS" && game.status.short !== "TBD";
  
  let result: "win" | "loss" | "draw" | null = null;
  if (isFinished && ourScore !== null && theirScore !== null) {
    if (ourScore > theirScore) result = "win";
    else if (ourScore < theirScore) result = "loss";
    else result = "draw";
  }

  const gameDate = game.date ? parseISO(game.date) : null;
  const matchHref = `/match/${encodeURIComponent(game.id)}`;

  return (
    <Link href={matchHref}>
      <div 
        className={cn(
          "p-4 rounded-xl border transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer group",
          isLive ? "bg-card border-red-500/50 ring-1 ring-red-500/20" : "bg-card border-border"
        )}
        data-testid={`card-game-${game.id}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 text-center w-20">
            {gameDate && (
              <>
                <div className="text-xs text-muted-foreground">
                  {format(gameDate, "EEE")}
                </div>
                <div className="font-bold">
                  {format(gameDate, "d MMM")}
                </div>
                {!isFinished && game.time && (
                  <div className="text-xs text-muted-foreground">
                    {game.time}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex-1 flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              {opponent.logo ? (
                <img src={opponent.logo} alt={opponent.name} className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  {opponent.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-medium">{opponent.name}</div>
                <div className="text-xs text-muted-foreground">
                  {isHome ? "Home" : "Away"} • {game.league.name}
                </div>
              </div>
            </div>

            {isFinished && ourScore !== null && theirScore !== null && (
              <div className="flex items-center gap-3">
                <div className={cn(
                  "text-2xl font-bold",
                  result === "win" ? "text-green-500" : 
                  result === "loss" ? "text-red-500" : 
                  "text-muted-foreground"
                )}>
                  {ourScore} - {theirScore}
                </div>
                <div className={cn(
                  "px-2 py-1 rounded text-xs font-bold uppercase",
                  result === "win" ? "bg-green-500/20 text-green-500" :
                  result === "loss" ? "bg-red-500/20 text-red-500" :
                  "bg-muted text-muted-foreground"
                )}>
                  {result === "win" ? "W" : result === "loss" ? "L" : "D"}
                </div>
              </div>
            )}

            {isLive && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-500 font-bold text-sm">{game.status.short}</span>
                {ourScore !== null && theirScore !== null && (
                  <span className="text-xl font-bold">{ourScore} - {theirScore}</span>
                )}
              </div>
            )}

            {!isFinished && !isLive && (
              <div className="text-muted-foreground text-sm">
                {game.status.long}
              </div>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

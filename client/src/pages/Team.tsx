import { useRoute, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar, Users, Trophy, MapPin, Clock, ChevronRight } from "lucide-react";
import { useState } from "react";
import { format, parseISO, isPast, isFuture, isToday } from "date-fns";

const DEFAULT_TEAM_SEASON = "2026";

interface Team {
  id: number;
  name: string;
  logo: string;
  country: {
    name: string;
    code: string;
    flag: string;
  };
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
}

interface ApiResponse<T> {
  response: T;
}

export default function TeamPage() {
  const [match, params] = useRoute("/team/:id");
  const [activeTab, setActiveTab] = useState<"fixtures" | "players">("fixtures");

  const teamId = params?.id;

  const { data: teamData, isLoading: teamLoading, error: teamError } = useQuery<ApiResponse<Team[]>>({
    queryKey: ["team", teamId],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/team/${teamId}`);
      if (!res.ok) throw new Error("Failed to fetch team");
      return res.json();
    },
    enabled: !!teamId,
  });

  const { data: gamesData, isLoading: gamesLoading } = useQuery<ApiResponse<Game[]>>({
    queryKey: ["team-games", teamId],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/team/${teamId}/games?season=${DEFAULT_TEAM_SEASON}`);
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json();
    },
    enabled: !!teamId,
  });

  const { data: playersData, isLoading: playersLoading } = useQuery<ApiResponse<Player[]>>({
    queryKey: ["team-players", teamId],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/team/${teamId}/players`);
      if (!res.ok) throw new Error("Failed to fetch players");
      return res.json();
    },
    enabled: !!teamId && activeTab === "players",
  });

  if (!match || !teamId) return null;

  const team = teamData?.response?.[0];
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

  if (teamLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (teamError || !team) {
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
                    <GameCard key={game.id} game={game} teamId={parseInt(teamId)} />
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
                    <GameCard key={game.id} game={game} teamId={parseInt(teamId)} />
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
                    <GameCard key={game.id} game={game} teamId={parseInt(teamId)} />
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
                {playersData.response.map((player) => (
                  <div 
                    key={player.id} 
                    className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
                    data-testid={`card-player-${player.id}`}
                  >
                    <div className="flex items-center gap-4">
                      {player.thumbnail ? (
                        <img 
                          src={player.thumbnail} 
                          alt={player.name} 
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                          {player.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{player.name}</div>
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
                  </div>
                ))}
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

  return (
    <Link href={`/match/${game.id}`}>
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

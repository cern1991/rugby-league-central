import { useRoute, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { ArrowLeft, MapPin, Calendar, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { findLocalMatchById } from "@/lib/localFixtures";

interface MatchEvent {
  id: string;
  date: string;
  time: string;
  venue: string;
  league: string;
  season: string;
  homeTeam: {
    id: string;
    name: string;
    logo: string | null;
    score: number | null;
  };
  awayTeam: {
    id: string;
    name: string;
    logo: string | null;
    score: number | null;
  };
  status: string;
  description: string;
}

interface ApiResponse<T> {
  response: T;
}

interface LocalMatchFallback {
  id: string | number;
  date?: string;
  time?: string;
  venue?: string;
  week?: string;
  league?: { name?: string; season?: number | string };
  teams?: {
    home?: { id?: string | number; name?: string; logo?: string | null };
    away?: { id?: string | number; name?: string; logo?: string | null };
  };
  scores?: { home?: number | null; away?: number | null };
}

export default function MatchDetail() {
  const [match, params] = useRoute("/match/:id");
  const matchId = (() => {
    if (!params?.id) return undefined;
    try {
      return decodeURIComponent(params.id);
    } catch {
      return params.id;
    }
  })();

  const fallbackMatch = useMemo(() => findLocalMatchById(matchId), [matchId]);

  const { data: matchData, isLoading, error } = useQuery<ApiResponse<MatchEvent[]>>({
    queryKey: ["match", matchId],
    queryFn: async () => {
      if (!matchId) {
        throw new Error("Missing match id");
      }
      const encodedId = encodeURIComponent(matchId);
      const res = await fetch(`/api/rugby/game/${encodedId}`);
      if (!res.ok) throw new Error("Failed to fetch match");
      return res.json();
    },
    enabled: !!matchId && !fallbackMatch,
  });

  if (!match || !matchId) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-bold" data-testid="text-match-not-found">Match not found</h2>
          <Link href="/" className="text-primary hover:underline mt-4" data-testid="link-back-home">
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const fallbackMatchEvent = useMemo<MatchEvent | null>(() => {
    if (!fallbackMatch) return null;
    const local = fallbackMatch as LocalMatchFallback;
    return {
      id: String(local.id),
      date: local.date || "",
      time: local.time || "",
      venue: local.venue || "",
      league: local.league?.name || "Rugby League",
      season: local.league?.season ? String(local.league.season) : "",
      status: "Not Started",
      description: "",
      homeTeam: {
        id: String(local.teams?.home?.id ?? ""),
        name: local.teams?.home?.name || "",
        logo: local.teams?.home?.logo ?? null,
        score: local.scores?.home ?? null,
      },
      awayTeam: {
        id: String(local.teams?.away?.id ?? ""),
        name: local.teams?.away?.name || "",
        logo: local.teams?.away?.logo ?? null,
        score: local.scores?.away ?? null,
      },
    };
  }, [fallbackMatch]);

  const game = matchData?.response?.[0] ?? fallbackMatchEvent;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (error || !game) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-bold" data-testid="text-match-not-found">Match not found</h2>
          <Link href="/" className="text-primary hover:underline mt-4" data-testid="link-back-home">
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const isFinished = game.status === "Match Finished" || (game.homeTeam.score !== null && game.awayTeam.score !== null);
  const gameDate = game.date ? parseISO(game.date) : null;

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
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          
          <div className="relative p-4 border-b border-border/50 flex flex-wrap justify-between items-center text-xs font-medium text-muted-foreground bg-muted/20 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-bold" data-testid="text-match-league">{game.league}</span>
              {game.season && (
                <>
                  <span>•</span>
                  <span>{game.season}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              {gameDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(gameDate, "EEEE, d MMMM yyyy")}</span>
                </div>
              )}
              {game.time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{game.time}</span>
                </div>
              )}
            </div>
          </div>

          <div className="relative p-8 md:p-12 grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <Link href={`/team/${game.homeTeam.id}`} data-testid="link-home-team-hero">
              <div className="flex flex-col items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                {game.homeTeam.logo ? (
                  <img 
                    src={game.homeTeam.logo} 
                    alt={game.homeTeam.name} 
                    className="w-20 h-20 md:w-24 md:h-24 object-contain"
                    data-testid="img-home-team-logo"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/20 flex items-center justify-center text-2xl md:text-3xl font-bold">
                    {game.homeTeam.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-center">
                  <h2 className="text-xl md:text-2xl font-bold leading-none mb-1" data-testid="text-home-team-name">{game.homeTeam.name}</h2>
                  <p className="text-muted-foreground text-sm">Home</p>
                </div>
              </div>
            </Link>

            <div className="flex flex-col items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-background/50 border border-border text-xs font-bold uppercase tracking-wider">
                {game.status}
              </div>
              <div className="font-display text-6xl md:text-8xl font-bold tracking-tighter flex items-center gap-4">
                <span 
                  className={cn(
                    isFinished && game.homeTeam.score !== null && game.awayTeam.score !== null && game.homeTeam.score > game.awayTeam.score 
                      ? "text-foreground" 
                      : "text-muted-foreground/70"
                  )}
                  data-testid="text-home-score"
                >
                  {game.homeTeam.score ?? "-"}
                </span>
                <span className="text-muted-foreground/20">:</span>
                <span 
                  className={cn(
                    isFinished && game.homeTeam.score !== null && game.awayTeam.score !== null && game.awayTeam.score > game.homeTeam.score 
                      ? "text-foreground" 
                      : "text-muted-foreground/70"
                  )}
                  data-testid="text-away-score"
                >
                  {game.awayTeam.score ?? "-"}
                </span>
              </div>
            </div>

            <Link href={`/team/${game.awayTeam.id}`} data-testid="link-away-team-hero">
              <div className="flex flex-col items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                {game.awayTeam.logo ? (
                  <img 
                    src={game.awayTeam.logo} 
                    alt={game.awayTeam.name} 
                    className="w-20 h-20 md:w-24 md:h-24 object-contain"
                    data-testid="img-away-team-logo"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/20 flex items-center justify-center text-2xl md:text-3xl font-bold">
                    {game.awayTeam.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-center">
                  <h2 className="text-xl md:text-2xl font-bold leading-none mb-1" data-testid="text-away-team-name">{game.awayTeam.name}</h2>
                  <p className="text-muted-foreground text-sm">Away</p>
                </div>
              </div>
            </Link>
          </div>

          {game.venue && (
            <div className="p-4 border-t border-border/50 bg-muted/10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span data-testid="text-match-venue">{game.venue}</span>
            </div>
          )}
        </div>

        {game.description && (
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-display font-bold text-lg mb-4">Match Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-match-description">
              {game.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={`/team/${game.homeTeam.id}`} data-testid="link-home-team-summary">
            <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                {game.homeTeam.logo ? (
                  <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-12 h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                    {game.homeTeam.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold">{game.homeTeam.name}</div>
                  <div className="text-sm text-muted-foreground">View team page</div>
                </div>
              </div>
            </div>
          </Link>

          <Link href={`/team/${game.awayTeam.id}`} data-testid="link-away-team-summary">
            <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                {game.awayTeam.logo ? (
                  <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-12 h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                    {game.awayTeam.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold">{game.awayTeam.name}</div>
                  <div className="text-sm text-muted-foreground">View team page</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}

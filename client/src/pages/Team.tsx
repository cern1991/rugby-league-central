import { useRoute, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { cn, formatTime } from "@/lib/utils";
import { ArrowLeft, Calendar, Users, Trophy, MapPin, Clock, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO, isPast, isFuture, isToday } from "date-fns";
import { LOCAL_TEAMS } from "@shared/localTeams";
import { getLocalFixturesForTeam } from "@/lib/localFixtures";
import { AVAILABLE_TEAMS } from "@/lib/theme";

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
  honours?: {
    premierships?: string[];
    minorPremierships?: string[];
    worldClubChallenge?: string[];
    superLeagueTitles?: string[];
    challengeCup?: string[];
    leagueLeadersShield?: string[];
  };
}

interface Game {
  id: string | number;
  date: string;
  time: string;
  timestamp?: number;
  week?: string;
  status: {
    long: string;
    short: string;
  };
  league: {
    id?: number | string;
    name: string;
    type?: string;
    logo?: string;
    season?: number | string;
  };
  country?: {
    name: string;
    code?: string;
    flag?: string;
  };
  teams: {
    home: {
      id: number | string;
      name: string;
      logo: string | null;
    };
    away: {
      id: number | string;
      name: string;
      logo: string | null;
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
  nationality?: string;
  nationalitySecondary?: string | null;
  position?: string;
  number?: string;
  dateOfBirth?: string;
  height?: string;
  weight?: string;
  thumbnail?: string | null;
  description?: string;
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
  const previousTeamThemeRef = useRef<string | null>(null);

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
      stadium: fallbackTeam.stadium ?? null,
      founded: fallbackTeam.founded ?? null,
      description: fallbackTeam.description ?? null,
      honours: fallbackTeam.honours,
    };
  }, [fallbackTeam]);

  const resolvedTeamId = fallbackTeam ? String(fallbackTeam.id) : routeTeamId;
  const teamIdKey = useMemo(() => (resolvedTeamId ? String(resolvedTeamId) : null), [resolvedTeamId]);

  useEffect(() => {
    if (!resolvedTeamId) return;
    try {
      sessionStorage.setItem("rlc-last-team-id", String(resolvedTeamId));
    } catch {
      // Ignore storage errors
    }
  }, [resolvedTeamId]);

  useEffect(() => {
    if (!resolvedTeamId) return;
    try {
      const storedTab = sessionStorage.getItem(`rlc-team-tab-${resolvedTeamId}`);
      if (storedTab === "fixtures" || storedTab === "players") {
        setActiveTab(storedTab);
      }
    } catch {
      // Ignore storage errors
    }
  }, [resolvedTeamId]);

  useEffect(() => {
    if (!resolvedTeamId) return;
    try {
      sessionStorage.setItem(`rlc-team-tab-${resolvedTeamId}`, activeTab);
    } catch {
      // Ignore storage errors
    }
  }, [activeTab, resolvedTeamId]);

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
      try {
        const res = await fetch(`/api/rugby/team/${encodeURIComponent(resolvedTeamId)}/games?season=${DEFAULT_TEAM_SEASON}`);
        if (!res.ok) throw new Error("Failed to fetch games");
        const data = await res.json();
        if (Array.isArray(data?.response) && data.response.length > 0) {
          return data;
        }
      } catch (error) {
        console.error("Team fixtures fetch failed, using local fixtures:", error);
      }
      return { response: getLocalFixturesForTeam(resolvedTeamId, fallbackTeam?.league) };
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

  if (!match || !routeTeamId) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-bold" data-testid="text-team-not-found">Team not found</h2>
          <Link href="/" className="text-primary hover:underline mt-4" data-testid="link-back-home">
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const team = useMemo(() => {
    const apiTeam = teamData?.response?.[0];
    if (!apiTeam) return fallbackTeamAsTeam;
    if (!fallbackTeamAsTeam) return apiTeam;
    return {
      ...fallbackTeamAsTeam,
      ...apiTeam,
      stadium: apiTeam.stadium || fallbackTeamAsTeam.stadium,
      founded: apiTeam.founded || fallbackTeamAsTeam.founded,
      description: apiTeam.description || fallbackTeamAsTeam.description,
      logo: apiTeam.logo || fallbackTeamAsTeam.logo,
      honours: apiTeam.honours || fallbackTeamAsTeam.honours,
    };
  }, [teamData, fallbackTeamAsTeam]);

  const teamThemeId = useMemo(() => {
    const name = team?.name || fallbackTeamAsTeam?.name || fallbackTeam?.name;
    if (!name) return null;
    const normalized = slugify(name);
    const matchTheme = AVAILABLE_TEAMS.find((entry) => slugify(entry.name) === normalized);
    return matchTheme?.themeId ?? null;
  }, [team?.name, fallbackTeamAsTeam, fallbackTeam]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (!teamThemeId) {
      if (previousTeamThemeRef.current !== null) {
        if (previousTeamThemeRef.current) {
          root.setAttribute("data-team", previousTeamThemeRef.current);
        } else {
          root.removeAttribute("data-team");
        }
        previousTeamThemeRef.current = null;
      }
      return;
    }

    if (previousTeamThemeRef.current === null) {
      previousTeamThemeRef.current = root.getAttribute("data-team");
    }
    root.setAttribute("data-team", teamThemeId);

    return () => {
      if (previousTeamThemeRef.current !== null) {
        if (previousTeamThemeRef.current) {
          root.setAttribute("data-team", previousTeamThemeRef.current);
        } else {
          root.removeAttribute("data-team");
        }
        previousTeamThemeRef.current = null;
      } else {
        root.removeAttribute("data-team");
      }
    };
  }, [teamThemeId]);

  const honourItems = useMemo(() => {
    const honours = team?.honours;
    if (!honours) return [];
    return [
      { label: "Premierships", years: honours.premierships || [] },
      { label: "Minor Premierships", years: honours.minorPremierships || [] },
      { label: "World Club Challenge", years: honours.worldClubChallenge || [] },
      { label: "Super League Titles", years: honours.superLeagueTitles || [] },
      { label: "Challenge Cup", years: honours.challengeCup || [] },
      { label: "League Leaders’ Shield", years: honours.leagueLeadersShield || [] },
    ];
  }, [team]);
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
    if (!teamIdKey) {
      return { wins: 0, losses: 0, draws: 0, avgFor: 0, avgAgainst: 0 };
    }

    const completed = pastGames.filter(game => {
      const isHome = String(game.teams.home?.id) === teamIdKey;
      const isAway = String(game.teams.away?.id) === teamIdKey;
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
        const isHome = String(game.teams.home?.id) === teamIdKey;
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
  }, [pastGames, teamIdKey]);

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

        <section className="grid gap-4 md:grid-cols-[1.4fr,1fr]">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <div>
              <h2 className="font-display text-xl font-bold">Club Overview</h2>
              <p className="text-xs text-muted-foreground">Bio & history</p>
            </div>
            {team.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {team.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                A full club history and background will appear here as soon as details are available.
              </p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
              Club Details
            </h3>
            <div className="space-y-3 text-sm">
              <InfoRow label="League" value={team.league || "Rugby League"} />
              <InfoRow label="Home ground" value={team.stadium || "TBC"} />
              <InfoRow label="Established" value={team.founded || "—"} />
              <InfoRow label="Country" value={team.country?.name || "—"} />
            </div>
          </div>
        </section>

        {team.honours && (
          <section className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Honours</h3>
              <p className="text-xs text-muted-foreground">Major titles and trophies</p>
            </div>
          </div>
          {honourItems.length > 0 && honourItems.some((item) => item.years.length > 0) ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {honourItems
                .filter((item) => item.years.length > 0)
                .map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-background/60 p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <span className="text-xs text-muted-foreground">{item.years.length}</span>
                    </div>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {item.years.join(", ")}
                      </p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No major honours recorded yet.</p>
          )}
          </section>
        )}

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
                    <GameCard key={game.id} game={game} teamId={teamIdKey ?? ""} />
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
                    <GameCard key={game.id} game={game} teamId={teamIdKey ?? ""} />
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
                    <GameCard key={game.id} game={game} teamId={teamIdKey ?? ""} />
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
                        className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer group min-h-[120px]"
                        data-testid={`card-player-${player.id}`}
                      >
                        <div className="flex items-center gap-4">
                          {team.logo ? (
                            <img 
                              src={team.logo} 
                              alt={team.name} 
                              className="w-16 h-16 object-contain"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                              {player.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-semibold truncate group-hover:text-primary transition-colors">{player.name}</div>
                              <div className="w-9 h-9 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                {player.number ?? "—"}
                              </div>
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center justify-between gap-3">
                                <span className="uppercase tracking-wide">Squad #</span>
                                <span className="font-semibold text-foreground">{player.number ?? "—"}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="uppercase tracking-wide">Position</span>
                                <span className="font-semibold text-foreground truncate">
                                  {player.position || fallbackPositionFromNumber(player.number) || "Utility"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {(() => {
                                const flags = getFlagUrls(
                                  player.nationality,
                                  player.nationalitySecondary,
                                  team.country?.flag
                                );
                                if (flags.length === 0) {
                                  return <span>—</span>;
                                }
                                return flags.map((flagUrl, index) => (
                                  <img
                                    key={flagUrl || index}
                                    src={flagUrl}
                                    alt={player.nationality || team.country?.name || "Flag"}
                                    className="w-6 h-4 object-cover rounded-sm"
                                    loading="lazy"
                                  />
                                ));
                              })()}
                            </div>
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

function fallbackPositionFromNumber(raw?: string | number | null) {
  if (raw === null || raw === undefined) return null;
  const num = typeof raw === "string" ? parseInt(raw, 10) : raw;
  if (!Number.isFinite(num)) return null;
  switch (num) {
    case 1:
      return "Fullback";
    case 2:
    case 5:
      return "Wing";
    case 3:
    case 4:
      return "Centre";
    case 6:
      return "Stand-off";
    case 7:
      return "Halfback";
    case 8:
    case 10:
      return "Prop";
    case 9:
      return "Hooker";
    case 11:
    case 12:
      return "Second-row";
    case 13:
      return "Loose forward";
    default:
      return null;
  }
}

function getFlagUrl(nationality?: string | null, fallbackFlag?: string | null) {
  if (!nationality) return fallbackFlag || null;
  const key = nationality.trim().toLowerCase();
  const map: Record<string, string> = {
    australia: "au",
    "new zealand": "nz",
    "cook islands": "ck",
    england: "gb-eng",
    "united kingdom": "gb",
    wales: "gb-wls",
    scotland: "gb-sct",
    ireland: "ie",
    france: "fr",
    jamaica: "jm",
    fiji: "fj",
    tonga: "to",
    samoa: "ws",
    "papua new guinea": "pg",
    "united states": "us",
    italy: "it",
    lebanon: "lb",
    brazil: "br",
    turkey: "tr",
    serbia: "rs",
    "czech republic": "cz",
    croatia: "hr",
    "south africa": "za",
    zimbabwe: "zw",
  };
  const code = map[key];
  if (!code) return fallbackFlag || null;
  return `https://flagcdn.com/w40/${code}.png`;
}

function getFlagUrls(
  nationality?: string | null,
  secondary?: string | null,
  fallbackFlag?: string | null
) {
  const flags: string[] = [];
  const primaryFlag = getFlagUrl(nationality, fallbackFlag);
  if (primaryFlag) flags.push(primaryFlag);
  const normalizedPrimary = nationality?.trim().toLowerCase();
  const normalizedSecondary = secondary?.trim().toLowerCase();
  if (normalizedSecondary && normalizedSecondary !== normalizedPrimary) {
    const secondaryFlag = getFlagUrl(secondary, null);
    if (secondaryFlag && secondaryFlag !== primaryFlag) {
      flags.push(secondaryFlag);
    }
  }
  return flags.length ? flags : [];
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function GameCard({ game, teamId }: { game: Game; teamId: string }) {
  if (!game.teams?.home || !game.teams?.away || !game.scores || !game.status) {
    return null;
  }
  
  const isHome = String(game.teams.home.id) === teamId;
  const opponent = isHome ? game.teams.away : game.teams.home;
  const opponentLogo = resolveTeamLogo(opponent, game.league?.name);
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
                    {formatTime(game.time)}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex-1 flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              {opponentLogo ? (
                <img src={opponentLogo} alt={opponent.name} className="w-10 h-10 object-contain" />
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

const TEAM_LOGO_BY_LEAGUE = LOCAL_TEAMS.reduce<Record<string, Record<string, string | null>>>((acc, team) => {
  const leagueKey = team.league?.toLowerCase().includes("super") ? "super" : "nrl";
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

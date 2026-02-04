import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import LeagueFilter from "@/components/LeagueFilter";
import { StandingsTeam, FEATURED_LEAGUES } from "@shared/schema";
import { usePreferredLeague } from "@/hooks/usePreferredLeague";
import { LOCAL_TEAMS } from "@shared/localTeams";

export default function LeagueTables() {
  const { selectedLeague, setSelectedLeague } = usePreferredLeague();

  const { data: standingsData, isLoading } = useQuery<{ response: StandingsTeam[][] }>({
    queryKey: ["standings", selectedLeague],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/standings?league=${encodeURIComponent(selectedLeague)}`);
      if (!res.ok) throw new Error("Failed to fetch standings");
      return res.json();
    },
  });

  const standings = standingsData?.response?.[0] || [];
  const shouldShowPlaceholder = !isLoading && standings.length === 0;
  const placeholderStandings = shouldShowPlaceholder ? buildPlaceholderStandings(selectedLeague) : [];
  const resolvedStandings = shouldShowPlaceholder ? placeholderStandings : standings;
  const displayLeagueName = FEATURED_LEAGUES.find(l => l.id === selectedLeague)?.name || selectedLeague;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
            <Trophy className="w-8 h-8 text-primary" />
            League Tables
          </h1>
          <p className="text-muted-foreground mt-1">Full standings for {displayLeagueName}</p>
        </div>

        {/* League Filter Buttons - Always Visible */}
        <LeagueFilter selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} />

        <div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4 mb-6">
            <h3 className="font-bold mb-3 text-sm">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Playoff Position</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Relegation Zone</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="animate-pulse">
                <div className="h-12 bg-muted" />
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-16 border-t border-border bg-muted/50" />
                ))}
              </div>
            </div>
          ) : resolvedStandings.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                {shouldShowPlaceholder && (
                  <div className="bg-amber-50 text-amber-900 text-sm px-4 py-3 border-b border-border">
                    Showing 2026 team lineup while live standings are unavailable.
                  </div>
                )}
                <table className="w-full" data-testid="table-standings">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground w-12">#</th>
                      <th className="text-left py-4 px-4 font-semibold text-sm text-muted-foreground">Team</th>
                      <th className="text-center py-4 px-2 font-semibold text-sm text-muted-foreground w-12">P</th>
                      <th className="text-center py-4 px-2 font-semibold text-sm text-muted-foreground w-12">W</th>
                      <th className="text-center py-4 px-2 font-semibold text-sm text-muted-foreground w-12">D</th>
                      <th className="text-center py-4 px-2 font-semibold text-sm text-muted-foreground w-12">L</th>
                      <th className="text-center py-4 px-2 font-semibold text-sm text-muted-foreground w-16 hidden md:table-cell">PF</th>
                      <th className="text-center py-4 px-2 font-semibold text-sm text-muted-foreground w-16 hidden md:table-cell">PA</th>
                      <th className="text-center py-4 px-2 font-semibold text-sm text-muted-foreground w-16">+/-</th>
                      <th className="text-center py-4 px-4 font-semibold text-sm text-muted-foreground w-16">PTS</th>
                      <th className="text-center py-4 px-4 font-semibold text-sm text-muted-foreground w-24 hidden md:table-cell">Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolvedStandings.map((row, index) => (
                      <tr 
                        key={row.team?.id || index} 
                        className={cn(
                          "border-t border-border hover:bg-muted/30 transition-colors",
                          index < 4 && "border-l-4 border-l-green-500",
                          index >= standings.length - 2 && "border-l-4 border-l-red-500"
                        )}
                        data-testid={`row-team-${row.team?.id || index}`}
                      >
                        <td className="py-4 px-4 font-bold text-muted-foreground">{row.position || index + 1}</td>
                        <td className="py-4 px-4">
                          <Link href={`/team/${row.team?.id}`}>
                            <div className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors" data-testid={`link-team-${row.team?.id}`}>
                              {row.team?.logo ? (
                                <img 
                                  src={row.team.logo} 
                                  alt={row.team.name} 
                                  className="w-8 h-8 object-contain"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                                  {row.team?.name?.slice(0, 2) || "??"}
                                </div>
                              )}
                              <span className="font-medium">{row.team?.name || "Unknown"}</span>
                            </div>
                          </Link>
                        </td>
                        <td className="py-4 px-2 text-center font-medium">{row.games?.played ?? 0}</td>
                        <td className="py-4 px-2 text-center font-medium text-green-500">{row.games?.win ?? 0}</td>
                        <td className="py-4 px-2 text-center font-medium text-muted-foreground">{row.games?.draw ?? 0}</td>
                        <td className="py-4 px-2 text-center font-medium text-red-500">{row.games?.lose ?? 0}</td>
                        <td className="py-4 px-2 text-center hidden md:table-cell">{row.points?.for ?? 0}</td>
                        <td className="py-4 px-2 text-center hidden md:table-cell">{row.points?.against ?? 0}</td>
                        <td className={cn(
                          "py-4 px-2 text-center font-medium",
                          (row.points?.difference ?? 0) > 0 ? "text-green-500" : 
                          (row.points?.difference ?? 0) < 0 ? "text-red-500" : "text-muted-foreground"
                        )}>
                          {(row.points?.difference ?? 0) > 0 ? "+" : ""}{row.points?.difference ?? 0}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-bold text-lg text-primary">{row.pts ?? 0}</span>
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            {(row.form || "").split("").slice(-5).map((result, i) => (
                              <span 
                                key={i}
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                                  result === "W" ? "bg-green-500" :
                                  result === "L" ? "bg-red-500" :
                                  result === "D" ? "bg-gray-500" :
                                  "bg-muted text-muted-foreground"
                                )}
                              >
                                {result}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium text-lg mb-2">No Standings Available</h3>
              <p>League table data for {displayLeagueName} is not available yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function buildPlaceholderStandings(leagueId: string): StandingsTeam[] {
  const teams = LOCAL_TEAMS.filter(team => team.league === leagueId);
  return teams.map((team, index) => ({
    position: index + 1,
    team: {
      id: Number(team.id) || index + 1,
      name: team.name,
      logo: team.logo,
    },
    games: {
      played: 0,
      win: 0,
      draw: 0,
      lose: 0,
    },
    points: {
      for: 0,
      against: 0,
      difference: 0,
    },
    pts: 0,
    form: "-----",
  }));
}

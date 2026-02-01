import { Layout } from "@/components/Layout";
import { GlobalSearch } from "@/components/GlobalSearch";
import LeagueFilter from "@/components/LeagueFilter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Users, ChevronRight } from "lucide-react";
import { Team, FEATURED_LEAGUES } from "@shared/schema";
import { usePreferredLeague } from "@/hooks/usePreferredLeague";
import { LOCAL_TEAMS } from "@shared/localTeams";

export default function Teams() {
  const { selectedLeague, setSelectedLeague } = usePreferredLeague();

  const { data: teamsData, isLoading } = useQuery<{ response: Team[] }>({
    queryKey: ["teams", selectedLeague],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/teams?league=${encodeURIComponent(selectedLeague)}`);
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });

  const teams = teamsData?.response || [];
  const localTeams = LOCAL_TEAMS.filter((team) => {
    const leagueLower = selectedLeague.toLowerCase();
    if (leagueLower.includes("super")) return team.league === "Super League";
    if (leagueLower.includes("nrl") || leagueLower.includes("national")) return team.league === "NRL";
    return team.league === selectedLeague;
  });
  const resolvedTeams = (() => {
    const merged = [...teams, ...localTeams];
    const unique = new Map<string, Team>();
    merged.forEach((team) => {
      const key = team.id || team.name;
      if (key && !unique.has(key)) {
        unique.set(key, team);
      }
    });
    return Array.from(unique.values());
  })();
  const displayLeagueName = FEATURED_LEAGUES.find(l => l.id === selectedLeague)?.name || selectedLeague;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
              <Users className="w-8 h-8 text-primary" />
              Teams
            </h1>
            <p className="text-muted-foreground mt-1">Browse teams from {displayLeagueName}</p>
          </div>

          <div className="w-full max-w-md">
            <GlobalSearch />
          </div>
        </div>

        {/* League Filter Buttons - Always Visible */}
        <LeagueFilter selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} />

        <div>
          {/* Team Count Stat */}
          <div className="mb-4 inline-block bg-card border border-border rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Teams</p>
            <div className="text-2xl sm:text-3xl font-bold text-primary" data-testid="stat-teams-count">
              {resolvedTeams.length}
            </div>
          </div>

          {/* Teams Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-6">
                  <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4" />
                  <div className="h-5 bg-muted rounded w-3/4 mx-auto mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : resolvedTeams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resolvedTeams.map((team) => (
                <Link key={team.id} href={`/team/${team.id}`} data-testid={`link-team-${team.id}`}>
                  <div 
                    className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                    data-testid={`card-team-${team.id}`}
                  >
                    <div className="flex items-center gap-4">
                      {team.logo ? (
                        <img 
                          src={team.logo} 
                          alt={team.name} 
                          className="w-16 h-16 object-contain group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {team.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {team.country?.name || displayLeagueName}
                        </p>
                        {team.stadium && (
                          <p className="text-xs text-muted-foreground truncate">
                            Home ground: {team.stadium}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-primary mt-2 group-hover:gap-2 transition-all">
                          <span>View squad</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium text-lg mb-2">No Teams Found</h3>
              <p>No teams available for {displayLeagueName}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

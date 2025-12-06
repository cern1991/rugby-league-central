import { Layout } from "@/components/Layout";
import { TeamSearch } from "@/components/TeamSearch";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Users, Filter, X, ChevronRight, Search } from "lucide-react";
import { Team, FEATURED_LEAGUES } from "@shared/schema";

export default function Teams() {
  const [selectedLeague, setSelectedLeague] = useState<string>("NRL");
  const [showFilters, setShowFilters] = useState(false);

  const { data: teamsData, isLoading } = useQuery<{ response: Team[] }>({
    queryKey: ["teams", selectedLeague],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/teams?league=${encodeURIComponent(selectedLeague)}`);
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });

  const teams = teamsData?.response || [];
  const displayLeagueName = FEATURED_LEAGUES.find(l => l.id === selectedLeague)?.name || selectedLeague;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
              <Users className="w-8 h-8 text-primary" />
              Teams
            </h1>
            <p className="text-muted-foreground mt-1">Browse teams from {displayLeagueName}</p>
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

        <div className="max-w-xl">
          <TeamSearch />
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
                  Select League
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
              <h3 className="font-bold mb-3 text-sm">Team Count</h3>
              <div className="text-3xl font-bold text-primary" data-testid="stat-teams-count">
                {teams.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">teams in {displayLeagueName}</p>
            </div>
          </aside>

          <div className="lg:col-span-3">
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
            ) : teams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
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
      </div>
    </Layout>
  );
}

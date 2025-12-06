import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, ChevronRight, Users, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: any[];
  results: number;
  response: T;
}

export function TeamSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading, error } = useQuery<ApiResponse<Team[]>>({
    queryKey: ["search-teams", searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/teams/search?name=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Failed to search teams");
      return res.json();
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30000,
  });

  const teams = data?.response || [];
  const rugbyLeagueTeams = teams.filter(team => {
    const name = team.name.toLowerCase();
    return !name.includes("union") && 
           !name.includes("sevens") && 
           !name.includes("7s") &&
           !name.includes("women");
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-display font-bold">Find Your Team</h2>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary hover:underline"
          data-testid="button-toggle-team-search"
        >
          {isExpanded ? "Hide" : "Show"}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search teams by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-team-search"
            />
          </div>

          {isLoading && searchQuery.length >= 2 && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {error && searchQuery.length >= 2 && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive" data-testid="error-team-search">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Search failed</p>
                <p className="text-sm opacity-80">Unable to search teams. Please try again later.</p>
              </div>
            </div>
          )}

          {!isLoading && !error && rugbyLeagueTeams.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rugbyLeagueTeams.slice(0, 9).map((team) => (
                <Link key={team.id} href={`/team/${team.id}`}>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                    data-testid={`card-team-${team.id}`}
                  >
                    {team.logo ? (
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{team.name}</div>
                      {team.country && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {team.country.flag && (
                            <img
                              src={team.country.flag}
                              alt={team.country.name}
                              className="w-4 h-3 object-cover"
                            />
                          )}
                          {team.country.name}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!isLoading && !error && searchQuery.length >= 2 && rugbyLeagueTeams.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No teams found matching "{searchQuery}"
            </div>
          )}

          {searchQuery.length < 2 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Enter at least 2 characters to search for teams
            </div>
          )}
        </div>
      )}
    </div>
  );
}

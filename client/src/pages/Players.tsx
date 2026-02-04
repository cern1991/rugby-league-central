import { Layout } from "@/components/Layout";
import LeagueFilter from "@/components/LeagueFilter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { UserRound, Search } from "lucide-react";
import { usePreferredLeague } from "@/hooks/usePreferredLeague";
import { cn } from "@/lib/utils";
import { getDisplayTeamName, normalizeLeagueKey } from "@/lib/teamDisplay";

interface PlayerListItem {
  id: string;
  name: string;
  position?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  league?: string | null;
  number?: string | null;
  teamLogo?: string | null;
  image?: string | null;
}

export default function Players() {
  const { selectedLeague, setSelectedLeague } = usePreferredLeague();
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [sortMode, setSortMode] = useState("surname-asc");

  useEffect(() => {
    try {
      const storedTeam = sessionStorage.getItem(`rlc-players-team-${selectedLeague}`);
      const storedPosition = sessionStorage.getItem(`rlc-players-position-${selectedLeague}`);
      const storedSort = sessionStorage.getItem(`rlc-players-sort-${selectedLeague}`);
      if (storedTeam) setTeamFilter(storedTeam);
      if (storedPosition) setPositionFilter(storedPosition);
      if (storedSort) setSortMode(storedSort);
    } catch {
      // ignore storage errors
    }
  }, [selectedLeague]);

  useEffect(() => {
    try {
      sessionStorage.setItem(`rlc-players-team-${selectedLeague}`, teamFilter);
      sessionStorage.setItem(`rlc-players-position-${selectedLeague}`, positionFilter);
      sessionStorage.setItem(`rlc-players-sort-${selectedLeague}`, sortMode);
    } catch {
      // ignore storage errors
    }
  }, [selectedLeague, teamFilter, positionFilter, sortMode]);

  const { data: teamsData } = useQuery<{ response: Array<{ id: string; name: string; logo?: string | null }> }>({
    queryKey: ["teams", "players", selectedLeague],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/teams?league=${encodeURIComponent(selectedLeague)}`);
      if (!res.ok) throw new Error("Failed to fetch teams for players");
      return res.json();
    },
  });

  const teamLogoById = useMemo(() => {
    const map = new Map<string, string>();
    (teamsData?.response || []).forEach((team) => {
      if (team?.id && team?.logo) {
        map.set(String(team.id), team.logo);
      }
    });
    return map;
  }, [teamsData]);

  const { data, isLoading } = useQuery<{ response: PlayerListItem[] }>({
    queryKey: ["players", selectedLeague],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/players?league=${encodeURIComponent(selectedLeague)}`);
      if (res.ok) {
        return res.json();
      }
      if (res.status !== 404) {
        throw new Error("Failed to fetch players");
      }

      const teams = teamsData?.response || [];
      if (!teams.length) {
        return { response: [] };
      }

      const playerResponses = await Promise.all(
        teams.map(async (team: { id: string; name: string; league?: string }) => {
          const teamRes = await fetch(`/api/rugby/team/${encodeURIComponent(team.id)}/players`);
          if (!teamRes.ok) return [];
          const data = await teamRes.json();
          const response = data?.response || [];
          return response.map((player: any) => ({
            id: player.id,
            name: player.name,
            position: player.position || "",
            teamId: String(team.id),
            teamName: team.name,
            league: team.league || selectedLeague,
            number: player.number || null,
            teamLogo: teamLogoById.get(String(team.id)) || null,
            image: player.thumbnail || player.photo || null,
          }));
        })
      );

      return { response: playerResponses.flat() };
    },
    enabled: !!teamsData,
  });

  const players = useMemo(() => {
    const leagueKey = normalizeLeagueKey(selectedLeague);
    const filtered = (data?.response || [])
      .filter((player) => normalizeLeagueKey(player.league || selectedLeague) === leagueKey)
      .map((player) => ({
        ...player,
        teamName: getDisplayTeamName(player.teamId, player.teamName, player.league),
        teamLogo: player.teamLogo || (player.teamId ? teamLogoById.get(String(player.teamId)) || null : null),
      }));
    const seen = new Set<string>();
    return filtered.filter((player) => {
      const key = player.id || `${player.name}-${player.teamId || player.teamName || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data, teamLogoById, selectedLeague]);

  const teamOptions = useMemo(() => {
    const map = new Map<string, string>();
    players.forEach((player) => {
      if (player.teamId && player.teamName) {
        map.set(player.teamId, player.teamName);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [players]);

  const positionOptions = useMemo(() => {
    const map = new Map<string, string>();
    players.forEach((player) => {
      const position = player.position?.trim();
      if (position) {
        map.set(position.toLowerCase(), position);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    const matched = players.filter((player) => {
      if (teamFilter !== "all" && player.teamId !== teamFilter) return false;
      if (positionFilter !== "all" && player.position !== positionFilter) return false;
      if (!lowerQuery) return true;
      return player.name.toLowerCase().includes(lowerQuery);
    });
    const getSurname = (name: string) => {
      const parts = name.trim().split(/\s+/);
      return parts[parts.length - 1] || name;
    };
    const sorter = (a: PlayerListItem, b: PlayerListItem) => {
      if (sortMode.startsWith("surname")) {
        const aSurname = getSurname(a.name);
        const bSurname = getSurname(b.name);
        const cmp = aSurname.localeCompare(bSurname) || a.name.localeCompare(b.name);
        return sortMode.endsWith("desc") ? -cmp : cmp;
      }
      if (sortMode.startsWith("position")) {
        const aPos = a.position || "";
        const bPos = b.position || "";
        const cmp = aPos.localeCompare(bPos) || a.name.localeCompare(b.name);
        return sortMode.endsWith("desc") ? -cmp : cmp;
      }
      const cmp = a.name.localeCompare(b.name);
      return sortMode.endsWith("desc") ? -cmp : cmp;
    };
    return matched.sort(sorter);
  }, [players, query, teamFilter, positionFilter, sortMode]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
              <UserRound className="w-8 h-8 text-primary" />
              Players
            </h1>
            <p className="text-muted-foreground mt-1">Browse player profiles across the league</p>
          </div>
        </div>

        <LeagueFilter selectedLeague={selectedLeague} setSelectedLeague={setSelectedLeague} />

        <div className="space-y-3">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search players"
              className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-testid="input-player-search"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Team</span>
              <select
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                data-testid="select-team-filter"
              >
                <option value="all">All teams</option>
                {teamOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Position</span>
              <select
                value={positionFilter}
                onChange={(event) => setPositionFilter(event.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                data-testid="select-position-filter"
              >
                <option value="all">All positions</option>
                {positionOptions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Sort</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                data-testid="select-player-sort"
              >
                <option value="surname-asc">Surname A–Z</option>
                <option value="surname-desc">Surname Z–A</option>
                <option value="position-asc">Position A–Z</option>
                <option value="position-desc">Position Z–A</option>
              </select>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredPlayers.length}</span>
          players
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-card border border-border rounded-xl p-6">
                <div className="w-16 h-16 bg-muted rounded-full mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlayers.map((player) => (
              <Link key={player.id} href={`/player/${encodeURIComponent(player.id)}`}>
                <div
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                  data-testid={`card-player-${player.id}`}
                >
                  <div className="flex items-center gap-4">
                    {player.teamLogo ? (
                      <img
                        src={player.teamLogo}
                        alt={player.name}
                        className="w-14 h-14 object-contain"
                      />
                    ) : player.image ? (
                      <img
                        src={player.image}
                        alt={player.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                        {player.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate group-hover:text-primary transition-colors">
                        {player.name}
                      </div>
                      <div className="text-sm text-primary truncate">
                        {player.position || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {player.teamName || player.league || selectedLeague}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full border flex items-center justify-center text-sm font-semibold",
                        player.number
                          ? "border-primary/30 text-primary bg-primary/5"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {player.number ?? "—"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            <UserRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No players found</p>
            <p className="text-sm mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

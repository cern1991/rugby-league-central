import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Search, Loader2, Users, UserCircle2, Newspaper, CalendarDays, Trophy } from "lucide-react";
import { cacheNewsArticle, encodeNewsLink } from "@/lib/news";
import { usePreferredLeague } from "@/hooks/usePreferredLeague";
import type { NewsItem } from "@shared/schema";

const MIN_QUERY_LENGTH = 2;
const TRENDING_SEARCHES = [
  "Wigan Warriors",
  "Leeds Rhinos",
  "Brisbane Broncos",
  "Hull Kingston Rovers",
  "State of Origin",
];

const EMPTY_RESULTS = {
  teams: [] as TeamResult[],
  players: [] as PlayerResult[],
  games: [] as GameResult[],
  news: [] as NewsResult[],
  tables: [] as TableResult[],
};

interface TeamResult {
  id: string;
  name: string;
  logo?: string | null;
  league?: string;
  country?: { name?: string };
}

interface PlayerResult {
  id: string;
  name: string;
  position?: string;
  team?: string;
  league?: string;
  image?: string;
}

interface GameResult {
  id: string;
  league?: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time?: string;
  venue?: string;
  round?: string;
}

interface NewsResult {
  id: string;
  title: string;
  link: string;
  source: string;
  pubDate?: string;
  league?: string;
  image?: string;
}

interface TableResult {
  id: string;
  name: string;
  description?: string;
}

interface Props {
  className?: string;
}

export function GlobalSearch({ className }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { setSelectedLeague } = usePreferredLeague();
  const charactersNeeded = Math.max(MIN_QUERY_LENGTH - query.trim().length, 0);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(handle);
  }, [query]);

  const { data, isFetching, isError } = useQuery<{ response: typeof EMPTY_RESULTS }>({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/rugby/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
    staleTime: 60 * 1000,
  });

  const results = data?.response ?? EMPTY_RESULTS;
  const hasResults = useMemo(() => {
    return (
      results.teams.length > 0 ||
      results.players.length > 0 ||
      results.games.length > 0 ||
      results.news.length > 0 ||
      results.tables.length > 0
    );
  }, [results]);

  const shouldDisplayPanel = isFocused || debouncedQuery.length >= MIN_QUERY_LENGTH;
  const hasMinimumQuery = debouncedQuery.length >= MIN_QUERY_LENGTH;

  return (
    <div className={cn("space-y-4", className)}>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search rugby league teams, players, competitions..."
          className="pl-10"
          data-testid="input-global-search"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>

      {shouldDisplayPanel && (
        <div className="border border-border rounded-xl p-4 bg-card/60">
          {!hasMinimumQuery ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">Keep typing</span>
                <span>
                  {charactersNeeded} more character{charactersNeeded === 1 ? "" : "s"} to start searching.
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setQuery(term);
                      setDebouncedQuery(term);
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching the rugby world...
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">Something went wrong while searching. Please try again.</p>
          ) : !hasResults ? (
            <p className="text-sm text-muted-foreground">
              No matches found for “{debouncedQuery}”. Try another team, player, or fixture.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {results.teams.length > 0 && (
                <ResultSection title="Teams" icon={<Users className="w-4 h-4" />}>
                  {results.teams.map((team) => (
                    <Link
                      key={team.id}
                      href={`/team/${team.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2 hover:border-primary/60 transition-colors"
                    >
                      {team.logo ? (
                        <img src={team.logo} alt={team.name} className="w-9 h-9 rounded-md object-contain" loading="lazy" />
                      ) : (
                        <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-xs font-bold">
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium leading-tight truncate">{team.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {team.league || team.country?.name || "Rugby League"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </ResultSection>
              )}

              {results.players.length > 0 && (
                <ResultSection title="Players" icon={<UserCircle2 className="w-4 h-4" />}>
                  {results.players.map((player) => (
                    <Link
                      key={player.id}
                      href={`/player/${encodeURIComponent(player.id)}`}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2 hover:border-primary/60 transition-colors"
                    >
                      <img
                        src={player.image}
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover object-center bg-muted"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <p className="font-medium leading-tight truncate">{player.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {player.position || "Player"} · {player.team || player.league || "Rugby League"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </ResultSection>
              )}

              {results.games.length > 0 && (
                <ResultSection title="Fixtures" icon={<CalendarDays className="w-4 h-4" />}>
                  {results.games.map((game) => (
                    <Link
                      key={game.id}
                      href={`/match/${encodeURIComponent(game.id)}`}
                      className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 hover:border-primary/60 transition-colors"
                    >
                      <p className="font-semibold text-sm">
                        {game.homeTeam} <span className="text-muted-foreground">vs</span> {game.awayTeam}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {game.league} · {game.round || "Upcoming"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {game.date} {game.time && `· ${game.time}`} {game.venue && `· ${game.venue}`}
                      </p>
                    </Link>
                  ))}
                </ResultSection>
              )}

              {results.news.length > 0 && (
                <ResultSection title="News" icon={<Newspaper className="w-4 h-4" />}>
                  {results.news.map((article) => {
                    const encodedLink = encodeNewsLink(article.link);
                    const cachedArticle: NewsItem = {
                      title: article.title,
                      link: article.link,
                      pubDate: article.pubDate || "",
                      source: article.source,
                      league: article.league,
                      image: article.image,
                    };
                    return (
                      <Link
                        key={article.id}
                        href={`/news/article/${encodedLink}`}
                        className="flex gap-3 rounded-lg border border-border/60 bg-background/80 hover:border-primary/60 transition-colors"
                        onClick={() => cacheNewsArticle(article.link, cachedArticle)}
                      >
                        {article.image && (
                          <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-l-lg bg-muted flex items-center justify-center">
                            <img src={article.image} alt={article.title} className="w-full h-full object-contain" loading="lazy" />
                          </div>
                        )}
                        <div className="py-2 pr-3 min-w-0">
                          <p className="font-medium text-sm leading-snug line-clamp-2">{article.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {article.source}
                            {article.pubDate ? ` · ${article.pubDate}` : ""}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </ResultSection>
              )}

              {results.tables.length > 0 && (
                <ResultSection title="Tables" icon={<Trophy className="w-4 h-4" />}>
                  {results.tables.map((table) => (
                    <Link
                      key={table.id}
                      href="/tables"
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2 hover:border-primary/60 transition-colors"
                      onClick={() => setSelectedLeague(table.id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{table.name}</p>
                        <p className="text-xs text-muted-foreground">{table.description}</p>
                      </div>
                      <span className="text-xs text-primary font-medium">View</span>
                    </Link>
                  ))}
                </ResultSection>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

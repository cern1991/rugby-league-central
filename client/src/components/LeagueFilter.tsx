import { cn } from "@/lib/utils";
import { FEATURED_LEAGUES } from "@shared/schema";

interface Props {
  selectedLeague: string;
  setSelectedLeague: (id: string) => void;
  className?: string;
}

export function LeagueFilter({ selectedLeague, setSelectedLeague, className }: Props) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-2">
        {FEATURED_LEAGUES.map((league) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id)}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
              selectedLeague === league.id
                ? "border-primary bg-primary text-primary-foreground shadow-lg"
                : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent"
            )}
            data-testid={`filter-league-${league.shortName.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {league.logo ? (
              <span className="h-12 w-12 rounded-xl bg-background/80 flex items-center justify-center ring-1 ring-border">
                <img
                  src={league.logo}
                  alt={`${league.name} logo`}
                  className="h-8 w-8 object-contain"
                  loading="lazy"
                />
              </span>
            ) : (
              <span className="text-lg sm:text-xl">{league.icon}</span>
            )}
            <div className="text-left">
              <p
                className={cn(
                  "text-xs uppercase tracking-wide",
                  selectedLeague === league.id ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                Follow
              </p>
              <p className="font-semibold text-base">{league.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LeagueFilter;

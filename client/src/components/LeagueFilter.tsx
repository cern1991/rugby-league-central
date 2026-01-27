import { cn } from "@/lib/utils";
import { FEATURED_LEAGUES } from "@shared/schema";

interface Props {
  selectedLeague: string;
  setSelectedLeague: (id: string) => void;
  className?: string;
}

export function LeagueFilter({ selectedLeague, setSelectedLeague, className }: Props) {
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {FEATURED_LEAGUES.filter((league) => league.id !== "Championship").map((league) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id)}
            className={cn(
              "flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors border",
              selectedLeague === league.id
                ? "bg-primary/10 text-primary border-primary/40 shadow-sm"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
            )}
            data-testid={`filter-league-${league.shortName.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {league.logo ? (
              <span className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-white/10 ring-1 ring-black/5 dark:ring-white/10">
                <img
                  src={league.logo}
                  alt={`${league.name} logo`}
                  className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                  loading="lazy"
                />
              </span>
            ) : (
              <span className="text-lg sm:text-xl">{league.icon}</span>
            )}
            <span>{league.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LeagueFilter;

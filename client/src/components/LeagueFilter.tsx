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
        {FEATURED_LEAGUES.map((league) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id)}
            className={cn(
              "flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200",
              selectedLeague === league.id
                ? "bg-gradient-to-br shadow-lg shadow-primary/20 text-white"
                : "bg-card border border-border hover:border-primary/50 text-foreground hover:bg-muted"
            )}
            style={
              selectedLeague === league.id
                ? { backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }
                : {}
            }
            data-testid={`filter-league-${league.shortName.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span className="text-lg sm:text-xl">{league.icon}</span>
            <span>{league.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LeagueFilter;

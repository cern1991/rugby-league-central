import { Layout } from "@/components/Layout";
import { ScoreCard } from "@/components/ScoreCard";
import { NewsCard } from "@/components/NewsCard";
import { MOCK_GAMES, MOCK_NEWS, LEAGUES, LeagueType } from "@/lib/mockData";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Globe, Flag } from "lucide-react";

type FilterRegion = "All" | "Australia" | "England" | "International" | "Pacific";

const regionGroups: Record<FilterRegion, LeagueType[]> = {
  "All": [],
  "Australia": ["NRL", "State of Origin", "QLD Cup", "NSW Cup"],
  "England": ["Super League", "Championship", "League 1", "Betfred Challenge Cup"],
  "International": ["International"],
  "Pacific": ["PNG Digicel Cup", "NZRL Premiership", "Elite One"],
};

export default function Home() {
  const [activeRegion, setActiveRegion] = useState<FilterRegion>("All");
  const [activeLeague, setActiveLeague] = useState<LeagueType | "All">("All");
  const [showAllLeagues, setShowAllLeagues] = useState(false);

  const availableLeagues = activeRegion === "All" 
    ? LEAGUES 
    : LEAGUES.filter(l => regionGroups[activeRegion].includes(l.id));

  const filteredGames = activeLeague === "All" 
    ? (activeRegion === "All" 
        ? MOCK_GAMES 
        : MOCK_GAMES.filter(g => regionGroups[activeRegion].includes(g.league)))
    : MOCK_GAMES.filter(g => g.league === activeLeague);

  const liveGames = filteredGames.filter(g => g.status === "Live");
  const upcomingGames = filteredGames.filter(g => g.status === "Upcoming");
  const completedGames = filteredGames.filter(g => g.status === "Final");

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Region Filter */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(regionGroups) as FilterRegion[]).map(region => (
            <button
              key={region}
              onClick={() => {
                setActiveRegion(region);
                setActiveLeague("All");
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeRegion === region 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              data-testid={`button-region-${region.toLowerCase()}`}
            >
              {region === "All" && <Globe className="w-4 h-4" />}
              {region === "Australia" && "🦘"}
              {region === "England" && "🏴󠁧󠁢󠁥󠁮󠁧󠁿"}
              {region === "International" && "🌍"}
              {region === "Pacific" && "🌏"}
              {region}
            </button>
          ))}
        </div>

        {/* League Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveLeague("All")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeLeague === "All" 
                ? "bg-background text-foreground shadow-sm border border-border" 
                : "bg-muted/30 text-muted-foreground hover:text-foreground"
            )}
            data-testid="button-league-all"
          >
            All Leagues
          </button>
          {(showAllLeagues ? availableLeagues : availableLeagues.slice(0, 6)).map(league => (
            <button
              key={league.id}
              onClick={() => setActiveLeague(league.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeLeague === league.id 
                  ? "bg-background text-foreground shadow-sm border border-border" 
                  : "bg-muted/30 text-muted-foreground hover:text-foreground"
              )}
              data-testid={`button-league-${league.id.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className={cn("w-2 h-2 rounded-full", league.color)} />
              {league.name}
            </button>
          ))}
          {availableLeagues.length > 6 && (
            <button
              onClick={() => setShowAllLeagues(!showAllLeagues)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-all"
              data-testid="button-toggle-leagues"
            >
              {showAllLeagues ? "Show Less" : `+${availableLeagues.length - 6} More`}
              <ChevronDown className={cn("w-3 h-3 transition-transform", showAllLeagues && "rotate-180")} />
            </button>
          )}
        </div>

        {/* Live Games Section */}
        {liveGames.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h2 className="text-2xl font-display font-bold tracking-tight">Live Now</h2>
              <span className="text-sm text-muted-foreground">({liveGames.length} matches)</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveGames.map(game => (
                  <ScoreCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Games Section */}
        {upcomingGames.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold tracking-tight">Upcoming</h2>
              <span className="text-sm text-muted-foreground">{upcomingGames.length} matches</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingGames.map(game => (
                  <ScoreCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Completed Games Section */}
        {completedGames.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold tracking-tight">Results</h2>
              <span className="text-sm text-muted-foreground">{completedGames.length} matches</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGames.map(game => (
                  <ScoreCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {filteredGames.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No matches found for this selection.</p>
          </div>
        )}

        {/* News Section */}
        <section className="space-y-4">
           <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold tracking-tight">League News</h2>
            <button className="text-sm text-primary hover:underline font-medium">View All</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* First item is featured */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
                <NewsCard news={MOCK_NEWS[0]} featured={true} />
            </div>
            {/* Rest of the items */}
            {MOCK_NEWS.slice(1).map(news => (
                <NewsCard key={news.id} news={news} />
            ))}
          </div>
        </section>

      </div>
    </Layout>
  );
}

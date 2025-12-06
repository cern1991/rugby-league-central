import { Layout } from "@/components/Layout";
import { ScoreCard } from "@/components/ScoreCard";
import { NewsCard } from "@/components/NewsCard";
import { MOCK_GAMES, MOCK_NEWS } from "@/lib/mockData";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "NRL", "Super League", "State of Origin", "International"];

  const filteredGames = activeFilter === "All" 
    ? MOCK_GAMES 
    : MOCK_GAMES.filter(g => g.league === activeFilter);

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Scores Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold tracking-tight">Match Center</h2>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg overflow-x-auto">
                {filters.map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                            activeFilter === filter 
                                ? "bg-background text-foreground shadow-sm" 
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {filter}
                    </button>
                ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map(game => (
                <ScoreCard key={game.id} game={game} />
            ))}
          </div>
        </section>

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

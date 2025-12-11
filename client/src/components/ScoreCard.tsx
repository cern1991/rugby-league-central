import { Game } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Trophy, Clock, Flame } from "lucide-react";
import { Link } from "wouter";

interface ScoreCardProps {
  game: Game;
}

export function ScoreCard({ game }: ScoreCardProps) {
  const isLive = game.status === "Live";
  const matchHref = `/match/${encodeURIComponent(game.id)}`;
  
  return (
    <Link href={matchHref}>
      <div className="group relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer">
        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 text-xs font-medium uppercase tracking-wider border-b border-border/50">
          <span className={cn("flex items-center gap-1.5", isLive ? "text-red-500 animate-pulse" : "text-muted-foreground")}>
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            {game.status === "Live" ? "Live Now" : game.status}
          </span>
          <span className="text-muted-foreground flex items-center gap-1">
             {game.time}
          </span>
        </div>

        {/* Teams & Scores */}
        <div className="p-5 grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          
          {/* Home Team */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold shadow-lg group-hover:scale-110 transition-transform duration-300", game.homeTeam.logoColor)}>
              {game.homeTeam.abbreviation}
            </div>
            <div className="space-y-0.5">
              <span className="block text-sm font-bold tracking-tight group-hover:text-primary transition-colors">{game.homeTeam.abbreviation}</span>
              <span className="block text-[10px] text-muted-foreground uppercase hidden sm:block">{game.homeTeam.name}</span>
            </div>
          </div>

          {/* Score / VS */}
          <div className="text-center min-w-[80px]">
              {game.status !== "Upcoming" ? (
                <div className="font-display text-4xl font-bold tracking-tighter flex items-center justify-center gap-2">
                  <span className={cn(game.homeTeam.score! > (game.awayTeam.score || 0) ? "text-foreground" : "text-muted-foreground")}>
                    {game.homeTeam.score}
                  </span>
                  <span className="text-muted-foreground/30 text-2xl">:</span>
                  <span className={cn(game.awayTeam.score! > (game.homeTeam.score || 0) ? "text-foreground" : "text-muted-foreground")}>
                    {game.awayTeam.score}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-display font-bold text-muted-foreground">VS</span>
              )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold shadow-lg group-hover:scale-110 transition-transform duration-300", game.awayTeam.logoColor)}>
              {game.awayTeam.abbreviation}
            </div>
            <div className="space-y-0.5">
              <span className="block text-sm font-bold tracking-tight group-hover:text-primary transition-colors">{game.awayTeam.abbreviation}</span>
              <span className="block text-[10px] text-muted-foreground uppercase hidden sm:block">{game.awayTeam.name}</span>
            </div>
          </div>
        </div>
        
        {/* Hot Indicator */}
        {game.isHot && (
          <div className="absolute top-0 right-0 p-1.5">
             <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20 animate-pulse" />
          </div>
        )}
      </div>
    </Link>
  );
}

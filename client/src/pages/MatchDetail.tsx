import { useRoute, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { MOCK_GAMES } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { ArrowLeft, Trophy, Timer, MapPin, Activity, List, BarChart2 } from "lucide-react";
import { useState } from "react";

export default function MatchDetail() {
  const [match, params] = useRoute("/match/:id");
  const [activeTab, setActiveTab] = useState<"timeline" | "stats">("timeline");

  if (!match || !params?.id) return null;

  const game = MOCK_GAMES.find(g => g.id === params.id);

  if (!game) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-bold">Match not found</h2>
          <Link href="/" className="text-primary hover:underline mt-4">Back to Dashboard</Link>
        </div>
      </Layout>
    );
  }

  const isLive = game.status === "Live";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link href="/">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </Link>

        {/* Scoreboard Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            
            {/* Header Info */}
            <div className="relative p-4 border-b border-border/50 flex justify-between items-center text-xs font-medium text-muted-foreground bg-muted/20">
                <div className="flex items-center gap-2">
                    <span className="text-foreground font-bold">{game.league}</span>
                    <span>•</span>
                    <span>{game.round}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{game.venue}</span>
                </div>
            </div>

            {/* Main Score Display */}
            <div className="relative p-8 md:p-12 grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-4">
                    <div className={cn("w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold shadow-2xl ring-4 ring-border/20", game.homeTeam.logoColor)}>
                        {game.homeTeam.abbreviation}
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl md:text-2xl font-bold leading-none mb-1">{game.homeTeam.name}</h2>
                        <p className="text-muted-foreground text-sm">Home</p>
                    </div>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-background/50 border border-border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        {isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                        {isLive ? "Live" : game.status} • {game.time}
                    </div>
                    <div className="font-display text-6xl md:text-8xl font-bold tracking-tighter flex items-center gap-4">
                         <span className={cn(game.homeTeam.score! > (game.awayTeam.score || 0) ? "text-foreground" : "text-muted-foreground/70")}>
                            {game.homeTeam.score ?? 0}
                        </span>
                        <span className="text-muted-foreground/20">:</span>
                        <span className={cn(game.awayTeam.score! > (game.homeTeam.score || 0) ? "text-foreground" : "text-muted-foreground/70")}>
                            {game.awayTeam.score ?? 0}
                        </span>
                    </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-4">
                    <div className={cn("w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold shadow-2xl ring-4 ring-border/20", game.awayTeam.logoColor)}>
                        {game.awayTeam.abbreviation}
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl md:text-2xl font-bold leading-none mb-1">{game.awayTeam.name}</h2>
                        <p className="text-muted-foreground text-sm">Away</p>
                    </div>
                </div>
            </div>

            {/* Scorers Summary */}
            {game.status !== "Upcoming" && (
                <div className="grid grid-cols-2 border-t border-border/50 divide-x divide-border/50 bg-muted/10">
                    <div className="p-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">Scorers</h4>
                        <div className="space-y-1 text-sm">
                            {game.homeScorers?.map((scorer, i) => (
                                <div key={i} className="flex justify-between">
                                    <span>{scorer.name}</span>
                                    <span className="text-muted-foreground">
                                        {scorer.tries && `${scorer.tries}T `}
                                        {scorer.goals && `${scorer.goals}G`}
                                    </span>
                                </div>
                            ))}
                            {(!game.homeScorers || game.homeScorers.length === 0) && <span className="text-muted-foreground italic">No scorers yet</span>}
                        </div>
                    </div>
                    <div className="p-4 text-right">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">Scorers</h4>
                        <div className="space-y-1 text-sm">
                             {game.awayScorers?.map((scorer, i) => (
                                <div key={i} className="flex justify-between flex-row-reverse">
                                    <span>{scorer.name}</span>
                                    <span className="text-muted-foreground">
                                        {scorer.tries && `${scorer.tries}T `}
                                        {scorer.goals && `${scorer.goals}G`}
                                    </span>
                                </div>
                            ))}
                            {(!game.awayScorers || game.awayScorers.length === 0) && <span className="text-muted-foreground italic">No scorers yet</span>}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Content Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Tabs */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-1 border-b border-border">
                    <button 
                        onClick={() => setActiveTab("timeline")}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                            activeTab === "timeline" 
                                ? "border-primary text-primary" 
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <List className="w-4 h-4" />
                        Play-by-Play
                    </button>
                    <button 
                        onClick={() => setActiveTab("stats")}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                            activeTab === "stats" 
                                ? "border-primary text-primary" 
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <BarChart2 className="w-4 h-4" />
                        Match Stats
                    </button>
                </div>

                <div className="min-h-[300px]">
                    {activeTab === "timeline" && (
                        <div className="space-y-4">
                            {game.timeline?.map((event) => (
                                <div key={event.id} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full mt-2",
                                            event.type === "try" ? "bg-green-500" : 
                                            event.type === "goal" ? "bg-blue-500" :
                                            event.type === "video_ref" ? "bg-yellow-500" :
                                            "bg-muted-foreground"
                                        )} />
                                        <div className="w-px h-full bg-border group-last:hidden my-1" />
                                    </div>
                                    <div className="pb-6 flex-1">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-mono font-bold text-primary">{event.time}</span>
                                            <span className="text-xs font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                {event.type.replace("_", " ")}
                                            </span>
                                            {event.team && (
                                                <span className="text-xs text-muted-foreground">
                                                    {event.team === "home" ? game.homeTeam.abbreviation : game.awayTeam.abbreviation}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm">{event.description}</p>
                                    </div>
                                </div>
                            ))}
                            {(!game.timeline || game.timeline.length === 0) && (
                                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                                    Match has not started yet
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "stats" && game.stats && (
                        <div className="space-y-6">
                             <StatBar 
                                label="Possession" 
                                homeValue={game.stats.possession[0]} 
                                awayValue={game.stats.possession[1]} 
                                suffix="%"
                            />
                             <StatBar 
                                label="Completion Rate" 
                                homeValue={game.stats.completion[0]} 
                                awayValue={game.stats.completion[1]} 
                                suffix="%"
                            />
                             <StatBar 
                                label="Errors" 
                                homeValue={game.stats.errors[0]} 
                                awayValue={game.stats.errors[1]} 
                                inverse={true}
                            />
                             <StatBar 
                                label="Tackles" 
                                homeValue={game.stats.tackles[0]} 
                                awayValue={game.stats.tackles[1]} 
                            />
                        </div>
                    )}
                     {activeTab === "stats" && !game.stats && (
                        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                            Stats unavailable
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column - Context */}
            <div className="space-y-6">
                <div className="p-6 rounded-xl bg-card border border-border">
                    <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Match Pulse
                    </h3>
                    {isLive ? (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Penrith are currently dominating possession in the second half. 
                                Brisbane needs to find a way to break the line soon or this game could slip away.
                            </p>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                                <div className="h-full bg-primary" style={{ width: '65%' }} />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Home Momentum</span>
                                <span>Away Momentum</span>
                            </div>
                        </div>
                    ) : (
                         <p className="text-sm text-muted-foreground">
                            {game.status === "Final" ? "Match has concluded." : "Match preview and prediction unavailable."}
                        </p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
}

function StatBar({ label, homeValue, awayValue, suffix = "", inverse = false }: { label: string, homeValue: number, awayValue: number, suffix?: string, inverse?: boolean }) {
    const total = homeValue + awayValue;
    const homePercent = (homeValue / total) * 100;
    
    // Highlight the "better" stat
    const homeIsBetter = inverse ? homeValue < awayValue : homeValue > awayValue;
    const awayIsBetter = inverse ? awayValue < homeValue : awayValue > homeValue;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
                <span className={cn(homeIsBetter ? "text-foreground" : "text-muted-foreground")}>{homeValue}{suffix}</span>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
                <span className={cn(awayIsBetter ? "text-foreground" : "text-muted-foreground")}>{awayValue}{suffix}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                <div 
                    className={cn("h-full transition-all", homeIsBetter ? "bg-primary" : "bg-muted-foreground/30")} 
                    style={{ width: `${homePercent}%` }} 
                />
                 <div 
                    className={cn("h-full transition-all", awayIsBetter ? "bg-primary" : "bg-muted-foreground/30")} 
                    style={{ flex: 1 }} 
                />
            </div>
        </div>
    )
}

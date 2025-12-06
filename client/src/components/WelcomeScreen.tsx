import { useState, useEffect } from "react";
import { Trophy, ChevronRight, Zap, Globe, Users, Calendar } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <div
        className={`relative flex flex-col items-center text-center max-w-lg transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/30">
            <Trophy className="w-12 h-12 text-primary-foreground" />
          </div>
        </div>

        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-4">
          Rugby League Central
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-md">
          Your complete hub for live scores, team stats, and match updates from leagues around the world.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <FeatureBadge icon={<Zap className="w-3.5 h-3.5" />} label="Live Scores" />
          <FeatureBadge icon={<Globe className="w-3.5 h-3.5" />} label="NRL" />
          <FeatureBadge icon={<Globe className="w-3.5 h-3.5" />} label="Super League" />
          <FeatureBadge icon={<Users className="w-3.5 h-3.5" />} label="Team Rosters" />
          <FeatureBadge icon={<Calendar className="w-3.5 h-3.5" />} label="Fixtures" />
        </div>

        <button
          onClick={onComplete}
          className="group flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          data-testid="button-enter-app"
        >
          Explore Leagues
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="text-sm text-muted-foreground mt-8">
          Powered by TheSportsDB
        </p>
      </div>
    </div>
  );
}

function FeatureBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 bg-muted/50 text-muted-foreground px-3 py-1.5 rounded-full text-sm font-medium border border-border/50">
      <span className="text-primary">{icon}</span>
      {label}
    </span>
  );
}

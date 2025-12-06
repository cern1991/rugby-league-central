import { useState, useEffect } from "react";
import { Trophy, ChevronRight, Zap } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    const animTimer = setTimeout(() => setIsAnimating(false), 100);
    return () => {
      clearTimeout(timer);
      clearTimeout(animTimer);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-gradient-to-br from-background via-background to-primary/10 flex flex-col items-center justify-center p-6 transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
    >
      <div
        className={`flex flex-col items-center text-center max-w-md transition-all duration-500 ${isAnimating ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <div
          className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 mb-6 animate-bounce"
          style={{ animationDuration: '2s' }}
        >
          <Trophy className="w-10 h-10 text-primary-foreground" />
        </div>

        <h1
          className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3"
        >
          SportSync
        </h1>

        <p
          className="text-muted-foreground text-lg mb-2"
        >
          Your Rugby League Hub
        </p>

        <div
          className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground mb-8"
        >
          <span className="flex items-center gap-1 bg-muted/50 px-3 py-1 rounded-full">
            <Zap className="w-3 h-3 text-primary" /> Live Scores
          </span>
          <span className="flex items-center gap-1 bg-muted/50 px-3 py-1 rounded-full">
            NRL
          </span>
          <span className="flex items-center gap-1 bg-muted/50 px-3 py-1 rounded-full">
            Super League
          </span>
          <span className="flex items-center gap-1 bg-muted/50 px-3 py-1 rounded-full">
            Championship
          </span>
          <span className="flex items-center gap-1 bg-muted/50 px-3 py-1 rounded-full">
            QLD Cup
          </span>
          <span className="flex items-center gap-1 bg-muted/50 px-3 py-1 rounded-full">
            + More
          </span>
        </div>

        {showContent && (
          <button
            onClick={onComplete}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
            data-testid="button-enter-app"
          >
            View Live Games
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <p
          className="text-xs text-muted-foreground mt-6"
        >
          All rugby league, one app
        </p>
      </div>
    </div>
  );
}

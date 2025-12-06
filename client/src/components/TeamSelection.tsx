import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { AVAILABLE_TEAMS, TEAM_THEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Heart, Palette, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function TeamSelection() {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [step, setStep] = useState<"teams" | "theme">("teams");
  const [loading, setLoading] = useState(false);
  const { updatePreferences } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const toggleTeam = (teamName: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamName) 
        ? prev.filter(t => t !== teamName)
        : [...prev, teamName]
    );
  };

  const handleContinue = () => {
    if (step === "teams") {
      setStep("theme");
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updatePreferences(selectedTeams, selectedTheme);
      toast({
        title: "Preferences saved!",
        description: "Your favorite teams and theme have been set.",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save preferences",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setLocation("/");
  };

  const groupedTeams = AVAILABLE_TEAMS.reduce((acc, team) => {
    if (!acc[team.league]) {
      acc[team.league] = [];
    }
    acc[team.league].push(team);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_TEAMS>);

  const suggestedThemes = selectedTeams.length > 0
    ? TEAM_THEMES.filter(theme => 
        AVAILABLE_TEAMS.some(team => 
          selectedTeams.includes(team.name) && team.themeId === theme.id
        ) || theme.id === "default"
      )
    : TEAM_THEMES;

  if (step === "teams") {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-border/50">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-display">Choose Your Favorite Teams</CardTitle>
              <CardDescription>
                Select the teams you support. We'll personalize your experience based on your picks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedTeams).map(([league, teams]) => (
                <div key={league} className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{league}</h3>
                  <div className="flex flex-wrap gap-2">
                    {teams.map(team => (
                      <button
                        key={team.name}
                        onClick={() => toggleTeam(team.name)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                          selectedTeams.includes(team.name)
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        data-testid={`button-team-${team.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {selectedTeams.includes(team.name) && <Check className="w-4 h-4" />}
                        {team.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-6 border-t border-border">
                <Button variant="ghost" onClick={handleSkip} data-testid="button-skip-teams">
                  Skip for now
                </Button>
                <Button onClick={handleContinue} data-testid="button-continue-theme">
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Palette className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display">Pick Your Theme</CardTitle>
            <CardDescription>
              Personalize the app's look with your team's colors. Choose a theme that matches your style.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {suggestedThemes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSelectedTheme(theme.id);
                    document.documentElement.setAttribute("data-theme", theme.id);
                  }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all text-left",
                    selectedTheme === theme.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  data-testid={`button-theme-${theme.id}`}
                >
                  {selectedTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className={cn("w-8 h-8 rounded-lg mb-3", theme.previewColor)} />
                  <p className="font-medium text-sm">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">{theme.league}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button variant="ghost" onClick={() => setStep("teams")} data-testid="button-back-teams">
                Back
              </Button>
              <Button onClick={handleComplete} disabled={loading} data-testid="button-complete-setup">
                {loading ? "Saving..." : "Complete Setup"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

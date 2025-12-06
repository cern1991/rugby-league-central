import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { AVAILABLE_TEAMS, TEAM_THEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Heart, Palette, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Settings() {
  const { user, updatePreferences } = useAuth();
  const [selectedTeams, setSelectedTeams] = useState<string[]>(user?.favoriteTeams || []);
  const [selectedTheme, setSelectedTheme] = useState(user?.themePreference || "default");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to access settings.</p>
          <Button className="mt-4" onClick={() => setLocation("/login")} data-testid="button-login-settings">
            Login
          </Button>
        </div>
      </Layout>
    );
  }

  const toggleTeam = (teamName: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamName) 
        ? prev.filter(t => t !== teamName)
        : [...prev, teamName]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updatePreferences(selectedTeams, selectedTheme);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedTeams = AVAILABLE_TEAMS.reduce((acc, team) => {
    if (!acc[team.league]) {
      acc[team.league] = [];
    }
    acc[team.league].push(team);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_TEAMS>);

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Account</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Shield className={cn("w-4 h-4", user.twoFactorEnabled ? "text-green-500" : "text-muted-foreground")} />
              <span>{user.twoFactorEnabled ? "Two-factor authentication enabled" : "Two-factor authentication not set up"}</span>
              {!user.twoFactorEnabled && (
                <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setLocation("/setup-2fa")} data-testid="link-setup-2fa">
                  Set up now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Favorite Teams</CardTitle>
                <CardDescription>Select the teams you support</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedTeams).map(([league, teams]) => (
              <div key={league} className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{league}</h4>
                <div className="flex flex-wrap gap-2">
                  {teams.map(team => (
                    <button
                      key={team.name}
                      onClick={() => toggleTeam(team.name)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                        selectedTeams.includes(team.name)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      data-testid={`settings-team-${team.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {selectedTeams.includes(team.name) && <Check className="w-3 h-3" />}
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">App Theme</CardTitle>
                <CardDescription>Customize the app colors to match your team</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {TEAM_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSelectedTheme(theme.id);
                    document.documentElement.setAttribute("data-theme", theme.id);
                  }}
                  className={cn(
                    "relative p-3 rounded-lg border-2 transition-all text-left",
                    selectedTheme === theme.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  data-testid={`settings-theme-${theme.id}`}
                >
                  {selectedTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  )}
                  <div className={cn("w-6 h-6 rounded mb-2", theme.previewColor)} />
                  <p className="font-medium text-xs truncate">{theme.name}</p>
                  <p className="text-[10px] text-muted-foreground">{theme.league}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading} data-testid="button-save-settings">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}

import { useMemo, useState } from "react";
import { useTheme, TEAM_THEMES } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Palette, Moon } from "lucide-react";

const SYSTEM_THEMES = [
  { id: "dark", label: "Default Dark", icon: Moon, description: "Charcoal base with electric blue accents" },
];

const TEAM_COLOR_THEMES = TEAM_THEMES.filter(
  (theme) => theme.league === "NRL" || theme.league === "Super League"
);

export function ThemeCustomizer() {
  const { currentTheme, setTheme } = useTheme();
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);

  const currentLabel = useMemo(() => {
    if (currentTheme === "dark") return "Default Dark";
    const match = TEAM_THEMES.find((theme) => theme.id === currentTheme);
    return match ? match.name : "Custom Theme";
  }, [currentTheme]);

  const handleTeamSelect = (themeId: string) => {
    setTheme(themeId);
    setTeamDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Customize theme"
            data-testid="button-theme-customizer"
          >
            <Palette className="w-5 h-5" />
            <span className="sr-only">Theme customizer</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          {SYSTEM_THEMES.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => setTheme(option.id)}
              className={cn("flex items-start gap-3 py-2", currentTheme === option.id && "text-primary")}
              data-testid={`menu-theme-${option.id}`}
            >
              <option.icon className="w-4 h-4 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setTeamDialogOpen(true)}
            className="flex items-center gap-2"
            data-testid="menu-theme-team"
          >
            <Palette className="w-4 h-4" />
            Team colors…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Current: <span className="font-medium text-foreground">{currentLabel}</span>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select team colors</DialogTitle>
            <DialogDescription>
              Match the interface accents to your favourite NRL or Super League club.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {TEAM_COLOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleTeamSelect(theme.id)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all text-left",
                    currentTheme === theme.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  data-testid={`button-theme-team-${theme.id}`}
                >
                  {currentTheme === theme.id && (
                    <span className="absolute top-2 right-2 text-xs font-semibold text-primary">
                      Active
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg border border-border bg-card flex items-center justify-center overflow-hidden">
                      {theme.logo ? (
                        <img
                          src={theme.logo}
                          alt={`${theme.name} logo`}
                          className="w-10 h-10 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">
                          {theme.name
                            .split(" ")
                            .slice(0, 2)
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className={cn("flex-1 h-10 rounded-lg border border-border", theme.previewColor)} />
                  </div>
                  <p className="font-medium text-sm truncate">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">{theme.league}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

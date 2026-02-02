import { useTheme } from "@/lib/theme";
import { usePreferredLeague } from "@/hooks/usePreferredLeague";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeCustomizer() {
  const { currentTheme, setTheme } = useTheme();
  const { selectedLeague } = usePreferredLeague();

  const isLight = currentTheme.endsWith("-light");
  const leagueKey = selectedLeague === "Super League" ? "super-league" : "nrl";
  const nextTheme = isLight ? leagueKey : `${leagueKey}-light`;
  const label = isLight ? "Light mode" : "Dark mode";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      data-testid="button-theme-toggle"
      onClick={() => setTheme(nextTheme)}
      title={label}
    >
      {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      <span className="sr-only">{label}</span>
    </Button>
  );
}

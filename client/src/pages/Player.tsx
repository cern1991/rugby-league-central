import type { ReactNode } from "react";
import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Activity, MapPin, Ruler, Dumbbell, Share2 } from "lucide-react";
import { getDisplayTeamName } from "@/lib/teamDisplay";

interface PlayerProfile {
  id: string;
  name: string;
  position?: string;
  team?: string;
  teamId?: string;
  league?: string;
  nationality?: string;
  birthDate?: string;
  height?: string;
  weight?: string;
  description?: string;
  image?: string;
  teamLogo?: string;
  signing?: string;
  socials?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  stats?: PlayerStats;
}

interface PlayerStats {
  appearances: number;
  tries: number;
  goals: number;
  tackleBusts: number;
  runMeters: number;
  tackles: number;
}

export default function PlayerPage() {
  const [, params] = useRoute("/player/:id");
  const playerId = params?.id ?? "";
  let teamLink: string | null = null;
  try {
    const lastTeamId = sessionStorage.getItem("rlc-last-team-id");
    if (lastTeamId) {
      teamLink = `/team/${encodeURIComponent(lastTeamId)}`;
    }
  } catch {
    // Ignore storage errors
  }

  const { data, isLoading, isError } = useQuery<{ response: PlayerProfile }>({
    queryKey: ["player", playerId],
    enabled: Boolean(playerId),
    queryFn: async () => {
      const res = await fetch(`/api/rugby/players/${encodeURIComponent(playerId)}`);
      if (!res.ok) throw new Error("Failed to fetch player");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const player = data?.response;

  const { data: teamData } = useQuery<{ response: Array<{ id: string; name: string; logo?: string | null }> }>({
    queryKey: ["player-team-logo", player?.league],
    enabled: Boolean(player?.league),
    queryFn: async () => {
      const res = await fetch(`/api/rugby/teams?league=${encodeURIComponent(player?.league || "NRL")}`);
      if (!res.ok) throw new Error("Failed to fetch team logos");
      return res.json();
    },
  });

  const resolvedTeamLogo = useMemo(() => {
    if (!player) return null;
    if (player.teamLogo) return player.teamLogo;
    const teams = teamData?.response || [];
    const byId = teams.find((team) => String(team.id) === String(player.teamId));
    if (byId?.logo) return byId.logo;
    const byName = teams.find(
      (team) => team.name.toLowerCase() === (player.team || "").toLowerCase()
    );
    return byName?.logo || null;
  }, [player, teamData]);

  const nationalityFlag = useMemo(() => {
    const nationality = player?.nationality?.trim().toLowerCase();
    if (!nationality) return null;
    const map: Record<string, string> = {
      australia: "au",
      "new zealand": "nz",
      england: "gb-eng",
      "united kingdom": "gb",
      wales: "gb-wls",
      scotland: "gb-sct",
      ireland: "ie",
      france: "fr",
      jamaica: "jm",
      fiji: "fj",
      tonga: "to",
      samoa: "ws",
      "papua new guinea": "pg",
      "united states": "us",
      italy: "it",
      serbia: "rs",
      "czech republic": "cz",
      croatia: "hr",
      "south africa": "za",
      zimbabwe: "zw",
    };
    const code = map[nationality];
    if (!code) return null;
    return `https://flagcdn.com/w40/${code}.png`;
  }, [player?.nationality]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/players" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to players
          </Link>
          {teamLink && (
            <Link
              href={teamLink}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition"
            >
              Go to team
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[320px,1fr] animate-pulse">
            <div className="h-80 rounded-2xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-36 bg-muted rounded" />
            </div>
          </div>
        ) : isError || !player ? (
          <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>We couldn't find that player. Please try searching again.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="grid gap-6 lg:grid-cols-[220px,1fr] p-4 lg:p-6">
                <div className="bg-muted/20 rounded-2xl flex items-center justify-center p-6">
                  {resolvedTeamLogo ? (
                    <img
                      src={resolvedTeamLogo}
                      alt={player.team || player.name}
                      className="max-h-40 w-auto object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-40 bg-muted flex items-center justify-center rounded-xl">
                      <Users className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h1 className="font-display text-3xl font-bold">{player.name}</h1>
                      <p className="text-sm text-muted-foreground">
                        {player.position || "Player"} · {getDisplayTeamName(player.teamId, player.team, player.league)}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {player.league || "Rugby League"}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-sm">
                    <InfoPair label="Team" value={getDisplayTeamName(player.teamId, player.team, player.league)} />
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Nationality</span>
                      <span className="flex items-center gap-2 font-medium">
                        {nationalityFlag ? (
                          <img
                            src={nationalityFlag}
                            alt={player.nationality || "Flag"}
                            className="w-6 h-4 object-cover rounded-sm"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        <span className="text-right">{player.nationality || "—"}</span>
                      </span>
                    </div>
                    {player.signing && <InfoPair label="Contract" value={player.signing} />}
                  </div>

                  {renderSocialLinks(player.socials)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 lg:p-6">
              <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Bio</h2>
              {player.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {player.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Detailed biography information will appear here when available.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

function renderSocialLinks(socials?: PlayerProfile["socials"]) {
  if (!socials) return null;

  const links = [
    socials.twitter && { label: "Twitter", url: formatSocialLink(socials.twitter) },
    socials.instagram && { label: "Instagram", url: formatSocialLink(socials.instagram) },
    socials.facebook && { label: "Facebook", url: formatSocialLink(socials.facebook) },
  ].filter(Boolean) as Array<{ label: string; url: string }>;

  if (links.length === 0) return null;

  return (
    <div className="border border-border rounded-xl p-4 bg-card/60">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        <Share2 className="w-4 h-4" />
        Follow
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function formatSocialLink(value: string) {
  if (!value) return "#";
  if (value.startsWith("http")) return value;
  const handle = value.replace(/^@/, "");
  if (value.toLowerCase().includes("instagram")) return `https://instagram.com/${handle}`;
  if (value.toLowerCase().includes("twitter") || value.toLowerCase().includes("x.com")) return `https://twitter.com/${handle}`;
  if (value.toLowerCase().includes("facebook")) return `https://facebook.com/${handle}`;
  return `https://twitter.com/${handle}`;
}

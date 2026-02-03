import type { ReactNode } from "react";
import { Layout } from "@/components/Layout";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Activity, MapPin, Ruler, Dumbbell, Share2 } from "lucide-react";

interface PlayerProfile {
  id: string;
  name: string;
  position?: string;
  team?: string;
  league?: string;
  nationality?: string;
  birthDate?: string;
  height?: string;
  weight?: string;
  description?: string;
  image?: string;
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
  let backLink = "/teams";
  try {
    const lastTeamId = sessionStorage.getItem("rlc-last-team-id");
    if (lastTeamId) {
      backLink = `/team/${encodeURIComponent(lastTeamId)}`;
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href={backLink} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to team
          </Link>
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
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-1/2 bg-muted/20">
                  {player.image ? (
                    <img
                      src={player.image}
                      alt={player.name}
                      className="w-full h-64 lg:h-full object-cover object-top"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-64 lg:h-full bg-muted flex items-center justify-center">
                      <Users className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="lg:w-1/2 p-4 lg:p-6 space-y-3 text-sm">
                  <h2 className="font-semibold text-base text-foreground">Player Profile</h2>
                  <InfoPair label="Team" value={player.team || "Rugby League"} />
                  <InfoPair label="League" value={player.league || "Rugby League"} />
                  <InfoPair label="Position" value={player.position || "—"} />
                  <InfoPair label="Nationality" value={player.nationality || "—"} />
                  <InfoPair label="Birth Date" value={player.birthDate || "—"} />
                  {player.signing && <InfoPair label="Contract" value={player.signing} />}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h1 className="font-display text-3xl font-bold">{player.name}</h1>
                <p className="text-muted-foreground mt-1">{player.position || "Player"} · {player.team || player.league}</p>
              </div>

              {player.description ? (
                <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                  {player.description}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Detailed biography information will appear here when available.
                </p>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <StatCard icon={<Activity className="w-4 h-4" />} label="Position" value={player.position || "—"} />
                <StatCard icon={<MapPin className="w-4 h-4" />} label="Team" value={player.team || "TBA"} />
                <StatCard icon={<Ruler className="w-4 h-4" />} label="Height" value={player.height || "—"} />
                <StatCard icon={<Dumbbell className="w-4 h-4" />} label="Weight" value={player.weight || "—"} />
              </div>

              {renderSocialLinks(player.socials)}
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

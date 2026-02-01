import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).notNull().default('free'),
  subscriptionId: text("subscription_id"),
  favoriteTeams: text("favorite_teams").array().default(sql`'{}'::text[]`),
  themePreference: varchar("theme_preference", { length: 50 }).default('default'),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  twoFactorSecret: true,
  twoFactorEnabled: true,
  subscriptionStatus: true,
  subscriptionId: true,
  favoriteTeams: true,
  themePreference: true,
  createdAt: true,
});

export const updateUserPreferencesSchema = z.object({
  favoriteTeams: z.array(z.string()).optional(),
  themePreference: z.string().optional(),
});

export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type User = typeof users.$inferSelect;

// API Response Types for Rugby data
export interface Team {
  id: string;
  name: string;
  logo: string | null;
  league: string;
  leagueId?: number;
  country: { name: string; code?: string; flag?: string | null };
  stadium?: string | null;
}

export interface Game {
  id: string;
  date: string;
  time: string;
  timestamp?: number;
  week?: string;
  status: { long: string; short: string };
  league: { id?: number; name: string; type?: string; logo?: string; season?: string };
  country?: { name: string; code?: string; flag?: string | null };
  teams: {
    home: { id: string; name: string; logo: string | null };
    away: { id: string; name: string; logo: string | null };
  };
  scores: { home: number | null; away: number | null };
}

export interface StandingsTeam {
  position: number;
  team: {
    id: number;
    name: string;
    logo: string | null;
  };
  games: {
    played: number;
    win: number;
    draw: number;
    lose: number;
  };
  points: {
    for: number;
    against: number;
    difference: number;
  };
  pts: number;
  form?: string;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  league?: string;
  image?: string;
}

export interface Player {
  id: number;
  name: string;
  position?: string;
  age?: number;
  nationality?: string;
  photo?: string;
}

export interface Squad {
  team: Team;
  players: Player[];
}

export const FEATURED_LEAGUES = [
  {
    id: "NRL",
    name: "NRL",
    shortName: "NRL",
    country: "Australia",
    color: "from-green-600 to-green-800",
    icon: "🦘",
    logo: "https://upload.wikimedia.org/wikipedia/en/5/50/National_Rugby_League.svg",
  },
  {
    id: "Super League",
    name: "Super League",
    shortName: "Super League",
    country: "England",
    color: "from-red-600 to-red-800",
    icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/fb/Super_League_Logo_2020.png",
  },
];

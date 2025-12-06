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

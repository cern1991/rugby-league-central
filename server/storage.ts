import { type User, type InsertUser, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined>;
  enable2FA(id: string, secret: string): Promise<User | undefined>;
  updateSubscription(id: string, status: string, subscriptionId?: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async enable2FA(id: string, secret: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ twoFactorSecret: secret, twoFactorEnabled: true })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateSubscription(id: string, status: string, subscriptionId?: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ subscriptionStatus: status, subscriptionId })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();

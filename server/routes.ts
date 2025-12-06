import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerUserSchema, updateUserPreferencesSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import passport from "./auth";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import type { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      passwordHash: string;
      twoFactorSecret: string | null;
      twoFactorEnabled: boolean;
      subscriptionStatus: string;
      subscriptionId: string | null;
      favoriteTeams: string[] | null;
      themePreference: string | null;
      createdAt: Date;
    }
  }
}

function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register a new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const passwordHash = await bcrypt.hash(validatedData.password, 10);
      
      const user = await storage.createUser({
        email: validatedData.email,
        passwordHash,
      });

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        
        res.status(201).json({
          id: user.id,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled,
          subscriptionStatus: user.subscriptionStatus,
        });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      // If 2FA is enabled, don't log in yet - require 2FA verification
      if (user.twoFactorEnabled) {
        return res.json({
          requiresTwoFactor: true,
          userId: user.id,
          message: "Two-factor authentication required",
        });
      }

      // No 2FA - complete login
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        
        res.json({
          id: user.id,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled,
          subscriptionStatus: user.subscriptionStatus,
        });
      });
    })(req, res, next);
  });

  // Verify 2FA token and complete login
  app.post("/api/auth/verify-2fa", async (req, res) => {
    try {
      const { userId, token } = req.body;
      
      if (!userId || !token) {
        return res.status(400).json({ message: "User ID and token are required" });
      }

      const user = await storage.getUser(userId);
      
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return res.status(400).json({ message: "Invalid user or 2FA not enabled" });
      }

      const isValid = authenticator.verify({
        token,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        return res.status(401).json({ message: "Invalid 2FA token" });
      }

      // Complete login
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        
        res.json({
          id: user.id,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled,
          subscriptionStatus: user.subscriptionStatus,
        });
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "2FA verification failed" });
    }
  });

  // Setup 2FA - generate secret and QR code
  app.post("/api/auth/setup-2fa", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      const secret = authenticator.generateSecret();
      const otpauthUrl = authenticator.keyuri(
        user.email,
        "Rugby League Aggregator",
        secret
      );

      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

      // Store the secret temporarily (not enabled yet)
      await storage.updateUser(user.id, { twoFactorSecret: secret });

      res.json({
        secret,
        qrCode: qrCodeDataUrl,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to setup 2FA" });
    }
  });

  // Enable 2FA after verifying the setup token
  app.post("/api/auth/enable-2fa", requireAuth, async (req, res) => {
    try {
      const { token } = req.body;
      const user = req.user!;

      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const currentUser = await storage.getUser(user.id);
      
      if (!currentUser || !currentUser.twoFactorSecret) {
        return res.status(400).json({ message: "2FA setup not initiated" });
      }

      const isValid = authenticator.verify({
        token,
        secret: currentUser.twoFactorSecret,
      });

      if (!isValid) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Enable 2FA
      const updatedUser = await storage.enable2FA(user.id, currentUser.twoFactorSecret);

      res.json({
        message: "2FA enabled successfully",
        twoFactorEnabled: updatedUser?.twoFactorEnabled,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to enable 2FA" });
    }
  });

  // Get current user
  app.get("/api/auth/user", requireAuth, (req, res) => {
    const user = req.user!;
    res.json({
      id: user.id,
      email: user.email,
      twoFactorEnabled: user.twoFactorEnabled,
      subscriptionStatus: user.subscriptionStatus,
      favoriteTeams: user.favoriteTeams || [],
      themePreference: user.themePreference || 'default',
    });
  });

  // Update user preferences (favorite teams and theme)
  app.put("/api/auth/preferences", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const validatedData = updateUserPreferencesSchema.parse(req.body);
      
      // Only include fields that are explicitly provided (not undefined)
      const updates: Partial<{ favoriteTeams: string[]; themePreference: string }> = {};
      
      if (validatedData.favoriteTeams !== undefined) {
        updates.favoriteTeams = validatedData.favoriteTeams;
      }
      if (validatedData.themePreference !== undefined) {
        updates.themePreference = validatedData.themePreference;
      }

      // If no updates provided, return current user data
      if (Object.keys(updates).length === 0) {
        return res.json({
          id: user.id,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled,
          subscriptionStatus: user.subscriptionStatus,
          favoriteTeams: user.favoriteTeams || [],
          themePreference: user.themePreference || 'default',
        });
      }

      const updatedUser = await storage.updateUser(user.id, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        subscriptionStatus: updatedUser.subscriptionStatus,
        favoriteTeams: updatedUser.favoriteTeams || [],
        themePreference: updatedUser.themePreference || 'default',
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update preferences" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Rugby API proxy routes (using RapidAPI)
  const RUGBY_API_BASE = "https://api-rugby.p.rapidapi.com";
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

  async function fetchRugbyAPI(endpoint: string, params: Record<string, string> = {}) {
    if (!RAPIDAPI_KEY) {
      throw new Error("Rugby API key not configured. Please set RAPIDAPI_KEY.");
    }

    const url = new URL(`${RUGBY_API_BASE}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "api-rugby.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`Rugby API error: ${response.status} - ${errorText}`);
      throw new Error(`Rugby API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error("Rugby API returned errors:", data.errors);
      throw new Error(`Rugby API error: ${JSON.stringify(data.errors)}`);
    }

    return data;
  }

  // Get all leagues
  app.get("/api/rugby/leagues", async (req, res) => {
    try {
      const data = await fetchRugbyAPI("/leagues");
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch leagues" });
    }
  });

  // Get teams by league
  app.get("/api/rugby/teams", async (req, res) => {
    try {
      const { league, season } = req.query as { league?: string; season?: string };
      const data = await fetchRugbyAPI("/teams", { league: league || "", season: season || "2025" });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch teams" });
    }
  });

  // Get team by ID
  app.get("/api/rugby/team/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = await fetchRugbyAPI("/teams", { id });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch team" });
    }
  });

  // Get games for a team
  app.get("/api/rugby/team/:id/games", async (req, res) => {
    try {
      const { id } = req.params;
      const { season, league } = req.query as { season?: string; league?: string };
      const data = await fetchRugbyAPI("/games", { 
        team: id, 
        season: season || "2025",
        league: league || ""
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch team games" });
    }
  });

  // Get game details
  app.get("/api/rugby/game/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = await fetchRugbyAPI("/games", { id });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch game" });
    }
  });

  // Get standings
  app.get("/api/rugby/standings", async (req, res) => {
    try {
      const { league, season } = req.query as { league?: string; season?: string };
      const data = await fetchRugbyAPI("/standings", { league: league || "", season: season || "2025" });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch standings" });
    }
  });

  // Search teams by name
  app.get("/api/rugby/teams/search", async (req, res) => {
    try {
      const { name } = req.query as { name?: string };
      const data = await fetchRugbyAPI("/teams", { search: name || "" });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to search teams" });
    }
  });

  return httpServer;
}

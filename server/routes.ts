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

  // TheSportsDB API routes (free, no key required)
  const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";

  async function fetchSportsDB(endpoint: string) {
    const response = await fetch(`${SPORTSDB_BASE}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`SportsDB API error: ${response.status}`);
    }

    return response.json();
  }

  // Search teams by name
  app.get("/api/rugby/teams/search", async (req, res) => {
    try {
      const { name } = req.query as { name?: string };
      if (!name || name.length < 2) {
        return res.json({ response: [] });
      }
      
      const data = await fetchSportsDB(`/searchteams.php?t=${encodeURIComponent(name)}`);
      const teams = data.teams || [];
      
      const rugbyTeams = teams.filter((team: any) => 
        team.strSport === "Rugby" || 
        team.strLeague?.toLowerCase().includes("rugby") ||
        team.strLeague?.toLowerCase().includes("nrl") ||
        team.strLeague?.toLowerCase().includes("super league")
      );
      
      const formattedTeams = rugbyTeams.map((team: any) => ({
        id: team.idTeam,
        name: team.strTeam,
        logo: team.strBadge || team.strTeamBadge,
        country: {
          name: team.strCountry || "Unknown",
          code: team.strCountry?.slice(0, 2).toUpperCase() || "",
          flag: null
        },
        league: team.strLeague,
        stadium: team.strStadium,
        description: team.strDescriptionEN
      }));
      
      res.json({ response: formattedTeams });
    } catch (error: any) {
      console.error("Team search error:", error);
      res.status(500).json({ message: error.message || "Failed to search teams" });
    }
  });

  // Get all teams in a league
  app.get("/api/rugby/teams", async (req, res) => {
    try {
      const { league } = req.query as { league?: string };
      const leagueName = league || "Australian_National_Rugby_League";
      
      const data = await fetchSportsDB(`/search_all_teams.php?l=${encodeURIComponent(leagueName)}`);
      const teams = data.teams || [];
      
      const formattedTeams = teams.map((team: any) => ({
        id: team.idTeam,
        name: team.strTeam,
        logo: team.strBadge || team.strTeamBadge,
        country: {
          name: team.strCountry || "Unknown",
          code: team.strCountry?.slice(0, 2).toUpperCase() || "",
          flag: null
        },
        league: team.strLeague,
        stadium: team.strStadium
      }));
      
      res.json({ response: formattedTeams });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch teams" });
    }
  });

  // Get team by ID
  app.get("/api/rugby/team/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = await fetchSportsDB(`/lookupteam.php?id=${id}`);
      const teams = data.teams || [];
      
      const formattedTeams = teams.map((team: any) => ({
        id: team.idTeam,
        name: team.strTeam,
        logo: team.strBadge || team.strTeamBadge,
        country: {
          name: team.strCountry || "Unknown",
          code: team.strCountry?.slice(0, 2).toUpperCase() || "",
          flag: null
        },
        league: team.strLeague,
        stadium: team.strStadium,
        description: team.strDescriptionEN,
        founded: team.intFormedYear,
        website: team.strWebsite
      }));
      
      res.json({ response: formattedTeams });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch team" });
    }
  });

  // Get upcoming events for a team
  app.get("/api/rugby/team/:id/games", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [nextData, pastData] = await Promise.all([
        fetchSportsDB(`/eventsnext.php?id=${id}`),
        fetchSportsDB(`/eventslast.php?id=${id}`)
      ]);
      
      const nextEvents = nextData.events || [];
      const pastEvents = pastData.results || [];
      
      const formatEvent = (event: any, isPast: boolean) => ({
        id: event.idEvent,
        date: event.dateEvent,
        time: event.strTime || "TBD",
        timestamp: new Date(`${event.dateEvent} ${event.strTime || "00:00"}`).getTime() / 1000,
        timezone: event.strTimestamp || "",
        week: event.intRound || "",
        status: {
          long: isPast ? "Match Finished" : "Not Started",
          short: isPast ? "FT" : "NS"
        },
        league: {
          id: event.idLeague,
          name: event.strLeague,
          type: "League",
          logo: null,
          season: event.strSeason
        },
        country: {
          name: event.strCountry || "",
          code: "",
          flag: null
        },
        teams: {
          home: {
            id: event.idHomeTeam,
            name: event.strHomeTeam,
            logo: event.strHomeTeamBadge || null
          },
          away: {
            id: event.idAwayTeam,
            name: event.strAwayTeam,
            logo: event.strAwayTeamBadge || null
          }
        },
        scores: {
          home: event.intHomeScore ? parseInt(event.intHomeScore) : null,
          away: event.intAwayScore ? parseInt(event.intAwayScore) : null
        }
      });
      
      const allGames = [
        ...pastEvents.map((e: any) => formatEvent(e, true)),
        ...nextEvents.map((e: any) => formatEvent(e, false))
      ];
      
      res.json({ response: allGames });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch team games" });
    }
  });

  // Get event/game details
  app.get("/api/rugby/game/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = await fetchSportsDB(`/lookupevent.php?id=${id}`);
      const events = data.events || [];
      
      const formattedEvents = events.map((event: any) => ({
        id: event.idEvent,
        date: event.dateEvent,
        time: event.strTime,
        venue: event.strVenue,
        league: event.strLeague,
        season: event.strSeason,
        homeTeam: {
          id: event.idHomeTeam,
          name: event.strHomeTeam,
          logo: event.strHomeTeamBadge,
          score: event.intHomeScore ? parseInt(event.intHomeScore) : null
        },
        awayTeam: {
          id: event.idAwayTeam,
          name: event.strAwayTeam,
          logo: event.strAwayTeamBadge,
          score: event.intAwayScore ? parseInt(event.intAwayScore) : null
        },
        status: event.strStatus || (event.intHomeScore ? "Match Finished" : "Not Started"),
        description: event.strDescriptionEN
      }));
      
      res.json({ response: formattedEvents });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch game" });
    }
  });

  // Get league standings (NRL league ID: 4416)
  app.get("/api/rugby/standings", async (req, res) => {
    try {
      const { league } = req.query as { league?: string };
      const leagueId = league || "4416";
      
      const data = await fetchSportsDB(`/lookuptable.php?l=${leagueId}&s=2024`);
      res.json({ response: data.table || [] });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch standings" });
    }
  });

  // Get all rugby leagues
  app.get("/api/rugby/leagues", async (req, res) => {
    try {
      const data = await fetchSportsDB(`/all_leagues.php`);
      const allLeagues = data.leagues || [];
      
      const rugbyLeagues = allLeagues.filter((league: any) => 
        league.strSport === "Rugby" || 
        league.strLeague?.toLowerCase().includes("rugby") ||
        league.strLeague?.toLowerCase().includes("nrl")
      );
      
      res.json({ response: rugbyLeagues });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch leagues" });
    }
  });

  return httpServer;
}

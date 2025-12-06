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

  // API-RUGBY from api-sports (requires RAPIDAPI_KEY)
  const RUGBY_API_BASE = "https://v1.rugby.api-sports.io";

  async function fetchRugbyAPI(endpoint: string) {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      throw new Error("RAPIDAPI_KEY is not configured");
    }

    const response = await fetch(`${RUGBY_API_BASE}${endpoint}`, {
      headers: {
        "x-apisports-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Rugby API error: ${response.status}`);
    }

    return response.json();
  }

  // League IDs for API-RUGBY
  const LEAGUE_IDS: Record<string, number> = {
    "NRL": 44,
    "Super League": 45,
    "Championship": 46,
  };

  const LEAGUE_NAMES: Record<number, string> = {
    44: "NRL",
    45: "Super League",
    46: "Championship",
  };

  // Cache for league teams to enable partial search
  let cachedLeagueTeams: any[] = [];
  let cacheTimestamp = 0;
  const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  async function getLeagueTeams() {
    const now = Date.now();
    if (cachedLeagueTeams.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
      return cachedLeagueTeams;
    }

    const allTeams: any[] = [];
    
    for (const leagueId of Object.values(LEAGUE_IDS)) {
      try {
        const data = await fetchRugbyAPI(`/teams?league=${leagueId}`);
        if (data.response) {
          const teamsWithLeague = data.response.map((team: any) => ({
            ...team,
            leagueId,
            leagueName: LEAGUE_NAMES[leagueId]
          }));
          allTeams.push(...teamsWithLeague);
        }
      } catch (e) {
        console.error(`Failed to fetch league ${leagueId}:`, e);
      }
    }

    cachedLeagueTeams = allTeams;
    cacheTimestamp = now;
    return allTeams;
  }

  // Search teams by name
  app.get("/api/rugby/teams/search", async (req, res) => {
    try {
      const { name } = req.query as { name?: string };
      if (!name || name.length < 2) {
        return res.json({ response: [] });
      }
      
      const searchLower = name.toLowerCase();
      
      // Get all cached league teams and search them
      const leagueTeams = await getLeagueTeams();
      
      // Search cached league teams for partial matches
      const matchingTeams = leagueTeams.filter((team: any) =>
        team.name?.toLowerCase().includes(searchLower)
      );
      
      const formattedTeams = matchingTeams.map((team: any) => ({
        id: team.id,
        name: team.name,
        logo: team.logo,
        country: {
          name: team.country?.name || "Unknown",
          code: team.country?.code || "",
          flag: team.country?.flag || null
        },
        league: team.leagueName,
        leagueId: team.leagueId
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
      
      // Map league names to IDs
      let leagueId = LEAGUE_IDS["NRL"]; // Default to NRL
      if (league) {
        if (league.toLowerCase().includes("super")) {
          leagueId = LEAGUE_IDS["Super League"];
        } else if (league.toLowerCase().includes("championship")) {
          leagueId = LEAGUE_IDS["Championship"];
        } else if (league.toLowerCase().includes("nrl") || league.toLowerCase().includes("national")) {
          leagueId = LEAGUE_IDS["NRL"];
        }
      }
      
      const data = await fetchRugbyAPI(`/teams?league=${leagueId}`);
      const teams = data.response || [];
      
      const formattedTeams = teams.map((team: any) => ({
        id: team.id,
        name: team.name,
        logo: team.logo,
        country: {
          name: team.country?.name || "Unknown",
          code: team.country?.code || "",
          flag: team.country?.flag || null
        },
        league: LEAGUE_NAMES[leagueId],
        leagueId: leagueId
      }));
      
      res.json({ response: formattedTeams });
    } catch (error: any) {
      console.error("Teams fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch teams" });
    }
  });

  // Get team by ID
  app.get("/api/rugby/team/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // First try to find in cached teams
      const cachedTeams = await getLeagueTeams();
      const cachedTeam = cachedTeams.find((t: any) => String(t.id) === String(id));
      
      if (cachedTeam) {
        res.json({ response: [{
          id: cachedTeam.id,
          name: cachedTeam.name,
          logo: cachedTeam.logo,
          country: cachedTeam.country || { name: "Unknown", code: "", flag: null },
          league: cachedTeam.leagueName,
          leagueId: cachedTeam.leagueId
        }] });
        return;
      }
      
      // Otherwise try API
      const data = await fetchRugbyAPI(`/teams?id=${id}`);
      const teams = data.response || [];
      
      const formattedTeams = teams.map((team: any) => ({
        id: team.id,
        name: team.name,
        logo: team.logo,
        country: team.country || { name: "Unknown", code: "", flag: null },
        league: team.league?.name,
        leagueId: team.league?.id
      }));
      
      res.json({ response: formattedTeams });
    } catch (error: any) {
      console.error("Team fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch team" });
    }
  });

  // Get fixtures/games for a league
  app.get("/api/rugby/fixtures", async (req, res) => {
    try {
      const { league, season } = req.query as { league?: string; season?: string };
      
      // Map league names to IDs
      let leagueId = LEAGUE_IDS["NRL"]; // Default to NRL
      if (league) {
        if (league.toLowerCase().includes("super")) {
          leagueId = LEAGUE_IDS["Super League"];
        } else if (league.toLowerCase().includes("championship")) {
          leagueId = LEAGUE_IDS["Championship"];
        } else if (league.toLowerCase().includes("nrl") || league.toLowerCase().includes("national")) {
          leagueId = LEAGUE_IDS["NRL"];
        }
      }
      
      const currentSeason = season || "2024";
      const data = await fetchRugbyAPI(`/games?league=${leagueId}&season=${currentSeason}`);
      const games = data.response || [];
      
      const formattedGames = games.map((game: any) => ({
        id: game.id,
        date: game.date,
        time: game.time,
        timestamp: game.timestamp,
        week: game.week,
        status: {
          long: game.status?.long || "Unknown",
          short: game.status?.short || "TBD"
        },
        league: {
          id: game.league?.id,
          name: game.league?.name,
          type: game.league?.type,
          logo: game.league?.logo,
          season: game.league?.season
        },
        country: game.country || { name: "", code: "", flag: null },
        teams: {
          home: {
            id: game.teams?.home?.id,
            name: game.teams?.home?.name,
            logo: game.teams?.home?.logo
          },
          away: {
            id: game.teams?.away?.id,
            name: game.teams?.away?.name,
            logo: game.teams?.away?.logo
          }
        },
        scores: {
          home: game.scores?.home,
          away: game.scores?.away
        }
      }));
      
      res.json({ response: formattedGames });
    } catch (error: any) {
      console.error("Fixtures fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch fixtures" });
    }
  });

  // Get games for a team (using league games filtered by team)
  app.get("/api/rugby/team/:id/games", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find team's league
      const cachedTeams = await getLeagueTeams();
      const team = cachedTeams.find((t: any) => String(t.id) === String(id));
      
      if (!team) {
        return res.json({ response: [] });
      }
      
      const leagueId = team.leagueId;
      const data = await fetchRugbyAPI(`/games?league=${leagueId}&season=2024`);
      const games = data.response || [];
      
      // Filter games that involve this team
      const teamGames = games.filter((game: any) => 
        String(game.teams?.home?.id) === String(id) || 
        String(game.teams?.away?.id) === String(id)
      );
      
      const formattedGames = teamGames.map((game: any) => ({
        id: game.id,
        date: game.date,
        time: game.time,
        timestamp: game.timestamp,
        week: game.week,
        status: {
          long: game.status?.long || "Unknown",
          short: game.status?.short || "TBD"
        },
        league: {
          id: game.league?.id,
          name: game.league?.name,
          type: game.league?.type,
          logo: game.league?.logo,
          season: game.league?.season
        },
        country: game.country || { name: "", code: "", flag: null },
        teams: {
          home: {
            id: game.teams?.home?.id,
            name: game.teams?.home?.name,
            logo: game.teams?.home?.logo
          },
          away: {
            id: game.teams?.away?.id,
            name: game.teams?.away?.name,
            logo: game.teams?.away?.logo
          }
        },
        scores: {
          home: game.scores?.home,
          away: game.scores?.away
        }
      }));
      
      res.json({ response: formattedGames });
    } catch (error: any) {
      console.error("Team games fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch team games" });
    }
  });

  // Get event/game details
  app.get("/api/rugby/game/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = await fetchRugbyAPI(`/games?id=${id}`);
      const games = data.response || [];
      
      const formattedGames = games.map((game: any) => ({
        id: game.id,
        date: game.date,
        time: game.time,
        venue: game.venue,
        league: game.league?.name,
        season: game.league?.season,
        homeTeam: {
          id: game.teams?.home?.id,
          name: game.teams?.home?.name,
          logo: game.teams?.home?.logo,
          score: game.scores?.home
        },
        awayTeam: {
          id: game.teams?.away?.id,
          name: game.teams?.away?.name,
          logo: game.teams?.away?.logo,
          score: game.scores?.away
        },
        status: game.status?.long || "Unknown"
      }));
      
      res.json({ response: formattedGames });
    } catch (error: any) {
      console.error("Game fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch game" });
    }
  });

  // Get league standings
  app.get("/api/rugby/standings", async (req, res) => {
    try {
      const { league, season } = req.query as { league?: string; season?: string };
      
      // Map league names to IDs
      let leagueId = LEAGUE_IDS["NRL"]; // Default to NRL
      if (league) {
        if (league.toLowerCase().includes("super")) {
          leagueId = LEAGUE_IDS["Super League"];
        } else if (league.toLowerCase().includes("championship")) {
          leagueId = LEAGUE_IDS["Championship"];
        } else if (league.toLowerCase().includes("nrl") || league.toLowerCase().includes("national")) {
          leagueId = LEAGUE_IDS["NRL"];
        }
      }
      
      const currentSeason = season || "2024";
      const data = await fetchRugbyAPI(`/standings?league=${leagueId}&season=${currentSeason}`);
      res.json({ response: data.response || [] });
    } catch (error: any) {
      console.error("Standings fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch standings" });
    }
  });

  // Get all rugby leagues
  app.get("/api/rugby/leagues", async (req, res) => {
    try {
      const data = await fetchRugbyAPI(`/leagues`);
      const leagues = data.response || [];
      
      res.json({ response: leagues });
    } catch (error: any) {
      console.error("Leagues fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch leagues" });
    }
  });

  // Get rugby news - using Google News RSS
  app.get("/api/rugby/news", async (req, res) => {
    try {
      const { league } = req.query as { league?: string };
      
      // Build search query based on league
      let searchQuery = "rugby league";
      if (league) {
        if (league.toLowerCase().includes("super")) {
          searchQuery = "Super League rugby";
        } else if (league.toLowerCase().includes("championship")) {
          searchQuery = "RFL Championship rugby";
        } else if (league.toLowerCase().includes("nrl") || league.toLowerCase().includes("national")) {
          searchQuery = "NRL rugby league";
        }
      }

      const encodedQuery = encodeURIComponent(searchQuery);
      const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-AU&gl=AU&ceid=AU:en`;
      
      const response = await fetch(rssUrl);
      const rssText = await response.text();
      
      // Parse RSS XML
      const items: any[] = [];
      const itemMatches = rssText.match(/<item>([\s\S]*?)<\/item>/g) || [];
      
      for (const itemXml of itemMatches.slice(0, 10)) {
        const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || "";
        const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";
        const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
        const source = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || "Unknown";
        
        if (title && link) {
          items.push({
            id: Buffer.from(link).toString('base64').slice(0, 20),
            title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
            link,
            publishedAt: pubDate,
            source,
            league: searchQuery
          });
        }
      }
      
      res.json({ response: items });
    } catch (error: any) {
      console.error("News fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch news" });
    }
  });

  return httpServer;
}

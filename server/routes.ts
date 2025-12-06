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

  // Local team data for fallback
  const LOCAL_TEAMS = [
    // NRL Teams (17 teams)
    { id: "brisbane-broncos", name: "Brisbane Broncos", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/7/76/Brisbane_Broncos_logo.svg" },
    { id: "canberra-raiders", name: "Canberra Raiders", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/0/0f/Canberra_Raiders_logo.svg" },
    { id: "canterbury-bulldogs", name: "Canterbury Bulldogs", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/5/5c/Canterbury-Bankstown_Bulldogs_logo.svg" },
    { id: "cronulla-sharks", name: "Cronulla Sharks", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/1/1a/Cronulla-Sutherland_Sharks_logo.svg" },
    { id: "dolphins", name: "Dolphins", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/f/f4/Redcliffe_Dolphins_logo.svg" },
    { id: "gold-coast-titans", name: "Gold Coast Titans", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/5/57/Gold_Coast_Titans_logo.svg" },
    { id: "manly-sea-eagles", name: "Manly Sea Eagles", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/0/0f/Manly-Warringah_Sea_Eagles_logo.svg" },
    { id: "melbourne-storm", name: "Melbourne Storm", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/9/9b/Melbourne_Storm_logo.svg" },
    { id: "newcastle-knights", name: "Newcastle Knights", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/f/ff/Newcastle_Knights_logo.svg" },
    { id: "nz-warriors", name: "New Zealand Warriors", league: "NRL", country: { name: "New Zealand", code: "NZ", flag: "https://flagcdn.com/w40/nz.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/7/78/New_Zealand_Warriors_logo.svg" },
    { id: "nth-qld-cowboys", name: "North Queensland Cowboys", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/2/2a/North_Queensland_Cowboys_logo.svg" },
    { id: "parramatta-eels", name: "Parramatta Eels", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/6/6b/Parramatta_Eels_logo.svg" },
    { id: "penrith-panthers", name: "Penrith Panthers", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/7/72/Penrith_Panthers_logo.svg" },
    { id: "south-sydney-rabbitohs", name: "South Sydney Rabbitohs", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/6/60/South_Sydney_Rabbitohs_logo.svg" },
    { id: "st-george-dragons", name: "St George Illawarra Dragons", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/5/59/St._George_Illawarra_Dragons_logo.svg" },
    { id: "sydney-roosters", name: "Sydney Roosters", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/e/e8/Sydney_Roosters_logo.svg" },
    { id: "wests-tigers", name: "Wests Tigers", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/2/2e/Wests_Tigers_logo.svg" },
    // Super League Teams (14 teams)
    { id: "bradford-bulls", name: "Bradford Bulls", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/f/f3/Bradford_Bulls_logo.svg" },
    { id: "castleford-tigers", name: "Castleford Tigers", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/4/4e/Castleford_Tigers_logo.svg" },
    { id: "catalans-dragons", name: "Catalans Dragons", league: "Super League", country: { name: "France", code: "FR", flag: "https://flagcdn.com/w40/fr.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/5/54/Catalans_Dragons_logo.svg" },
    { id: "huddersfield-giants", name: "Huddersfield Giants", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/4/4e/Huddersfield_Giants_logo.svg" },
    { id: "hull-fc", name: "Hull FC", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/b/be/Hull_FC_logo.svg" },
    { id: "hull-kr", name: "Hull Kingston Rovers", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/1/16/Hull_Kingston_Rovers_logo.svg" },
    { id: "leeds-rhinos", name: "Leeds Rhinos", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/a/ac/Leeds_Rhinos_logo.svg" },
    { id: "leigh-leopards", name: "Leigh Leopards", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/2/29/Leigh_Leopards_logo.svg" },
    { id: "st-helens", name: "St Helens", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/d/d8/St_Helens_RFC_logo.svg" },
    { id: "toulouse-olympique", name: "Toulouse Olympique", league: "Super League", country: { name: "France", code: "FR", flag: "https://flagcdn.com/w40/fr.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/c/c9/Toulouse_Olympique_logo.svg" },
    { id: "wakefield-trinity", name: "Wakefield Trinity", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/7/7e/Wakefield_Trinity_logo.svg" },
    { id: "warrington-wolves", name: "Warrington Wolves", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/b/b9/Warrington_Wolves_logo.svg" },
    { id: "wigan-warriors", name: "Wigan Warriors", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/7/77/Wigan_Warriors_logo.svg" },
    { id: "york-knights", name: "York Knights", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/3/38/York_City_Knights_logo.svg" },
    // Championship Teams (10 teams)
    { id: "barrow-raiders", name: "Barrow Raiders", league: "Championship", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/6/62/Barrow_Raiders_logo.svg" },
    { id: "batley-bulldogs", name: "Batley Bulldogs", league: "Championship", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/5/5e/Batley_Bulldogs_logo.svg" },
    { id: "doncaster", name: "Doncaster", league: "Championship", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/1/16/Doncaster_RLFC_logo.svg" },
    { id: "featherstone-rovers", name: "Featherstone Rovers", league: "Championship", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/1/12/Featherstone_Rovers_logo.svg" },
    { id: "halifax-panthers", name: "Halifax Panthers", league: "Championship", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/d/d9/Halifax_Panthers_logo.svg" },
    { id: "hunslet", name: "Hunslet", league: "Championship", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/0/03/Hunslet_RLFC_logo.svg" },
    { id: "london-broncos", name: "London Broncos", league: "Championship", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/1/14/London_Broncos_logo.svg" },
    { id: "oldham", name: "Oldham", league: "Championship", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/0/01/Oldham_RLFC_logo.svg" },
    { id: "sheffield-eagles", name: "Sheffield Eagles", league: "Championship", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/3/3f/Sheffield_Eagles_logo.svg" },
    { id: "widnes-vikings", name: "Widnes Vikings", league: "Championship", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://upload.wikimedia.org/wikipedia/en/c/c1/Widnes_Vikings_logo.svg" },
  ];

  // Get local teams by league
  function getLocalTeams(league?: string): any[] {
    if (!league) return LOCAL_TEAMS;
    
    const leagueLower = league.toLowerCase();
    if (leagueLower.includes("super")) {
      return LOCAL_TEAMS.filter(t => t.league === "Super League");
    } else if (leagueLower.includes("championship")) {
      return LOCAL_TEAMS.filter(t => t.league === "Championship");
    } else if (leagueLower.includes("nrl") || leagueLower.includes("national")) {
      return LOCAL_TEAMS.filter(t => t.league === "NRL");
    }
    return LOCAL_TEAMS.filter(t => t.league === league);
  }

  // Search local teams by name
  function searchLocalTeams(name: string): any[] {
    const searchLower = name.toLowerCase();
    return LOCAL_TEAMS.filter(team => 
      team.name.toLowerCase().includes(searchLower)
    );
  }

  // Search teams by name
  app.get("/api/rugby/teams/search", async (req, res) => {
    try {
      const { name } = req.query as { name?: string };
      if (!name || name.length < 2) {
        return res.json({ response: [] });
      }
      
      // Use local team data for search
      const matchingTeams = searchLocalTeams(name);
      
      res.json({ response: matchingTeams });
    } catch (error: any) {
      console.error("Team search error:", error);
      res.status(500).json({ message: error.message || "Failed to search teams" });
    }
  });

  // Get all teams in a league
  app.get("/api/rugby/teams", async (req, res) => {
    try {
      const { league } = req.query as { league?: string };
      
      // Use local team data
      const teams = getLocalTeams(league || "NRL");
      
      res.json({ response: teams });
    } catch (error: any) {
      console.error("Teams fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch teams" });
    }
  });

  // Get team by ID
  app.get("/api/rugby/team/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find team in local data
      const team = LOCAL_TEAMS.find((t: any) => String(t.id) === String(id));
      
      if (team) {
        res.json({ response: [team] });
      } else {
        res.json({ response: [] });
      }
    } catch (error: any) {
      console.error("Team fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch team" });
    }
  });

  // Get fixtures/games for a league (currently returns empty - API not available)
  app.get("/api/rugby/fixtures", async (req, res) => {
    try {
      // API not available - return empty response
      // In the future, this could use a working API or local fixture data
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Fixtures fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch fixtures" });
    }
  });

  // Get games for a team (currently returns empty - API not available)
  app.get("/api/rugby/team/:id/games", async (req, res) => {
    try {
      // API not available - return empty response
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Team games fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch team games" });
    }
  });

  // Get event/game details (currently returns empty - API not available)
  app.get("/api/rugby/game/:id", async (req, res) => {
    try {
      // API not available - return empty response
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Game fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch game" });
    }
  });

  // Get league standings (currently returns empty - API not available)
  app.get("/api/rugby/standings", async (req, res) => {
    try {
      // API not available - return empty response
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Standings fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch standings" });
    }
  });

  // Get all rugby leagues
  app.get("/api/rugby/leagues", async (req, res) => {
    try {
      // Return static list of supported leagues
      res.json({ response: [
        { id: "NRL", name: "NRL", country: "Australia" },
        { id: "Super League", name: "Super League", country: "England" },
        { id: "Championship", name: "Championship", country: "England" }
      ] });
    } catch (error: any) {
      console.error("Leagues fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch leagues" });
    }
  });

  // Helper to decode HTML entities
  function decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

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
      
      if (!response.ok) {
        console.error("RSS fetch failed:", response.status, response.statusText);
        return res.json({ response: [] });
      }
      
      const rssText = await response.text();
      
      // Parse RSS XML
      const items: any[] = [];
      const itemMatches = rssText.match(/<item>([\s\S]*?)<\/item>/g) || [];
      
      for (const itemXml of itemMatches.slice(0, 10)) {
        const rawTitle = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || "";
        const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";
        const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
        const rawSource = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || "Unknown";
        
        if (rawTitle && link) {
          items.push({
            id: Buffer.from(link).toString('base64').slice(0, 20),
            title: decodeHtmlEntities(rawTitle),
            link,
            pubDate,
            source: decodeHtmlEntities(rawSource),
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

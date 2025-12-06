import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerUserSchema, updateUserPreferencesSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import passport from "./auth";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import type { User } from "@shared/schema";

const SPORTSDB_API_KEY = "3";
const SPORTSDB_BASE_URL = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}`;

const LEAGUE_IDS: Record<string, string> = {
  "NRL": "4416",
  "Super League": "4415", 
};

async function fetchFromSportsDB(endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${SPORTSDB_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`SportsDB API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("SportsDB fetch error:", error);
    return null;
  }
}

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

  // Local team data with TheSportsDB IDs and badges
  const LOCAL_TEAMS = [
    // NRL Teams (17 teams)
    { id: "135191", name: "Brisbane Broncos", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/dnj6uw1646347648.png" },
    { id: "135186", name: "Canberra Raiders", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/wmlzo81646347671.png" },
    { id: "135187", name: "Canterbury Bulldogs", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/xppsxy1552072965.png" },
    { id: "135184", name: "Cronulla Sharks", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/qn3n5r1552073088.png" },
    { id: "140097", name: "Dolphins", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/7bxuvl1665126908.png" },
    { id: "135194", name: "Gold Coast Titans", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/4qqmp81646347724.png" },
    { id: "135188", name: "Manly Sea Eagles", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/1ok3661646347740.png" },
    { id: "135190", name: "Melbourne Storm", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/hpdn401646347751.png" },
    { id: "135198", name: "Newcastle Knights", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/aes2o51646347790.png" },
    { id: "135193", name: "New Zealand Warriors", league: "NRL", country: { name: "New Zealand", code: "NZ", flag: "https://flagcdn.com/w40/nz.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/w8b9kw1646347767.png" },
    { id: "135196", name: "North Queensland Cowboys", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/q6xu7c1646347820.png" },
    { id: "135183", name: "Parramatta Eels", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/5tvma21646347846.png" },
    { id: "135197", name: "Penrith Panthers", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/239jb41552073712.png" },
    { id: "135185", name: "South Sydney Rabbitohs", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/0m4unp1552072677.png" },
    { id: "135195", name: "St George Illawarra Dragons", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/ur74hh1552073186.png" },
    { id: "135192", name: "Sydney Roosters", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/by299w1646347883.png" },
    { id: "135189", name: "Wests Tigers", league: "NRL", country: { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/cs6i6f1646347894.png" },
    // Super League Teams (12 teams)
    { id: "135213", name: "Castleford Tigers", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/uubtq71656789542.png" },
    { id: "135211", name: "Catalans Dragons", league: "Super League", country: { name: "France", code: "FR", flag: "https://flagcdn.com/w40/fr.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/s3hv1a1656789566.png" },
    { id: "135219", name: "Huddersfield Giants", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/7u1czh1656789587.png" },
    { id: "135214", name: "Hull FC", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://www.thesportsdb.com/images/media/team/badge/qfgncj1761164505.png" },
    { id: "135215", name: "Hull Kingston Rovers", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/6w6g8z1656789645.png" },
    { id: "135216", name: "Leeds Rhinos", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/ryqwvv1447875742.png" },
    { id: "135217", name: "Leigh Leopards", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/wqutpt1706621089.png" },
    { id: "135212", name: "Salford Red Devils", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/3dnjjp1656789716.png" },
    { id: "135218", name: "St Helens", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/xolesg1706620870.png" },
    { id: "135221", name: "Wakefield Trinity", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/gytlqy1656789733.png" },
    { id: "135220", name: "Warrington Wolves", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/saimjk1656789616.png" },
    { id: "135222", name: "Wigan Warriors", league: "Super League", country: { name: "England", code: "GB", flag: "https://flagcdn.com/w40/gb.png" }, logo: "https://r2.thesportsdb.com/images/media/team/badge/vch5a71673549813.png" },
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
      
      // Try TheSportsDB first
      const data = await fetchFromSportsDB(`/searchteams.php?t=${encodeURIComponent(name)}`);
      if (data?.teams) {
        const rugbyLeagueTeams = data.teams.filter((team: any) => 
          team.strSport === "Rugby League" || 
          team.strLeague?.includes("NRL") || 
          team.strLeague?.includes("Super League") ||
          team.strLeague?.includes("Rugby")
        ).map((team: any) => ({
          id: team.idTeam,
          name: team.strTeam,
          logo: team.strBadge || team.strLogo,
          league: team.strLeague,
          country: {
            name: team.strCountry,
            code: team.strCountry === "Australia" ? "AU" : team.strCountry === "New Zealand" ? "NZ" : "GB",
            flag: team.strCountry === "Australia" ? "https://flagcdn.com/w40/au.png" : 
                  team.strCountry === "New Zealand" ? "https://flagcdn.com/w40/nz.png" :
                  team.strCountry === "France" ? "https://flagcdn.com/w40/fr.png" : "https://flagcdn.com/w40/gb.png"
          },
        }));
        
        if (rugbyLeagueTeams.length > 0) {
          return res.json({ response: rugbyLeagueTeams });
        }
      }
      
      // Fallback to local search
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
      const leagueName = league || "NRL";
      
      // Use local team data with TheSportsDB IDs and badges
      const teams = getLocalTeams(leagueName);
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
      
      // Check local data first for known rugby league teams
      const localTeam = LOCAL_TEAMS.find((t: any) => String(t.id) === String(id));
      
      // Try TheSportsDB for additional details, but verify it's rugby league
      const data = await fetchFromSportsDB(`/lookupteam.php?id=${id}`);
      if (data?.teams && data.teams.length > 0) {
        const team = data.teams[0];
        // Only use API data if it's a rugby league team
        if (team.strSport === "Rugby League") {
          return res.json({ response: [{
            id: team.idTeam,
            name: team.strTeam,
            logo: localTeam?.logo || team.strBadge || team.strLogo,
            league: team.strLeague,
            country: {
              name: team.strCountry,
              code: team.strCountry === "Australia" ? "AU" : team.strCountry === "New Zealand" ? "NZ" : "GB",
              flag: team.strCountry === "Australia" ? "https://flagcdn.com/w40/au.png" : 
                    team.strCountry === "New Zealand" ? "https://flagcdn.com/w40/nz.png" :
                    team.strCountry === "France" ? "https://flagcdn.com/w40/fr.png" : "https://flagcdn.com/w40/gb.png"
            },
            stadium: team.strStadium,
            description: team.strDescriptionEN,
            founded: team.intFormedYear,
            website: team.strWebsite,
            facebook: team.strFacebook,
            twitter: team.strTwitter,
            instagram: team.strInstagram,
            jersey: team.strEquipment,
          }] });
        }
      }
      
      // Fallback to local data for rugby league teams
      if (localTeam) {
        res.json({ response: [localTeam] });
      } else {
        res.json({ response: [] });
      }
    } catch (error: any) {
      console.error("Team fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch team" });
    }
  });

  // Get team roster/squad
  app.get("/api/rugby/team/:id/players", async (req, res) => {
    try {
      const { id } = req.params;
      
      const data = await fetchFromSportsDB(`/lookup_all_players.php?id=${id}`);
      if (data?.player) {
        const players = data.player.map((p: any) => ({
          id: p.idPlayer,
          name: p.strPlayer,
          position: p.strPosition,
          nationality: p.strNationality,
          birthDate: p.dateBorn,
          height: p.strHeight,
          weight: p.strWeight,
          photo: p.strThumb || p.strCutout,
          number: p.strNumber,
          description: p.strDescriptionEN,
        }));
        return res.json({ response: players });
      }
      
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Team players fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch team players" });
    }
  });

  // Get fixtures/games for a league (uses season data for rugby league)
  app.get("/api/rugby/fixtures", async (req, res) => {
    try {
      const { league, season } = req.query as { league?: string; season?: string };
      const leagueName = league || "NRL";
      const leagueId = LEAGUE_IDS[leagueName];
      const seasonYear = season || "2025";
      
      if (leagueId) {
        // Use eventsseason.php for complete season data (works during off-season)
        const data = await fetchFromSportsDB(`/eventsseason.php?id=${leagueId}&s=${seasonYear}`);
        if (data?.events && Array.isArray(data.events)) {
          // Filter to only rugby league events and sort by date
          const events = data.events
            .filter((e: any) => e.strSport === "Rugby League" || e.idLeague === leagueId)
            .map((e: any) => ({
              id: e.idEvent,
              date: e.dateEvent,
              time: e.strTime,
              homeTeam: {
                id: e.idHomeTeam,
                name: e.strHomeTeam,
                logo: e.strHomeTeamBadge,
                score: e.intHomeScore,
              },
              awayTeam: {
                id: e.idAwayTeam,
                name: e.strAwayTeam,
                logo: e.strAwayTeamBadge,
                score: e.intAwayScore,
              },
              venue: e.strVenue,
              status: e.strStatus || (e.intHomeScore !== null ? "Match Finished" : "Not Started"),
              round: e.intRound,
              league: { id: leagueId, name: leagueName },
            }))
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 50);
          return res.json({ response: events });
        }
      }
      
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Fixtures fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch fixtures" });
    }
  });

  // Get past/completed games for a league
  app.get("/api/rugby/results", async (req, res) => {
    try {
      const { league } = req.query as { league?: string };
      const leagueName = league || "NRL";
      const leagueId = LEAGUE_IDS[leagueName];
      
      if (leagueId) {
        // Get last 15 events
        const data = await fetchFromSportsDB(`/eventspastleague.php?id=${leagueId}`);
        if (data?.events) {
          const events = data.events.map((e: any) => ({
            id: e.idEvent,
            date: e.dateEvent,
            time: e.strTime,
            homeTeam: {
              id: e.idHomeTeam,
              name: e.strHomeTeam,
              logo: e.strHomeTeamBadge,
              score: e.intHomeScore,
            },
            awayTeam: {
              id: e.idAwayTeam,
              name: e.strAwayTeam,
              logo: e.strAwayTeamBadge,
              score: e.intAwayScore,
            },
            venue: e.strVenue,
            status: e.strStatus || "FT",
            round: e.intRound,
            league: { id: leagueId, name: leagueName },
          }));
          return res.json({ response: events });
        }
      }
      
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Results fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch results" });
    }
  });

  // Get games for a team
  app.get("/api/rugby/team/:id/games", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get next 5 and last 5 events for the team
      const [nextData, pastData] = await Promise.all([
        fetchFromSportsDB(`/eventsnext.php?id=${id}`),
        fetchFromSportsDB(`/eventslast.php?id=${id}`)
      ]);
      
      const mapEvent = (e: any) => {
        const statusStr = e.strStatus || (e.intHomeScore !== null ? "Match Finished" : "Not Started");
        const statusShort = statusStr === "Match Finished" ? "FT" : 
                           statusStr === "Not Started" ? "NS" : 
                           statusStr === "After Extra Time" ? "AET" : 
                           statusStr === "Postponed" ? "PST" : statusStr;
        return {
          id: e.idEvent,
          date: e.dateEvent,
          time: e.strTime,
          timestamp: e.dateEvent ? new Date(`${e.dateEvent}T${e.strTime || "00:00:00"}`).getTime() : 0,
          timezone: "UTC",
          week: e.intRound || "",
          status: {
            long: statusStr,
            short: statusShort,
          },
          league: { 
            id: e.idLeague, 
            name: e.strLeague,
            type: "League",
            logo: null,
            season: new Date().getFullYear(),
          },
          country: {
            name: e.strCountry || "Unknown",
            code: "AU",
            flag: "https://flagcdn.com/w40/au.png",
          },
          teams: {
            home: {
              id: parseInt(e.idHomeTeam) || 0,
              name: e.strHomeTeam,
              logo: e.strHomeTeamBadge,
            },
            away: {
              id: parseInt(e.idAwayTeam) || 0,
              name: e.strAwayTeam,
              logo: e.strAwayTeamBadge,
            },
          },
          scores: {
            home: e.intHomeScore !== null ? parseInt(e.intHomeScore) : null,
            away: e.intAwayScore !== null ? parseInt(e.intAwayScore) : null,
          },
        };
      };
      
      // Filter for rugby league only and map events
      const pastEvents = (pastData?.results || [])
        .filter((e: any) => e.strSport === "Rugby League")
        .map(mapEvent);
      const nextEvents = (nextData?.events || [])
        .filter((e: any) => e.strSport === "Rugby League")
        .map(mapEvent);
      
      const events = [...pastEvents, ...nextEvents];
      
      res.json({ response: events });
    } catch (error: any) {
      console.error("Team games fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch team games" });
    }
  });

  // Get event/game details
  app.get("/api/rugby/game/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const data = await fetchFromSportsDB(`/lookupevent.php?id=${id}`);
      if (data?.events && data.events.length > 0) {
        const e = data.events[0];
        return res.json({ response: [{
          id: e.idEvent,
          date: e.dateEvent,
          time: e.strTime,
          homeTeam: {
            id: e.idHomeTeam,
            name: e.strHomeTeam,
            logo: e.strHomeTeamBadge,
            score: e.intHomeScore,
          },
          awayTeam: {
            id: e.idAwayTeam,
            name: e.strAwayTeam,
            logo: e.strAwayTeamBadge,
            score: e.intAwayScore,
          },
          venue: e.strVenue,
          status: e.strStatus || (e.intHomeScore !== null ? "FT" : null),
          round: e.intRound,
          league: { id: e.idLeague, name: e.strLeague },
          description: e.strDescriptionEN,
          video: e.strVideo,
        }] });
      }
      
      res.json({ response: [] });
    } catch (error: any) {
      console.error("Game fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch game" });
    }
  });

  // Get league standings
  app.get("/api/rugby/standings", async (req, res) => {
    try {
      const { league } = req.query as { league?: string };
      const leagueName = league || "NRL";
      const leagueId = LEAGUE_IDS[leagueName];
      
      if (leagueId) {
        const data = await fetchFromSportsDB(`/lookuptable.php?l=${leagueId}`);
        if (data?.table) {
          const standings = data.table.map((t: any) => ({
            position: t.intRank,
            team: {
              id: t.idTeam,
              name: t.strTeam,
              logo: t.strBadge,
            },
            played: t.intPlayed,
            won: t.intWin,
            drawn: t.intDraw,
            lost: t.intLoss,
            goalsFor: t.intGoalsFor,
            goalsAgainst: t.intGoalsAgainst,
            goalDifference: t.intGoalDifference,
            points: t.intPoints,
          }));
          return res.json({ response: standings });
        }
      }
      
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

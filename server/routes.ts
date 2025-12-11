import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerUserSchema, updateUserPreferencesSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import passport from "./auth";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import type { User } from "@shared/schema";
import { LOCAL_TEAM_ROSTERS } from "./data/localRosters";
import { NRL_2026_FIXTURES_BY_TEAM, type LocalFixture } from "./data/localFixtures";
import { SUPER_LEAGUE_FIXTURES_BY_TEAM, SUPER_LEAGUE_TEAM_ID_BY_CODE } from "./data/localSuperLeagueFixtures";
import { SUPER_LEAGUE_SQUADS, type SuperLeagueSquad } from "./data/localSuperLeagueSquads";
import { getLocalNewsFallback } from "./data/localNews";
import { LOCAL_TEAMS } from "../shared/localTeams";

const SPORTSDB_API_KEY = "3";
const SPORTSDB_BASE_URL = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}`;

const LEAGUE_IDS: Record<string, string> = {
  "NRL": "4416",
  "Super League": "4415", 
};
const CURRENT_SEASON = "2026";

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

  const SUPER_LEAGUE_TEAM_IDS = new Set(Object.values(SUPER_LEAGUE_TEAM_ID_BY_CODE));
  const SUPER_LEAGUE_SQUADS_BY_TEAM_ID = Object.entries(SUPER_LEAGUE_SQUADS).reduce<Record<string, SuperLeagueSquad[]>>((acc, [code, squads]) => {
    const teamId = SUPER_LEAGUE_TEAM_ID_BY_CODE[code];
    if (teamId) {
      acc[teamId] = squads;
    }
    return acc;
  }, {});

  function findLocalTeamByFragment(name: string) {
    if (!name) return undefined;
    const normalized = name.trim().toLowerCase();
    return LOCAL_TEAMS.find((team) => {
      const teamName = team.name.toLowerCase();
      const simplifiedTeam = teamName.replace(/[^a-z]/g, "");
      const simplifiedInput = normalized.replace(/[^a-z]/g, "");
      return (
        teamName === normalized ||
        teamName.includes(normalized) ||
        normalized.includes(teamName) ||
        simplifiedTeam === simplifiedInput ||
        simplifiedTeam.includes(simplifiedInput)
      );
    });
  }

  const getFallbackPlayerImage = (name: string) => {
    const encoded = encodeURIComponent(name || "Player");
    return `https://ui-avatars.com/api/?name=${encoded}&background=random&color=ffffff`;
  };

  function mapLocalFixtureToGame(fixture: LocalFixture, leagueName: string, leagueId: string) {
    const dateObj = new Date(fixture.dateUtc);
    const isoDate = dateObj.toISOString();
    const [datePart, timePart] = isoDate.split("T");
    const homeTeam = findLocalTeamByFragment(fixture.homeTeam);
    const awayTeam = findLocalTeamByFragment(fixture.awayTeam);
    const defaultCountry = { name: "Australia", code: "AU", flag: "https://flagcdn.com/w40/au.png" };

    return {
      id: `local-${leagueName}-${fixture.matchNumber}-${fixture.homeTeam}-${fixture.awayTeam}`,
      date: datePart,
      time: (timePart || "00:00:00").substring(0, 8),
      timestamp: dateObj.getTime(),
      timezone: "UTC",
      week: `Round ${fixture.roundNumber}`,
      status: { long: "Not Started", short: "NS" },
      league: { 
        id: parseInt(leagueId, 10) || leagueId, 
        name: leagueName,
        type: "League",
        logo: null,
        season: parseInt(CURRENT_SEASON, 10),
      },
      country: homeTeam?.country || defaultCountry,
      teams: {
        home: {
          id: homeTeam ? parseInt(homeTeam.id, 10) : 0,
          name: homeTeam?.name || fixture.homeTeam,
          logo: homeTeam?.logo || null,
        },
        away: {
          id: awayTeam ? parseInt(awayTeam.id, 10) : 0,
          name: awayTeam?.name || fixture.awayTeam,
          logo: awayTeam?.logo || null,
        },
      },
      scores: { home: null, away: null },
      venue: fixture.location,
    };
  }

  function buildFixturesFromLocalMap(fixturesByTeam: Record<string, LocalFixture[]>, leagueName: string) {
    const leagueId = LEAGUE_IDS[leagueName];
    if (!leagueId) return [];
    const dedup = new Map<string, LocalFixture>();
    Object.values(fixturesByTeam).forEach((fixtures) => {
      fixtures.forEach((fixture) => {
        const key = `${fixture.matchNumber}-${fixture.homeTeam}-${fixture.awayTeam}-${fixture.dateUtc}`;
        if (!dedup.has(key)) {
          dedup.set(key, fixture);
        }
      });
    });

    return Array.from(dedup.values())
      .map((fixture) => mapLocalFixtureToGame(fixture, leagueName, leagueId))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  function buildNrlFixturesFromLocalData() {
    return buildFixturesFromLocalMap(NRL_2026_FIXTURES_BY_TEAM, "NRL");
  }

  function buildSuperLeagueFixturesFromLocalData() {
    return buildFixturesFromLocalMap(SUPER_LEAGUE_FIXTURES_BY_TEAM, "Super League");
  }

  function getLocalFixturesForTeam(teamId: string, leagueName?: string) {
    const leagueLower = leagueName?.toLowerCase() || "";
    if (leagueLower.includes("super")) {
      return SUPER_LEAGUE_FIXTURES_BY_TEAM[teamId];
    }
    return NRL_2026_FIXTURES_BY_TEAM[teamId];
  }

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

  // Helper: get local team logo by id
  function getLocalTeamLogo(id: any): string | null {
    const team = LOCAL_TEAMS.find((t: any) => String(t.id) === String(id));
    return team?.logo || null;
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
      if (teams.length > 0) {
        return res.json({ response: teams });
      }

      // Fallback to TheSportsDB if no local teams exist for the league
      const leagueCandidates = [leagueName];
      const leagueLower = leagueName.toLowerCase();
      if (leagueLower.includes("championship") && !leagueLower.includes("rfl")) {
        leagueCandidates.push("RFL Championship");
      }
      if (leagueLower.includes("super") && !leagueLower.includes("league")) {
        leagueCandidates.push("Super League");
      }

      for (const leagueLabel of leagueCandidates) {
        const data = await fetchFromSportsDB(`/search_all_teams.php?l=${encodeURIComponent(leagueLabel)}`);
        if (data?.teams && data.teams.length > 0) {
          const mapped = data.teams
            .filter((team: any) => team.strSport === "Rugby League")
            .map((team: any) => ({
              id: team.idTeam,
              name: team.strTeam,
              logo: team.strBadge || team.strLogo,
              league: team.strLeague,
              country: {
                name: team.strCountry || "Unknown",
                code: team.strCountry === "Australia" ? "AU" : team.strCountry === "New Zealand" ? "NZ" : team.strCountry === "France" ? "FR" : "GB",
                flag:
                  team.strCountry === "Australia"
                    ? "https://flagcdn.com/w40/au.png"
                    : team.strCountry === "New Zealand"
                      ? "https://flagcdn.com/w40/nz.png"
                      : team.strCountry === "France"
                        ? "https://flagcdn.com/w40/fr.png"
                        : team.strCountry
                          ? "https://flagcdn.com/w40/gb.png"
                          : null,
              },
            }));
          if (mapped.length > 0) {
            return res.json({ response: mapped });
          }
        }
      }

      res.json({ response: [] });
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

  // Proxy Wakefield Trinity logo from Wikimedia to avoid CORS/user-agent issues
  app.get("/api/assets/logo/wakefield.png", async (_req, res) => {
    try {
      // Use MediaWiki API to get the file URL for File:Wakey_new_logo.png
      const apiUrl = "https://en.wikipedia.org/w/api.php?action=query&titles=File:Wakey_new_logo.png&prop=imageinfo&iiprop=url&format=json";
      const apiResp = await fetch(apiUrl);
      if (!apiResp.ok) return res.status(502).send("Failed to contact Wikimedia API");
      const apiJson = await apiResp.json();
      const pages = apiJson?.query?.pages || {};
      const pageKey = Object.keys(pages)[0];
      const imageinfo = pages[pageKey]?.imageinfo;
      const imageUrl = imageinfo && imageinfo[0] && imageinfo[0].url;

      if (!imageUrl) {
        return res.status(404).send("Wakefield logo not found on Wikimedia");
      }

      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) return res.status(502).send("Failed to fetch image from Wikimedia");

      const contentType = imgResp.headers.get("content-type") || "image/png";
      const buffer = Buffer.from(await imgResp.arrayBuffer());

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (error) {
      console.error("Error proxying Wakefield logo:", error);
      res.status(500).send("Internal server error while proxying logo");
    }
  });

  // Proxy York Knights logo from Wikimedia to avoid CORS/user-agent issues
  app.get("/api/assets/logo/york.webp", async (_req, res) => {
    try {
      // Use MediaWiki API to get the file URL for File:York_RLFC_Knights_logo.webp
      const apiUrl = "https://en.wikipedia.org/w/api.php?action=query&titles=File:York_RLFC_Knights_logo.webp&prop=imageinfo&iiprop=url&format=json";
      const apiResp = await fetch(apiUrl);
      if (!apiResp.ok) return res.status(502).send("Failed to contact Wikimedia API");
      const apiJson = await apiResp.json();
      const pages = apiJson?.query?.pages || {};
      const pageKey = Object.keys(pages)[0];
      const imageinfo = pages[pageKey]?.imageinfo;
      const imageUrl = imageinfo && imageinfo[0] && imageinfo[0].url;

      if (!imageUrl) {
        return res.status(404).send("York Knights logo not found on Wikimedia");
      }

      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) return res.status(502).send("Failed to fetch image from Wikimedia");

      const contentType = imgResp.headers.get("content-type") || "image/webp";
      const buffer = Buffer.from(await imgResp.arrayBuffer());

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (error) {
      console.error("Error proxying York Knights logo:", error);
      res.status(500).send("Internal server error while proxying logo");
    }
  });

  // Proxy St George Illawarra Dragons logo from Wikimedia to avoid CORS/user-agent issues
  app.get("/api/assets/logo/st-george-illawarra.svg", async (_req, res) => {
    try {
      // Use MediaWiki API to get the file URL for File:St._George_Illawarra_Dragons_logo.svg
      const apiUrl = "https://en.wikipedia.org/w/api.php?action=query&titles=File:St._George_Illawarra_Dragons_logo.svg&prop=imageinfo&iiprop=url&format=json";
      const apiResp = await fetch(apiUrl);
      if (!apiResp.ok) return res.status(502).send("Failed to contact Wikimedia API");
      const apiJson = await apiResp.json();
      const pages = apiJson?.query?.pages || {};
      const pageKey = Object.keys(pages)[0];
      const imageinfo = pages[pageKey]?.imageinfo;
      const imageUrl = imageinfo && imageinfo[0] && imageinfo[0].url;

      if (!imageUrl) {
        return res.status(404).send("St George Illawarra Dragons logo not found on Wikimedia");
      }

      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) return res.status(502).send("Failed to fetch image from Wikimedia");

      const contentType = imgResp.headers.get("content-type") || "image/svg+xml";
      const buffer = Buffer.from(await imgResp.arrayBuffer());

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (error) {
      console.error("Error proxying St George Illawarra Dragons logo:", error);
      res.status(500).send("Internal server error while proxying logo");
    }
  });

  // Get team roster/squad
  app.get("/api/rugby/team/:id/players", async (req, res) => {
    try {
      const { id } = req.params;
      const { season } = req.query as { season?: string };
      const defaultSeason = parseInt(CURRENT_SEASON, 10);
      const requestedSeason = season ? parseInt(season, 10) : defaultSeason;
      const seasonFilter = Number.isNaN(requestedSeason) ? defaultSeason : requestedSeason;
      const isCurrentSeasonRequest = seasonFilter === defaultSeason;
      const localRoster = LOCAL_TEAM_ROSTERS[id] || [];
      const teamInfo = LOCAL_TEAMS.find((team) => String(team.id) === String(id));
      const superLeagueSquads = SUPER_LEAGUE_SQUADS_BY_TEAM_ID[id] || [];

      const buildLocalRosterPlayers = () => {
        if (!localRoster || localRoster.length === 0) return null;
        return localRoster.map((player) => ({
          id: player.id,
          name: player.name,
          position: player.position,
          nationality: teamInfo?.country?.name || "Australia",
          birthDate: null,
          height: null,
          weight: null,
          photo: getFallbackPlayerImage(player.name),
          thumbnail: getFallbackPlayerImage(player.name),
          number: null,
          description: `${player.name} plays ${player.position} for ${teamInfo?.name || "the club"}.`,
        }));
      };

      const buildSuperLeaguePlayers = () => {
        if (!superLeagueSquads || superLeagueSquads.length === 0) return null;
        const squad =
          superLeagueSquads.find((entry) => entry.season === seasonFilter) ||
          superLeagueSquads[0];
        if (!squad || !squad.players || squad.players.length === 0) return null;
        return squad.players.map((player, index) => {
          const avatar = getFallbackPlayerImage(player.name);
          return {
          id: `SL-${id}-${player.squad_number ?? index + 1}`,
          name: player.name,
          position: player.position,
          nationality: player.nationality || teamInfo?.country?.name || "England",
          birthDate: player.dob || null,
          height: player.height_cm ? `${player.height_cm} cm` : null,
          weight: player.weight_kg ? `${player.weight_kg} kg` : null,
          photo: avatar,
          thumbnail: avatar,
          number: player.squad_number ? String(player.squad_number) : null,
          description:
            player.position && squad.source_note
              ? `${player.name} (${player.position}) - ${squad.source_note}`
              : squad.source_note || `${player.name} is part of ${squad.team_name}'s ${squad.season} squad.`,
        }});
      };

      const localPlayers = buildLocalRosterPlayers();
      const superLeaguePlayers = buildSuperLeaguePlayers();

      if (isCurrentSeasonRequest) {
        if (localPlayers) {
          return res.json({ response: localPlayers });
        }
        if (superLeaguePlayers) {
          return res.json({ response: superLeaguePlayers });
        }
      }

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
          thumbnail: p.strThumb || p.strCutout,
          number: p.strNumber,
          description: p.strDescriptionEN,
        }));
        return res.json({ response: players });
      }

      if (localPlayers) {
        return res.json({ response: localPlayers });
      }

      if (superLeaguePlayers) {
        return res.json({ response: superLeaguePlayers });
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
      const seasonYear = season || CURRENT_SEASON;
      const normalizedLeague = leagueName.toLowerCase();

      if (seasonYear === CURRENT_SEASON) {
        if (normalizedLeague.includes("super")) {
          const localFixtures = buildSuperLeagueFixturesFromLocalData();
          if (localFixtures.length > 0) {
            return res.json({ response: localFixtures });
          }
        }

        if (normalizedLeague.includes("nrl")) {
          const localFixtures = buildNrlFixturesFromLocalData();
          if (localFixtures.length > 0) {
            return res.json({ response: localFixtures });
          }
        }
      }
      
      if (leagueId) {
        // Use eventsseason.php for complete season data (works during off-season)
        const data = await fetchFromSportsDB(`/eventsseason.php?id=${leagueId}&s=${seasonYear}`);
        if (data?.events && Array.isArray(data.events)) {
          // Filter to only rugby league events and sort by date
          const events = data.events
            .filter((e: any) => e.strSport === "Rugby League" || e.idLeague === leagueId)
            .map((e: any) => {
              const statusStr = e.strStatus || (e.intHomeScore !== null ? "Match Finished" : "Not Started");
              const statusShort = statusStr === "Match Finished" ? "FT" : 
                                 statusStr === "Not Started" ? "NS" : 
                                 statusStr === "After Extra Time" ? "AET" : 
                                 statusStr === "Postponed" ? "PST" : statusStr;
              return {
                id: e.idEvent,
                date: e.dateEvent,
                time: e.strTime,
                teams: {
                  home: {
                      id: e.idHomeTeam,
                      name: e.strHomeTeam,
                      logo: e.strHomeTeamBadge || getLocalTeamLogo(e.idHomeTeam),
                    },
                    away: {
                      id: e.idAwayTeam,
                      name: e.strAwayTeam,
                      logo: e.strAwayTeamBadge || getLocalTeamLogo(e.idAwayTeam),
                    },
                },
                scores: {
                  home: e.intHomeScore !== null ? parseInt(e.intHomeScore) : null,
                  away: e.intAwayScore !== null ? parseInt(e.intAwayScore) : null,
                },
                venue: e.strVenue,
                status: { long: statusStr, short: statusShort },
                round: e.intRound,
                league: { id: leagueId, name: leagueName },
              };
            })
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
          const events = data.events.map((e: any) => {
            const statusStr = e.strStatus || "Match Finished";
            const statusShort = statusStr === "Match Finished" ? "FT" : 
                               statusStr === "After Extra Time" ? "AET" : statusStr;
            return {
              id: e.idEvent,
              date: e.dateEvent,
              time: e.strTime,
              teams: {
                home: {
                  id: e.idHomeTeam,
                  name: e.strHomeTeam,
                  logo: e.strHomeTeamBadge,
                },
                away: {
                  id: e.idAwayTeam,
                  name: e.strAwayTeam,
                  logo: e.strAwayTeamBadge,
                },
              },
              scores: {
                home: e.intHomeScore !== null ? parseInt(e.intHomeScore) : null,
                away: e.intAwayScore !== null ? parseInt(e.intAwayScore) : null,
              },
              venue: e.strVenue,
              status: { long: statusStr, short: statusShort },
              round: e.intRound,
              league: { id: leagueId, name: leagueName },
            };
          });
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
      const { season } = req.query as { season?: string };
      const requestedSeason = season || CURRENT_SEASON;
      const localTeamInfo = LOCAL_TEAMS.find((team: any) => String(team.id) === String(id));
      const localFixtures = requestedSeason === CURRENT_SEASON ? getLocalFixturesForTeam(id, localTeamInfo?.league) : undefined;
      
      if (localFixtures && localFixtures.length > 0) {
        const leagueName = localTeamInfo?.league?.toLowerCase().includes("super") ? "Super League" : "NRL";
        const leagueId = LEAGUE_IDS[leagueName] || LEAGUE_IDS["NRL"];
        const mapped = localFixtures
          .map((fixture) => mapLocalFixtureToGame(fixture, leagueName, leagueId))
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        return res.json({ response: mapped });
      }
      
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
      
      let events = [...pastEvents, ...nextEvents];

      // Fallback: if no team-specific events found, try season events for leagues
      if (events.length === 0) {
        try {
          const teamLookup = await fetchFromSportsDB(`/lookupteam.php?id=${id}`);
          const seasonYear = String(new Date().getFullYear());
          const leagueCandidates: string[] = [];

          if (teamLookup?.teams && teamLookup.teams[0]) {
            const teamInfo = teamLookup.teams[0];
            if (teamInfo.idLeague) leagueCandidates.push(String(teamInfo.idLeague));
            if (teamInfo.strLeague) {
              // try to find known league id by name
              const matched = Object.entries(LEAGUE_IDS).find(([k, v]) => (teamInfo.strLeague || '').toLowerCase().includes(k.toLowerCase()));
              if (matched) leagueCandidates.push(matched[1]);
            }
          }

          // Add known league ids as additional candidates
          for (const v of Object.values(LEAGUE_IDS)) {
            if (!leagueCandidates.includes(v)) leagueCandidates.push(v);
          }

          const fallbackEvents: any[] = [];
          for (const lId of leagueCandidates) {
            const seasonData = await fetchFromSportsDB(`/eventsseason.php?id=${lId}&s=${seasonYear}`);
            if (seasonData?.events) {
              const matches = seasonData.events.filter((e: any) => String(e.idHomeTeam) === String(id) || String(e.idAwayTeam) === String(id));
              for (const me of matches) {
                fallbackEvents.push(mapEvent(me));
              }
            }
            if (fallbackEvents.length > 0) break;
          }

          if (fallbackEvents.length > 0) {
            events = fallbackEvents;
          }
        } catch (err) {
          console.warn('Team games fallback failed for', id, err);
        }
      }

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
        // Ensure the event is a Rugby League event; SportsDB can return other sports for the same id
        const isRugbyEvent = (e.strSport === "Rugby League") ||
          (e.idLeague && Object.values(LEAGUE_IDS).includes(String(e.idLeague))) ||
          (e.strLeague && /Rugby|NRL|Super League/i.test(e.strLeague || ''));

        if (!isRugbyEvent) {
          console.warn(`Event ${id} is not Rugby League (found sport/league: ${e.strSport || e.strLeague || e.idLeague})`);
          return res.json({ response: [] });
        }
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
          league: e.strLeague,
          season: e.strSeason,
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
    const { league } = req.query as { league?: string };
    const fallbackNews = getLocalNewsFallback(league);

    try {
      // Build search query based on league
      let searchQuery = "rugby league";
      if (league) {
        const leagueLower = league.toLowerCase();
        if (leagueLower.includes("super")) {
          searchQuery = "Super League rugby";
        } else if (leagueLower.includes("championship")) {
          searchQuery = "RFL Championship rugby";
        } else if (leagueLower.includes("nrl") || leagueLower.includes("national")) {
          searchQuery = "NRL rugby league";
        }
      }

      const encodedQuery = encodeURIComponent(searchQuery);
      const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-AU&gl=AU&ceid=AU:en`;
      const response = await fetch(rssUrl);

      if (!response.ok) {
        console.error("RSS fetch failed:", response.status, response.statusText);
        return res.json({ response: fallbackNews });
      }

      const rssText = await response.text();
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
            league: searchQuery,
          });
        }
      }

      if (items.length === 0) {
        return res.json({ response: fallbackNews });
      }

      return res.json({ response: items });
    } catch (error) {
      console.error("News fetch error:", error);
      return res.json({ response: fallbackNews });
    }
  });

  return httpServer;
}

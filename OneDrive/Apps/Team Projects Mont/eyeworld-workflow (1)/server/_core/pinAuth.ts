import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Team members configuration — single source of truth
export const TEAM_MEMBERS = [
  { name: "Hadeer", pin: "5678", role: "media_buyer" as const },
  { name: "Bakr",   pin: "9012", role: "designer" as const },
  { name: "Asmaa",  pin: "3456", role: "content_creator" as const },
] as const;

// Director — no PIN, authenticates by name only
export const DIRECTOR = {
  name: "Hamdi",
  role: "director" as const,
};

// A stable openId derived from a team member's name (no OAuth needed)
function nameToOpenId(name: string): string {
  return `pin:${name.toLowerCase()}`;
}

export function registerPinAuthRoutes(app: Express) {
  // POST /api/auth/pin-login
  // Body: { name?: string; pin?: string }
  // For Hamdi: send { name: "Hamdi" } (no pin required)
  // For others: send { pin: "5678" } or { name: "Hadeer", pin: "5678" }
  app.post("/api/auth/pin-login", async (req: Request, res: Response) => {
    try {
      const { name, pin } = req.body as { name?: string; pin?: string };

      let member: { name: string; role: "director" | "media_buyer" | "designer" | "content_creator" } | null = null;

      // Director login (name only, no PIN)
      if (name === DIRECTOR.name) {
        member = DIRECTOR;
      } else {
        // Team member login: match by PIN
        const found = TEAM_MEMBERS.find(m => m.pin === pin);
        if (found) {
          // Optionally validate name matches if provided
          if (name && found.name !== name) {
            res.status(401).json({ error: "Name and PIN do not match" });
            return;
          }
          member = found;
        }
      }

      if (!member) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const openId = nameToOpenId(member.name);

      // Upsert user in DB so tRPC context can find them
      await db.upsertUser({
        openId,
        name: member.name,
        loginMethod: "pin",
        role: member.role,
        lastSignedIn: new Date(),
      });

      // Create session token using the existing SDK (same as OAuth)
      const sessionToken = await sdk.createSessionToken(openId, {
        name: member.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        user: { name: member.name, role: member.role },
      });
    } catch (error) {
      console.error("[PinAuth] Login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // POST /api/auth/pin-logout
  app.post("/api/auth/pin-logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}

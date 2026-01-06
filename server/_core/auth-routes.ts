import express from "express";
import bcrypt from "bcryptjs";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";

export function registerAuthRoutes(app: express.Express) {
  // Form-based login (for HTML forms)
  app.post("/api/auth/manager/login-form", async (req: express.Request, res: express.Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: "Email et mot de passe requis",
        });
      }

      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({
          error: "Email ou mot de passe incorrect",
        });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({
          error: "Email ou mot de passe incorrect",
        });
      }

      // Update last signed in
      if (user.openId) {
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId || `email_${email}`, {
        name: user.name || user.email || "Manager",
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      // Store auth in localStorage via redirect with data in URL
      const authData = Buffer.from(JSON.stringify({
        userId: user.id,
        email: user.email,
        timestamp: Date.now()
      })).toString('base64');

      // Redirect to dashboard with auth data
      res.redirect(`/manager/dashboard?auth=${authData}`);
    } catch (error) {
      console.error("[Auth] Login form error:", error);
      res.status(500).json({
        error: "Une erreur s'est produite lors de la connexion",
      });
    }
  });

  // Manager login REST endpoint
  app.post("/api/auth/manager/login", async (req: express.Request, res: express.Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: "Email et mot de passe requis",
        });
      }

      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({
          error: "Email ou mot de passe incorrect",
        });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({
          error: "Email ou mot de passe incorrect",
        });
      }

      // Update last signed in
      if (user.openId) {
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId || `email_${email}`, {
        name: user.name || user.email || "Manager",
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      // Store auth in localStorage
      const authData = Buffer.from(JSON.stringify({
        userId: user.id,
        email: user.email,
        timestamp: Date.now()
      })).toString('base64');

      return res.json({
        success: true,
        userId: user.id,
        auth: authData,
      });
    } catch (error) {
      console.error("[Auth] Login error:", error);
      return res.status(500).json({
        error: "Une erreur s'est produite lors de la connexion",
      });
    }
  });

  // Manager register REST endpoint
  app.post("/api/auth/manager/register", async (req: express.Request, res: express.Response) => {
    try {
      const { email, password, salonName, city } = req.body;

      if (!email || !password || !salonName || !city) {
        return res.status(400).json({
          error: "Tous les champs sont requis",
        });
      }

      // Check if email already exists
      const existing = await db.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({
          error: "Cet email est déjà utilisé",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Store password hash in a separate field (we'll need to extend the schema)
      // For now, we'll use a workaround by storing it in the loginMethod field temporarily

      // Create user with email-based openId
      const openId = `email_${email}`;
      await db.upsertUser({
        openId,
        email,
        name: salonName,
      });

      // Create salon
      const user = await db.getUserByEmail(email);
      if (user) {
        await db.createSalon({
          name: salonName,
          city,
          managerId: user.id,
        });

        // Create notification settings
        const salons = await db.getSalonsByManager(user.id);
        const salon = salons[0];
        if (salon) {
          await db.createOrUpdateNotificationSettings(salon.id, {
            dailyReminder: true,
            inactivityAlert: true,
            reportNotification: true,
          });
        }
      }

      return res.json({
        success: true,
        message: "Inscription réussie. Veuillez vous connecter.",
      });
    } catch (error) {
      console.error("[Auth] Register error:", error);
      return res.status(500).json({
        error: "Une erreur s'est produite lors de l'inscription",
      });
    }
  });
}

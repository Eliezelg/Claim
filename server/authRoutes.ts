import { Router, Request, Response } from "express";
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken, 
  hashPassword, 
  verifyPassword,
  requireAuth,
  requireAdmin
} from "./auth";
import { storage } from "./storage";
import { 
  registerSchema, 
  loginSchema, 
  updateUserPreferencesSchema,
  type RegisterUser,
  type LoginUser,
  type UpdateUserPreferences 
} from "@shared/schema";
import { z } from "zod";

const router = Router();

// Register new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body) as RegisterUser;
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà" });
    }
    
    // Hash password
    const passwordHash = await hashPassword(validatedData.password);
    
    // Create user
    const user = await storage.createUserWithPassword({
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      preferredLanguage: validatedData.preferredLanguage || 'en',
      passwordHash,
      emailVerified: false,
      role: 'USER'
    });
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    res.status(201).json({
      message: "Compte créé avec succès",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Données invalides", 
        details: error.errors 
      });
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Login user
router.post("/login", async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body) as LoginUser;
    
    // Find user by email
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(user.passwordHash, validatedData.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    res.json({
      message: "Connexion réussie",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Données invalides", 
        details: error.errors 
      });
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Refresh access token
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: "Token de rafraîchissement manquant" });
    }
    
    const payload = verifyToken(refreshToken);
    if (!payload) {
      return res.status(403).json({ error: "Token de rafraîchissement invalide" });
    }
    
    // Get fresh user data
    const user = await storage.getUser(payload.userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    
    // Generate new access token
    const accessToken = generateAccessToken(user);
    
    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Get current user (requires auth)
router.get("/user", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    
    // Get fresh user data from database
    const user = await storage.getUser((req.user as any).id);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      emailVerified: user.emailVerified
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Update user preferences (requires auth)
router.patch("/user/preferences", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    
    const validatedData = updateUserPreferencesSchema.parse(req.body) as UpdateUserPreferences;
    
    const updatedUser = await storage.updateUserPreferences((req.user as any).id, validatedData);
    if (!updatedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    
    res.json({
      message: "Préférences mises à jour",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        preferredLanguage: updatedUser.preferredLanguage
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Données invalides", 
        details: error.errors 
      });
    }
    console.error("Update preferences error:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Logout
router.post("/logout", (req: Request, res: Response) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');
  res.json({ message: "Déconnexion réussie" });
});

// Admin route - Get all users (requires admin)
router.get("/admin/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { search, role, limit, offset } = req.query;
    
    const result = await storage.listAllUsers({
      searchQuery: search as string,
      role: role as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    
    res.json(result);
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Admin route - Update user role (requires admin)
router.patch("/admin/users/:id/role", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['USER', 'ADMIN', 'SUPERADMIN'].includes(role)) {
      return res.status(400).json({ error: "Rôle invalide" });
    }
    
    const updatedUser = await storage.updateUserRole(id, role);
    if (!updatedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    
    res.json({
      message: "Rôle utilisateur mis à jour",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error("Admin update user role error:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

export default router;
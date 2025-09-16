import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import argon2 from "argon2";
import { storage } from "./storage";
import type { User, UserRole } from "@shared/schema";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      adminUser?: User;
    }
  }
}

// JWT Configuration - Require JWT_SECRET for security
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("CRITICAL ERROR: JWT_SECRET environment variable is required for authentication security!");
  console.error("Please set JWT_SECRET to a strong, random secret (minimum 32 characters)");
  process.exit(1);
}
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "30d";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Token utilities
export function generateAccessToken(user: User): string {
  const payload: JWTPayload = { 
    userId: user.id,
    email: user.email || '',
    role: user.role || 'USER'
  };
  const options: SignOptions = { expiresIn: ACCESS_TOKEN_TTL };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function generateRefreshToken(user: User): string {
  const payload: JWTPayload = { 
    userId: user.id,
    email: user.email || '',
    role: user.role || 'USER'
  };
  const options: SignOptions = { expiresIn: REFRESH_TOKEN_TTL };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

// Middleware for authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Set user on request object (we'll fetch from DB in routes if needed)
  req.user = {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    passwordHash: null,
    firstName: null,
    lastName: null,
    profileImageUrl: null,
    preferredLanguage: 'en',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  next();
}

// Middleware to check if user is admin
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userRole = (req.user as any).role as UserRole;
  if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  req.adminUser = req.user;
  next();
}

// Middleware to check if user is super admin
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userRole = (req.user as any).role as UserRole;
  if (userRole !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  req.adminUser = req.user;
  next();
}

// Optional auth - doesn't fail if no token
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      } as User;
    }
  }

  next();
}
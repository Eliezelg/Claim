import type { Express } from "express";
import { createServer, type Server } from "http";
// Remove Replit Auth - now using JWT
// import { setupAuth } from "./replitAuth";

// Import modular routes
import jwtAuthRoutes from "./authRoutes"; // New JWT auth routes
import { flightRoutes } from "./routes/flightRoutes";
import { claimRoutes } from "./routes/claimRoutes";
import { documentRoutes } from "./routes/documentRoutes";
import { adminRoutes } from "./routes/adminRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // JWT Auth routes - replaces Replit Auth
  app.use('/api/auth', jwtAuthRoutes);

  // Register route modules
  app.use('/api', flightRoutes); // Changer de /api/flights à /api pour que /api/compensation/calculate fonctionne
  app.use('/api/claims', claimRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/admin', adminRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
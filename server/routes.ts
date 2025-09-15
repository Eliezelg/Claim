import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./replitAuth";

// Import modular routes
import { authRoutes } from "./routes/authRoutes";
import { flightRoutes } from "./routes/flightRoutes";
import { claimRoutes } from "./routes/claimRoutes";
import { documentRoutes } from "./routes/documentRoutes";
import { adminRoutes } from "./routes/adminRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Register route modules
  app.use('/api/auth', authRoutes);
  app.use('/api/flights', flightRoutes);
  app.use('/api/claims', claimRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/admin', adminRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
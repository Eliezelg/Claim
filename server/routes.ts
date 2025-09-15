import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./replitAuth";
import path from "path";

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
  app.use('/api', flightRoutes); // Changer de /api/flights à /api pour que /api/compensation/calculate fonctionne
  app.use('/api/claims', claimRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/admin', adminRoutes);

  // Serve React static files for SPA fallback
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.url.startsWith('/api/')) {
      return next(); // If it's an API route, let the API handlers deal with it
    }
    res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
  });


  const httpServer = createServer(app);
  return httpServer;
}
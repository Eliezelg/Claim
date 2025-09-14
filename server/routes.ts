import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { flightService } from "./services/flightService";
import { compensationCalculator } from "./services/compensationCalculator";
import { emailService } from "./services/emailService";
import { insertClaimSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Flight search routes
  app.get('/api/flights/search', async (req, res) => {
    try {
      const { flight_number, date } = req.query;
      
      if (!flight_number || !date) {
        return res.status(400).json({ message: 'Flight number and date are required' });
      }

      const flightDate = new Date(date as string);
      const flightData = await flightService.getFlightData(flight_number as string, flightDate);
      
      if (!flightData) {
        return res.status(404).json({ message: 'Flight not found' });
      }

      res.json(flightData);
    } catch (error) {
      console.error('Error searching flights:', error);
      res.status(500).json({ message: 'Failed to search flights' });
    }
  });

  app.get('/api/airports/search', async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || (q as string).length < 2) {
        return res.status(400).json({ message: 'Query must be at least 2 characters' });
      }

      const airports = await flightService.searchAirports(q as string);
      res.json(airports);
    } catch (error) {
      console.error('Error searching airports:', error);
      res.status(500).json({ message: 'Failed to search airports' });
    }
  });

  // Compensation calculation route
  app.post('/api/compensation/calculate', async (req, res) => {
    try {
      const { flight_number, date } = req.body;
      
      if (!flight_number || !date) {
        return res.status(400).json({ message: 'Flight number and date are required' });
      }

      const flightDate = new Date(date);
      const flightData = await flightService.getFlightData(flight_number, flightDate);
      
      if (!flightData) {
        return res.status(404).json({ message: 'Flight not found' });
      }

      const compensation = compensationCalculator.calculateCompensation(flightData);
      
      res.json({
        flight: flightData,
        compensation,
      });
    } catch (error) {
      console.error('Error calculating compensation:', error);
      res.status(500).json({ message: 'Failed to calculate compensation' });
    }
  });

  // Claims routes
  const createClaimRequestSchema = insertClaimSchema.extend({
    flightDate: z.coerce.date(),
    euCompensationAmount: z.coerce.string().optional(),
    israelCompensationAmount: z.coerce.string().optional(), 
    finalCompensationAmount: z.coerce.string().optional(),
  });

  app.post('/api/claims', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const claimData = createClaimRequestSchema.parse({
        ...req.body,
        userId,
      });

      const claim = await storage.createClaim(claimData);
      
      // Send confirmation email
      const user = await storage.getUser(userId);
      if (user && user.email) {
        await emailService.sendClaimSubmittedEmail(user, claim);
      }

      res.json(claim);
    } catch (error) {
      console.error('Error creating claim:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid claim data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create claim' });
    }
  });

  app.get('/api/claims', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const claims = await storage.getClaimsByUserId(userId);
      res.json(claims);
    } catch (error) {
      console.error('Error fetching claims:', error);
      res.status(500).json({ message: 'Failed to fetch claims' });
    }
  });

  app.get('/api/claims/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const claim = await storage.getClaimById(req.params.id, userId);
      
      if (!claim) {
        return res.status(404).json({ message: 'Claim not found' });
      }

      res.json(claim);
    } catch (error) {
      console.error('Error fetching claim:', error);
      res.status(500).json({ message: 'Failed to fetch claim' });
    }
  });

  app.patch('/api/claims/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status } = req.body;
      
      // Verify claim belongs to user
      const existingClaim = await storage.getClaimById(req.params.id, userId);
      if (!existingClaim) {
        return res.status(404).json({ message: 'Claim not found' });
      }

      const claim = await storage.updateClaimStatus(req.params.id, status);
      
      if (!claim) {
        return res.status(404).json({ message: 'Claim not found' });
      }

      // Send status update email
      const user = await storage.getUser(userId);
      if (user && user.email) {
        await emailService.sendClaimStatusUpdateEmail(user, claim, status);
      }

      res.json(claim);
    } catch (error) {
      console.error('Error updating claim status:', error);
      res.status(500).json({ message: 'Failed to update claim status' });
    }
  });

  // Document upload routes
  app.post('/api/claims/:id/documents', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const claimId = req.params.id;
      
      // Verify claim belongs to user
      const claim = await storage.getClaimById(claimId, userId);
      if (!claim) {
        return res.status(404).json({ message: 'Claim not found' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const documentData = insertDocumentSchema.parse({
        claimId,
        type: req.body.type || 'OTHER',
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path,
      });

      const document = await storage.createDocument(documentData);
      res.json(document);
    } catch (error) {
      console.error('Error uploading document:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid document data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to upload document' });
    }
  });

  app.get('/api/claims/:id/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const claimId = req.params.id;
      
      // Verify claim belongs to user
      const claim = await storage.getClaimById(claimId, userId);
      if (!claim) {
        return res.status(404).json({ message: 'Claim not found' });
      }

      const documents = await storage.getDocumentsByClaimId(claimId);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: 'Failed to fetch documents' });
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteDocument(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: 'Failed to delete document' });
    }
  });

  // User preferences route
  app.patch('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { preferredLanguage } = req.body;
      
      const user = await storage.upsertUser({
        id: userId,
      });

      res.json(user);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ message: 'Failed to update preferences' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

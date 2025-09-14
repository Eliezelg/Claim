import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated, isAdmin, isSuperAdmin } from "./replitAuth";
import { storage } from "./storage";
import { flightService } from "./services/flightService";
import { compensationCalculator } from "./services/compensationCalculator";
import { emailService } from "./services/emailService";
import { insertClaimSchema, insertDocumentSchema, type ClaimStatus, type UserRole, claimStatusEnum, jurisdictionEnum, userRoleEnum } from "@shared/schema";
import { z } from "zod";

// Admin API validation schemas
const uuidSchema = z.string().uuid({ message: "Must be a valid UUID" });

const paginationSchema = z.object({
  limit: z.string().optional().transform((val) => {
    if (!val) return 50;
    const parsed = parseInt(val);
    if (isNaN(parsed)) return 50;
    return Math.min(Math.max(parsed, 1), 100); // Clamp between 1-100
  }),
  offset: z.string().optional().transform((val) => {
    if (!val) return 0;
    const parsed = parseInt(val);
    if (isNaN(parsed)) return 0;
    return Math.max(parsed, 0); // Minimum 0
  })
});

const dateStringSchema = z.string().optional().transform((val) => {
  if (!val) return undefined;
  const date = new Date(val);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${val}`);
  }
  return date;
});

const adminClaimsQuerySchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTING', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED']).optional(),
  jurisdiction: z.enum(['EU_261', 'ISRAEL_ASL', 'OTHER']).optional(),
  fromDate: dateStringSchema,
  toDate: dateStringSchema,
  search: z.string().optional().transform((val) => val?.trim()),
}).merge(paginationSchema);

const adminUsersQuerySchema = z.object({
  search: z.string().optional().transform((val) => val?.trim()),
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
}).merge(paginationSchema);

const adminReportsQuerySchema = z.object({
  format: z.enum(['json', 'csv']).optional().default('json'),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTING', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED']).optional(),
  jurisdiction: z.enum(['EU_261', 'ISRAEL_ASL', 'OTHER']).optional(),
  fromDate: dateStringSchema,
  toDate: dateStringSchema,
});

const claimStatusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTING', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED']),
  description: z.string().optional().transform((val) => val?.trim())
});

const userRoleUpdateSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN'])
});
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

  // Admin API routes
  
  // Admin Claims Management
  app.get('/api/admin/claims', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validatedQuery = adminClaimsQuerySchema.parse(req.query);
      
      const filters = {
        ...(validatedQuery.status && { status: validatedQuery.status as ClaimStatus }),
        ...(validatedQuery.jurisdiction && { jurisdiction: validatedQuery.jurisdiction }),
        ...(validatedQuery.fromDate && { fromDate: validatedQuery.fromDate }),
        ...(validatedQuery.toDate && { toDate: validatedQuery.toDate }),
        ...(validatedQuery.search && { searchQuery: validatedQuery.search }),
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
      };

      const result = await storage.listAllClaims(filters);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid query parameters', 
          errors: error.errors 
        });
      }
      console.error('Admin claims fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch claims' });
    }
  });

  app.get('/api/admin/claims/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const claimId = uuidSchema.parse(req.params.id);
      const claim = await storage.getClaimById(claimId);
      
      if (!claim) {
        return res.status(404).json({ message: 'Claim not found' });
      }

      res.json(claim);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid claim ID format', 
          errors: error.errors 
        });
      }
      console.error('Admin claim fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch claim' });
    }
  });

  app.patch('/api/admin/claims/:id/status', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const claimId = uuidSchema.parse(req.params.id);
      const validatedBody = claimStatusUpdateSchema.parse(req.body);
      const actorUserId = req.adminUser.id;

      const claim = await storage.updateClaimStatusWithActor(
        claimId, 
        validatedBody.status as ClaimStatus, 
        actorUserId,
        validatedBody.description
      );
      
      if (!claim) {
        return res.status(404).json({ message: 'Claim not found' });
      }

      // Send status update email to user
      const user = await storage.getUser(claim.userId);
      if (user && user.email) {
        await emailService.sendClaimStatusUpdateEmail(user, claim, validatedBody.status);
      }

      res.json(claim);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid request data', 
          errors: error.errors 
        });
      }
      console.error('Admin claim status update error:', error);
      res.status(500).json({ message: 'Failed to update claim status' });
    }
  });

  // Admin Users Management
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validatedQuery = adminUsersQuerySchema.parse(req.query);
      
      const options = {
        ...(validatedQuery.search && { searchQuery: validatedQuery.search }),
        ...(validatedQuery.role && { role: validatedQuery.role as UserRole }),
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
      };

      const result = await storage.listAllUsers(options);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid query parameters', 
          errors: error.errors 
        });
      }
      console.error('Admin users fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.patch('/api/admin/users/:id/role', isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const userId = uuidSchema.parse(req.params.id);
      const validatedBody = userRoleUpdateSchema.parse(req.body);

      const user = await storage.updateUserRole(userId, validatedBody.role as UserRole);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid request data', 
          errors: error.errors 
        });
      }
      console.error('Admin user role update error:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  // Admin Statistics Dashboard
  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getGlobalStats();
      res.json(stats);
    } catch (error) {
      console.error('Admin stats fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  // Admin Reports (basic endpoint structure for future expansion)
  app.get('/api/admin/reports/claims', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validatedQuery = adminReportsQuerySchema.parse(req.query);
      
      const filters = {
        ...(validatedQuery.status && { status: validatedQuery.status as ClaimStatus }),
        ...(validatedQuery.jurisdiction && { jurisdiction: validatedQuery.jurisdiction }),
        ...(validatedQuery.fromDate && { fromDate: validatedQuery.fromDate }),
        ...(validatedQuery.toDate && { toDate: validatedQuery.toDate }),
        limit: 1000, // Higher limit for reports
        offset: 0,
      };

      const result = await storage.listAllClaims(filters);
      
      if (validatedQuery.format === 'csv') {
        // For now, return JSON structure that can be converted to CSV on frontend
        // Future: implement CSV generation server-side
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Suggested-Filename', `claims-report-${new Date().toISOString().split('T')[0]}.json`);
      }
      
      res.json({
        reportType: 'claims',
        generatedAt: new Date().toISOString(),
        filters,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid query parameters', 
          errors: error.errors 
        });
      }
      console.error('Admin reports error:', error);
      res.status(500).json({ message: 'Failed to generate report' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

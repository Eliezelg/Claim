
import type { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { emailService } from "../services/emailService";
import type { ClaimStatus, UserRole } from "../../shared/schema";

// Validation schemas
const uuidSchema = z.string().uuid({ message: "Must be a valid UUID" });

const paginationSchema = z.object({
  limit: z.string().optional().transform((val) => {
    if (!val) return 50;
    const parsed = parseInt(val);
    if (isNaN(parsed)) return 50;
    return Math.min(Math.max(parsed, 1), 100);
  }),
  offset: z.string().optional().transform((val) => {
    if (!val) return 0;
    const parsed = parseInt(val);
    if (isNaN(parsed)) return 0;
    return Math.max(parsed, 0);
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

export class AdminController {
  static async getAllClaims(req: any, res: Response) {
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
  }

  static async getClaimById(req: any, res: Response) {
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
  }

  static async updateClaimStatus(req: any, res: Response) {
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
  }

  static async getAllUsers(req: any, res: Response) {
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
  }

  static async updateUserRole(req: any, res: Response) {
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
  }

  static async getStats(req: any, res: Response) {
    try {
      const stats = await storage.getGlobalStats();
      res.json(stats);
    } catch (error) {
      console.error('Admin stats fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  }

  static async getClaimsReport(req: any, res: Response) {
    try {
      const validatedQuery = adminReportsQuerySchema.parse(req.query);
      
      const filters = {
        ...(validatedQuery.status && { status: validatedQuery.status as ClaimStatus }),
        ...(validatedQuery.jurisdiction && { jurisdiction: validatedQuery.jurisdiction }),
        ...(validatedQuery.fromDate && { fromDate: validatedQuery.fromDate }),
        ...(validatedQuery.toDate && { toDate: validatedQuery.toDate }),
        limit: 1000,
        offset: 0,
      };

      const result = await storage.listAllClaims(filters);
      
      if (validatedQuery.format === 'csv') {
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
  }
}

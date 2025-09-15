
import type { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { emailService } from "../services/emailService";
import { insertClaimSchema } from "../../shared/schema";

const createClaimRequestSchema = insertClaimSchema.extend({
  flightDate: z.coerce.date(),
  euCompensationAmount: z.coerce.string().optional(),
  israelCompensationAmount: z.coerce.string().optional(), 
  finalCompensationAmount: z.coerce.string().optional(),
});

export class ClaimController {
  static async createClaim(req: any, res: Response) {
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
  }

  static async getUserClaims(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const claims = await storage.getClaimsByUserId(userId);
      res.json(claims);
    } catch (error) {
      console.error('Error fetching claims:', error);
      res.status(500).json({ message: 'Failed to fetch claims' });
    }
  }

  static async getClaimById(req: any, res: Response) {
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
  }

  static async updateClaimStatus(req: any, res: Response) {
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
  }
}

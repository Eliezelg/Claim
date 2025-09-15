
import type { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertDocumentSchema } from "../../shared/schema";

export class DocumentController {
  static async uploadDocument(req: any, res: Response) {
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
  }

  static async getClaimDocuments(req: any, res: Response) {
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
  }

  static async deleteDocument(req: any, res: Response) {
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
  }
}

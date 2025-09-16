
import { Router } from "express";
import { requireAuth } from "../auth";
import { DocumentController } from "../controllers/documentController";

const router = Router();

router.delete('/:id', requireAuth, DocumentController.deleteDocument);

export { router as documentRoutes };

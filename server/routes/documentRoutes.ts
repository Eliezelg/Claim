
import { Router } from "express";
import { isAuthenticated } from "../replitAuth";
import { DocumentController } from "../controllers/documentController";

const router = Router();

router.delete('/:id', isAuthenticated, DocumentController.deleteDocument);

export { router as documentRoutes };

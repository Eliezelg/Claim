
import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth";
import { AdminController } from "../controllers/adminController";

const router = Router();

// Claims Management
router.get('/claims', requireAuth, requireAdmin, AdminController.getAllClaims);
router.get('/claims/:id', requireAuth, requireAdmin, AdminController.getClaimById);
router.patch('/claims/:id/status', requireAuth, requireAdmin, AdminController.updateClaimStatus);

// Users Management
router.get('/users', requireAuth, requireAdmin, AdminController.getAllUsers);
router.patch('/users/:id/role', requireAuth, requireAdmin, AdminController.updateUserRole);

// Statistics
router.get('/stats', requireAuth, requireAdmin, AdminController.getStats);

// Reports
router.get('/reports/claims', requireAuth, requireAdmin, AdminController.getClaimsReport);

export { router as adminRoutes };

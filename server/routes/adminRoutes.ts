
import { Router } from "express";
import { isAuthenticated, isAdmin, isSuperAdmin } from "../replitAuth";
import { AdminController } from "../controllers/adminController";

const router = Router();

// Claims Management
router.get('/claims', isAuthenticated, isAdmin, AdminController.getAllClaims);
router.get('/claims/:id', isAuthenticated, isAdmin, AdminController.getClaimById);
router.patch('/claims/:id/status', isAuthenticated, isAdmin, AdminController.updateClaimStatus);

// Users Management
router.get('/users', isAuthenticated, isAdmin, AdminController.getAllUsers);
router.patch('/users/:id/role', isAuthenticated, isSuperAdmin, AdminController.updateUserRole);

// Statistics
router.get('/stats', isAuthenticated, isAdmin, AdminController.getStats);

// Reports
router.get('/reports/claims', isAuthenticated, isAdmin, AdminController.getClaimsReport);

export { router as adminRoutes };

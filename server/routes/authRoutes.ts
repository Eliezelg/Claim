
import { Router } from "express";
import { isAuthenticated } from "../replitAuth";
import { AuthController } from "../controllers/authController";

const router = Router();

router.get('/user', isAuthenticated, AuthController.getCurrentUser);
router.patch('/user/preferences', isAuthenticated, AuthController.updateUserPreferences);

export { router as authRoutes };

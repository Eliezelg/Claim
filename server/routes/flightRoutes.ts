
import { Router } from "express";
import { FlightController } from "../controllers/flightController";

const router = Router();

// Routes pour les vols
router.get('/flights/search', FlightController.searchFlight);
router.get('/flights/airports/search', FlightController.searchAirports);

// Route pour le calcul de compensation (utilisée par le client)
router.post('/compensation/calculate', FlightController.calculateCompensation);

export { router as flightRoutes };

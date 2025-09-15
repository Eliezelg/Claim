
import { Router } from "express";
import { FlightController } from "../controllers/flightController";

const router = Router();

router.get('/search', FlightController.searchFlight);
router.get('/airports/search', FlightController.searchAirports);
router.post('/compensation/calculate', FlightController.calculateCompensation);

export { router as flightRoutes };

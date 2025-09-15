
import type { Request, Response } from "express";
import { flightService } from "../services/flightService";
import { compensationCalculator } from "../services/compensationCalculator";

export class FlightController {
  static async searchFlight(req: Request, res: Response) {
    try {
      const { flight_number, date } = req.query;
      
      if (!flight_number || !date) {
        return res.status(400).json({ message: 'Flight number and date are required' });
      }

      const flightDate = new Date(date as string);
      const flightData = await flightService.getFlightData(flight_number as string, flightDate);
      
      if (!flightData) {
        return res.status(404).json({ message: 'Flight not found' });
      }

      res.json(flightData);
    } catch (error) {
      console.error('Error searching flights:', error);
      res.status(500).json({ message: 'Failed to search flights' });
    }
  }

  static async searchAirports(req: Request, res: Response) {
    try {
      const { q } = req.query;
      
      if (!q || (q as string).length < 2) {
        return res.status(400).json({ message: 'Query must be at least 2 characters' });
      }

      const airports = await flightService.searchAirports(q as string);
      res.json(airports);
    } catch (error) {
      console.error('Error searching airports:', error);
      res.status(500).json({ message: 'Failed to search airports' });
    }
  }

  static async calculateCompensation(req: Request, res: Response) {
    try {
      const { flight_number, date } = req.body;
      
      console.log('Calculating compensation for:', { flight_number, date });
      
      if (!flight_number || !date) {
        console.error('Missing required fields:', { flight_number, date });
        return res.status(400).json({ message: 'Flight number and date are required' });
      }

      const flightDate = new Date(date);
      console.log('Parsed flight date:', flightDate);
      
      const flightData = await flightService.getFlightData(flight_number, flightDate);
      console.log('Flight data retrieved:', flightData ? 'Found' : 'Not found');
      
      if (!flightData) {
        console.log('No flight data found for:', flight_number, 'on', flightDate.toISOString());
        return res.status(404).json({ message: 'Flight not found' });
      }

      const compensation = compensationCalculator.calculateCompensation(flightData);
      console.log('Compensation calculated:', compensation);
      
      const result = {
        flight: flightData,
        compensation,
      };
      
      console.log('Sending response:', JSON.stringify(result, null, 2));
      res.json(result);
    } catch (error) {
      console.error('Error calculating compensation:', error);
      res.status(500).json({ message: 'Failed to calculate compensation' });
    }
  }
}

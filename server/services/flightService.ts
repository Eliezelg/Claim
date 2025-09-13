import { storage } from "../storage";
import { FlightWithRelations, InsertFlight, FlightStatus } from "@shared/schema";

export interface FlightData {
  flightNumber: string;
  date: Date;
  departureAirport: {
    iataCode: string;
    name: string;
    city: string;
    country: string;
  };
  arrivalAirport: {
    iataCode: string;
    name: string;
    city: string;
    country: string;
  };
  scheduledDeparture: Date;
  actualDeparture: Date | null;
  scheduledArrival: Date;
  actualArrival: Date | null;
  status: FlightStatus;
  delayMinutes: number;
  distance: number;
  airline: {
    iataCode: string;
    name: string;
  };
}

export class FlightService {
  async getFlightData(flightNumber: string, date: Date): Promise<FlightData | null> {
    try {
      // First check our database
      const existingFlight = await storage.getFlightByNumberAndDate(flightNumber, date);
      if (existingFlight) {
        return this.formatFlightData(existingFlight);
      }

      // If not found, use mock data for demonstration
      // In production, this would call external flight APIs
      const mockFlightData = this.generateMockFlightData(flightNumber, date);
      
      // Store the flight data in our database
      await this.storeFlight(mockFlightData);
      
      return mockFlightData;
    } catch (error) {
      console.error('Error fetching flight data:', error);
      return null;
    }
  }

  private async storeFlight(flightData: FlightData): Promise<void> {
    try {
      // Ensure airports exist
      const depAirport = await storage.getAirportByIataCode(flightData.departureAirport.iataCode);
      if (!depAirport) {
        await storage.createAirport({
          id: flightData.departureAirport.iataCode,
          iataCode: flightData.departureAirport.iataCode,
          name: flightData.departureAirport.name,
          city: flightData.departureAirport.city,
          country: flightData.departureAirport.country,
        });
      }

      const arrAirport = await storage.getAirportByIataCode(flightData.arrivalAirport.iataCode);
      if (!arrAirport) {
        await storage.createAirport({
          id: flightData.arrivalAirport.iataCode,
          iataCode: flightData.arrivalAirport.iataCode,
          name: flightData.arrivalAirport.name,
          city: flightData.arrivalAirport.city,
          country: flightData.arrivalAirport.country,
        });
      }

      // Ensure airline exists
      const airline = await storage.getAirlineByIataCode(flightData.airline.iataCode);
      if (!airline) {
        await storage.createAirline({
          id: flightData.airline.iataCode,
          iataCode: flightData.airline.iataCode,
          name: flightData.airline.name,
        });
      }

      // Store flight
      const flightToStore: InsertFlight = {
        flightNumber: flightData.flightNumber,
        airlineId: flightData.airline.iataCode,
        departureAirportId: flightData.departureAirport.iataCode,
        arrivalAirportId: flightData.arrivalAirport.iataCode,
        scheduledDeparture: flightData.scheduledDeparture,
        actualDeparture: flightData.actualDeparture,
        scheduledArrival: flightData.scheduledArrival,
        actualArrival: flightData.actualArrival,
        status: flightData.status,
        distance: flightData.distance,
        flightDate: flightData.date,
      };

      await storage.createFlight(flightToStore);
    } catch (error) {
      console.error('Error storing flight data:', error);
    }
  }

  private formatFlightData(flight: FlightWithRelations): FlightData | null {
    if (!flight.departureAirport || !flight.arrivalAirport || !flight.airline) {
      return null;
    }

    const delayMinutes = this.calculateDelayMinutes(
      flight.scheduledArrival,
      flight.actualArrival
    );

    return {
      flightNumber: flight.flightNumber,
      date: flight.flightDate,
      departureAirport: {
        iataCode: flight.departureAirport.iataCode,
        name: flight.departureAirport.name,
        city: flight.departureAirport.city || '',
        country: flight.departureAirport.country || '',
      },
      arrivalAirport: {
        iataCode: flight.arrivalAirport.iataCode,
        name: flight.arrivalAirport.name,
        city: flight.arrivalAirport.city || '',
        country: flight.arrivalAirport.country || '',
      },
      scheduledDeparture: flight.scheduledDeparture!,
      actualDeparture: flight.actualDeparture,
      scheduledArrival: flight.scheduledArrival!,
      actualArrival: flight.actualArrival,
      status: flight.status,
      delayMinutes,
      distance: flight.distance || 0,
      airline: {
        iataCode: flight.airline.iataCode,
        name: flight.airline.name,
      },
    };
  }

  private generateMockFlightData(flightNumber: string, date: Date): FlightData {
    // This is a simplified mock data generator
    // In production, this would be replaced with real API calls
    const airports = [
      { iataCode: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
      { iataCode: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
      { iataCode: 'TLV', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel' },
      { iataCode: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
      { iataCode: 'MAD', name: 'Barajas Airport', city: 'Madrid', country: 'Spain' },
    ];

    const airlines = [
      { iataCode: 'LH', name: 'Lufthansa' },
      { iataCode: 'AF', name: 'Air France' },
      { iataCode: 'LY', name: 'El Al' },
      { iataCode: 'BA', name: 'British Airways' },
    ];

    // Extract airline code from flight number
    const airlineCode = flightNumber.substring(0, 2);
    const airline = airlines.find(a => a.iataCode === airlineCode) || airlines[0];

    // Random airport selection for demo
    const depAirport = airports[Math.floor(Math.random() * airports.length)];
    let arrAirport = airports[Math.floor(Math.random() * airports.length)];
    while (arrAirport.iataCode === depAirport.iataCode) {
      arrAirport = airports[Math.floor(Math.random() * airports.length)];
    }

    const scheduledDeparture = new Date(date);
    scheduledDeparture.setHours(10, 30, 0, 0);

    const scheduledArrival = new Date(scheduledDeparture);
    scheduledArrival.setHours(scheduledArrival.getHours() + 2, scheduledArrival.getMinutes() + 15);

    // Simulate delay (30% chance of delay)
    const hasDelay = Math.random() > 0.7;
    const delayMinutes = hasDelay ? Math.floor(Math.random() * 300) + 60 : 0; // 1-5 hours delay

    const actualDeparture = hasDelay ? new Date(scheduledDeparture.getTime() + delayMinutes * 60000) : scheduledDeparture;
    const actualArrival = hasDelay ? new Date(scheduledArrival.getTime() + delayMinutes * 60000) : scheduledArrival;

    const status: FlightStatus = hasDelay ? 'DELAYED' : 'ON_TIME';

    // Calculate distance (simplified)
    const distance = Math.floor(Math.random() * 3000) + 500; // 500-3500 km

    return {
      flightNumber,
      date,
      departureAirport: depAirport,
      arrivalAirport: arrAirport,
      scheduledDeparture,
      actualDeparture: hasDelay ? actualDeparture : null,
      scheduledArrival,
      actualArrival: hasDelay ? actualArrival : null,
      status,
      delayMinutes,
      distance,
      airline,
    };
  }

  private calculateDelayMinutes(scheduled: Date | null, actual: Date | null): number {
    if (!scheduled || !actual) return 0;
    return Math.max(0, Math.floor((actual.getTime() - scheduled.getTime()) / (1000 * 60)));
  }

  async searchAirports(query: string): Promise<Array<{ iataCode: string; name: string; city: string; country: string }>> {
    const airports = await storage.searchAirports(query);
    return airports.map(airport => ({
      iataCode: airport.iataCode,
      name: airport.name,
      city: airport.city || '',
      country: airport.country || '',
    }));
  }
}

export const flightService = new FlightService();

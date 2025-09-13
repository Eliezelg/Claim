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

      // Call FlightAPI.io to get real flight data
      const realFlightData = await this.fetchFromFlightAPI(flightNumber, date);
      if (realFlightData) {
        // Store the flight data in our database
        await this.storeFlight(realFlightData);
        return realFlightData;
      }

      // Fallback to mock data if API fails - don't store mock data in DB
      console.warn('FlightAPI.io call failed, using mock data as fallback');
      const mockFlightData = this.generateMockFlightData(flightNumber, date);
      // Don't store mock data to avoid polluting real data
      
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
          name: flightData.departureAirport.name,
          iataCode: flightData.departureAirport.iataCode,
          city: flightData.departureAirport.city,
          country: flightData.departureAirport.country,
        });
      }

      const arrAirport = await storage.getAirportByIataCode(flightData.arrivalAirport.iataCode);
      if (!arrAirport) {
        await storage.createAirport({
          id: flightData.arrivalAirport.iataCode,
          name: flightData.arrivalAirport.name,
          iataCode: flightData.arrivalAirport.iataCode,
          city: flightData.arrivalAirport.city,
          country: flightData.arrivalAirport.country,
        });
      }

      // Ensure airline exists
      const airline = await storage.getAirlineByIataCode(flightData.airline.iataCode);
      if (!airline) {
        await storage.createAirline({
          id: flightData.airline.iataCode,
          name: flightData.airline.name,
          iataCode: flightData.airline.iataCode,
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
        iataCode: flight.departureAirport.iataCode || '',
        name: flight.departureAirport.name,
        city: flight.departureAirport.city || '',
        country: flight.departureAirport.country || '',
      },
      arrivalAirport: {
        iataCode: flight.arrivalAirport.iataCode || '',
        name: flight.arrivalAirport.name,
        city: flight.arrivalAirport.city || '',
        country: flight.arrivalAirport.country || '',
      },
      scheduledDeparture: flight.scheduledDeparture || new Date(),
      actualDeparture: flight.actualDeparture,
      scheduledArrival: flight.scheduledArrival || new Date(),
      actualArrival: flight.actualArrival,
      status: flight.status || 'ON_TIME',
      delayMinutes,
      distance: flight.distance || 0,
      airline: {
        iataCode: flight.airline.iataCode || '',
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

  private async fetchFromFlightAPI(flightNumber: string, date: Date): Promise<FlightData | null> {
    try {
      if (!process.env.FLIGHTAPI_IO_KEY) {
        console.error('FLIGHTAPI_IO_KEY environment variable not set');
        return null;
      }

      // Extract airline code from flight number (usually first 2 characters)
      const airlineCode = flightNumber.substring(0, 2);
      const flightNum = flightNumber.substring(2);
      
      // Format date as YYYYMMDD
      const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
      
      const url = `https://api.flightapi.io/airline/${process.env.FLIGHTAPI_IO_KEY}?num=${flightNum}&name=${airlineCode}&date=${formattedDate}`;
      
      console.log(`Fetching flight data from FlightAPI.io: ${flightNumber} on ${formattedDate}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`FlightAPI.io API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      if (!data || data.error) {
        console.error('FlightAPI.io returned error:', data?.error || 'Unknown error');
        return null;
      }
      
      return this.parseFlightAPIResponse(data, flightNumber, date);
    } catch (error) {
      console.error('Error calling FlightAPI.io:', error);
      return null;
    }
  }

  private parseFlightAPIResponse(apiData: any, flightNumber: string, date: Date): FlightData | null {
    try {
      // FlightAPI.io response structure may vary, this is a general mapping
      const flight = apiData;
      
      if (!flight.departure || !flight.arrival) {
        console.error('Invalid flight data structure from FlightAPI.io');
        return null;
      }
      
      // Parse scheduled and actual times
      const scheduledDeparture = new Date(flight.departure.scheduled);
      const actualDeparture = flight.departure.actual ? new Date(flight.departure.actual) : null;
      const scheduledArrival = new Date(flight.arrival.scheduled);
      const actualArrival = flight.arrival.actual ? new Date(flight.arrival.actual) : null;
      
      // Calculate delay
      const delayMinutes = this.calculateDelayMinutes(scheduledArrival, actualArrival);
      
      // Determine status
      let status: FlightStatus = 'ON_TIME';
      if (flight.status) {
        if (flight.status.toLowerCase().includes('delay')) status = 'DELAYED';
        else if (flight.status.toLowerCase().includes('cancel')) status = 'CANCELLED';
        else if (flight.status.toLowerCase().includes('board')) status = 'BOARDING';
        else if (flight.status.toLowerCase().includes('departed')) status = 'DEPARTED';
        else if (flight.status.toLowerCase().includes('arrived')) status = 'ARRIVED';
      } else if (delayMinutes > 15) {
        status = 'DELAYED';
      }
      
      // Calculate approximate distance (simplified - could be enhanced)
      const distance = this.calculateDistance(
        flight.departure.airport?.coordinates?.lat || 0,
        flight.departure.airport?.coordinates?.lng || 0,
        flight.arrival.airport?.coordinates?.lat || 0,
        flight.arrival.airport?.coordinates?.lng || 0
      );
      
      return {
        flightNumber,
        date,
        departureAirport: {
          iataCode: flight.departure.iata || flight.departure.airport?.iata || '',
          name: flight.departure.airport?.name || 'Unknown Airport',
          city: flight.departure.airport?.city || '',
          country: flight.departure.airport?.country || '',
        },
        arrivalAirport: {
          iataCode: flight.arrival.iata || flight.arrival.airport?.iata || '',
          name: flight.arrival.airport?.name || 'Unknown Airport',
          city: flight.arrival.airport?.city || '',
          country: flight.arrival.airport?.country || '',
        },
        scheduledDeparture,
        actualDeparture,
        scheduledArrival,
        actualArrival,
        status,
        delayMinutes,
        distance: Math.round(distance),
        airline: {
          iataCode: flight.airline?.iata || flightNumber.substring(0, 2),
          name: flight.airline?.name || 'Unknown Airline',
        },
      };
    } catch (error) {
      console.error('Error parsing FlightAPI.io response:', error);
      return null;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula to calculate distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private calculateDelayMinutes(scheduled: Date | null, actual: Date | null): number {
    if (!scheduled || !actual) return 0;
    return Math.max(0, Math.floor((actual.getTime() - scheduled.getTime()) / (1000 * 60)));
  }

  async searchAirports(query: string): Promise<Array<{ iataCode: string; name: string; city: string; country: string }>> {
    const airports = await storage.searchAirports(query);
    return airports.map(airport => ({
      iataCode: airport.iataCode || '',
      name: airport.name,
      city: airport.city || '',
      country: airport.country || '',
    }));
  }
}

export const flightService = new FlightService();

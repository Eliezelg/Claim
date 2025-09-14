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

      // Validate dates before storing
      const validatedScheduledDeparture = this.validateDate(flightData.scheduledDeparture);
      const validatedScheduledArrival = this.validateDate(flightData.scheduledArrival);
      const validatedActualDeparture = flightData.actualDeparture ? this.validateDate(flightData.actualDeparture) : null;
      const validatedActualArrival = flightData.actualArrival ? this.validateDate(flightData.actualArrival) : null;

      if (!validatedScheduledDeparture || !validatedScheduledArrival) {
        console.error('Invalid scheduled dates, cannot store flight:', {
          scheduledDeparture: flightData.scheduledDeparture,
          scheduledArrival: flightData.scheduledArrival
        });
        return;
      }

      // Store flight
      const flightToStore: InsertFlight = {
        flightNumber: flightData.flightNumber,
        airlineId: flightData.airline.iataCode,
        departureAirportId: flightData.departureAirport.iataCode,
        arrivalAirportId: flightData.arrivalAirport.iataCode,
        scheduledDeparture: validatedScheduledDeparture,
        actualDeparture: validatedActualDeparture,
        scheduledArrival: validatedScheduledArrival,
        actualArrival: validatedActualArrival,
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
      console.log(`Request URL: ${url.replace(process.env.FLIGHTAPI_IO_KEY!, '[API_KEY_HIDDEN]')}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`FlightAPI.io API error: ${response.status} ${response.statusText}`);
        console.error(`Response body: ${errorText}`);
        return null;
      }
      
      const data = await response.json();
      
      console.log('FlightAPI.io response data:', JSON.stringify(data, null, 2));
      
      if (!data || data.error) {
        console.error('FlightAPI.io returned error:', data?.error || 'Unknown error');
        console.error('Full response data:', JSON.stringify(data, null, 2));
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
      // FlightAPI.io returns an array of objects
      if (!Array.isArray(apiData) || apiData.length === 0) {
        console.error('Invalid flight data structure from FlightAPI.io - expected array');
        return null;
      }
      
      // Find the correct flight segment/entry that matches our request
      let selectedEntry = null;
      
      // First, try to find a single entry with both departure and arrival data
      selectedEntry = apiData.find(item => item.departure && item.arrival);
      
      if (!selectedEntry) {
        // If no complete entry found, we need to carefully select matching segments
        // Look for entries that might correspond to the same flight segment
        const departureEntries = apiData.filter(item => item.departure);
        const arrivalEntries = apiData.filter(item => item.arrival);
        
        // Try to match by flight number or date if available
        for (const depEntry of departureEntries) {
          const matchingArrival = arrivalEntries.find(arrEntry => {
            // Try to match by comparing flight numbers or dates if available in the entry
            return arrEntry.flightNumber === depEntry.flightNumber || 
                   arrEntry.flight === depEntry.flight ||
                   (arrEntry.arrival?.scheduledTime && depEntry.departure?.scheduledTime &&
                    new Date(arrEntry.arrival.scheduledTime).getDate() === new Date(depEntry.departure.scheduledTime).getDate());
          });
          
          if (matchingArrival) {
            selectedEntry = {
              departure: depEntry.departure,
              arrival: matchingArrival.arrival,
              // Also carry over any other properties from the matched entries
              ...depEntry,
              ...matchingArrival
            };
            break;
          }
        }
        
        // Fallback: use first available departure and arrival if no better match
        if (!selectedEntry && departureEntries.length > 0 && arrivalEntries.length > 0) {
          selectedEntry = {
            departure: departureEntries[0].departure,
            arrival: arrivalEntries[0].arrival,
          };
        }
      }
      
      if (!selectedEntry || !selectedEntry.departure || !selectedEntry.arrival) {
        console.error('Unable to find matching departure and arrival data in FlightAPI.io response');
        console.error('Available entries:', apiData.map(item => Object.keys(item)));
        return null;
      }
      
      const departure = selectedEntry.departure;
      const arrival = selectedEntry.arrival;
      
      // Extract status from the selected entry or find a matching status entry
      const statusObj = selectedEntry.status ? selectedEntry : apiData.find(item => item.status);
      
      // Parse scheduled and actual times from the specific format
      // CRITICAL FIX: Use scheduledTime for scheduled times, not actual times
      const scheduledDeparture = this.parseFlightAPITime(departure.scheduledTime, date) || 
                                 (departure.departureDateTime ? new Date(departure.departureDateTime) : new Date(date));
      const actualDeparture = departure.departureDateTime ? new Date(departure.departureDateTime) : null;
      const scheduledArrival = this.parseFlightAPITime(arrival.scheduledTime, date) || 
                              (arrival.arrivalDateTime ? new Date(arrival.arrivalDateTime) : new Date(date));
      const actualArrival = arrival.arrivalDateTime ? new Date(arrival.arrivalDateTime) : null;
      
      // Calculate delay
      const delayMinutes = this.calculateDelayMinutes(scheduledArrival, actualArrival);
      
      // Determine status with robust mapping
      let status: FlightStatus = 'ON_TIME';
      if (statusObj && statusObj.status) {
        const statusStr = statusObj.status.toLowerCase().trim();
        
        // Check for cancelled variations
        if (statusStr.includes('cancel') || statusStr.includes('cancell') || statusStr === 'cx') {
          status = 'CANCELLED';
        }
        // Check for diverted variations
        else if (statusStr.includes('divert') || statusStr.includes('diversion') || statusStr === 'div') {
          status = 'DIVERTED';
        }
        // Check for delayed variations
        else if (statusStr.includes('delay') || statusStr.includes('late') || statusStr === 'dl') {
          status = 'DELAYED';
        }
        // Check for boarding variations
        else if (statusStr.includes('board') || statusStr.includes('gate') || statusStr === 'bd') {
          status = 'BOARDING';
        }
        // Check for departed variations
        else if (statusStr.includes('departed') || statusStr.includes('takeoff') || statusStr.includes('airborne') || statusStr === 'dp') {
          status = 'DEPARTED';
        }
        // Check for arrived variations
        else if (statusStr.includes('arrived') || statusStr.includes('landed') || statusStr === 'ar') {
          status = 'ARRIVED';
        }
        // Check for on-time variations
        else if (statusStr.includes('on time') || statusStr.includes('ontime') || statusStr === 'ot' || statusStr === 'scheduled') {
          status = 'ON_TIME';
        }
      }
      
      // Fallback: if no explicit status but significant delay detected
      if (status === 'ON_TIME' && delayMinutes > 15) {
        status = 'DELAYED';
      }
      
      // Calculate accurate distance using Haversine formula with real airport coordinates
      const distance = this.calculateDistanceByAirportCodes(departure.airportCode, arrival.airportCode);
      
      return {
        flightNumber,
        date,
        departureAirport: {
          iataCode: departure.airportCode || '',
          name: departure.airport || 'Unknown Airport',
          city: departure.airportCity || '',
          country: this.getCountryFromCode(departure.airportCountryCode || ''),
        },
        arrivalAirport: {
          iataCode: arrival.airportCode || '',
          name: arrival.airport || 'Unknown Airport',
          city: arrival.airportCity || '',
          country: this.getCountryFromCode(arrival.airportCountryCode || ''),
        },
        scheduledDeparture,
        actualDeparture,
        scheduledArrival,
        actualArrival,
        status,
        delayMinutes,
        distance: Math.round(distance),
        airline: {
          iataCode: flightNumber.substring(0, 2),
          name: this.getAirlineName(flightNumber.substring(0, 2)),
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

  private calculateDistanceByAirportCodes(fromCode: string, toCode: string): number {
    // Airport coordinates lookup table (latitude, longitude)
    const airportCoordinates: { [key: string]: { lat: number; lng: number } } = {
      // Major European airports
      'FRA': { lat: 50.0379, lng: 8.5622 }, // Frankfurt
      'MUC': { lat: 48.3537, lng: 11.7750 }, // Munich
      'LHR': { lat: 51.4700, lng: -0.4543 }, // London Heathrow
      'CDG': { lat: 49.0097, lng: 2.5479 }, // Paris Charles de Gaulle
      'MAD': { lat: 40.4839, lng: -3.5680 }, // Madrid
      'BCN': { lat: 41.2971, lng: 2.0833 }, // Barcelona
      'FCO': { lat: 41.7999, lng: 12.2462 }, // Rome Fiumicino
      'AMS': { lat: 52.3105, lng: 4.7683 }, // Amsterdam
      'ZUR': { lat: 47.4647, lng: 8.5492 }, // Zurich
      'VIE': { lat: 48.1103, lng: 16.5697 }, // Vienna
      'BRU': { lat: 50.9010, lng: 4.4856 }, // Brussels
      'CPH': { lat: 55.6181, lng: 12.6561 }, // Copenhagen
      'ARN': { lat: 59.6498, lng: 17.9238 }, // Stockholm
      'OSL': { lat: 60.1939, lng: 11.1004 }, // Oslo
      'HEL': { lat: 60.3172, lng: 24.9633 }, // Helsinki
      
      // Middle East airports
      'TLV': { lat: 32.0117, lng: 34.8867 }, // Tel Aviv
      'DXB': { lat: 25.2532, lng: 55.3657 }, // Dubai
      'DOH': { lat: 25.2731, lng: 51.6083 }, // Doha
      'CAI': { lat: 30.1219, lng: 31.4056 }, // Cairo
      
      // North American airports
      'JFK': { lat: 40.6413, lng: -73.7781 }, // New York JFK
      'LAX': { lat: 33.9425, lng: -118.4081 }, // Los Angeles
      'ORD': { lat: 41.9742, lng: -87.9073 }, // Chicago O'Hare
      'YYZ': { lat: 43.6777, lng: -79.6248 }, // Toronto
      'YUL': { lat: 45.4582, lng: -73.7444 }, // Montreal
      
      // Asian airports
      'NRT': { lat: 35.7720, lng: 140.3929 }, // Tokyo Narita
      'ICN': { lat: 37.4602, lng: 126.4407 }, // Seoul Incheon
      'PVG': { lat: 31.1434, lng: 121.8052 }, // Shanghai Pudong
      'SIN': { lat: 1.3644, lng: 103.9915 }, // Singapore
      'BKK': { lat: 13.6900, lng: 100.7501 }, // Bangkok
      'DEL': { lat: 28.5562, lng: 77.1000 }, // Delhi
      'BOM': { lat: 19.0896, lng: 72.8656 }, // Mumbai
      
      // Additional European airports
      'LGW': { lat: 51.1537, lng: -0.1821 }, // London Gatwick
      'STN': { lat: 51.8849, lng: 0.2349 }, // London Stansted
      'ORY': { lat: 48.7262, lng: 2.3659 }, // Paris Orly
      'ATH': { lat: 37.9364, lng: 23.9445 }, // Athens
      'LIS': { lat: 38.7742, lng: -9.1342 }, // Lisbon
      'PRG': { lat: 50.1008, lng: 14.2632 }, // Prague
      'WAW': { lat: 52.1657, lng: 20.9671 }, // Warsaw
      'BUD': { lat: 47.4394, lng: 19.2550 }, // Budapest
    };
    
    const fromCoords = airportCoordinates[fromCode];
    const toCoords = airportCoordinates[toCode];
    
    if (!fromCoords || !toCoords) {
      console.warn(`Missing coordinates for airports: ${fromCode} -> ${toCode}, using default distance estimate`);
      // Fallback to a reasonable default based on typical flight distances
      return 1200; // Average European flight distance
    }
    
    return this.calculateDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng);
  }

  private getCountryFromCode(countryCode: string): string {
    const countries: { [key: string]: string } = {
      'DE': 'Germany',
      'FR': 'France',
      'GB': 'United Kingdom', 
      'UK': 'United Kingdom',
      'ES': 'Spain',
      'IL': 'Israel',
      'US': 'United States',
      'IT': 'Italy',
      'NL': 'Netherlands',
    };
    return countries[countryCode] || countryCode;
  }

  private getAirlineName(airlineCode: string): string {
    const airlines: { [key: string]: string } = {
      'LH': 'Lufthansa',
      'AF': 'Air France',
      'BA': 'British Airways',
      'LY': 'El Al',
      'IB': 'Iberia',
      'KL': 'KLM',
      'LX': 'Swiss International Air Lines',
    };
    return airlines[airlineCode] || 'Unknown Airline';
  }

  private parseFlightAPITime(timeString: string | null, baseDate: Date): Date | null {
    if (!timeString) return null;
    
    try {
      // FlightAPI.io returns times in format "18:00, Sep 09" or "21:50, Sep 09"
      const match = timeString.match(/(\d{1,2}):(\d{2}),\s*(\w{3})\s*(\d{1,2})/);
      if (!match) {
        console.error('Unable to parse FlightAPI time format:', timeString);
        return null;
      }
      
      const [, hours, minutes, monthAbbr, day] = match;
      
      // Map month abbreviations to numbers
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const monthNum = monthMap[monthAbbr];
      if (monthNum === undefined) {
        console.error('Unknown month abbreviation:', monthAbbr);
        return null;
      }
      
      // Use the year from the baseDate
      const parsedDate = new Date(baseDate.getFullYear(), monthNum, parseInt(day), parseInt(hours), parseInt(minutes));
      
      // Validate the parsed date
      if (isNaN(parsedDate.getTime())) {
        console.error('Invalid parsed date from:', timeString);
        return null;
      }
      
      return parsedDate;
    } catch (error) {
      console.error('Error parsing FlightAPI time:', timeString, error);
      return null;
    }
  }

  private validateDate(date: Date | null): Date | null {
    if (!date) return null;
    if (isNaN(date.getTime())) return null;
    return date;
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

import { IFlightProvider, NormalizedFlight, FlightProviderException, FlightProviderError, FlightType } from "./IFlightProvider";
import { FlightStatus } from "@shared/schema";
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export class AeroDataBoxProvider implements IFlightProvider {
  readonly name = "AeroDataBox";
  readonly priority = 2; // Second priority, fallback for FlightAware
  
  private apiKey: string;
  private baseUrl = "https://aerodatabox.p.rapidapi.com";
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async getFlightData(flightNumber: string, date: Date): Promise<NormalizedFlight | null> {
    try {
      // AeroDataBox uses YYYY-MM-DD format
      const dateStr = date.toISOString().split('T')[0];
      
      // Get flight data for specific flight and date
      const url = `${this.baseUrl}/flights/number/${flightNumber}/${dateStr}`;
      
      console.log(`AeroDataBox API request: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new FlightProviderException(FlightProviderError.AUTH_ERROR, "Invalid AeroDataBox API key");
        } else if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '3600');
          throw new FlightProviderException(FlightProviderError.RATE_LIMITED, "AeroDataBox rate limit exceeded", retryAfter);
        } else if (response.status === 404) {
          console.log(`AeroDataBox: Flight ${flightNumber} not found for date ${dateStr}`);
          return null;
        }
        
        throw new FlightProviderException(
          FlightProviderError.SERVICE_UNAVAILABLE,
          `AeroDataBox API error: ${response.status} ${response.statusText}`
        );
      }
      
      const data = await response.json();
      console.log('AeroDataBox response:', JSON.stringify(data, null, 2));
      
      return this.parseAeroDataBoxResponse(data, flightNumber, date);
    } catch (error) {
      if (error instanceof FlightProviderException) {
        throw error;
      }
      
      console.error('AeroDataBox API error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new FlightProviderException(FlightProviderError.UNKNOWN_ERROR, `AeroDataBox request failed: ${errorMessage}`);
    }
  }
  
  private parseAeroDataBoxResponse(data: any, flightNumber: string, date: Date): NormalizedFlight | null {
    try {
      // AeroDataBox returns an array of flights for the same flight number
      if (!Array.isArray(data) || data.length === 0) {
        console.log('AeroDataBox: No flights found in response');
        return null;
      }
      
      // Find the flight that matches our date most closely
      const targetDate = date.toISOString().split('T')[0];
      const flight = data.find(f => 
        f.departure?.scheduledTime?.local?.startsWith(targetDate) ||
        f.departure?.scheduledTime?.utc?.startsWith(targetDate)
      ) || data[0];
      
      if (!flight.departure || !flight.arrival) {
        console.error('AeroDataBox: Missing departure or arrival data');
        return null;
      }
      
      // Detect flight type
      const flightType = this.detectFlightType(flight);
      
      // Check if this is a historical flight (older than 24h)
      const isHistoricalFlight = date.getTime() < Date.now() - (24 * 60 * 60 * 1000);
      
      // Parse times with timezone handling
      const scheduledDeparture = this.parseAeroDataBoxTime(
        flight.departure.scheduledTime?.local || flight.departure.scheduledTime?.utc,
        flight.departure.airport?.timeZone
      );
      const scheduledArrival = this.parseAeroDataBoxTime(
        flight.arrival.scheduledTime?.local || flight.arrival.scheduledTime?.utc,
        flight.arrival.airport?.timeZone
      );
      
      // For historical flights, only use actualTime if available - DO NOT fallback to predictedTime
      // For current/future flights, allow fallback to predictedTime
      let actualDeparture = this.parseAeroDataBoxTime(
        flight.departure.actualTime?.local || flight.departure.actualTime?.utc,
        flight.departure.airport?.timeZone
      );
      let actualArrival = this.parseAeroDataBoxTime(
        flight.arrival.actualTime?.local || flight.arrival.actualTime?.utc,
        flight.arrival.airport?.timeZone
      );
      
      // Only fallback to predictedTime for non-historical flights
      if (!isHistoricalFlight) {
        actualDeparture = actualDeparture || this.parseAeroDataBoxTime(
          flight.departure.predictedTime?.local || flight.departure.predictedTime?.utc,
          flight.departure.airport?.timeZone
        );
        actualArrival = actualArrival || this.parseAeroDataBoxTime(
          flight.arrival.predictedTime?.local || flight.arrival.predictedTime?.utc,
          flight.arrival.airport?.timeZone
        );
      }
      
      if (!scheduledDeparture || !scheduledArrival) {
        console.error('AeroDataBox: Could not parse scheduled times');
        return null;
      }
      
      // Calculate delay in minutes
      const delayMinutes = actualArrival && scheduledArrival 
        ? Math.round((actualArrival.getTime() - scheduledArrival.getTime()) / (1000 * 60))
        : 0;
      
      // Map status
      const status = this.mapAeroDataBoxStatus(flight.status);
      
      // Extract airline code from flight number
      const airlineCode = flightNumber.substring(0, 2);
      
      return {
        flightNumber,
        date,
        airline: {
          iataCode: airlineCode,
          name: flight.airline?.name || this.getAirlineName(airlineCode)
        },
        departureAirport: {
          iataCode: flight.departure.airport?.iata || '',
          name: flight.departure.airport?.name || '',
          city: flight.departure.airport?.municipalityName || '',
          country: flight.departure.airport?.countryCode || '',
          timezone: flight.departure.airport?.timeZone
        },
        arrivalAirport: {
          iataCode: flight.arrival.airport?.iata || '',
          name: flight.arrival.airport?.name || '',
          city: flight.arrival.airport?.municipalityName || '',
          country: flight.arrival.airport?.countryCode || '',
          timezone: flight.arrival.airport?.timeZone
        },
        scheduledDeparture,
        actualDeparture,
        scheduledArrival,
        actualArrival,
        status,
        flightType,
        delayMinutes,
        distance: this.calculateDistance(flight),
        aircraft: {
          type: flight.aircraft?.model,
          registration: flight.aircraft?.reg
        },
        providerMeta: {
          provider: this.name,
          rawResponse: flight,
          providerId: flight.number,
          confidence: 0.85, // Good data quality but not as comprehensive as FlightAware
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      console.error('Error parsing AeroDataBox response:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new FlightProviderException(FlightProviderError.INVALID_DATA, `Failed to parse AeroDataBox data: ${errorMessage}`);
    }
  }
  
  private detectFlightType(flight: any): FlightType {
    // Check if it's explicitly marked as cargo
    if (flight.isCargo === true) {
      return FlightType.CARGO;
    }
    
    // Check aircraft type for cargo indicators
    if (flight.aircraft?.model) {
      const aircraftType = flight.aircraft.model.toLowerCase();
      if (aircraftType.includes('cargo') || aircraftType.includes('freighter')) {
        return FlightType.CARGO;
      }
    }
    
    // Check flight type flags
    if (flight.flightType) {
      const flightTypeStr = flight.flightType.toLowerCase();
      if (flightTypeStr.includes('cargo') || flightTypeStr.includes('freight')) {
        return FlightType.CARGO;
      }
      if (flightTypeStr.includes('charter')) {
        return FlightType.CHARTER;
      }
    }
    
    return FlightType.PASSENGER;
  }
  
  private parseAeroDataBoxTime(timeString: string | null, timezone?: string): Date | null {
    if (!timeString) return null;
    
    try {
      // AeroDataBox provides both local and UTC times
      if (timeString.endsWith('Z') || timeString.includes('+') || timeString.includes('-')) {
        // Already has timezone info, parse directly
        return new Date(timeString);
      }
      
      // Local time without timezone info - use timezone if provided
      if (timezone) {
        try {
          return fromZonedTime(timeString, timezone);
        } catch (tzError) {
          console.warn('Failed to parse with timezone, falling back to UTC assumption:', tzError);
        }
      }
      
      // Fallback: treat as UTC
      return new Date(timeString + 'Z');
    } catch (error) {
      console.error('Error parsing AeroDataBox time:', error);
      return null;
    }
  }
  
  private mapAeroDataBoxStatus(status: string): FlightStatus {
    if (!status || status.toLowerCase() === 'unknown') return 'UNKNOWN';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('cancelled') || statusLower.includes('canceled')) return 'CANCELLED';
    if (statusLower.includes('diverted')) return 'DIVERTED';
    if (statusLower.includes('delayed')) return 'DELAYED';
    if (statusLower.includes('departed')) return 'DEPARTED';
    if (statusLower.includes('arrived')) return 'ARRIVED';
    if (statusLower.includes('boarding')) return 'BOARDING';
    if (statusLower.includes('scheduled') || statusLower.includes('on time')) return 'ON_TIME';
    
    return 'UNKNOWN';
  }
  
  private calculateDistance(flight: any): number {
    // Try to get distance from flight data
    if (flight.greatCircleDistance?.km) {
      return Math.round(flight.greatCircleDistance.km);
    }
    
    // Fallback to coordinate calculation if airports have coordinates
    if (flight.departure?.airport?.location && flight.arrival?.airport?.location) {
      const depLat = parseFloat(flight.departure.airport.location.lat);
      const depLon = parseFloat(flight.departure.airport.location.lon);
      const arrLat = parseFloat(flight.arrival.airport.location.lat);
      const arrLon = parseFloat(flight.arrival.airport.location.lon);
      
      if (!isNaN(depLat) && !isNaN(depLon) && !isNaN(arrLat) && !isNaN(arrLon)) {
        return Math.round(this.haversineDistance(depLat, depLon, arrLat, arrLon));
      }
    }
    
    return 0;
  }
  
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  
  private getAirlineName(airlineCode: string): string {
    const airlines: { [key: string]: string } = {
      'LH': 'Lufthansa',
      'AF': 'Air France',
      'BA': 'British Airways',
      'LY': 'El Al',
      'IB': 'Iberia',
      'KL': 'KLM',
      'LX': 'Swiss International Air Lines',
      'UA': 'United Airlines',
      'DL': 'Delta Air Lines',
      'AA': 'American Airlines'
    };
    return airlines[airlineCode] || 'Unknown Airline';
  }
  
  canHandle(flightNumber: string, date: Date): boolean {
    // AeroDataBox has good coverage but may be more limited for historical data
    const daysSinceDate = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceDate <= 30; // More conservative window for accuracy
  }
  
  async getStatus(): Promise<{
    available: boolean;
    remainingQuota?: number;
    resetTime?: Date;
    responseTimeMs?: number;
  }> {
    try {
      const start = Date.now();
      // Use a simple endpoint to check status
      const response = await fetch(`${this.baseUrl}/flights/airports/iata/JFK/${new Date().toISOString().split('T')[0]}`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
          'Accept': 'application/json'
        }
      });
      const responseTimeMs = Date.now() - start;
      
      if (response.ok || response.status === 404) { // 404 is normal for this test endpoint
        const quota = response.headers.get('x-ratelimit-requests-remaining');
        const resetTime = response.headers.get('x-ratelimit-requests-reset');
        
        return {
          available: true,
          remainingQuota: quota ? parseInt(quota) : undefined,
          resetTime: resetTime ? new Date(parseInt(resetTime) * 1000) : undefined,
          responseTimeMs
        };
      }
      
      return { available: false, responseTimeMs };
    } catch (error) {
      console.error('AeroDataBox status check failed:', error);
      return { available: false };
    }
  }
}
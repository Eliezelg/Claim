import { IFlightProvider, NormalizedFlight, FlightProviderException, FlightProviderError, FlightType } from "./IFlightProvider";
import { FlightStatus } from "@shared/schema";
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export class FlightAwareProvider implements IFlightProvider {
  readonly name = "FlightAware AeroAPI";
  readonly priority = 1; // Highest priority
  
  private apiKey: string;
  private baseUrl = "https://aeroapi.flightaware.com/aeroapi";
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async getFlightData(flightNumber: string, date: Date): Promise<NormalizedFlight | null> {
    try {
      // FlightAware uses YYYY-MM-DD format for dates
      const dateStr = date.toISOString().split('T')[0];
      
      // Get flight info for specific date
      const url = `${this.baseUrl}/flights/${flightNumber}`;
      const params = new URLSearchParams({
        start: dateStr,
        end: dateStr,
        max_pages: '1'
      });
      
      console.log(`FlightAware API request: ${url}?${params.toString()}`);
      
      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          'x-apikey': this.apiKey,
          'Accept': 'application/json; charset=UTF-8'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new FlightProviderException(FlightProviderError.AUTH_ERROR, "Invalid FlightAware API key");
        } else if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '3600');
          throw new FlightProviderException(FlightProviderError.RATE_LIMITED, "FlightAware rate limit exceeded", retryAfter);
        } else if (response.status === 404) {
          console.log(`FlightAware: Flight ${flightNumber} not found for date ${dateStr}`);
          return null;
        }
        
        throw new FlightProviderException(
          FlightProviderError.SERVICE_UNAVAILABLE, 
          `FlightAware API error: ${response.status} ${response.statusText}`
        );
      }
      
      const data = await response.json();
      console.log('FlightAware response:', JSON.stringify(data, null, 2));
      
      return this.parseFlightAwareResponse(data, flightNumber, date);
    } catch (error) {
      if (error instanceof FlightProviderException) {
        throw error;
      }
      
      console.error('FlightAware API error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new FlightProviderException(FlightProviderError.UNKNOWN_ERROR, `FlightAware request failed: ${errorMessage}`);
    }
  }
  
  private parseFlightAwareResponse(data: any, flightNumber: string, date: Date): NormalizedFlight | null {
    try {
      if (!data.flights || !Array.isArray(data.flights) || data.flights.length === 0) {
        console.log('FlightAware: No flights found in response');
        return null;
      }
      
      // Get the first flight (most relevant for the date)
      const flight = data.flights[0];
      
      if (!flight.origin || !flight.destination) {
        console.error('FlightAware: Missing origin or destination data');
        return null;
      }
      
      // Detect flight type based on aircraft type and operator info
      const flightType = this.detectFlightType(flight);
      
      // Parse times with timezone handling
      const scheduledDeparture = this.parseFlightAwareTime(flight.scheduled_out, flight.origin.timezone);
      const scheduledArrival = this.parseFlightAwareTime(flight.scheduled_in, flight.destination.timezone);
      const actualDeparture = this.parseFlightAwareTime(flight.actual_out, flight.origin.timezone);
      const actualArrival = this.parseFlightAwareTime(flight.actual_in, flight.destination.timezone);
      
      if (!scheduledDeparture || !scheduledArrival) {
        console.error('FlightAware: Could not parse scheduled times');
        return null;
      }
      
      // Calculate delay in minutes
      const delayMinutes = actualArrival && scheduledArrival 
        ? Math.round((actualArrival.getTime() - scheduledArrival.getTime()) / (1000 * 60))
        : 0;
      
      // Map status
      const status = this.mapFlightAwareStatus(flight.status);
      
      // Extract airline code from flight number
      const airlineCode = flightNumber.substring(0, 2);
      
      return {
        flightNumber,
        date,
        airline: {
          iataCode: airlineCode,
          name: flight.operator || this.getAirlineName(airlineCode)
        },
        departureAirport: {
          iataCode: flight.origin.code,
          name: flight.origin.name || flight.origin.code,
          city: flight.origin.city || '',
          country: flight.origin.country_code || '',
          timezone: flight.origin.timezone
        },
        arrivalAirport: {
          iataCode: flight.destination.code,
          name: flight.destination.name || flight.destination.code,
          city: flight.destination.city || '',
          country: flight.destination.country_code || '',
          timezone: flight.destination.timezone
        },
        scheduledDeparture,
        actualDeparture,
        scheduledArrival,
        actualArrival,
        status,
        flightType,
        delayMinutes,
        distance: flight.route_distance ? Math.round(flight.route_distance * 1.852) : 0, // nautical miles to km
        aircraft: {
          type: flight.aircraft_type,
          registration: flight.registration
        },
        providerMeta: {
          provider: this.name,
          rawResponse: flight,
          providerId: flight.fa_flight_id,
          confidence: 0.95, // FlightAware has high data quality
          lastUpdated: new Date()
        },
        evidenceUrls: flight.fa_flight_id ? [`https://flightaware.com/live/flight/${flight.fa_flight_id}`] : undefined
      };
    } catch (error) {
      console.error('Error parsing FlightAware response:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new FlightProviderException(FlightProviderError.INVALID_DATA, `Failed to parse FlightAware data: ${errorMessage}`);
    }
  }
  
  private detectFlightType(flight: any): FlightType {
    // Check aircraft type for cargo indicators
    if (flight.aircraft_type) {
      const aircraftType = flight.aircraft_type.toLowerCase();
      // Cargo aircraft typically end with 'F' for freighter
      if (aircraftType.includes('f') && (aircraftType.includes('cargo') || aircraftType.includes('freight'))) {
        return FlightType.CARGO;
      }
    }
    
    // Check operator or flight type flags if available
    if (flight.flight_type) {
      const flightTypeStr = flight.flight_type.toLowerCase();
      if (flightTypeStr.includes('cargo') || flightTypeStr.includes('freight')) {
        return FlightType.CARGO;
      }
      if (flightTypeStr.includes('charter')) {
        return FlightType.CHARTER;
      }
    }
    
    // Default to passenger for scheduled airline flights
    return FlightType.PASSENGER;
  }
  
  private parseFlightAwareTime(timestamp: string | null, timezone: string): Date | null {
    if (!timestamp || !timezone) return null;
    
    try {
      // FlightAware returns ISO timestamps with timezone info
      const date = new Date(timestamp);
      
      // Convert to UTC if not already
      if (timezone && timezone !== 'UTC') {
        // FlightAware times are typically already in UTC, but double-check
        return date;
      }
      
      return date;
    } catch (error) {
      console.error('Error parsing FlightAware time:', error);
      return null;
    }
  }
  
  private mapFlightAwareStatus(status: string): FlightStatus {
    if (!status) return 'ON_TIME';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('cancelled') || statusLower.includes('canceled')) return 'CANCELLED';
    if (statusLower.includes('diverted')) return 'DIVERTED';
    if (statusLower.includes('delayed')) return 'DELAYED';
    if (statusLower.includes('departed') || statusLower.includes('airborne')) return 'DEPARTED';
    if (statusLower.includes('arrived')) return 'ARRIVED';
    if (statusLower.includes('boarding')) return 'BOARDING';
    
    return 'ON_TIME';
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
    // FlightAware has excellent global coverage, so can handle most flights
    // Limit to flights within the last 90 days for best accuracy
    const daysSinceDate = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceDate <= 90;
  }
  
  async getStatus(): Promise<{
    available: boolean;
    remainingQuota?: number;
    resetTime?: Date;
    responseTimeMs?: number;
  }> {
    try {
      const start = Date.now();
      const response = await fetch(`${this.baseUrl}/flights/count`, {
        headers: {
          'x-apikey': this.apiKey,
          'Accept': 'application/json; charset=UTF-8'
        }
      });
      const responseTimeMs = Date.now() - start;
      
      if (response.ok) {
        const quota = response.headers.get('x-rate-limit-remaining');
        const resetTime = response.headers.get('x-rate-limit-reset');
        
        return {
          available: true,
          remainingQuota: quota ? parseInt(quota) : undefined,
          resetTime: resetTime ? new Date(parseInt(resetTime) * 1000) : undefined,
          responseTimeMs
        };
      }
      
      return { available: false, responseTimeMs };
    } catch (error) {
      console.error('FlightAware status check failed:', error);
      return { available: false };
    }
  }
}
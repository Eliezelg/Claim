import { IFlightProvider, NormalizedFlight, FlightProviderException, FlightProviderError, FlightType } from "./IFlightProvider";
import { FlightStatus } from "@shared/schema";
import { fromZonedTime } from 'date-fns-tz';

export class AviationstackProvider implements IFlightProvider {
  readonly name = "Aviationstack";
  readonly priority = 3; // Third priority, tertiary fallback
  
  private apiKey: string;
  private baseUrl = "https://api.aviationstack.com/v1";
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async getFlightData(flightNumber: string, date: Date): Promise<NormalizedFlight | null> {
    try {
      // Aviationstack uses YYYY-MM-DD format
      const dateStr = date.toISOString().split('T')[0];
      
      // Aviationstack API call
      const url = `${this.baseUrl}/flights`;
      const params = new URLSearchParams({
        access_key: this.apiKey,
        flight_iata: flightNumber,
        flight_date: dateStr,
        limit: '1'
      });
      
      console.log(`Aviationstack API request: ${url}?${params.toString().replace(this.apiKey, '[API_KEY_HIDDEN]')}`);
      
      const response = await fetch(`${url}?${params.toString()}`);
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new FlightProviderException(FlightProviderError.AUTH_ERROR, "Invalid Aviationstack API key");
        } else if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '3600');
          throw new FlightProviderException(FlightProviderError.RATE_LIMITED, "Aviationstack rate limit exceeded", retryAfter);
        }
        
        throw new FlightProviderException(
          FlightProviderError.SERVICE_UNAVAILABLE,
          `Aviationstack API error: ${response.status} ${response.statusText}`
        );
      }
      
      const data = await response.json();
      console.log('Aviationstack response:', JSON.stringify(data, null, 2));
      
      return this.parseAviationstackResponse(data, flightNumber, date);
    } catch (error) {
      if (error instanceof FlightProviderException) {
        throw error;
      }
      
      console.error('Aviationstack API error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new FlightProviderException(FlightProviderError.UNKNOWN_ERROR, `Aviationstack request failed: ${errorMessage}`);
    }
  }
  
  private parseAviationstackResponse(data: any, flightNumber: string, date: Date): NormalizedFlight | null {
    try {
      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        console.log('Aviationstack: No flights found in response');
        return null;
      }
      
      const flight = data.data[0];
      
      if (!flight.departure || !flight.arrival) {
        console.error('Aviationstack: Missing departure or arrival data');
        return null;
      }
      
      // Parse times (Aviationstack provides various time formats)
      const scheduledDeparture = this.parseAviationstackTime(flight.departure.scheduled);
      const scheduledArrival = this.parseAviationstackTime(flight.arrival.scheduled);
      const actualDeparture = this.parseAviationstackTime(flight.departure.actual);
      const actualArrival = this.parseAviationstackTime(flight.arrival.actual);
      
      if (!scheduledDeparture || !scheduledArrival) {
        console.error('Aviationstack: Could not parse scheduled times');
        return null;
      }
      
      // Calculate delay in minutes
      const delayMinutes = actualArrival && scheduledArrival 
        ? Math.round((actualArrival.getTime() - scheduledArrival.getTime()) / (1000 * 60))
        : 0;
      
      // Map status
      const status = this.mapAviationstackStatus(flight.flight_status);
      
      // Detect flight type (limited info in Aviationstack)
      const flightType = FlightType.PASSENGER; // Aviationstack mainly covers passenger flights
      
      return {
        flightNumber,
        date,
        airline: {
          iataCode: flight.airline?.iata || flightNumber.substring(0, 2),
          name: flight.airline?.name || this.getAirlineName(flightNumber.substring(0, 2))
        },
        departureAirport: {
          iataCode: flight.departure.iata || '',
          name: flight.departure.airport || '',
          city: flight.departure.city || '',
          country: flight.departure.country || '',
          timezone: flight.departure.timezone
        },
        arrivalAirport: {
          iataCode: flight.arrival.iata || '',
          name: flight.arrival.airport || '',
          city: flight.arrival.city || '',
          country: flight.arrival.country || '',
          timezone: flight.arrival.timezone
        },
        scheduledDeparture,
        actualDeparture,
        scheduledArrival,
        actualArrival,
        status,
        flightType,
        delayMinutes,
        distance: 0, // Aviationstack doesn't provide distance
        providerMeta: {
          provider: this.name,
          rawResponse: flight,
          providerId: flight.flight?.iata || flightNumber,
          confidence: 0.75, // Lower confidence due to data aggregation
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      console.error('Error parsing Aviationstack response:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new FlightProviderException(FlightProviderError.INVALID_DATA, `Failed to parse Aviationstack data: ${errorMessage}`);
    }
  }
  
  private parseAviationstackTime(timeString: string | null): Date | null {
    if (!timeString) return null;
    
    try {
      // Aviationstack provides ISO timestamps
      return new Date(timeString);
    } catch (error) {
      console.error('Error parsing Aviationstack time:', error);
      return null;
    }
  }
  
  private mapAviationstackStatus(status: string): FlightStatus {
    if (!status) return 'ON_TIME';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'cancelled') return 'CANCELLED';
    if (statusLower === 'diverted') return 'DIVERTED';
    if (statusLower === 'delayed') return 'DELAYED';
    if (statusLower === 'departed' || statusLower === 'active') return 'DEPARTED';
    if (statusLower === 'landed') return 'ARRIVED';
    if (statusLower === 'scheduled') return 'ON_TIME';
    
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
    // Aviationstack has real-time focus, limited historical data
    const daysSinceDate = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceDate <= 7; // Very limited window for free tier
  }
  
  async getStatus(): Promise<{
    available: boolean;
    remainingQuota?: number;
    resetTime?: Date;
    responseTimeMs?: number;
  }> {
    try {
      const start = Date.now();
      // Simple status check using a minimal query
      const response = await fetch(`${this.baseUrl}/flights?access_key=${this.apiKey}&limit=1`);
      const responseTimeMs = Date.now() - start;
      
      if (response.ok) {
        // Parse quota from response headers if available
        const data = await response.json();
        
        return {
          available: true,
          remainingQuota: data.pagination?.remaining || undefined,
          responseTimeMs
        };
      }
      
      return { available: false, responseTimeMs };
    } catch (error) {
      console.error('Aviationstack status check failed:', error);
      return { available: false };
    }
  }
}
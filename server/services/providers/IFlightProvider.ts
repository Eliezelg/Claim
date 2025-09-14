import { FlightStatus } from "@shared/schema";

export enum FlightType {
  PASSENGER = "PASSENGER",
  CARGO = "CARGO", 
  CHARTER = "CHARTER",
  UNKNOWN = "UNKNOWN"
}

export interface NormalizedFlight {
  // Basic flight info
  flightNumber: string;
  date: Date;
  airline: {
    iataCode: string;
    name: string;
  };
  
  // Airports with timezone info
  departureAirport: {
    iataCode: string;
    name: string;
    city: string;
    country: string;
    timezone?: string; // IANA timezone name if available
  };
  arrivalAirport: {
    iataCode: string;
    name: string;
    city: string;
    country: string;
    timezone?: string; // IANA timezone name if available
  };
  
  // Times - all normalized to UTC
  scheduledDeparture: Date;
  actualDeparture: Date | null;
  scheduledArrival: Date;
  actualArrival: Date | null;
  
  // Flight metadata
  status: FlightStatus;
  flightType: FlightType;
  delayMinutes: number;
  distance: number; // in kilometers
  
  // Aircraft info if available
  aircraft?: {
    type?: string;
    registration?: string;
  };
  
  // Provider metadata for audit trail
  providerMeta: {
    provider: string;
    rawResponse?: any;
    providerId?: string;
    confidence: number; // 0-1 scale for data quality confidence
    lastUpdated: Date;
  };
  
  // Evidence URLs or references for legal documentation
  evidenceUrls?: string[];
}

export enum FlightProviderError {
  NOT_FOUND = "NOT_FOUND",
  INVALID_REQUEST = "INVALID_REQUEST", 
  RATE_LIMITED = "RATE_LIMITED",
  AUTH_ERROR = "AUTH_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  INVALID_DATA = "INVALID_DATA",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

export class FlightProviderException extends Error {
  constructor(
    public errorType: FlightProviderError,
    message: string,
    public retryAfter?: number // seconds until retry allowed
  ) {
    super(message);
    this.name = 'FlightProviderException';
  }
}

export interface IFlightProvider {
  readonly name: string;
  readonly priority: number; // Lower number = higher priority
  
  /**
   * Retrieve flight data for a specific flight number and date
   * @param flightNumber Full flight number (e.g., "LY327")
   * @param date Flight date
   * @returns Normalized flight data or null if not found
   * @throws FlightProviderException for errors
   */
  getFlightData(flightNumber: string, date: Date): Promise<NormalizedFlight | null>;
  
  /**
   * Check if this provider can handle the given flight
   * @param flightNumber Flight number to check
   * @param date Flight date
   * @returns True if this provider can handle the request
   */
  canHandle(flightNumber: string, date: Date): boolean;
  
  /**
   * Get provider-specific rate limits and status
   */
  getStatus(): Promise<{
    available: boolean;
    remainingQuota?: number;
    resetTime?: Date;
    responseTimeMs?: number;
  }>;
}
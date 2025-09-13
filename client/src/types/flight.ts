export type FlightStatus = 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'DIVERTED';

export interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
}

export interface Airline {
  iataCode: string;
  name: string;
}

export interface FlightData {
  flightNumber: string;
  date: Date;
  departureAirport: Airport;
  arrivalAirport: Airport;
  scheduledDeparture: Date;
  actualDeparture: Date | null;
  scheduledArrival: Date;
  actualArrival: Date | null;
  status: FlightStatus;
  delayMinutes: number;
  distance: number;
  airline: Airline;
}

export interface CompensationResult {
  eligible: boolean;
  amount: number;
  currency: string;
  jurisdiction: 'EU_261' | 'ISRAEL_ASL' | 'OTHER';
  reason?: string;
  details: {
    flightDistance: number;
    delayMinutes: number;
    category: string;
    regulation: string;
  };
}

export interface CompensationAnalysis {
  eu: CompensationResult;
  israel: CompensationResult;
  recommended: CompensationResult | null;
}

export interface FlightSearchResult {
  flight: FlightData;
  compensation: CompensationAnalysis;
}

import { FlightData } from "./flightService";
import { Jurisdiction } from "@shared/schema";

export interface CompensationResult {
  eligible: boolean;
  amount: number;
  currency: string;
  jurisdiction: Jurisdiction;
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

export class CompensationCalculator {
  calculateCompensation(flightData: FlightData): CompensationAnalysis {
    const eu = this.calculateEU261(flightData);
    const israel = this.calculateIsraelASL(flightData);
    const recommended = this.getBestOption(eu, israel);

    return { eu, israel, recommended };
  }

  private calculateEU261(flightData: FlightData): CompensationResult {
    const { departureAirport, arrivalAirport, delayMinutes, distance } = flightData;
    
    // Check if EU regulation applies
    const isEUDeparture = this.isEUCountry(departureAirport.country);
    const isEUArrival = this.isEUCountry(arrivalAirport.country);
    
    // EU 261/2004 applies to:
    // - All flights departing from EU
    // - Flights arriving in EU operated by EU carriers
    if (!isEUDeparture && !(isEUArrival && this.isEUCarrier(flightData.airline.iataCode))) {
      return {
        eligible: false,
        amount: 0,
        currency: 'EUR',
        jurisdiction: 'EU_261',
        reason: 'Flight not covered by EU regulation',
        details: {
          flightDistance: distance,
          delayMinutes,
          category: 'Not applicable',
          regulation: 'EU 261/2004',
        },
      };
    }

    // Must be delayed by 3+ hours to be eligible
    if (delayMinutes < 180) {
      return {
        eligible: false,
        amount: 0,
        currency: 'EUR',
        jurisdiction: 'EU_261',
        reason: 'Delay must be 3+ hours for compensation',
        details: {
          flightDistance: distance,
          delayMinutes,
          category: 'Insufficient delay',
          regulation: 'EU 261/2004',
        },
      };
    }

    // Calculate compensation based on distance
    let amount = 0;
    let category = '';

    if (distance <= 1500) {
      amount = 250;
      category = 'Short haul (≤1,500km)';
    } else if (distance <= 3500) {
      amount = 400;
      category = 'Medium haul (1,500-3,500km)';
    } else {
      amount = 600;
      category = 'Long haul (>3,500km)';
    }

    // Check for 50% reduction if rerouted with limited delay
    const reductionThresholds = {
      1500: 2 * 60, // 2 hours
      3500: 3 * 60, // 3 hours
      Infinity: 4 * 60, // 4 hours
    };

    const threshold = Object.entries(reductionThresholds).find(([dist]) => distance <= parseInt(dist))?.[1] || 4 * 60;
    if (delayMinutes <= threshold) {
      amount = Math.floor(amount * 0.5);
      category += ' (50% reduction)';
    }

    return {
      eligible: true,
      amount,
      currency: 'EUR',
      jurisdiction: 'EU_261',
      details: {
        flightDistance: distance,
        delayMinutes,
        category,
        regulation: 'EU 261/2004',
      },
    };
  }

  private calculateIsraelASL(flightData: FlightData): CompensationResult {
    const { departureAirport, arrivalAirport, delayMinutes, distance } = flightData;
    
    // Check if Israeli regulation applies
    const isIsraelFlight = departureAirport.country === 'Israel' || arrivalAirport.country === 'Israel';
    
    if (!isIsraelFlight) {
      return {
        eligible: false,
        amount: 0,
        currency: 'NIS',
        jurisdiction: 'ISRAEL_ASL',
        reason: 'Flight does not involve Israeli airports',
        details: {
          flightDistance: distance,
          delayMinutes,
          category: 'Not applicable',
          regulation: 'Israeli Aviation Services Law',
        },
      };
    }

    // Must be delayed by 8+ hours for Israeli compensation
    if (delayMinutes < 480) {
      return {
        eligible: false,
        amount: 0,
        currency: 'NIS',
        jurisdiction: 'ISRAEL_ASL',
        reason: 'Delay must be 8+ hours for compensation',
        details: {
          flightDistance: distance,
          delayMinutes,
          category: 'Insufficient delay',
          regulation: 'Israeli Aviation Services Law',
        },
      };
    }

    // Calculate compensation based on distance (2024 amounts)
    let amount = 0;
    let category = '';

    if (distance <= 2000) {
      amount = 1490; // Category A
      category = 'Category A (≤2,000km)';
    } else if (distance <= 4500) {
      amount = 2390; // Category B
      category = 'Category B (2,000-4,500km)';
    } else {
      amount = 3580; // Category C
      category = 'Category C (>4,500km)';
    }

    // Check for 50% reduction based on final delay
    const reductionThresholds = {
      2000: 4 * 60, // 4 hours
      4500: 5 * 60, // 5 hours
      Infinity: 6 * 60, // 6 hours
    };

    const threshold = Object.entries(reductionThresholds).find(([dist]) => distance <= parseInt(dist))?.[1] || 6 * 60;
    if (delayMinutes <= threshold) {
      amount = Math.floor(amount * 0.5);
      category += ' (50% reduction)';
    }

    return {
      eligible: true,
      amount,
      currency: 'NIS',
      jurisdiction: 'ISRAEL_ASL',
      details: {
        flightDistance: distance,
        delayMinutes,
        category,
        regulation: 'Israeli Aviation Services Law',
      },
    };
  }

  private getBestOption(eu: CompensationResult, israel: CompensationResult): CompensationResult | null {
    if (!eu.eligible && !israel.eligible) {
      return null;
    }

    if (eu.eligible && !israel.eligible) {
      return eu;
    }

    if (israel.eligible && !eu.eligible) {
      return israel;
    }

    // Both eligible - convert to same currency for comparison
    // Using approximate exchange rate: 1 EUR = 3.8 NIS
    const euInNIS = eu.amount * 3.8;
    const israelAmount = israel.amount;

    return israelAmount > euInNIS ? israel : eu;
  }

  private isEUCountry(country: string): boolean {
    const euCountries = [
      'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
      'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
      'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
      'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia',
      'Slovenia', 'Spain', 'Sweden', 'Iceland', 'Norway', 'Switzerland'
    ];
    return euCountries.includes(country);
  }

  private isEUCarrier(airlineCode: string): boolean {
    // Simplified check - in production this would be a more comprehensive database
    const euCarriers = ['LH', 'AF', 'KL', 'BA', 'IB', 'AZ', 'OS', 'SN', 'LX', 'SK'];
    return euCarriers.includes(airlineCode);
  }
}

export const compensationCalculator = new CompensationCalculator();

import { IFlightProvider, NormalizedFlight, FlightProviderException, FlightProviderError } from "./IFlightProvider";

export interface ProviderAttempt {
  provider: string;
  success: boolean;
  error?: string;
  responseTimeMs?: number;
  data?: NormalizedFlight;
}

export interface FlightProviderChainResult {
  flight: NormalizedFlight | null;
  attempts: ProviderAttempt[];
  successfulProvider?: string;
  totalResponseTimeMs: number;
}

export class FlightProviderChain {
  private providers: IFlightProvider[] = [];
  private cache = new Map<string, { data: NormalizedFlight; expires: Date }>();
  private circuitBreaker = new Map<string, { failures: number; lastFailure: Date; isOpen: boolean }>();
  
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private readonly CIRCUIT_BREAKER_THRESHOLD = 3;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  
  constructor(providers: IFlightProvider[]) {
    this.providers = providers.sort((a, b) => a.priority - b.priority);
  }
  
  async getFlightData(flightNumber: string, date: Date): Promise<FlightProviderChainResult> {
    const startTime = Date.now();
    const attempts: ProviderAttempt[] = [];
    const cacheKey = `${flightNumber}_${date.toISOString().split('T')[0]}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > new Date()) {
      console.log(`FlightProviderChain: Cache hit for ${cacheKey}`);
      return {
        flight: cached.data,
        attempts: [{ provider: 'cache', success: true, responseTimeMs: 0 }],
        successfulProvider: 'cache',
        totalResponseTimeMs: Date.now() - startTime
      };
    }
    
    // Try providers in priority order
    for (const provider of this.providers) {
      // Skip if circuit breaker is open
      if (this.isCircuitBreakerOpen(provider.name)) {
        console.log(`FlightProviderChain: Circuit breaker open for ${provider.name}, skipping`);
        attempts.push({
          provider: provider.name,
          success: false,
          error: 'Circuit breaker open'
        });
        continue;
      }
      
      // Check if provider can handle this request
      if (!provider.canHandle(flightNumber, date)) {
        console.log(`FlightProviderChain: ${provider.name} cannot handle ${flightNumber} for ${date.toISOString()}`);
        attempts.push({
          provider: provider.name,
          success: false,
          error: 'Provider cannot handle this request'
        });
        continue;
      }
      
      const providerStartTime = Date.now();
      
      try {
        console.log(`FlightProviderChain: Trying ${provider.name} for ${flightNumber}`);
        
        const flight = await provider.getFlightData(flightNumber, date);
        const responseTimeMs = Date.now() - providerStartTime;
        
        if (flight) {
          // Success! Cache the result and reset circuit breaker
          this.cache.set(cacheKey, {
            data: flight,
            expires: new Date(Date.now() + this.CACHE_TTL_MS)
          });
          this.resetCircuitBreaker(provider.name);
          
          attempts.push({
            provider: provider.name,
            success: true,
            responseTimeMs,
            data: flight
          });
          
          console.log(`FlightProviderChain: Success with ${provider.name} in ${responseTimeMs}ms`);
          
          return {
            flight,
            attempts,
            successfulProvider: provider.name,
            totalResponseTimeMs: Date.now() - startTime
          };
        } else {
          // No data found, but not an error
          attempts.push({
            provider: provider.name,
            success: false,
            error: 'No data found',
            responseTimeMs
          });
          
          console.log(`FlightProviderChain: ${provider.name} found no data for ${flightNumber}`);
        }
      } catch (error) {
        const responseTimeMs = Date.now() - providerStartTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        attempts.push({
          provider: provider.name,
          success: false,
          error: errorMessage,
          responseTimeMs
        });
        
        console.error(`FlightProviderChain: ${provider.name} failed:`, errorMessage);
        
        // Handle circuit breaker for certain errors
        if (error instanceof FlightProviderException) {
          if (error.errorType === FlightProviderError.SERVICE_UNAVAILABLE ||
              error.errorType === FlightProviderError.RATE_LIMITED ||
              error.errorType === FlightProviderError.AUTH_ERROR) {
            this.recordFailure(provider.name);
          }
          
          // If rate limited, wait before trying next provider
          if (error.errorType === FlightProviderError.RATE_LIMITED && error.retryAfter) {
            console.log(`FlightProviderChain: Rate limited, waiting ${error.retryAfter}s before continuing`);
            await this.sleep(Math.min(error.retryAfter * 1000, 10000)); // Max 10s wait
          }
        } else {
          this.recordFailure(provider.name);
        }
      }
    }
    
    console.log(`FlightProviderChain: All providers failed for ${flightNumber}`);
    
    return {
      flight: null,
      attempts,
      totalResponseTimeMs: Date.now() - startTime
    };
  }
  
  private isCircuitBreakerOpen(providerName: string): boolean {
    const breaker = this.circuitBreaker.get(providerName);
    if (!breaker) return false;
    
    if (breaker.isOpen) {
      // Check if enough time has passed to try again
      if (Date.now() - breaker.lastFailure.getTime() > this.CIRCUIT_BREAKER_TIMEOUT) {
        breaker.isOpen = false;
        breaker.failures = 0;
        console.log(`FlightProviderChain: Circuit breaker reset for ${providerName}`);
        return false;
      }
      return true;
    }
    
    return false;
  }
  
  private recordFailure(providerName: string): void {
    const breaker = this.circuitBreaker.get(providerName) || { failures: 0, lastFailure: new Date(), isOpen: false };
    
    breaker.failures++;
    breaker.lastFailure = new Date();
    
    if (breaker.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      breaker.isOpen = true;
      console.warn(`FlightProviderChain: Circuit breaker opened for ${providerName} after ${breaker.failures} failures`);
    }
    
    this.circuitBreaker.set(providerName, breaker);
  }
  
  private resetCircuitBreaker(providerName: string): void {
    this.circuitBreaker.delete(providerName);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Debug/monitoring methods
  getProviderStatus(): Record<string, any> {
    return {
      providers: this.providers.map(p => ({
        name: p.name,
        priority: p.priority,
        circuitBreakerOpen: this.isCircuitBreakerOpen(p.name)
      })),
      circuitBreakers: Object.fromEntries(this.circuitBreaker),
      cacheSize: this.cache.size
    };
  }
  
  clearCache(): void {
    this.cache.clear();
  }
  
  clearCircuitBreakers(): void {
    this.circuitBreaker.clear();
  }
}
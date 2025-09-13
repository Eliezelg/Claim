import {
  users,
  claims,
  documents,
  flights,
  airports,
  airlines,
  claimTimeline,
  type User,
  type UpsertUser,
  type Claim,
  type ClaimWithRelations,
  type InsertClaim,
  type InsertDocument,
  type Document,
  type InsertFlight,
  type Flight,
  type FlightWithRelations,
  type InsertAirport,
  type Airport,
  type InsertAirline,
  type Airline,
  type InsertClaimTimeline,
  type ClaimTimeline,
  type ClaimStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Claim operations
  createClaim(claim: InsertClaim): Promise<Claim>;
  getClaimById(id: string, userId?: string): Promise<ClaimWithRelations | undefined>;
  getClaimsByUserId(userId: string): Promise<ClaimWithRelations[]>;
  updateClaimStatus(id: string, status: ClaimStatus): Promise<Claim | undefined>;
  updateClaim(id: string, updates: Partial<InsertClaim>): Promise<Claim | undefined>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentsByClaimId(claimId: string): Promise<Document[]>;
  deleteDocument(id: string): Promise<boolean>;
  
  // Flight operations
  createFlight(flight: InsertFlight): Promise<Flight>;
  getFlightByNumberAndDate(flightNumber: string, date: Date): Promise<FlightWithRelations | undefined>;
  searchFlights(query: string, date?: Date): Promise<FlightWithRelations[]>;
  
  // Airport operations
  createAirport(airport: InsertAirport): Promise<Airport>;
  getAirportByIataCode(iataCode: string): Promise<Airport | undefined>;
  searchAirports(query: string): Promise<Airport[]>;
  
  // Airline operations
  createAirline(airline: InsertAirline): Promise<Airline>;
  getAirlineByIataCode(iataCode: string): Promise<Airline | undefined>;
  
  // Timeline operations
  addClaimTimelineEntry(entry: InsertClaimTimeline): Promise<ClaimTimeline>;
  getClaimTimeline(claimId: string): Promise<ClaimTimeline[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Claim operations
  async createClaim(claimData: InsertClaim): Promise<Claim> {
    // Generate unique claim number
    const claimNumber = `CLM-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const [claim] = await db
      .insert(claims)
      .values({
        ...claimData,
        claimNumber,
      })
      .returning();
    
    // Add initial timeline entry
    await this.addClaimTimelineEntry({
      claimId: claim.id,
      status: claim.status,
      description: 'Claim created',
    });
    
    return claim;
  }

  async getClaimById(id: string, userId?: string): Promise<ClaimWithRelations | undefined> {
    const query = db
      .select()
      .from(claims)
      .leftJoin(users, eq(claims.userId, users.id))
      .leftJoin(flights, eq(claims.flightId, flights.id))
      .where(userId ? and(eq(claims.id, id), eq(claims.userId, userId)) : eq(claims.id, id));

    const [result] = await query;
    
    if (!result) return undefined;

    const [documents, timeline] = await Promise.all([
      this.getDocumentsByClaimId(id),
      this.getClaimTimeline(id),
    ]);

    return {
      ...result.claims,
      user: result.users || undefined,
      flight: result.flights || undefined,
      documents,
      timeline,
    };
  }

  async getClaimsByUserId(userId: string): Promise<ClaimWithRelations[]> {
    const results = await db
      .select()
      .from(claims)
      .leftJoin(flights, eq(claims.flightId, flights.id))
      .where(eq(claims.userId, userId))
      .orderBy(desc(claims.createdAt));

    const claimsWithRelations = await Promise.all(
      results.map(async (result) => {
        const [documents, timeline] = await Promise.all([
          this.getDocumentsByClaimId(result.claims.id),
          this.getClaimTimeline(result.claims.id),
        ]);

        return {
          ...result.claims,
          flight: result.flights || undefined,
          documents,
          timeline,
        };
      })
    );

    return claimsWithRelations;
  }

  async updateClaimStatus(id: string, status: ClaimStatus): Promise<Claim | undefined> {
    const [claim] = await db
      .update(claims)
      .set({ 
        status, 
        updatedAt: new Date(),
        ...(status === 'SUBMITTED' && { submittedAt: new Date() }),
        ...(status === 'PAID' && { completedAt: new Date() }),
      })
      .where(eq(claims.id, id))
      .returning();
    
    if (claim) {
      await this.addClaimTimelineEntry({
        claimId: id,
        status,
        description: `Status updated to ${status}`,
      });
    }
    
    return claim;
  }

  async updateClaim(id: string, updates: Partial<InsertClaim>): Promise<Claim | undefined> {
    const [claim] = await db
      .update(claims)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(claims.id, id))
      .returning();
    return claim;
  }

  // Document operations
  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(documentData)
      .returning();
    return document;
  }

  async getDocumentsByClaimId(claimId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.claimId, claimId));
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db
      .delete(documents)
      .where(eq(documents.id, id));
    return result.rowCount > 0;
  }

  // Flight operations
  async createFlight(flightData: InsertFlight): Promise<Flight> {
    const [flight] = await db
      .insert(flights)
      .values(flightData)
      .returning();
    return flight;
  }

  async getFlightByNumberAndDate(flightNumber: string, date: Date): Promise<FlightWithRelations | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [result] = await db
      .select()
      .from(flights)
      .leftJoin(airlines, eq(flights.airlineId, airlines.id))
      .leftJoin(airports, eq(flights.departureAirportId, airports.id))
      .where(
        and(
          eq(flights.flightNumber, flightNumber),
          and(
            sql`${flights.flightDate} >= ${startOfDay}`,
            sql`${flights.flightDate} <= ${endOfDay}`
          )
        )
      );

    if (!result) return undefined;

    const arrivalAirport = result.flights.arrivalAirportId 
      ? await this.getAirportByIataCode(result.flights.arrivalAirportId)
      : undefined;

    return {
      ...result.flights,
      airline: result.airlines || undefined,
      departureAirport: result.airports || undefined,
      arrivalAirport,
    };
  }

  async searchFlights(query: string, date?: Date): Promise<FlightWithRelations[]> {
    let whereClause = like(flights.flightNumber, `%${query}%`);
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause = and(
        whereClause,
        and(
          sql`${flights.flightDate} >= ${startOfDay}`,
          sql`${flights.flightDate} <= ${endOfDay}`
        )
      );
    }

    const results = await db
      .select()
      .from(flights)
      .leftJoin(airlines, eq(flights.airlineId, airlines.id))
      .leftJoin(airports, eq(flights.departureAirportId, airports.id))
      .where(whereClause)
      .limit(10);

    return results.map(result => ({
      ...result.flights,
      airline: result.airlines || undefined,
      departureAirport: result.airports || undefined,
    }));
  }

  // Airport operations
  async createAirport(airportData: InsertAirport): Promise<Airport> {
    const [airport] = await db
      .insert(airports)
      .values(airportData)
      .returning();
    return airport;
  }

  async getAirportByIataCode(iataCode: string): Promise<Airport | undefined> {
    const [airport] = await db
      .select()
      .from(airports)
      .where(eq(airports.iataCode, iataCode));
    return airport;
  }

  async searchAirports(query: string): Promise<Airport[]> {
    return await db
      .select()
      .from(airports)
      .where(
        or(
          like(airports.name, `%${query}%`),
          like(airports.iataCode, `%${query}%`),
          like(airports.city, `%${query}%`)
        )
      )
      .limit(10);
  }

  // Airline operations
  async createAirline(airlineData: InsertAirline): Promise<Airline> {
    const [airline] = await db
      .insert(airlines)
      .values(airlineData)
      .returning();
    return airline;
  }

  async getAirlineByIataCode(iataCode: string): Promise<Airline | undefined> {
    const [airline] = await db
      .select()
      .from(airlines)
      .where(eq(airlines.iataCode, iataCode));
    return airline;
  }

  // Timeline operations
  async addClaimTimelineEntry(entryData: InsertClaimTimeline): Promise<ClaimTimeline> {
    const [entry] = await db
      .insert(claimTimeline)
      .values(entryData)
      .returning();
    return entry;
  }

  async getClaimTimeline(claimId: string): Promise<ClaimTimeline[]> {
    return await db
      .select()
      .from(claimTimeline)
      .where(eq(claimTimeline.claimId, claimId))
      .orderBy(desc(claimTimeline.createdAt));
  }
}

export const storage = new DatabaseStorage();

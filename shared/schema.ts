import { sql } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  preferredLanguage: varchar("preferred_language").default('en'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const claimStatusEnum = pgEnum('claim_status', [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'DOCUMENTING',
  'NEGOTIATING',
  'APPROVED',
  'REJECTED',
  'PAID',
  'CANCELLED'
]);

export const jurisdictionEnum = pgEnum('jurisdiction', [
  'EU_261',
  'ISRAEL_ASL',
  'OTHER'
]);

export const documentTypeEnum = pgEnum('document_type', [
  'BOARDING_PASS',
  'RECEIPT',
  'PASSPORT',
  'ID',
  'OTHER'
]);

export const flightStatusEnum = pgEnum('flight_status', [
  'ON_TIME',
  'DELAYED',
  'CANCELLED',
  'DIVERTED',
  'BOARDING',
  'DEPARTED',
  'ARRIVED',
  'UNKNOWN'
]);

export const flightTypeEnum = pgEnum('flight_type', [
  'PASSENGER',
  'CARGO',
  'CHARTER',
  'UNKNOWN'
]);

// Airlines table
export const airlines = pgTable("airlines", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  iataCode: varchar("iata_code", { length: 2 }).unique(),
  icaoCode: varchar("icao_code", { length: 3 }).unique(),
  country: varchar("country"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Airports table
export const airports = pgTable("airports", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  iataCode: varchar("iata_code", { length: 3 }).unique(),
  icaoCode: varchar("icao_code", { length: 4 }).unique(),
  city: varchar("city"),
  country: varchar("country"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Flights table
export const flights = pgTable("flights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flightNumber: varchar("flight_number").notNull(),
  airlineId: varchar("airline_id").references(() => airlines.id),
  departureAirportId: varchar("departure_airport_id").references(() => airports.id),
  arrivalAirportId: varchar("arrival_airport_id").references(() => airports.id),
  scheduledDeparture: timestamp("scheduled_departure"),
  actualDeparture: timestamp("actual_departure"),
  scheduledArrival: timestamp("scheduled_arrival"),
  actualArrival: timestamp("actual_arrival"),
  status: flightStatusEnum("status").default('UNKNOWN'),
  flightType: flightTypeEnum("flight_type").default('PASSENGER'),
  distance: integer("distance"), // in kilometers
  flightDate: timestamp("flight_date").notNull(),
  
  // Timezone information
  departureTimezone: varchar("departure_timezone"), // IANA timezone name
  arrivalTimezone: varchar("arrival_timezone"), // IANA timezone name
  
  // Provider metadata for audit trail
  dataProvider: varchar("data_provider"), // e.g., 'FlightAware', 'AeroDataBox'
  providerFlightId: varchar("provider_flight_id"), // Provider's internal flight ID
  dataConfidence: decimal("data_confidence", { precision: 3, scale: 2 }), // 0.00-1.00
  rawProviderData: jsonb("raw_provider_data"), // Store raw API response for audit
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_flight_number_date").on(table.flightNumber, table.flightDate),
  index("idx_departure_airport").on(table.departureAirportId),
  index("idx_arrival_airport").on(table.arrivalAirportId),
]);

// Claims table
export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimNumber: varchar("claim_number").unique().notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  flightId: varchar("flight_id").references(() => flights.id),
  
  // Flight details (backup in case flight not in our DB)
  flightNumber: varchar("flight_number").notNull(),
  flightDate: timestamp("flight_date").notNull(),
  departureAirport: varchar("departure_airport").notNull(),
  arrivalAirport: varchar("arrival_airport").notNull(),
  
  // Passenger details
  passengerFirstName: varchar("passenger_first_name").notNull(),
  passengerLastName: varchar("passenger_last_name").notNull(),
  passengerEmail: varchar("passenger_email").notNull(),
  passengerPhone: varchar("passenger_phone"),
  passengerAddress: text("passenger_address"),
  passengerCountry: varchar("passenger_country"),
  
  // Banking details
  iban: varchar("iban"),
  
  // Claim details
  status: claimStatusEnum("status").default('DRAFT'),
  jurisdiction: jurisdictionEnum("jurisdiction"),
  
  // Compensation amounts
  euCompensationAmount: decimal("eu_compensation_amount", { precision: 10, scale: 2 }),
  israelCompensationAmount: decimal("israel_compensation_amount", { precision: 10, scale: 2 }),
  finalCompensationAmount: decimal("final_compensation_amount", { precision: 10, scale: 2 }),
  
  // Additional info
  incidentDescription: text("incident_description"),
  assistanceReceived: boolean("assistance_received").default(false),
  
  // Timestamps
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_claims").on(table.userId),
  index("idx_claim_status").on(table.status),
  index("idx_flight_date").on(table.flightDate),
]);

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").references(() => claims.id).notNull(),
  type: documentTypeEnum("type").notNull(),
  fileName: varchar("file_name").notNull(),
  originalFileName: varchar("original_file_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: varchar("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
}, (table) => [
  index("idx_claim_documents").on(table.claimId),
]);

// Claim timeline/history
export const claimTimeline = pgTable("claim_timeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").references(() => claims.id).notNull(),
  status: claimStatusEnum("status").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_claim_timeline").on(table.claimId, table.createdAt),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  claims: many(claims),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  user: one(users, {
    fields: [claims.userId],
    references: [users.id],
  }),
  flight: one(flights, {
    fields: [claims.flightId],
    references: [flights.id],
  }),
  documents: many(documents),
  timeline: many(claimTimeline),
}));

export const flightsRelations = relations(flights, ({ one, many }) => ({
  airline: one(airlines, {
    fields: [flights.airlineId],
    references: [airlines.id],
  }),
  departureAirport: one(airports, {
    fields: [flights.departureAirportId],
    references: [airports.id],
  }),
  arrivalAirport: one(airports, {
    fields: [flights.arrivalAirportId],
    references: [airports.id],
  }),
  claims: many(claims),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  claim: one(claims, {
    fields: [documents.claimId],
    references: [claims.id],
  }),
}));

export const claimTimelineRelations = relations(claimTimeline, ({ one }) => ({
  claim: one(claims, {
    fields: [claimTimeline.claimId],
    references: [claims.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const upsertUserSchema = insertUserSchema.pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  claimNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertFlightSchema = createInsertSchema(flights).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAirlineSchema = createInsertSchema(airlines).omit({
  createdAt: true,
});

export const insertAirportSchema = createInsertSchema(airports).omit({
  createdAt: true,
});

export const insertClaimTimelineSchema = createInsertSchema(claimTimeline).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claims.$inferSelect;
export type ClaimWithRelations = Claim & {
  user?: User;
  flight?: Flight;
  documents?: Document[];
  timeline?: ClaimTimeline[];
};
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertFlight = z.infer<typeof insertFlightSchema>;
export type Flight = typeof flights.$inferSelect;
export type FlightWithRelations = Flight & {
  airline?: Airline;
  departureAirport?: Airport;
  arrivalAirport?: Airport;
};
export type InsertAirline = z.infer<typeof insertAirlineSchema>;
export type Airline = typeof airlines.$inferSelect;
export type InsertAirport = z.infer<typeof insertAirportSchema>;
export type Airport = typeof airports.$inferSelect;
export type InsertClaimTimeline = z.infer<typeof insertClaimTimelineSchema>;
export type ClaimTimeline = typeof claimTimeline.$inferSelect;

export type ClaimStatus = typeof claimStatusEnum.enumValues[number];
export type Jurisdiction = typeof jurisdictionEnum.enumValues[number];
export type DocumentType = typeof documentTypeEnum.enumValues[number];
export type FlightStatus = typeof flightStatusEnum.enumValues[number];
export type FlightType = typeof flightTypeEnum.enumValues[number];

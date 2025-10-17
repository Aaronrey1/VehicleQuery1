import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, index, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  deviceType: text("device_type").notNull(),
  portType: text("port_type").notNull(),
}, (table) => ({
  makeIdx: index("make_idx").on(table.make),
  modelIdx: index("model_idx").on(table.model),
  yearIdx: index("year_idx").on(table.year),
  makeModelYearIdx: index("make_model_year_idx").on(table.make, table.model, table.year),
}));

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
});

export const searchVehicleSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  deviceType: z.string().optional(),
  portType: z.string().optional(),
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type SearchVehicle = z.infer<typeof searchVehicleSchema>;

export type VehicleStats = {
  totalVehicles: number;
  totalMakes: number;
  totalModels: number;
  deviceTypes: number;
};

export type SearchResults = {
  vehicles: Vehicle[];
  total: number;
};

// Keep existing user schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Harness/Geometris table
export const harnesses = pgTable("harnesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  yearFrom: integer("year_from"),
  yearTo: integer("year_to"),
  make: text("make").notNull(),
  model: text("model").notNull(),
  harnessType: text("harness_type").notNull(),
  comments: text("comments"),
}, (table) => ({
  makeIdx: index("harness_make_idx").on(table.make),
  modelIdx: index("harness_model_idx").on(table.model),
  yearFromIdx: index("harness_year_from_idx").on(table.yearFrom),
  yearToIdx: index("harness_year_to_idx").on(table.yearTo),
  makeModelIdx: index("harness_make_model_idx").on(table.make, table.model),
}));

export const insertHarnessSchema = createInsertSchema(harnesses).omit({
  id: true,
});

export const searchHarnessSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
});

export type InsertHarness = z.infer<typeof insertHarnessSchema>;
export type Harness = typeof harnesses.$inferSelect;
export type SearchHarness = z.infer<typeof searchHarnessSchema>;

export type HarnessStats = {
  totalHarnesses: number;
  totalMakes: number;
  totalModels: number;
};

export type HarnessSearchResults = {
  harnesses: Harness[];
  total: number;
};

// AI Search logs for billing tracking
export const aiSearchLogs = pgTable("ai_search_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  source: text("source").notNull(), // 'database_tier1', 'database_tier2', 'google_api'
  confidence: integer("confidence").notNull(),
  cost: integer("cost").notNull().default(0), // in tenths of a cent (0 for database, 5 for Google = $0.005)
}, (table) => ({
  timestampIdx: index("ai_search_timestamp_idx").on(table.timestamp),
  sourceIdx: index("ai_search_source_idx").on(table.source),
}));

export const insertAiSearchLogSchema = createInsertSchema(aiSearchLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertAiSearchLog = z.infer<typeof insertAiSearchLogSchema>;
export type AiSearchLog = typeof aiSearchLogs.$inferSelect;

export type BillingStats = {
  totalSearches: number;
  databaseSearches: number; // Free
  googleSearches: number; // Paid
  vecoSearches: number; // Free
  totalCostCents: number; // in tenths of a cent (divide by 1000 for dollars)
  tier1Searches: number;
  tier2Searches: number;
  recentLogs: AiSearchLog[];
};

// Pending vehicles from Google API awaiting admin approval
export const pendingVehicles = pgTable("pending_vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  deviceType: text("device_type").notNull(),
  portType: text("port_type").notNull(),
  confidence: integer("confidence").notNull(),
  googleSearchResults: text("google_search_results"), // JSON string of Google results
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("pending_status_idx").on(table.status),
  createdAtIdx: index("pending_created_at_idx").on(table.createdAt),
}));

export const insertPendingVehicleSchema = createInsertSchema(pendingVehicles).omit({
  id: true,
  createdAt: true,
});

export type InsertPendingVehicle = z.infer<typeof insertPendingVehicleSchema>;
export type PendingVehicle = typeof pendingVehicles.$inferSelect;

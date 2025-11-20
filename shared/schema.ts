import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, index, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"), // Legacy field - kept for backward compatibility
  yearFrom: integer("year_from"),
  yearTo: integer("year_to"),
  deviceType: text("device_type").notNull(),
  portType: text("port_type").notNull(),
}, (table) => ({
  makeIdx: index("make_idx").on(table.make),
  modelIdx: index("model_idx").on(table.model),
  yearIdx: index("year_idx").on(table.year),
  yearFromIdx: index("year_from_idx").on(table.yearFrom),
  yearToIdx: index("year_to_idx").on(table.yearTo),
  makeModelYearIdx: index("make_model_year_idx").on(table.make, table.model, table.year),
}));

// Base schema without validation (for partial updates)
const baseInsertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
});

// Full insert schema with validation
export const insertVehicleSchema = baseInsertVehicleSchema.superRefine((data, ctx) => {
  const hasYear = data.year !== undefined && data.year !== null;
  const hasYearFrom = data.yearFrom !== undefined && data.yearFrom !== null;
  const hasYearTo = data.yearTo !== undefined && data.yearTo !== null;
  const hasYearRange = hasYearFrom || hasYearTo;
  
  // Cannot have both single year AND year range
  if (hasYear && hasYearRange) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cannot provide both single year and year range. Choose one.",
      path: ['year'],
    });
    return;
  }
  
  // Must have either single year OR both yearFrom and yearTo
  if (!hasYear && (!hasYearFrom || !hasYearTo)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Must provide either a single year or both from/to years",
      path: ['year'],
    });
  }
  
  // If using year range, yearFrom must be <= yearTo
  if (hasYearFrom && hasYearTo && data.yearFrom! > data.yearTo!) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "From Year must be less than or equal to To Year",
      path: ['yearFrom'],
    });
  }
});

// Update schema allows partial updates without strict validation
export const updateVehicleSchema = baseInsertVehicleSchema.partial();

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
  googleSearches: number; // Paid - Historical Google API calls
  geminiSearches: number; // Paid - Current Gemini AI calls
  vecoSearches: number; // Free
  totalCostCents: number; // in tenths of a cent (divide by 1000 for dollars)
  tier1Searches: number;
  tier2Searches: number;
  recentLogs: AiSearchLog[];
};

export type BillingPieCharts = {
  searchTierBreakdown: Array<{ name: string; value: number; color: string }>;
};

export type PendingApprovalsAnalytics = {
  sourceBreakdowns: Array<{
    source: string;
    total: number;
    statuses: Array<{
      name: string;
      value: number;
      percentage: number;
      color: string;
    }>;
  }>;
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
  source: text("source"), // AI prediction source: 'google_api', 'gemini_api', 'database_tier1', etc.
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  userName: text("user_name"), // Optional: user's name for email notification
  userEmail: text("user_email"), // Optional: user's email for approval notification
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("pending_status_idx").on(table.status),
  createdAtIdx: index("pending_created_at_idx").on(table.createdAt),
}));

export const insertPendingVehicleSchema = createInsertSchema(pendingVehicles).omit({
  id: true,
  createdAt: true,
}).extend({
  userName: z.string().min(1).optional(),
  userEmail: z.string().email().optional(),
});

export type InsertPendingVehicle = z.infer<typeof insertPendingVehicleSchema>;
export type PendingVehicle = typeof pendingVehicles.$inferSelect;

// Comprehensive search logs for all search types
export const searchLogs = pgTable("search_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  searchType: text("search_type").notNull(), // 'regular', 'bulk', 'ai', 'vin', 'geometris'
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  country: text("country"), // Country code (e.g., 'US', 'CA', 'GB')
  ipAddress: text("ip_address"),
  resultsCount: integer("results_count").notNull().default(0),
  queryDetails: text("query_details"), // JSON string with additional search parameters
  userName: text("user_name"), // Optional: user's name who performed the search
  userEmail: text("user_email"), // Optional: user's email who performed the search
  apiKeyId: varchar("api_key_id"), // Optional: API key used for this search
  endpoint: text("endpoint"), // API endpoint called (e.g., '/api/ai/predict', '/api/vin/decode')
  exactMatch: boolean("exact_match"), // For AI/VIN searches: true if found exact match, false if needed prediction
}, (table) => ({
  timestampIdx: index("search_logs_timestamp_idx").on(table.timestamp),
  searchTypeIdx: index("search_logs_type_idx").on(table.searchType),
  countryIdx: index("search_logs_country_idx").on(table.country),
  apiKeyIdIdx: index("search_logs_api_key_id_idx").on(table.apiKeyId),
}));

export const insertSearchLogSchema = createInsertSchema(searchLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertSearchLog = z.infer<typeof insertSearchLogSchema>;
export type SearchLog = typeof searchLogs.$inferSelect;

export type SearchAnalytics = {
  totalSearches: number;
  searchesByType: {
    regular: number;
    bulk: number;
    ai: number;
    vin: number;
    geometris: number;
  };
  exactMatchBreakdown: {
    ai: { exactMatches: number; predictions: number };
    vin: { exactMatches: number; predictions: number };
  };
  searchesByCountry: Array<{
    country: string;
    count: number;
  }>;
  recentLogs: SearchLog[];
};

export type ApiCallAnalytics = {
  totalCalls: number;
  callsByKey: Array<{
    apiKeyId: string;
    keyName: string;
    keyPrefix: string;
    totalCalls: number;
    lastUsed: Date | null;
    callsByEndpoint: Array<{
      endpoint: string;
      count: number;
    }>;
  }>;
  callsByEndpoint: Array<{
    endpoint: string;
    count: number;
  }>;
  recentLogs: SearchLog[];
};

// API Keys for external integrations (e.g., Salesforce)
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyHash: varchar("key_hash", { length: 128 }).notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
}, (table) => ({
  keyHashIdx: index("api_key_hash_idx").on(table.keyHash),
  activeIdx: index("api_key_active_idx").on(table.active),
}));

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  keyHash: true, // Key will be auto-generated and hashed
  keyPrefix: true, // Prefix will be auto-generated
  createdAt: true,
  lastUsedAt: true,
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// Type for API key with plaintext key (only returned at creation)
export type ApiKeyWithPlaintext = ApiKey & { key: string };

// Data Overrides table - allows manual editing of any displayed number
export const dataOverrides = pgTable("data_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricKey: text("metric_key").notNull().unique(), // e.g., "dashboard.totalSearches", "billing.totalCost"
  displayName: text("display_name").notNull(), // Human-readable name for admin UI
  originalValue: text("original_value"), // Store original computed value for reference
  overrideValue: text("override_value").notNull(), // The manual override value
  category: text("category").notNull(), // e.g., "dashboard", "billing", "analytics"
  isActive: boolean("is_active").notNull().default(true), // Enable/disable override
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDataOverrideSchema = createInsertSchema(dataOverrides).omit({
  id: true,
  updatedAt: true,
});

export type InsertDataOverride = z.infer<typeof insertDataOverrideSchema>;
export type DataOverride = typeof dataOverrides.$inferSelect;

// Custom Charts table - allows adding custom pie charts/graphs to pages
export const customCharts = pgTable("custom_charts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  page: text("page").notNull(), // e.g., "dashboard", "billing", "analytics"
  chartType: text("chart_type").notNull(), // "pie", "bar", "line"
  chartData: text("chart_data").notNull(), // JSON string with chart data
  position: integer("position").notNull().default(0), // Order on page
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomChartSchema = createInsertSchema(customCharts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomChart = z.infer<typeof insertCustomChartSchema>;
export type CustomChart = typeof customCharts.$inferSelect;

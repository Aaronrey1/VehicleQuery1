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

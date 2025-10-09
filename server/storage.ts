import { vehicles, users, harnesses, type Vehicle, type InsertVehicle, type SearchVehicle, type User, type InsertUser, type Harness, type InsertHarness, type SearchHarness } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, ilike, desc, asc, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods (existing)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vehicle methods
  searchVehicles(params: SearchVehicle & { limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<{ vehicles: Vehicle[], total: number }>;
  getVehicleById(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  createVehicles(vehicles: InsertVehicle[]): Promise<Vehicle[]>;
  getMakes(): Promise<string[]>;
  getModelsByMake(make: string): Promise<string[]>;
  getYearsByMakeAndModel(make: string, model: string): Promise<number[]>;
  getVehicleStats(): Promise<{
    totalVehicles: number;
    totalMakes: number;
    totalModels: number;
    deviceTypes: number;
  }>;
  getDeviceTypes(): Promise<string[]>;
  getPortTypes(): Promise<string[]>;
  updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<void>;
  deleteAllVehicles(): Promise<void>;

  // Harness methods
  searchHarnesses(params: SearchHarness & { limit?: number; offset?: number }): Promise<{ harnesses: Harness[], total: number }>;
  createHarnesses(harnesses: InsertHarness[]): Promise<Harness[]>;
  getHarnessMakes(): Promise<string[]>;
  getHarnessModelsByMake(make: string): Promise<string[]>;
  getHarnessStats(): Promise<{
    totalHarnesses: number;
    totalMakes: number;
    totalModels: number;
  }>;
  updateHarness(id: string, harness: Partial<InsertHarness>): Promise<Harness | undefined>;
  deleteHarness(id: string): Promise<void>;
  deleteAllHarnesses(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async searchVehicles(params: SearchVehicle & { limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<{ vehicles: Vehicle[], total: number }> {
    const { make, model, year, deviceType, portType, limit = 50, offset = 0, sortBy = 'make', sortOrder = 'asc' } = params;
    
    const conditions = [];
    if (make) {
      conditions.push(ilike(vehicles.make, `%${make}%`));
    }
    if (model) {
      conditions.push(ilike(vehicles.model, `%${model}%`));
    }
    if (year) {
      conditions.push(eq(vehicles.year, year));
    }
    if (deviceType) {
      conditions.push(ilike(vehicles.deviceType, `%${deviceType}%`));
    }
    if (portType) {
      conditions.push(ilike(vehicles.portType, `%${portType}%`));
    }
    
    const whereClause = conditions.length === 0 ? undefined : 
      conditions.length === 1 ? conditions[0] : and(...conditions);
    
    // Determine sort column
    const orderByColumn = sortBy === 'model' ? vehicles.model :
      sortBy === 'year' ? vehicles.year :
      sortBy === 'deviceType' ? vehicles.deviceType :
      sortBy === 'portType' ? vehicles.portType :
      vehicles.make;
    
    // Build queries with conditional where clause
    const baseVehicleQuery = db.select().from(vehicles);
    const vehicleQuery = whereClause 
      ? baseVehicleQuery.where(whereClause).orderBy(sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn)).limit(limit).offset(offset)
      : baseVehicleQuery.orderBy(sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn)).limit(limit).offset(offset);
    
    const baseCountQuery = db.select({ count: sql<number>`count(*)` }).from(vehicles);
    const countQuery = whereClause 
      ? baseCountQuery.where(whereClause)
      : baseCountQuery;
    
    const [vehicleResults, countResults] = await Promise.all([
      vehicleQuery,
      countQuery
    ]);
    
    return {
      vehicles: vehicleResults,
      total: Number(countResults[0]?.count || 0)
    };
  }

  async getVehicleById(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [createdVehicle] = await db
      .insert(vehicles)
      .values(vehicle)
      .returning();
    return createdVehicle;
  }

  async createVehicles(vehicleData: InsertVehicle[]): Promise<Vehicle[]> {
    if (vehicleData.length === 0) return [];
    
    // Insert in batches to avoid stack overflow with large datasets
    const batchSize = 1000;
    const allCreatedVehicles: Vehicle[] = [];
    
    for (let i = 0; i < vehicleData.length; i += batchSize) {
      const batch = vehicleData.slice(i, i + batchSize);
      const createdVehicles = await db
        .insert(vehicles)
        .values(batch)
        .returning();
      allCreatedVehicles.push(...createdVehicles);
    }
    
    return allCreatedVehicles;
  }

  async getMakes(): Promise<string[]> {
    const results = await db
      .selectDistinct({ make: vehicles.make })
      .from(vehicles)
      .orderBy(asc(vehicles.make));
    return results.map(r => r.make);
  }

  async getModelsByMake(make: string): Promise<string[]> {
    const results = await db
      .selectDistinct({ model: vehicles.model })
      .from(vehicles)
      .where(eq(vehicles.make, make))
      .orderBy(asc(vehicles.model));
    return results.map(r => r.model);
  }

  async getYearsByMakeAndModel(make: string, model: string): Promise<number[]> {
    const results = await db
      .selectDistinct({ year: vehicles.year })
      .from(vehicles)
      .where(and(eq(vehicles.make, make), eq(vehicles.model, model)))
      .orderBy(desc(vehicles.year));
    return results.map(r => r.year);
  }

  async getVehicleStats(): Promise<{
    totalVehicles: number;
    totalMakes: number;
    totalModels: number;
    deviceTypes: number;
  }> {
    const [vehicleCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles);
    
    const [makeCount] = await db
      .select({ count: sql<number>`count(distinct ${vehicles.make})` })
      .from(vehicles);
    
    const [modelCount] = await db
      .select({ count: sql<number>`count(distinct ${vehicles.model})` })
      .from(vehicles);
    
    const [deviceTypeCount] = await db
      .select({ count: sql<number>`count(distinct ${vehicles.deviceType})` })
      .from(vehicles);
    
    return {
      totalVehicles: vehicleCount?.count || 0,
      totalMakes: makeCount?.count || 0,
      totalModels: modelCount?.count || 0,
      deviceTypes: deviceTypeCount?.count || 0,
    };
  }

  async getDeviceTypes(): Promise<string[]> {
    const results = await db
      .selectDistinct({ deviceType: vehicles.deviceType })
      .from(vehicles)
      .orderBy(asc(vehicles.deviceType));
    return results.map(r => r.deviceType);
  }

  async getPortTypes(): Promise<string[]> {
    const results = await db
      .selectDistinct({ portType: vehicles.portType })
      .from(vehicles)
      .orderBy(asc(vehicles.portType));
    return results.map(r => r.portType);
  }

  async updateVehicle(id: string, vehicleData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set(vehicleData)
      .where(eq(vehicles.id, id))
      .returning();
    return updatedVehicle || undefined;
  }

  async deleteVehicle(id: string): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  async deleteAllVehicles(): Promise<void> {
    await db.delete(vehicles);
  }

  // Harness methods implementation
  async searchHarnesses(params: SearchHarness & { limit?: number; offset?: number }): Promise<{ harnesses: Harness[], total: number }> {
    const { make, model, year, limit = 50, offset = 0 } = params;
    
    const conditions = [];
    if (make) {
      conditions.push(ilike(harnesses.make, `%${make}%`));
    }
    if (model) {
      conditions.push(ilike(harnesses.model, `%${model}%`));
    }
    if (year) {
      // Check if year falls within the yearFrom and yearTo range
      conditions.push(and(
        lte(harnesses.yearFrom, year),
        gte(harnesses.yearTo, year)
      ));
    }
    
    const whereClause = conditions.length === 0 ? undefined : 
      conditions.length === 1 ? conditions[0] : and(...conditions);
    
    // Build queries with conditional where clause
    const baseHarnessQuery = db.select().from(harnesses);
    const harnessQuery = whereClause 
      ? baseHarnessQuery.where(whereClause).orderBy(asc(harnesses.make), asc(harnesses.model)).limit(limit).offset(offset)
      : baseHarnessQuery.orderBy(asc(harnesses.make), asc(harnesses.model)).limit(limit).offset(offset);
    
    const baseCountQuery = db.select({ count: sql<number>`count(*)` }).from(harnesses);
    const countQuery = whereClause 
      ? baseCountQuery.where(whereClause)
      : baseCountQuery;
    
    const [harnessResults, countResults] = await Promise.all([
      harnessQuery,
      countQuery
    ]);
    
    return {
      harnesses: harnessResults,
      total: Number(countResults[0]?.count || 0)
    };
  }

  async createHarnesses(harnessData: InsertHarness[]): Promise<Harness[]> {
    if (harnessData.length === 0) return [];
    
    // Insert in batches to avoid stack overflow with large datasets
    const batchSize = 1000;
    const allCreatedHarnesses: Harness[] = [];
    
    for (let i = 0; i < harnessData.length; i += batchSize) {
      const batch = harnessData.slice(i, i + batchSize);
      const createdHarnesses = await db
        .insert(harnesses)
        .values(batch)
        .returning();
      allCreatedHarnesses.push(...createdHarnesses);
    }
    
    return allCreatedHarnesses;
  }

  async getHarnessMakes(): Promise<string[]> {
    const results = await db
      .selectDistinct({ make: harnesses.make })
      .from(harnesses)
      .orderBy(asc(harnesses.make));
    return results.map(r => r.make);
  }

  async getHarnessModelsByMake(make: string): Promise<string[]> {
    const results = await db
      .selectDistinct({ model: harnesses.model })
      .from(harnesses)
      .where(eq(harnesses.make, make))
      .orderBy(asc(harnesses.model));
    return results.map(r => r.model);
  }

  async getHarnessStats(): Promise<{
    totalHarnesses: number;
    totalMakes: number;
    totalModels: number;
  }> {
    const [harnessCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(harnesses);
    
    const [makeCount] = await db
      .select({ count: sql<number>`count(distinct ${harnesses.make})` })
      .from(harnesses);
    
    const [modelCount] = await db
      .select({ count: sql<number>`count(distinct ${harnesses.model})` })
      .from(harnesses);
    
    return {
      totalHarnesses: harnessCount?.count || 0,
      totalMakes: makeCount?.count || 0,
      totalModels: modelCount?.count || 0,
    };
  }

  async updateHarness(id: string, harnessData: Partial<InsertHarness>): Promise<Harness | undefined> {
    const [updatedHarness] = await db
      .update(harnesses)
      .set(harnessData)
      .where(eq(harnesses.id, id))
      .returning();
    return updatedHarness || undefined;
  }

  async deleteHarness(id: string): Promise<void> {
    await db.delete(harnesses).where(eq(harnesses.id, id));
  }

  async deleteAllHarnesses(): Promise<void> {
    await db.delete(harnesses);
  }
}

export const storage = new DatabaseStorage();

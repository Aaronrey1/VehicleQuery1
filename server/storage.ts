import { vehicles, users, harnesses, aiSearchLogs, pendingVehicles, type Vehicle, type InsertVehicle, type SearchVehicle, type User, type InsertUser, type Harness, type InsertHarness, type SearchHarness, type InsertAiSearchLog, type BillingStats, type PendingVehicle, type InsertPendingVehicle } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, ilike, desc, asc, gte, lte } from "drizzle-orm";
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

  // AI Search logging methods
  logAiSearch(log: InsertAiSearchLog): Promise<void>;
  getBillingStats(): Promise<BillingStats>;
  getTodayGoogleSearchCount(): Promise<number>;

  // Pending vehicles methods (Google API results awaiting approval)
  createPendingVehicle(vehicle: InsertPendingVehicle): Promise<PendingVehicle>;
  getPendingVehicles(): Promise<PendingVehicle[]>;
  approvePendingVehicle(id: string): Promise<void>;
  rejectPendingVehicle(id: string): Promise<void>;
  deletePendingVehicle(id: string): Promise<void>;
}

// Helper function to map snake_case database columns to camelCase TypeScript properties
function mapVehicleFromDb(dbRow: any): Vehicle {
  return {
    id: dbRow.id,
    make: dbRow.make,
    model: dbRow.model,
    year: dbRow.year,
    yearFrom: dbRow.year_from,
    yearTo: dbRow.year_to,
    deviceType: dbRow.device_type,
    portType: dbRow.port_type,
  };
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
    
    // Build WHERE conditions dynamically
    const buildWhereClause = (searchModel?: string) => {
      const conditions = [];
      
      if (make) {
        conditions.push(sql`REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(UPPER(make), '-', ''), ',', ''), '/', ''), '.', ''), ' ', ''), '(', ''), ')', ''), '[', ''), ']', ''), '&', ''), '+', ''), '*', '') ILIKE ${`%${make}%`}`);
      }
      
      if (searchModel) {
        if (searchModel === 'ALLMODELS') {
          conditions.push(sql`REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(UPPER(model), '-', ''), ',', ''), '/', ''), '.', ''), ' ', ''), '(', ''), ')', ''), '[', ''), ']', ''), '&', ''), '+', ''), '*', '') ILIKE '%ALLMODELS%'`);
        } else {
          conditions.push(sql`REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(UPPER(model), '-', ''), ',', ''), '/', ''), '.', ''), ' ', ''), '(', ''), ')', ''), '[', ''), ']', ''), '&', ''), '+', ''), '*', '') ILIKE ${`%${searchModel}%`}`);
        }
      }
      
      if (year) {
        conditions.push(sql`(year = ${year} OR (year_to >= ${year} AND year_from <= ${year}))`);
      }
      
      if (deviceType) {
        conditions.push(sql`REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(UPPER(device_type), '-', ''), ',', ''), '/', ''), '.', ''), ' ', ''), '(', ''), ')', ''), '[', ''), ']', ''), '&', ''), '+', ''), '*', '') ILIKE ${`%${deviceType}%`}`);
      }
      
      if (portType) {
        conditions.push(sql`REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(UPPER(port_type), '-', ''), ',', ''), '/', ''), '.', ''), ' ', ''), '(', ''), ')', ''), '[', ''), ']', ''), '&', ''), '+', ''), '*', '') ILIKE ${`%${portType}%`}`);
      }
      
      return conditions;
    };
    
    // Determine sort column
    const sortColumn = sortBy === 'model' ? sql.raw('model') :
      sortBy === 'year' ? sql.raw('year') :
      sortBy === 'deviceType' ? sql.raw('device_type') :
      sortBy === 'portType' ? sql.raw('port_type') :
      sql.raw('make');
    
    const orderDirection = sortOrder === 'asc' ? sql.raw('ASC') : sql.raw('DESC');
    
    // IMPORTANT: If model is specified, check for "ALL MODELS" wildcard first
    if (model) {
      const wildcardConditions = buildWhereClause('ALLMODELS');
      
      if (wildcardConditions.length > 0) {
        // Combine conditions using AND
        let wildcardWhere = wildcardConditions[0];
        for (let i = 1; i < wildcardConditions.length; i++) {
          wildcardWhere = sql`${wildcardWhere} AND ${wildcardConditions[i]}`;
        }
        
        const wildcardCountQuery = sql`SELECT COUNT(*) as count FROM ${vehicles} WHERE ${wildcardWhere}`;
        
        const wildcardCountResult = await db.execute(wildcardCountQuery);
        const wildcardTotal = Number(wildcardCountResult.rows[0]?.count || 0);
        
        if (wildcardTotal > 0) {
          const wildcardQuery = sql`SELECT * FROM ${vehicles} WHERE ${wildcardWhere} ORDER BY ${sortColumn} ${orderDirection} LIMIT ${limit} OFFSET ${offset}`;
          const wildcardResults = await db.execute(wildcardQuery);
          
          return {
            vehicles: wildcardResults.rows.map(mapVehicleFromDb),
            total: wildcardTotal
          };
        }
      }
    }
    
    // No wildcard found, execute specific model search
    const conditions = buildWhereClause(model);
    
    if (conditions.length > 0) {
      // Combine conditions using AND
      let whereClause = conditions[0];
      for (let i = 1; i < conditions.length; i++) {
        whereClause = sql`${whereClause} AND ${conditions[i]}`;
      }
      
      const countQuery = sql`SELECT COUNT(*) as count FROM ${vehicles} WHERE ${whereClause}`;
      const dataQuery = sql`SELECT * FROM ${vehicles} WHERE ${whereClause} ORDER BY ${sortColumn} ${orderDirection} LIMIT ${limit} OFFSET ${offset}`;
      
      const [countResult, dataResult] = await Promise.all([
        db.execute(countQuery),
        db.execute(dataQuery)
      ]);
      
      return {
        vehicles: dataResult.rows.map(mapVehicleFromDb),
        total: Number(countResult.rows[0]?.count || 0)
      };
    } else {
      // No conditions, return all vehicles
      const countQuery = sql`SELECT COUNT(*) as count FROM ${vehicles}`;
      const dataQuery = sql`SELECT * FROM ${vehicles} ORDER BY ${sortColumn} ${orderDirection} LIMIT ${limit} OFFSET ${offset}`;
      
      const [countResult, dataResult] = await Promise.all([
        db.execute(countQuery),
        db.execute(dataQuery)
      ]);
      
      return {
        vehicles: dataResult.rows.map(mapVehicleFromDb),
        total: Number(countResult.rows[0]?.count || 0)
      };
    }
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
      .select({ year: vehicles.year, yearFrom: vehicles.yearFrom, yearTo: vehicles.yearTo })
      .from(vehicles)
      .where(and(eq(vehicles.make, make), eq(vehicles.model, model)));
    
    // Collect all unique years from both single year field and year ranges
    const yearsSet = new Set<number>();
    results.forEach(r => {
      if (r.year !== null) {
        yearsSet.add(r.year);
      }
      // If it's a year range, add all years in the range
      if (r.yearFrom !== null && r.yearTo !== null) {
        for (let y = r.yearFrom; y <= r.yearTo; y++) {
          yearsSet.add(y);
        }
      }
    });
    
    // Return sorted array in descending order
    return Array.from(yearsSet).sort((a, b) => b - a);
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

  async logAiSearch(log: InsertAiSearchLog): Promise<void> {
    await db.insert(aiSearchLogs).values(log);
  }

  async getBillingStats(): Promise<BillingStats> {
    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs);

    const [databaseCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(sql`${aiSearchLogs.source} != 'google_api'`);

    const [googleCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(eq(aiSearchLogs.source, 'google_api'));

    const [tier1Count] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(eq(aiSearchLogs.source, 'database_tier1'));

    const [tier2Count] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(eq(aiSearchLogs.source, 'database_tier2'));

    const [vecoCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(eq(aiSearchLogs.source, 'veco'));

    const [costSum] = await db
      .select({ sum: sql<number>`coalesce(sum(${aiSearchLogs.cost}), 0)` })
      .from(aiSearchLogs);

    const recentLogs = await db
      .select()
      .from(aiSearchLogs)
      .orderBy(desc(aiSearchLogs.timestamp))
      .limit(100);

    return {
      totalSearches: Number(totalCount?.count || 0),
      databaseSearches: Number(databaseCount?.count || 0),
      googleSearches: Number(googleCount?.count || 0),
      vecoSearches: Number(vecoCount?.count || 0),
      tier1Searches: Number(tier1Count?.count || 0),
      tier2Searches: Number(tier2Count?.count || 0),
      totalCostCents: Number(costSum?.sum || 0),
      recentLogs,
    };
  }

  async createPendingVehicle(vehicle: InsertPendingVehicle): Promise<PendingVehicle> {
    const [createdVehicle] = await db
      .insert(pendingVehicles)
      .values(vehicle)
      .returning();
    return createdVehicle;
  }

  async getPendingVehicles(): Promise<PendingVehicle[]> {
    return await db
      .select()
      .from(pendingVehicles)
      .where(eq(pendingVehicles.status, 'pending'))
      .orderBy(desc(pendingVehicles.createdAt));
  }

  async approvePendingVehicle(id: string): Promise<void> {
    const [pending] = await db
      .select()
      .from(pendingVehicles)
      .where(eq(pendingVehicles.id, id));

    if (!pending) {
      throw new Error('Pending vehicle not found');
    }

    // Add to main vehicles table
    await db.insert(vehicles).values({
      make: pending.make,
      model: pending.model,
      year: pending.year,
      deviceType: pending.deviceType,
      portType: pending.portType,
    });

    // Update status to approved
    await db
      .update(pendingVehicles)
      .set({ status: 'approved' })
      .where(eq(pendingVehicles.id, id));
  }

  async rejectPendingVehicle(id: string): Promise<void> {
    await db
      .update(pendingVehicles)
      .set({ status: 'rejected' })
      .where(eq(pendingVehicles.id, id));
  }

  async deletePendingVehicle(id: string): Promise<void> {
    await db.delete(pendingVehicles).where(eq(pendingVehicles.id, id));
  }

  async getTodayGoogleSearchCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(
        and(
          eq(aiSearchLogs.source, 'google_api'),
          sql`${aiSearchLogs.timestamp} >= ${today.toISOString()}`
        )
      );

    return Number(result?.count || 0);
  }
}

export const storage = new DatabaseStorage();

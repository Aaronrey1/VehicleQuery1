import { vehicles, users, harnesses, aiSearchLogs, pendingVehicles, searchLogs, apiKeys, type Vehicle, type InsertVehicle, type SearchVehicle, type User, type InsertUser, type Harness, type InsertHarness, type SearchHarness, type InsertAiSearchLog, type BillingStats, type BillingPieCharts, type PendingVehicle, type InsertPendingVehicle, type InsertSearchLog, type SearchLog, type SearchAnalytics, type ApiCallAnalytics, type ApiKey, type InsertApiKey, type ApiKeyWithPlaintext } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, ilike, desc, asc, gte, lte, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

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
  getBillingPieCharts(): Promise<BillingPieCharts>;
  getTodayGeminiSearchCount(): Promise<number>;

  // Pending vehicles methods (Google API results awaiting approval)
  createPendingVehicle(vehicle: InsertPendingVehicle): Promise<PendingVehicle>;
  getPendingVehicles(): Promise<PendingVehicle[]>;
  getAllPendingVehicles(status?: 'pending' | 'approved' | 'rejected'): Promise<PendingVehicle[]>;
  approvePendingVehicle(id: string): Promise<void>;
  rejectPendingVehicle(id: string): Promise<void>;
  deletePendingVehicle(id: string): Promise<void>;

  // Search logging methods
  logSearch(log: InsertSearchLog): Promise<void>;
  getSearchAnalytics(fromDate?: Date, toDate?: Date): Promise<SearchAnalytics>;

  // API Key methods
  createApiKey(apiKey: InsertApiKey): Promise<ApiKeyWithPlaintext>;
  getApiKeys(): Promise<ApiKey[]>;
  validateApiKey(key: string): Promise<ApiKey | undefined>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  revokeApiKey(id: string): Promise<void>;
  deleteApiKey(id: string): Promise<void>;
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
      .where(sql`${aiSearchLogs.source} NOT IN ('google_api', 'gemini_api')`);

    const [googleCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(eq(aiSearchLogs.source, 'google_api'));

    const [geminiCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(eq(aiSearchLogs.source, 'gemini_api'));

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

    const [exactMatchCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(eq(aiSearchLogs.source, 'exact'));

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
      geminiSearches: Number(geminiCount?.count || 0),
      vecoSearches: Number(vecoCount?.count || 0),
      exactMatches: Number(exactMatchCount?.count || 0),
      tier1Searches: Number(tier1Count?.count || 0),
      tier2Searches: Number(tier2Count?.count || 0),
      totalCostCents: Number(costSum?.sum || 0),
      recentLogs,
    };
  }

  async getBillingPieCharts(): Promise<BillingPieCharts> {
    // Get counts from ai_search_logs by source (all predictions ever made)
    const [tier1Count] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(eq(aiSearchLogs.source, 'database_tier1'));

    const [tier2Count] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(eq(aiSearchLogs.source, 'database_tier2'));

    const [googleCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(eq(aiSearchLogs.source, 'google_api'));

    const [geminiCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(eq(aiSearchLogs.source, 'gemini_api'));

    const [exactMatchCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(eq(aiSearchLogs.source, 'exact'));

    // Get approval analytics from pending_vehicles (excluding deleted)
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pendingVehicles)
      .where(eq(pendingVehicles.status, 'pending'));

    const [approvedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pendingVehicles)
      .where(eq(pendingVehicles.status, 'approved'));

    const [rejectedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pendingVehicles)
      .where(eq(pendingVehicles.status, 'rejected'));

    // Get tier breakdown with pending/approved/rejected for each tier
    // Join ai_search_logs with pending_vehicles to ensure we count ALL predictions
    // Use ai_search_logs as the source of truth for totals, pending_vehicles for approval status
    const tierBreakdownResults = await db.execute<{
      source: string;
      status: string;
      count: number;
    }>(sql`
      SELECT 
        COALESCE(a.source, 'gemini_api') as source,
        COALESCE(p.status, 'deleted') as status,
        COUNT(*) as count
      FROM ${aiSearchLogs} a
      LEFT JOIN ${pendingVehicles} p
        ON UPPER(TRIM(a.make)) = UPPER(TRIM(p.make))
        AND UPPER(TRIM(a.model)) = UPPER(TRIM(p.model))
        AND a.year = p.year
        AND COALESCE(a.source, 'gemini_api') = COALESCE(p.source, 'gemini_api')
        AND p.status != 'deleted'
      WHERE a.source != 'exact'
      GROUP BY COALESCE(a.source, 'gemini_api'), COALESCE(p.status, 'deleted')
    `);

    // Build tier map with pending/approved/rejected counts
    // Note: 'deleted' status means the record exists in ai_search_logs but not in pending_vehicles
    // We'll count these as 'pending' since they haven't been reviewed yet
    const tierMap = new Map<string, { pending: number; approved: number; rejected: number }>();
    tierBreakdownResults.rows.forEach((row: { source: string; status: string; count: number }) => {
      const source = row.source || 'gemini_api';
      if (!tierMap.has(source)) {
        tierMap.set(source, { pending: 0, approved: 0, rejected: 0 });
      }
      const counts = tierMap.get(source)!;
      if (row.status === 'pending' || row.status === 'deleted') {
        // Count both 'pending' and 'deleted' as pending (not yet reviewed)
        counts.pending += Number(row.count);
      } else if (row.status === 'approved') {
        counts.approved = Number(row.count);
      } else if (row.status === 'rejected') {
        counts.rejected = Number(row.count);
      }
    });

    // Helper function to create tier data - uses ai_search_logs count with approval status from pending_vehicles
    const createTierData = (source: string, name: string, totalCount: number, baseColor: string) => {
      const approvalData = tierMap.get(source) || { pending: 0, approved: 0, rejected: 0 };
      
      // Total from ai_search_logs, approval breakdown from pending_vehicles
      // All searches from this tier need approval (except 'exact' which is excluded)
      return {
        name,
        data: [
          { name: 'Pending', value: approvalData.pending, color: '#f59e0b' },
          { name: 'Approved', value: approvalData.approved, color: '#10b981' },
          { name: 'Rejected', value: approvalData.rejected, color: '#ef4444' },
        ].filter(item => item.value > 0),
        total: totalCount, // Use the count from ai_search_logs
      };
    };

    const individualTierCharts = {
      tier1: createTierData('database_tier1', 'Pattern ±5 years', Number(tier1Count?.count || 0), '#3b82f6'),
      tier2: createTierData('database_tier2', 'Pattern ±10 years', Number(tier2Count?.count || 0), '#06b6d4'),
      googleApi: createTierData('google_api', 'Google API', Number(googleCount?.count || 0), '#f59e0b'),
      geminiAi: createTierData('gemini_api', 'Gemini AI', Number(geminiCount?.count || 0), '#a855f7'),
      // Don't include 'unmatched' in individual tier charts - only show the 4 main tiers
    };

    // Search tier breakdown using ai_search_logs (matches the stats)
    const searchTierBreakdown = [
      { name: 'Exact Matches', value: Number(exactMatchCount?.count || 0), color: '#10b981' },
      { name: 'Pattern ±5 years', value: Number(tier1Count?.count || 0), color: '#3b82f6' },
      { name: 'Pattern ±10 years', value: Number(tier2Count?.count || 0), color: '#06b6d4' },
      { name: 'Google API', value: Number(googleCount?.count || 0), color: '#f59e0b' },
      { name: 'Gemini AI', value: Number(geminiCount?.count || 0), color: '#a855f7' },
    ].filter(item => item.value > 0);

    const approvalAnalytics = [
      { name: 'Pending', value: Number(pendingCount?.count || 0), color: '#f59e0b' },
      { name: 'Approved', value: Number(approvedCount?.count || 0), color: '#10b981' },
      { name: 'Rejected', value: Number(rejectedCount?.count || 0), color: '#ef4444' },
    ].filter(item => item.value > 0);

    // Get API call breakdown by endpoint (only API calls with apiKeyId)
    const apiCallResults = await db
      .select({
        endpoint: searchLogs.endpoint,
        count: sql<number>`count(*)`,
      })
      .from(searchLogs)
      .where(sql`${searchLogs.apiKeyId} IS NOT NULL`)
      .groupBy(searchLogs.endpoint)
      .orderBy(desc(sql<number>`count(*)`));

    // Map endpoints to friendly names with colors
    const endpointColorMap: Record<string, { name: string; color: string }> = {
      '/api/ai/predict': { name: 'AI Predictions', color: '#8b5cf6' },
      '/api/vin/decode': { name: 'VIN Decoder', color: '#3b82f6' },
      '/api/vehicles/search': { name: 'Vehicle Search', color: '#10b981' },
      '/api/harnesses/search': { name: 'Harness Search', color: '#f59e0b' },
    };

    const apiCallBreakdown = apiCallResults.map((row) => {
      const endpoint = row.endpoint || 'Unknown';
      const mappedData = endpointColorMap[endpoint] || { name: endpoint, color: '#6b7280' };
      return {
        name: mappedData.name,
        value: Number(row.count),
        color: mappedData.color,
      };
    });

    return {
      searchTierBreakdown,
      approvalAnalytics,
      individualTierCharts,
      apiCallBreakdown,
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

  async getAllPendingVehicles(status?: 'pending' | 'approved' | 'rejected'): Promise<PendingVehicle[]> {
    if (status) {
      return await db
        .select()
        .from(pendingVehicles)
        .where(eq(pendingVehicles.status, status))
        .orderBy(desc(pendingVehicles.createdAt));
    }
    // Exclude deleted records from "all" pending vehicles
    return await db
      .select()
      .from(pendingVehicles)
      .where(ne(pendingVehicles.status, 'deleted'))
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
    // Soft delete: set status to 'deleted' instead of removing the row
    // This preserves approval history for billing charts
    await db
      .update(pendingVehicles)
      .set({ status: 'deleted' })
      .where(eq(pendingVehicles.id, id));
  }

  async getTodayGeminiSearchCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiSearchLogs)
      .where(
        and(
          eq(aiSearchLogs.source, 'gemini_api'),
          sql`${aiSearchLogs.timestamp} >= ${today.toISOString()}`
        )
      );

    return Number(result?.count || 0);
  }

  async logSearch(log: InsertSearchLog): Promise<void> {
    await db.insert(searchLogs).values(log);
  }

  async getSearchAnalytics(fromDate?: Date, toDate?: Date): Promise<SearchAnalytics> {
    // Build date filter conditions
    const conditions = [];
    if (fromDate) {
      conditions.push(gte(searchLogs.timestamp, fromDate));
    }
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(lte(searchLogs.timestamp, endOfDay));
    }

    // Exclude 'regular' type from all analytics (only count AI, Bulk, VIN, Geometris)
    const excludeRegular = ne(searchLogs.searchType, 'regular');
    const whereClause = conditions.length > 0 
      ? and(...conditions, excludeRegular)
      : excludeRegular;

    // Get total searches (excluding 'regular')
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(searchLogs)
      .where(whereClause);

    const totalSearches = Number(totalResult?.count || 0);

    // Get searches by type (excluding 'regular')
    const typeResults = await db
      .select({
        searchType: searchLogs.searchType,
        count: sql<number>`count(*)`,
      })
      .from(searchLogs)
      .where(whereClause)
      .groupBy(searchLogs.searchType);

    const searchesByType = {
      regular: 0,
      bulk: 0,
      ai: 0,
      vin: 0,
      geometris: 0,
    };

    typeResults.forEach((row) => {
      const type = row.searchType as keyof typeof searchesByType;
      if (type in searchesByType) {
        searchesByType[type] = Number(row.count);
      }
    });

    // Get searches by country
    const countryResults = await db
      .select({
        country: searchLogs.country,
        count: sql<number>`count(*)`,
      })
      .from(searchLogs)
      .where(whereClause)
      .groupBy(searchLogs.country)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(20);

    const searchesByCountry = countryResults.map((row) => ({
      country: row.country || 'Unknown',
      count: Number(row.count),
    }));

    // Get exact match breakdown for AI searches
    const [aiExactMatches] = await db
      .select({ count: sql<number>`count(*)` })
      .from(searchLogs)
      .where(and(
        whereClause,
        eq(searchLogs.searchType, 'ai'),
        eq(searchLogs.exactMatch, true)
      ) as any);
    
    const [aiPredictions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(searchLogs)
      .where(and(
        whereClause,
        eq(searchLogs.searchType, 'ai'),
        eq(searchLogs.exactMatch, false)
      ) as any);

    // Get exact match breakdown for VIN searches
    const [vinExactMatches] = await db
      .select({ count: sql<number>`count(*)` })
      .from(searchLogs)
      .where(and(
        whereClause,
        eq(searchLogs.searchType, 'vin'),
        eq(searchLogs.exactMatch, true)
      ) as any);
    
    const [vinPredictions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(searchLogs)
      .where(and(
        whereClause,
        eq(searchLogs.searchType, 'vin'),
        eq(searchLogs.exactMatch, false)
      ) as any);

    // Get recent logs
    const recentLogs = await db
      .select()
      .from(searchLogs)
      .where(whereClause)
      .orderBy(desc(searchLogs.timestamp))
      .limit(100);

    return {
      totalSearches,
      searchesByType,
      exactMatchBreakdown: {
        ai: {
          exactMatches: Number(aiExactMatches?.count || 0),
          predictions: Number(aiPredictions?.count || 0),
        },
        vin: {
          exactMatches: Number(vinExactMatches?.count || 0),
          predictions: Number(vinPredictions?.count || 0),
        },
      },
      searchesByCountry,
      recentLogs,
    };
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKeyWithPlaintext> {
    // Generate API key with format: vdb_[prefix]_[secret]
    const prefix = randomUUID().replace(/-/g, '').substring(0, 8);
    const secret = randomUUID() + randomUUID().replace(/-/g, '');
    const key = `vdb_${prefix}_${secret}`;
    
    // Hash the full key before storing
    const saltRounds = 10;
    const keyHash = await bcrypt.hash(key, saltRounds);
    
    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        ...insertApiKey,
        keyHash,
        keyPrefix: `vdb_${prefix}`,
      })
      .returning();
    
    // Return the API key with the plaintext key (only at creation)
    return {
      ...apiKey,
      key,
    };
  }

  async getApiKeys(): Promise<ApiKey[]> {
    return await db
      .select()
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt));
  }

  async validateApiKey(key: string): Promise<ApiKey | undefined> {
    // Get all active API keys
    const allKeys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.active, true));
    
    // Check each key hash to find a match
    for (const apiKey of allKeys) {
      const isValid = await bcrypt.compare(key, apiKey.keyHash);
      if (isValid) {
        return apiKey;
      }
    }
    
    return undefined;
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async revokeApiKey(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ active: false })
      .where(eq(apiKeys.id, id));
  }

  async deleteApiKey(id: string): Promise<void> {
    await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, id));
  }

  async getDashboardAnalytics(): Promise<{
    totalSearches: number;
    mostSearchedMake: string;
    totalVehicles: number;
    topSearchedVehicles: Array<{
      make: string;
      model: string;
      year: number | null;
      searches: number;
    }>;
  }> {
    // Get total searches
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(searchLogs);
    const totalSearches = Number(totalResult?.count || 0);

    // Get most searched make
    const makeResults = await db
      .select({
        make: searchLogs.make,
        count: sql<number>`count(*)`,
      })
      .from(searchLogs)
      .where(sql`${searchLogs.make} IS NOT NULL`)
      .groupBy(searchLogs.make)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(1);
    const mostSearchedMake = makeResults[0]?.make || 'N/A';

    // Get total vehicles
    const [vehicleResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles);
    const totalVehicles = Number(vehicleResult?.count || 0);

    // Get top searched vehicles (make/model/year combinations)
    const topVehicleResults = await db
      .select({
        make: searchLogs.make,
        model: searchLogs.model,
        year: searchLogs.year,
        count: sql<number>`count(*)`,
      })
      .from(searchLogs)
      .where(and(
        sql`${searchLogs.make} IS NOT NULL`,
        sql`${searchLogs.model} IS NOT NULL`
      ))
      .groupBy(searchLogs.make, searchLogs.model, searchLogs.year)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(5);

    const topSearchedVehicles = topVehicleResults.map((row) => ({
      make: row.make || '',
      model: row.model || '',
      year: row.year,
      searches: Number(row.count),
    }));

    return {
      totalSearches,
      mostSearchedMake,
      totalVehicles,
      topSearchedVehicles,
    };
  }

  async getApiCallAnalytics(fromDate?: Date, toDate?: Date): Promise<ApiCallAnalytics> {
    // Build date filter conditions
    const conditions = [];
    if (fromDate) {
      conditions.push(gte(searchLogs.timestamp, fromDate));
    }
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(lte(searchLogs.timestamp, endOfDay));
    }

    // Only count API calls (where apiKeyId is not null)
    const apiCallsOnly = sql`${searchLogs.apiKeyId} IS NOT NULL`;
    const whereClause = conditions.length > 0 
      ? and(...conditions, apiCallsOnly)
      : apiCallsOnly;

    // Get total API calls
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(searchLogs)
      .where(whereClause);

    const totalCalls = Number(totalResult?.count || 0);

    // Get calls by endpoint
    const endpointResults = await db
      .select({
        endpoint: searchLogs.endpoint,
        count: sql<number>`count(*)`,
      })
      .from(searchLogs)
      .where(whereClause)
      .groupBy(searchLogs.endpoint)
      .orderBy(desc(sql<number>`count(*)`));

    const callsByEndpoint = endpointResults.map((row) => ({
      endpoint: row.endpoint || 'Unknown',
      count: Number(row.count),
    }));

    // Get calls by API key
    const keyResults = await db
      .select({
        apiKeyId: searchLogs.apiKeyId,
        count: sql<number>`count(*)`,
      })
      .from(searchLogs)
      .where(whereClause)
      .groupBy(searchLogs.apiKeyId)
      .orderBy(desc(sql<number>`count(*)`));

    const callsByKey = [];
    for (const row of keyResults) {
      if (!row.apiKeyId) continue;

      // Get API key details
      const [keyDetails] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, row.apiKeyId));

      if (!keyDetails) continue;

      // Get endpoint breakdown for this API key
      const keyEndpointResults = await db
        .select({
          endpoint: searchLogs.endpoint,
          count: sql<number>`count(*)`,
        })
        .from(searchLogs)
        .where(and(eq(searchLogs.apiKeyId, row.apiKeyId), whereClause))
        .groupBy(searchLogs.endpoint);

      const callsByEndpointForKey = keyEndpointResults.map((ep) => ({
        endpoint: ep.endpoint || 'Unknown',
        count: Number(ep.count),
      }));

      callsByKey.push({
        apiKeyId: row.apiKeyId,
        keyName: keyDetails.name,
        keyPrefix: keyDetails.keyPrefix,
        totalCalls: Number(row.count),
        lastUsed: keyDetails.lastUsedAt,
        callsByEndpoint: callsByEndpointForKey,
      });
    }

    // Get recent logs
    const recentLogs = await db
      .select()
      .from(searchLogs)
      .where(whereClause)
      .orderBy(desc(searchLogs.timestamp))
      .limit(100);

    return {
      totalCalls,
      callsByKey,
      callsByEndpoint,
      recentLogs,
    };
  }
}

export const storage = new DatabaseStorage();

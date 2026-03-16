import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 10
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export const db = drizzle({ client: pool, schema });

// Retry wrapper for database operations that may fail due to Neon endpoint suspension
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 2000
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || '';
      const isNeonSuspended =
        msg.includes('endpoint has been disabled') ||
        msg.includes('endpoint is disabled') ||
        msg.includes('Control plane request failed') ||
        msg.includes('connection timeout');

      if (isNeonSuspended && attempt < maxRetries) {
        console.warn(`Database endpoint sleeping, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

// Ensure vehicle_features table exists (for production database sync)
export async function ensureVehicleFeaturesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicle_features (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        vin_support TEXT,
        rpm TEXT,
        speed TEXT,
        mil_state TEXT,
        ignition_status TEXT,
        precise_fuel TEXT,
        true_odometer TEXT,
        driver_seat_belt TEXT,
        tire_pressure TEXT,
        door_lock_status TEXT,
        oil_percent TEXT,
        maf TEXT,
        map TEXT,
        ev_state_of_charge TEXT,
        ev_range TEXT,
        ev_charging_status TEXT,
        ev_state_of_health TEXT
      );
    `);
    console.log("Vehicle features table ready.");
  } catch (err) {
    console.error("Failed to ensure vehicle_features table:", err);
  }
}

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
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export const db = drizzle({ client: pool, schema });

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
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, searchVehicleSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Search vehicles
  app.get("/api/vehicles/search", async (req, res) => {
    try {
      const { make, model, year, page = "1", limit = "50", sortBy = "make", sortOrder = "asc" } = req.query;
      
      const searchParams = {
        make: make as string,
        model: model as string,
        year: year ? parseInt(year as string) : undefined,
        limit: parseInt(limit as string),
        offset: (parseInt(page as string) - 1) * parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };
      
      const result = await storage.searchVehicles(searchParams);
      res.json(result);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Failed to search vehicles" });
    }
  });

  // Get vehicle statistics
  app.get("/api/vehicles/stats", async (req, res) => {
    try {
      const stats = await storage.getVehicleStats();
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to get vehicle statistics" });
    }
  });

  // Get makes
  app.get("/api/vehicles/makes", async (req, res) => {
    try {
      const makes = await storage.getMakes();
      res.json(makes);
    } catch (error) {
      console.error("Makes error:", error);
      res.status(500).json({ message: "Failed to get makes" });
    }
  });

  // Get models by make
  app.get("/api/vehicles/models/:make", async (req, res) => {
    try {
      const { make } = req.params;
      const models = await storage.getModelsByMake(make);
      res.json(models);
    } catch (error) {
      console.error("Models error:", error);
      res.status(500).json({ message: "Failed to get models" });
    }
  });

  // Get years by make and model
  app.get("/api/vehicles/years/:make/:model", async (req, res) => {
    try {
      const { make, model } = req.params;
      const years = await storage.getYearsByMakeAndModel(make, model);
      res.json(years);
    } catch (error) {
      console.error("Years error:", error);
      res.status(500).json({ message: "Failed to get years" });
    }
  });

  // Import vehicles from CSV/JSON
  app.post("/api/vehicles/import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { mode = "append" } = req.body;
      let vehicleData: any[] = [];

      // Handle CSV
      if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
        const csvData = await new Promise<any[]>((resolve, reject) => {
          const results: any[] = [];
          const stream = Readable.from(req.file!.buffer.toString());
          
          stream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
        });
        vehicleData = csvData;
      }
      // Handle JSON
      else if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
        vehicleData = JSON.parse(req.file.buffer.toString());
      }
      else {
        return res.status(400).json({ message: "Unsupported file format. Please use CSV or JSON." });
      }

      // Validate and transform data
      const validVehicles = [];
      const errors = [];

      for (let i = 0; i < vehicleData.length; i++) {
        const row = vehicleData[i];
        try {
          // Normalize column names
          const normalizedRow = {
            make: row.make || row.Make,
            model: row.model || row.Model,
            year: parseInt(row.year || row.Year),
            deviceType: row.device_type || row.deviceType || row['Device Type'],
            portType: row.port_type || row.portType || row['Port Type']
          };

          const validVehicle = insertVehicleSchema.parse(normalizedRow);
          validVehicles.push(validVehicle);
        } catch (error) {
          errors.push({ row: i + 1, error: error instanceof Error ? error.message : "Validation failed" });
        }
      }

      if (mode === "replace") {
        await storage.deleteAllVehicles();
      }

      const createdVehicles = await storage.createVehicles(validVehicles);

      res.json({
        message: "Import completed",
        imported: createdVehicles.length,
        errors: errors.length,
        errorDetails: errors.slice(0, 10) // Return first 10 errors
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Failed to import vehicles" });
    }
  });

  // Export vehicles
  app.get("/api/vehicles/export", async (req, res) => {
    try {
      const { vehicles } = await storage.searchVehicles({ limit: 100000, offset: 0 });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=vehicles.csv');
      
      // CSV header
      res.write('make,model,year,device_type,port_type\n');
      
      // CSV data
      for (const vehicle of vehicles) {
        res.write(`${vehicle.make},${vehicle.model},${vehicle.year},${vehicle.deviceType},${vehicle.portType}\n`);
      }
      
      res.end();
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export vehicles" });
    }
  });

  // Clear all vehicles
  app.delete("/api/vehicles", async (req, res) => {
    try {
      await storage.deleteAllVehicles();
      res.json({ message: "All vehicles deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ message: "Failed to delete vehicles" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

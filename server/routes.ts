import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, searchVehicleSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

const upload = multer({ storage: multer.memoryStorage() });

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (req.session && req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({ message: "Authentication required" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth endpoint for admin password verification
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      
      if (password === adminPassword) {
        // Regenerate session to prevent session fixation attacks
        req.session.regenerate((err) => {
          if (err) {
            return res.status(500).json({ message: "Session error" });
          }
          req.session.isAuthenticated = true;
          res.json({ success: true });
        });
      } else {
        res.status(401).json({ success: false, message: "Invalid password" });
      }
    } catch (error) {
      res.status(500).json({ message: "Authentication error" });
    }
  });

  // Check authentication status
  app.get("/api/auth/status", async (req, res) => {
    res.json({ isAuthenticated: req.session?.isAuthenticated || false });
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Logout failed" });
      } else {
        res.json({ success: true });
      }
    });
  });

  // Bulk search vehicles
  app.post("/api/vehicles/bulk-search", async (req, res) => {
    try {
      const { queries } = req.body;
      
      if (!Array.isArray(queries) || queries.length === 0) {
        return res.status(400).json({ message: "Invalid queries format" });
      }

      const allVehicles: any[] = [];

      for (const query of queries) {
        try {
          // Validate each query
          const validatedQuery = searchVehicleSchema.parse({
            make: query.make,
            model: query.model,
            year: query.year
          });

          const searchParams = {
            ...validatedQuery,
            limit: 1000,
            offset: 0,
            sortBy: "make",
            sortOrder: "asc" as 'asc' | 'desc'
          };

          const { vehicles } = await storage.searchVehicles(searchParams);
          allVehicles.push(...vehicles);
        } catch (validationError) {
          // Skip invalid queries
          console.warn("Skipping invalid query:", query, validationError);
        }
      }

      // Return consistent response shape
      res.json({
        vehicles: allVehicles,
        total: allVehicles.length
      });
    } catch (error) {
      console.error("Bulk search error:", error);
      res.status(500).json({ message: "Failed to perform bulk search" });
    }
  });

  // Search vehicles
  app.get("/api/vehicles/search", async (req, res) => {
    try {
      const { make, model, year, deviceType, portType, page = "1", limit = "50", sortBy = "make", sortOrder = "asc" } = req.query;
      
      const searchParams = {
        make: make as string,
        model: model as string,
        year: year ? parseInt(year as string) : undefined,
        deviceType: deviceType as string,
        portType: portType as string,
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

  // Get device types
  app.get("/api/vehicles/device-types", async (req, res) => {
    try {
      const deviceTypes = await storage.getDeviceTypes();
      res.json(deviceTypes);
    } catch (error) {
      console.error("Device types error:", error);
      res.status(500).json({ message: "Failed to get device types" });
    }
  });

  // Get port types
  app.get("/api/vehicles/port-types", async (req, res) => {
    try {
      const portTypes = await storage.getPortTypes();
      res.json(portTypes);
    } catch (error) {
      console.error("Port types error:", error);
      res.status(500).json({ message: "Failed to get port types" });
    }
  });

  // Get vehicle by ID
  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const vehicle = await storage.getVehicleById(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(vehicle);
    } catch (error) {
      console.error("Get vehicle error:", error);
      res.status(500).json({ message: "Failed to get vehicle" });
    }
  });

  // Create a new vehicle (protected)
  app.post("/api/vehicles", requireAuth, async (req, res) => {
    try {
      const validatedVehicle = insertVehicleSchema.parse(req.body);
      const createdVehicle = await storage.createVehicle(validatedVehicle);
      res.status(201).json(createdVehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      console.error("Create vehicle error:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  // Update a vehicle (protected)
  app.patch("/api/vehicles/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedVehicle = insertVehicleSchema.partial().parse(req.body);
      const updatedVehicle = await storage.updateVehicle(id, validatedVehicle);
      
      if (!updatedVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(updatedVehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      console.error("Update vehicle error:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  // Delete a vehicle (protected)
  app.delete("/api/vehicles/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const vehicle = await storage.getVehicleById(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      await storage.deleteVehicle(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete vehicle error:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Import vehicles from CSV/JSON (protected)
  app.post("/api/vehicles/import", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { mode = "append" } = req.body;
      let vehicleData: any[] = [];

      // Handle CSV
      if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
        vehicleData = await new Promise<any[]>((resolve, reject) => {
          const results: any[] = [];
          const stream = Readable.from(req.file!.buffer.toString());
          
          stream
            .pipe(csv({
              mapHeaders: ({ header }) => header.trim().toLowerCase()
            }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
        });
      }
      // Handle JSON
      else if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
        vehicleData = JSON.parse(req.file.buffer.toString());
      }
      else {
        return res.status(400).json({ message: "Unsupported file format. Please use CSV or JSON." });
      }

      // Debug: Log first row to see what we're getting
      if (vehicleData.length > 0) {
        console.log("First row keys:", Object.keys(vehicleData[0]));
        console.log("First row data:", vehicleData[0]);
      }

      // Validate and transform data
      const validVehicles = [];
      const errors = [];

      for (let i = 0; i < vehicleData.length; i++) {
        const row = vehicleData[i];
        try {
          // Extract values (keys are already normalized to lowercase by csv parser)
          const make = row.make || row.Make;
          const model = row.model || row.Model;
          const yearStr = row.year || row.Year;
          const deviceType = row.device_type || row.devicetype || row.deviceType || row['device type'];
          const portType = row.port_type || row.porttype || row.portType || row['port type'];
          
          // Parse year
          const year = parseInt(yearStr);
          
          if (!make || !model || isNaN(year) || !deviceType || !portType) {
            throw new Error(`Missing required fields. Found: make=${make}, model=${model}, year=${year}, deviceType=${deviceType}, portType=${portType}`);
          }
          
          // Normalize data
          const normalizedRow = {
            make: make,
            model: model,
            year: year,
            deviceType: deviceType,
            portType: portType
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

  // Export vehicles (with optional filters)
  app.get("/api/vehicles/export", async (req, res) => {
    try {
      const { make, model, year, deviceType, portType } = req.query;
      
      const searchParams = {
        make: make as string,
        model: model as string,
        year: year ? parseInt(year as string) : undefined,
        deviceType: deviceType as string,
        portType: portType as string,
        limit: 100000,
        offset: 0,
        sortBy: "make",
        sortOrder: "asc" as 'asc' | 'desc'
      };
      
      const { vehicles } = await storage.searchVehicles(searchParams);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=vehicles-export.csv');
      
      // CSV header
      res.write('make,model,year,device_type,port_type\n');
      
      // CSV data
      for (const vehicle of vehicles) {
        // Escape values that might contain commas
        const escapeCsv = (val: string | number) => {
          const str = String(val);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        };
        
        res.write(`${escapeCsv(vehicle.make)},${escapeCsv(vehicle.model)},${vehicle.year},${escapeCsv(vehicle.deviceType)},${escapeCsv(vehicle.portType)}\n`);
      }
      
      res.end();
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export vehicles" });
    }
  });

  // Clear all vehicles (protected)
  app.delete("/api/vehicles", requireAuth, async (req, res) => {
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

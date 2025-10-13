import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, searchVehicleSchema, insertHarnessSchema, searchHarnessSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import axios from "axios";

const upload = multer({ storage: multer.memoryStorage() });

// Helper function to search Google for vehicle information
async function searchGoogleForVehicle(make: string, model: string, year: number) {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  
  if (!apiKey || !cx) {
    throw new Error("Google API credentials not configured");
  }

  const query = `${year} ${make} ${model} OBD port type diagnostic connector`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Google search error:", error);
    return null;
  }
}

// Parse Google results to extract vehicle specifications
function parseGoogleResults(searchResults: any, make: string, model: string) {
  if (!searchResults || !searchResults.items || searchResults.items.length === 0) {
    return null;
  }

  // Extract text from search results
  const combinedText = searchResults.items
    .slice(0, 5)
    .map((item: any) => `${item.title} ${item.snippet}`)
    .join(' ')
    .toLowerCase();

  // Common port types to look for
  const portTypes = ['OBD', 'OBD-II', 'OBD2', 'J1939', '16pin', '9pin'];
  let detectedPort = null;

  for (const portType of portTypes) {
    if (combinedText.includes(portType.toLowerCase())) {
      detectedPort = portType === 'OBD-II' || portType === 'OBD2' ? 'OBD' : portType;
      break;
    }
  }

  // Default to OBD if found in results
  if (!detectedPort && combinedText.includes('diagnostic')) {
    detectedPort = 'OBD';
  }

  return {
    portType: detectedPort || 'OBD',
    deviceType: 'DCM97021ZB', // Default device type
    confidence: detectedPort ? 40 : 20, // Low confidence from Google
    source: 'google',
    searchResults: searchResults.items.slice(0, 3).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }))
  };
}

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
        req.session.isAuthenticated = true;
        // Explicitly save session before sending response
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          console.log("Session saved successfully, cookie should be set");
          res.json({ success: true });
        });
      } else {
        res.status(401).json({ success: false, message: "Invalid password" });
      }
    } catch (error) {
      console.error("Authentication error:", error);
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
      const { queries, oneToOne = false } = req.body;
      
      if (!Array.isArray(queries) || queries.length === 0) {
        return res.status(400).json({ message: "Invalid queries format" });
      }

      const allVehicles: any[] = [];

      for (const query of queries) {
        try {
          // Validate and normalize each query
          const validatedQuery = searchVehicleSchema.parse({
            make: normalizeMake(query.make),
            model: query.model,
            year: query.year
          });

          const searchParams = {
            ...validatedQuery,
            limit: oneToOne ? 1 : 1000, // Limit to 1 result in 1-to-1 mode
            offset: 0,
            sortBy: "make",
            sortOrder: "asc" as 'asc' | 'desc'
          };

          const { vehicles } = await storage.searchVehicles(searchParams);
          
          if (oneToOne && vehicles.length > 0) {
            // In 1-to-1 mode, only take the first result
            allVehicles.push(vehicles[0]);
          } else {
            // In all-results mode, add all matches
            allVehicles.push(...vehicles);
          }
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

  // Manufacturer alias mapping for smart search across ALL endpoints
  // Shared utility function used by search, AI prediction, bulk search, etc.
  const normalizeMake = (make: string | undefined): string | undefined => {
    if (!make) return undefined;
    
    const makeUpper = make.toUpperCase().trim();
    
    const aliases: Record<string, string> = {
      'CHEVY': 'CHEVROLET',
      'CHEV': 'CHEVROLET',
      'VW': 'VOLKSWAGEN',
      'BENZ': 'MERCEDES-BENZ',
      'MERCEDES': 'MERCEDES-BENZ',
      'MB': 'MERCEDES-BENZ',
      'BMW': 'BMW',
      'MERC': 'MERCURY',
      'CADDY': 'CADILLAC',
      'CAD': 'CADILLAC',
      'FORD': 'FORD',
      'GMC': 'GMC',
      'DODGE': 'DODGE',
      'RAM': 'RAM',
      'JEEP': 'JEEP',
      'CHRYSLER': 'CHRYSLER',
      'TOYOTA': 'TOYOTA',
      'HONDA': 'HONDA',
      'NISSAN': 'NISSAN',
      'HYUNDAI': 'HYUNDAI',
      'KIA': 'KIA',
      'MAZDA': 'MAZDA',
      'SUBARU': 'SUBARU',
      'MITSUBISHI': 'MITSUBISHI',
      'INFINITI': 'INFINITI',
      'LEXUS': 'LEXUS',
      'ACURA': 'ACURA',
      'BUICK': 'BUICK',
      'PONTIAC': 'PONTIAC',
      'OLDSMOBILE': 'OLDSMOBILE',
      'OLDS': 'OLDSMOBILE',
      'SATURN': 'SATURN',
      'HUMMER': 'HUMMER',
      'LINCOLN': 'LINCOLN',
      'VOLVO': 'VOLVO',
      'SAAB': 'SAAB',
      'AUDI': 'AUDI',
      'PORSCHE': 'PORSCHE',
      'JAGUAR': 'JAGUAR',
      'JAG': 'JAGUAR',
      'LAND ROVER': 'LAND ROVER',
      'ROVER': 'LAND ROVER',
      'MINI': 'MINI',
      'FIAT': 'FIAT',
      'ALFA ROMEO': 'ALFA ROMEO',
      'ALFA': 'ALFA ROMEO',
      'MASERATI': 'MASERATI',
      'FERRARI': 'FERRARI',
      'LAMBORGHINI': 'LAMBORGHINI',
      'LAMBO': 'LAMBORGHINI',
      'BENTLEY': 'BENTLEY',
      'ROLLS ROYCE': 'ROLLS-ROYCE',
      'ROLLS': 'ROLLS-ROYCE',
      'TESLA': 'TESLA',
      'RIVIAN': 'RIVIAN',
      'LUCID': 'LUCID',
      'POLESTAR': 'POLESTAR',
      'GENESIS': 'GENESIS',
      'SCION': 'SCION',
      'ISUZU': 'ISUZU',
      'SUZUKI': 'SUZUKI',
      'DAEWOO': 'DAEWOO',
      'SMART': 'SMART',
      'PETERBILT': 'PETERBILT',
      'KENWORTH': 'KENWORTH',
      'MACK': 'MACK',
      'FREIGHTLINER': 'FREIGHTLINER',
      'INTERNATIONAL': 'INTERNATIONAL',
      'WESTERN STAR': 'WESTERN STAR',
    };
    
    // Return normalized make if alias exists, otherwise return original (title cased)
    if (aliases[makeUpper]) {
      return aliases[makeUpper];
    }
    
    // Title case the original if not found in aliases
    return make.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Search vehicles
  app.get("/api/vehicles/search", async (req, res) => {
    try {
      const { make, model, year, deviceType, portType, page = "1", limit = "50", sortBy = "make", sortOrder = "asc" } = req.query;
      
      const searchParams = {
        make: normalizeMake(make as string),
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

  // ==================== HARNESS ROUTES ====================

  // Search harnesses
  app.get("/api/harnesses/search", async (req, res) => {
    try {
      const { make, model, year, page = "1", limit = "50" } = req.query;
      
      const searchParams = {
        make: make as string,
        model: model as string,
        year: year ? parseInt(year as string) : undefined,
        limit: parseInt(limit as string),
        offset: (parseInt(page as string) - 1) * parseInt(limit as string),
      };
      
      const result = await storage.searchHarnesses(searchParams);
      res.json(result);
    } catch (error) {
      console.error("Harness search error:", error);
      res.status(500).json({ message: "Failed to search harnesses" });
    }
  });

  // Get harness statistics
  app.get("/api/harnesses/stats", async (req, res) => {
    try {
      const stats = await storage.getHarnessStats();
      res.json(stats);
    } catch (error) {
      console.error("Harness stats error:", error);
      res.status(500).json({ message: "Failed to get harness statistics" });
    }
  });

  // Get harness makes
  app.get("/api/harnesses/makes", async (req, res) => {
    try {
      const makes = await storage.getHarnessMakes();
      res.json(makes);
    } catch (error) {
      console.error("Harness makes error:", error);
      res.status(500).json({ message: "Failed to get harness makes" });
    }
  });

  // Get harness models by make
  app.get("/api/harnesses/models/:make", async (req, res) => {
    try {
      const { make } = req.params;
      const models = await storage.getHarnessModelsByMake(make);
      res.json(models);
    } catch (error) {
      console.error("Harness models error:", error);
      res.status(500).json({ message: "Failed to get harness models" });
    }
  });

  // Import harnesses from CSV (protected)
  app.post("/api/harnesses/import", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { mode = "append" } = req.body;
      let harnessData: any[] = [];

      // Handle CSV
      if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
        harnessData = await new Promise<any[]>((resolve, reject) => {
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
        harnessData = JSON.parse(req.file.buffer.toString());
      }
      else {
        return res.status(400).json({ message: "Unsupported file format. Please use CSV or JSON." });
      }

      // Debug: Log first row to see what we're getting
      if (harnessData.length > 0) {
        console.log("First harness row keys:", Object.keys(harnessData[0]));
        console.log("First harness row data:", harnessData[0]);
      }

      // Validate and transform data
      const validHarnesses = [];
      const errors = [];

      for (let i = 0; i < harnessData.length; i++) {
        const row = harnessData[i];
        try {
          // Extract values (keys are already normalized to lowercase by csv parser)
          const make = row.make || row.Make;
          const model = row.model || row.Model;
          const yearFromStr = row.year_from || row.yearfrom || row.yearFrom || row['year from'];
          const yearToStr = row.year_to || row.yearto || row.yearTo || row['year to'];
          const harnessType = row.harness_type || row.harnesstype || row.harnessType || row['harness type'];
          const comments = row.comments || row.Comments || '';
          
          // Parse years
          const yearFrom = parseInt(yearFromStr);
          const yearTo = parseInt(yearToStr);
          
          if (!make || !model || isNaN(yearFrom) || isNaN(yearTo) || !harnessType) {
            throw new Error(`Missing required fields. Found: make=${make}, model=${model}, yearFrom=${yearFrom}, yearTo=${yearTo}, harnessType=${harnessType}`);
          }
          
          // Normalize data
          const normalizedRow = {
            make: make,
            model: model,
            yearFrom: yearFrom,
            yearTo: yearTo,
            harnessType: harnessType,
            comments: comments
          };

          const validHarness = insertHarnessSchema.parse(normalizedRow);
          validHarnesses.push(validHarness);
        } catch (error) {
          errors.push({ row: i + 1, error: error instanceof Error ? error.message : "Validation failed" });
        }
      }

      if (mode === "replace") {
        await storage.deleteAllHarnesses();
      }

      const createdHarnesses = await storage.createHarnesses(validHarnesses);

      res.json({
        message: "Import completed",
        imported: createdHarnesses.length,
        errors: errors.length,
        errorDetails: errors.slice(0, 10) // Return first 10 errors
      });
    } catch (error) {
      console.error("Harness import error:", error);
      res.status(500).json({ message: "Failed to import harnesses" });
    }
  });

  // Update individual harness (protected)
  app.patch("/api/harnesses/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const harnessData = insertHarnessSchema.partial().parse(req.body);
      
      const updatedHarness = await storage.updateHarness(id, harnessData);
      
      if (!updatedHarness) {
        return res.status(404).json({ message: "Harness not found" });
      }
      
      res.json(updatedHarness);
    } catch (error) {
      console.error("Update harness error:", error);
      res.status(500).json({ message: "Failed to update harness" });
    }
  });

  // Delete individual harness (protected)
  app.delete("/api/harnesses/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteHarness(id);
      res.json({ message: "Harness deleted successfully" });
    } catch (error) {
      console.error("Delete harness error:", error);
      res.status(500).json({ message: "Failed to delete harness" });
    }
  });

  // Clear all harnesses (protected)
  app.delete("/api/harnesses", requireAuth, async (req, res) => {
    try {
      await storage.deleteAllHarnesses();
      res.json({ message: "All harnesses deleted successfully" });
    } catch (error) {
      console.error("Delete harness error:", error);
      res.status(500).json({ message: "Failed to delete harnesses" });
    }
  });

  // AI Prediction endpoint - pattern-based suggestions
  app.get("/api/ai/predict", async (req, res) => {
    try {
      const { make, model, year } = req.query;
      
      if (!make || !model || !year) {
        return res.status(400).json({ message: "Make, model, and year are required" });
      }

      const yearNum = parseInt(year as string);
      
      // Normalize the make to handle common aliases (Chevy → Chevrolet, VW → Volkswagen, etc.)
      const normalizedMake = normalizeMake(make as string);

      // First, check if exact vehicle exists
      const exactMatch = await storage.searchVehicles({
        make: normalizedMake,
        model: model as string,
        year: yearNum,
        limit: 1,
        offset: 0,
        sortBy: "year",
        sortOrder: "asc"
      });

      if (exactMatch.vehicles.length > 0) {
        return res.json({
          found: true,
          exactMatch: exactMatch.vehicles[0]
        });
      }

      // No exact match - find similar vehicles for prediction
      // Search for same make+model with all years, then filter to ±5 year window
      const allSimilarVehicles = await storage.searchVehicles({
        make: normalizedMake,
        model: model as string,
        limit: 1000, // Get more to ensure we have enough in the year range
        offset: 0,
        sortBy: "year",
        sortOrder: "desc"
      });

      // Filter to vehicles within ±5 years of requested year
      const yearWindow = 5;
      const nearbyYearVehicles = allSimilarVehicles.vehicles.filter(
        v => Math.abs(v.year - yearNum) <= yearWindow
      );

      if (nearbyYearVehicles.length === 0) {
        // No similar vehicles in year range - try broader manufacturer match
        const allManufacturerVehicles = await storage.searchVehicles({
          make: normalizedMake,
          limit: 1000,
          offset: 0,
          sortBy: "year",
          sortOrder: "desc"
        });

        // Filter manufacturer vehicles to ±10 year window for broader match
        const broaderYearWindow = 10;
        const nearbyManufacturerVehicles = allManufacturerVehicles.vehicles.filter(
          v => Math.abs(v.year - yearNum) <= broaderYearWindow
        );

        if (nearbyManufacturerVehicles.length === 0) {
          // No database matches found - try Google Custom Search
          console.log(`No database matches for ${make} ${model} ${yearNum}, calling Google API...`);
          
          const googleResults = await searchGoogleForVehicle(make as string, model as string, yearNum);
          const parsedResults = parseGoogleResults(googleResults, make as string, model as string);

          if (!parsedResults) {
            return res.json({
              found: false,
              predictions: null
            });
          }

          return res.json({
            found: false,
            predictions: {
              portType: parsedResults.portType,
              portConfidence: parsedResults.confidence,
              deviceType: parsedResults.deviceType,
              deviceConfidence: parsedResults.confidence,
              basedOn: 0,
              source: 'google',
              searchResults: parsedResults.searchResults,
              similarVehicles: []
            }
          });
        }

        // Use nearby manufacturer vehicles for broader prediction
        // TWO-STEP: First predict port type, then device type
        
        // STEP 1: Predict PORT TYPE from manufacturer vehicles
        const portTypeCounts = new Map<string, number>();
        nearbyManufacturerVehicles.forEach(v => {
          portTypeCounts.set(v.portType, (portTypeCounts.get(v.portType) || 0) + 1);
        });

        const mostCommonPort = Array.from(portTypeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
        const portConfidence = (mostCommonPort[1] / nearbyManufacturerVehicles.length) * 100;

        // STEP 2: Filter to vehicles with that port type, then predict DEVICE TYPE
        const vehiclesWithPort = nearbyManufacturerVehicles.filter(v => v.portType === mostCommonPort[0]);
        
        const deviceTypeCounts = new Map<string, number>();
        vehiclesWithPort.forEach(v => {
          deviceTypeCounts.set(v.deviceType, (deviceTypeCounts.get(v.deviceType) || 0) + 1);
        });

        const mostCommonDevice = Array.from(deviceTypeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
        const deviceConfidence = (mostCommonDevice[1] / vehiclesWithPort.length) * 100;

        return res.json({
          found: false,
          predictions: {
            portType: mostCommonPort[0],
            portConfidence: Math.round(portConfidence * 0.6), // Lower confidence for broader match
            deviceType: mostCommonDevice[0],
            deviceConfidence: Math.round(deviceConfidence * 0.6), // Lower confidence for broader match
            basedOn: nearbyManufacturerVehicles.length,
            similarVehicles: nearbyManufacturerVehicles.slice(0, 10)
          }
        });
      }

      // TWO-STEP PREDICTION: First predict port type, then device type
      
      // STEP 1: Predict PORT TYPE from all nearby vehicles
      const portTypeCounts = new Map<string, number>();
      nearbyYearVehicles.forEach(v => {
        portTypeCounts.set(v.portType, (portTypeCounts.get(v.portType) || 0) + 1);
      });

      const mostCommonPort = Array.from(portTypeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      const portConfidence = (mostCommonPort[1] / nearbyYearVehicles.length) * 100;

      // STEP 2: Filter to vehicles with predicted port type, then predict DEVICE TYPE
      const vehiclesWithPort = nearbyYearVehicles.filter(v => v.portType === mostCommonPort[0]);
      
      const deviceTypeCounts = new Map<string, number>();
      vehiclesWithPort.forEach(v => {
        deviceTypeCounts.set(v.deviceType, (deviceTypeCounts.get(v.deviceType) || 0) + 1);
      });

      const mostCommonDevice = Array.from(deviceTypeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      const deviceConfidence = (mostCommonDevice[1] / vehiclesWithPort.length) * 100;

      res.json({
        found: false,
        predictions: {
          portType: mostCommonPort[0],
          portConfidence: Math.round(portConfidence),
          deviceType: mostCommonDevice[0],
          deviceConfidence: Math.round(deviceConfidence),
          basedOn: nearbyYearVehicles.length,
          similarVehicles: nearbyYearVehicles.slice(0, 10)
        }
      });
    } catch (error) {
      console.error("AI prediction error:", error);
      res.status(500).json({ message: "Failed to generate prediction" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

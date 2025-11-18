import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, updateVehicleSchema, searchVehicleSchema, insertHarnessSchema, searchHarnessSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import axios from "axios";
import { predictVehicleSpecs, checkIfHeavyVehicle as geminiCheckHeavyVehicle } from "./gemini";
import { getClientIp, getClientCountry } from "./geolocation";

const upload = multer({ storage: multer.memoryStorage() });

// Helper function to suggest device type based on port type
function suggestDeviceType(portType: string): string {
  const normalizedPortType = portType.toUpperCase().trim();
  
  const portToDeviceMap: Record<string, string> = {
    'OBD': 'DCM97021ZB',
    'HARDWIRED': 'DCM97021ZB1',
    'JBUS 9PIN TYPE 1 T & L': 'DCM97021ZB2',
    'JBUS 9PIN TYPE 2 T & L': 'DCM97021ZB2',
    'JBUS 6PIN': 'DCM97021ZB2',
    'JBUS 16 PIN': 'DCM97021Z4',
    'JBUS 16PIN': 'DCM97021ZB4',
    'JBUS 9PIN TYPE 1 STANDARD': 'DCM97021ZB2',
    'JBUS 9PIN TYPE 1 T': 'DCM9702',
    'JBUS 9PIN TYPE 2': 'DCM97021ZB2',
    '9PIN TYPE 1 STANDARD CABLE': 'DCM97021ZB2',
    'OBD WITH EXTENSION CABLE': 'DCM97021ZB',
    'OBD WITH FLAT CABLES': 'DCM97021ZB',
    'OBD WITH FLAT EXTENSION CABLE': 'DCM97021ZB',
    'OBD WITH OBD EXTENSION CABLE': 'DCM97021ZB',
    'OBD/PORT PICTURE REQUIRED': 'DCM97021ZB',
  };
  
  return portToDeviceMap[normalizedPortType] || '';
}

// Helper function to search Pentaho JBusPortFinder for vehicle information
async function searchPentahoForVehicle(make: string, model: string, year: number) {
  try {
    const baseUrl = "http://pentaho8.azuga.com/pentaho/api/repos/%3Ahome%3Aazuga%3A996-JBusPortFinder.prpt";
    const htmlUrl = `${baseUrl}/generatedContent?userid=azuga&password=azuga&output-target=table/csv`;
    
    const response = await axios.get(htmlUrl);
    const htmlData = response.data;
    
    if (typeof htmlData !== 'string') {
      return null;
    }
    
    // Strip HTML tags and extract text content
    const textContent = htmlData
      .replace(/<[^>]*>/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== '&nbsp;');
    
    // Parse the report structure: Make -> Model -> Year Range -> Port Type
    const entries = [];
    let currentEntry: any = {};
    
    for (const line of textContent) {
      if (line.startsWith('Make:')) {
        // Save previous entry if exists
        if (currentEntry.make) {
          entries.push({...currentEntry});
        }
        currentEntry = { make: line.replace('Make:', '').trim() };
      } else if (line.startsWith('Model:')) {
        currentEntry.model = line.replace('Model:', '').trim();
      } else if (line.startsWith('Year Range:')) {
        currentEntry.yearRange = line.replace('Year Range:', '').trim();
      } else if (line.startsWith('Port Type')) {
        // Next meaningful line will be the port type value
        currentEntry.expectingPortType = true;
      } else if (currentEntry.expectingPortType && line.length > 1 && !line.includes(':')) {
        currentEntry.portType = line.trim();
        currentEntry.expectingPortType = false;
      }
    }
    
    // Add last entry
    if (currentEntry.make) {
      entries.push(currentEntry);
    }
    
    console.log(`Pentaho: Parsed ${entries.length} entries`);
    
    // Search for matching vehicle
    let exactMatch = null;
    let allModelsMatch = null;
    let allHeavyModelMatch = null;
    
    for (const entry of entries) {
      if (!entry.make || !entry.model) continue;
      
      const entryMake = entry.make.toLowerCase();
      const entryModel = entry.model.toLowerCase();
      const searchMake = make.toLowerCase();
      const searchModel = model.toLowerCase();
      
      // Parse year range (e.g., "1996-2002" or "2015")
      let yearFrom = 0, yearTo = 0;
      if (entry.yearRange) {
        const years = entry.yearRange.split('-').map((y: string) => parseInt(y.trim()));
        yearFrom = years[0] || 0;
        yearTo = years[1] || years[0] || 0;
      }
      
      // Check for exact match (make + model + year in range)
      if (entryMake === searchMake && 
          entryModel === searchModel && 
          year >= yearFrom && year <= yearTo) {
        
        exactMatch = {
          portType: entry.portType || 'JBUS',
          deviceType: 'DCM97021ZB',
          confidence: 60,
          source: 'pentaho'
        };
        console.log(`Pentaho: Exact match found for ${make} ${model} ${year}`);
        break;
      }
      
      // Check for "All models"
      if (entryMake === searchMake && 
          (entryModel.includes('all model') || entryModel === 'all')) {
        
        if (!allModelsMatch) {
          allModelsMatch = {
            portType: entry.portType || 'JBUS',
            deviceType: 'DCM97021ZB',
            confidence: 50,
            source: 'pentaho'
          };
          console.log(`Pentaho: Found "All models" entry for ${make}`);
        }
      }
      
      // Check for "All heavy model"
      if (entryMake === searchMake && 
          entryModel.includes('heavy')) {
        
        if (!allHeavyModelMatch) {
          allHeavyModelMatch = {
            portType: entry.portType || 'JBUS',
            deviceType: 'DCM97021ZB',
            confidence: 55,
            source: 'pentaho'
          };
          console.log(`Pentaho: Found "All heavy model" entry for ${make}`);
        }
      }
    }
    
    // Return best match
    if (exactMatch) {
      return exactMatch;
    }
    
    if (allModelsMatch) {
      console.log(`Pentaho: Using "All models" match for ${make}`);
      return allModelsMatch;
    }
    
    if (allHeavyModelMatch) {
      console.log(`Pentaho: Checking if ${make} ${model} is heavy duty...`);
      const isHeavy = await geminiCheckHeavyVehicle(make, model);
      
      if (isHeavy) {
        console.log(`Pentaho: ${make} ${model} confirmed as heavy vehicle`);
        return allHeavyModelMatch;
      } else {
        console.log(`Pentaho: ${make} ${model} is not heavy duty, skipping`);
      }
    }
    
    console.log(`Pentaho: No match found for ${make} ${model} ${year}`);
    return null;
  } catch (error) {
    console.error("Pentaho search error:", error);
    return null;
  }
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
          const normalizedMake = normalizeMake(query.make);
          const normalizedModel = normalizeText(query.model);
          
          console.log(`[BULK SEARCH DEBUG] Original: ${query.make} ${query.model} ${query.year}`);
          console.log(`[BULK SEARCH DEBUG] Normalized: ${normalizedMake} ${normalizedModel} ${query.year}`);
          
          const validatedQuery = searchVehicleSchema.parse({
            make: normalizedMake,
            model: normalizedModel,
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
          console.log(`[BULK SEARCH DEBUG] Found ${vehicles.length} vehicles`);
          
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

      // Log the bulk search
      await storage.logSearch({
        searchType: 'bulk',
        make: null,
        model: null,
        year: null,
        country: getClientCountry(req),
        ipAddress: getClientIp(req),
        resultsCount: allVehicles.length,
        queryDetails: JSON.stringify({ queryCount: queries.length, oneToOne }),
      });

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
      'BENZ': 'MERCEDESBENZ',
      'MERCEDES': 'MERCEDESBENZ',
      'MB': 'MERCEDESBENZ',
      'MERCEDESBENZ': 'MERCEDESBENZ',
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
      'LANDROVER': 'LANDROVER',
      'ROVER': 'LANDROVER',
      'MINI': 'MINI',
      'FIAT': 'FIAT',
      'ALFAROMEO': 'ALFAROMEO',
      'ALFA': 'ALFAROMEO',
      'MASERATI': 'MASERATI',
      'FERRARI': 'FERRARI',
      'LAMBORGHINI': 'LAMBORGHINI',
      'LAMBO': 'LAMBORGHINI',
      'BENTLEY': 'BENTLEY',
      'ROLLSROYCE': 'ROLLSROYCE',
      'ROLLS': 'ROLLSROYCE',
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
      'WESTERNSTAR': 'WESTERNSTAR',
    };
    
    // Remove special characters and spaces from the make (consistent with normalizeText)
    const normalized = makeUpper.replace(/[-,/.\s()[\]&+*]/g, '');
    
    // Return alias if exists, otherwise return normalized make
    return aliases[normalized] || normalized;
  };

  // Normalize text input to uppercase for case-insensitive search
  // Also removes special characters like -, /, , . (), [], &, +, * and spaces for flexible matching
  const normalizeText = (text: string | undefined): string | undefined => {
    if (!text) return undefined;
    // Remove common special characters, spaces, and normalize to uppercase
    return text
      .toUpperCase()
      .trim()
      .replace(/[-,/.\s()[\]&+*]/g, ''); // Remove dashes, commas, slashes, periods, spaces, parentheses, brackets, ampersands, plus, asterisk
  };

  // Search vehicles
  app.get("/api/vehicles/search", async (req, res) => {
    try {
      const { make, model, year, deviceType, portType, page = "1", limit = "50", sortBy = "make", sortOrder = "asc" } = req.query;
      
      const searchParams = {
        make: normalizeMake(make as string),
        model: normalizeText(model as string),
        year: year ? parseInt(year as string) : undefined,
        deviceType: normalizeText(deviceType as string),
        portType: normalizeText(portType as string),
        limit: parseInt(limit as string),
        offset: (parseInt(page as string) - 1) * parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };
      
      const result = await storage.searchVehicles(searchParams);
      
      // Don't log regular database searches in analytics
      // Only log special search types: AI, Bulk, VIN, Geometris
      
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
        make: normalizeMake(make as string),
        model: normalizeText(model as string),
        year: year ? parseInt(year as string) : undefined,
        deviceType: normalizeText(deviceType as string),
        portType: normalizeText(portType as string),
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
      const validatedVehicle = updateVehicleSchema.parse(req.body);
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
          const yearStr = row.year || row.Year || row.year_ran || row['year ran'];
          let deviceType = row.device_type || row.devicetype || row.deviceType || row['device type'] || row.device_;
          const portType = row.port_type || row.porttype || row.portType || row['port type'] || row.port_typ;
          
          // Auto-suggest device type if missing but port type is present
          if (!deviceType && portType) {
            deviceType = suggestDeviceType(portType);
          }
          
          // Parse year - can be single year (2005) or range (1996-2002)
          let yearFrom = null;
          let yearTo = null;
          let year = null;
          
          if (yearStr && typeof yearStr === 'string' && yearStr.includes('-')) {
            // Year range like "1996-2002"
            const parts = yearStr.split('-').map(p => parseInt(p.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              yearFrom = parts[0];
              yearTo = parts[1];
            }
          } else if (yearStr) {
            // Single year
            const parsedYear = parseInt(yearStr);
            if (!isNaN(parsedYear)) {
              year = parsedYear;
              yearFrom = parsedYear;
              yearTo = parsedYear;
            }
          }
          
          if (!make || !model || (!year && !yearFrom && !yearTo) || !deviceType || !portType) {
            throw new Error(`Missing required fields. Found: make=${make}, model=${model}, year=${year || `${yearFrom}-${yearTo}`}, deviceType=${deviceType}, portType=${portType}`);
          }
          
          // Normalize data
          const normalizedRow: any = {
            make: make,
            model: model,
            deviceType: deviceType,
            portType: portType
          };
          
          // Add year fields based on what we parsed
          if (year !== null) {
            normalizedRow.year = year;
          }
          if (yearFrom !== null) {
            normalizedRow.yearFrom = yearFrom;
          }
          if (yearTo !== null) {
            normalizedRow.yearTo = yearTo;
          }

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
      
      // Log the Geometris search
      await storage.logSearch({
        searchType: 'geometris',
        make: make as string || null,
        model: model as string || null,
        year: year ? parseInt(year as string) : null,
        country: getClientCountry(req),
        ipAddress: getClientIp(req),
        resultsCount: result.total,
        queryDetails: null,
      });
      
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
      
      // Log the AI search
      await storage.logSearch({
        searchType: 'ai',
        make: make as string,
        model: model as string,
        year: yearNum,
        country: getClientCountry(req),
        ipAddress: getClientIp(req),
        resultsCount: 0, // Will be 0 or 1 depending on exact match
        queryDetails: null,
      });
      
      // Normalize the make to handle common aliases (Chevy → Chevrolet, VW → Volkswagen, etc.)
      const normalizedMake = normalizeMake(make as string);

      // Make/Model validation: Check if inputs are reasonable
      let makeModelWarning = null;
      
      // Check if make is too short or seems invalid
      if (!normalizedMake || normalizedMake.length < 2) {
        makeModelWarning = `⚠️ The make "${make}" seems invalid. Please enter a valid vehicle manufacturer.`;
      } else {
        // Check if make exists in database
        const makeExists = await storage.searchVehicles({
          make: normalizedMake,
          limit: 1,
          offset: 0,
          sortBy: "year",
          sortOrder: "asc"
        });
        
        if (makeExists.vehicles.length === 0) {
          makeModelWarning = `⚠️ No vehicles found for make "${make}". This manufacturer may not be in our database yet.`;
        }
      }
      
      // Check if model is too short
      if (model && (model as string).length < 2) {
        makeModelWarning = `⚠️ The model "${model}" seems invalid. Please enter a valid vehicle model.`;
      }

      // Normalize model for searching
      const normalizedModel = normalizeText(model as string);

      // Year validation: Check if this make/model exists in database and if year makes sense
      const makeModelExists = await storage.searchVehicles({
        make: normalizedMake,
        model: normalizedModel,
        limit: 1000,
        offset: 0,
        sortBy: "year",
        sortOrder: "asc"
      });

      let yearWarning = null;
      if (makeModelExists.vehicles.length > 0) {
        // Get year range for this make/model, properly handling year ranges
        const minYears: number[] = [];
        const maxYears: number[] = [];
        
        makeModelExists.vehicles.forEach(v => {
          if (v.year !== null && v.year !== undefined) {
            // Single year vehicle
            minYears.push(v.year);
            maxYears.push(v.year);
          } else if (v.yearFrom !== null && v.yearTo !== null) {
            // Year range vehicle
            minYears.push(v.yearFrom);
            maxYears.push(v.yearTo);
          }
        });
        
        const minYear = minYears.length > 0 ? Math.min(...minYears) : yearNum;
        const maxYear = maxYears.length > 0 ? Math.max(...maxYears) : yearNum;
        
        // Check if requested year is way outside the known range
        const yearDiff = yearNum < minYear ? minYear - yearNum : yearNum - maxYear;
        
        if (yearNum < minYear && yearDiff > 5) {
          yearWarning = `⚠️ This vehicle model was first produced in ${minYear}, but you searched for ${yearNum}. This year is likely incorrect.`;
        } else if (yearNum > maxYear && yearDiff > 5) {
          yearWarning = `⚠️ This vehicle model was last produced in ${maxYear}, but you searched for ${yearNum}. This year might be incorrect.`;
        }
      }

      // First, check if exact vehicle exists
      const exactMatch = await storage.searchVehicles({
        make: normalizedMake,
        model: normalizedModel,
        year: yearNum,
        limit: 1,
        offset: 0,
        sortBy: "year",
        sortOrder: "asc"
      });

      if (exactMatch.vehicles.length > 0) {
        const matchedVehicle = exactMatch.vehicles[0];
        const isAllModelsFallback = matchedVehicle.model === 'ALL MODELS';
        
        return res.json({
          found: true,
          exactMatch: matchedVehicle,
          isAllModelsFallback,
          yearWarning,
          makeModelWarning,
          searchPath: [
            { source: isAllModelsFallback ? 'Database (ALL MODELS Fallback)' : 'Database (Exact Match)', checked: true, found: true }
          ]
        });
      }

      // No exact match in database - find similar vehicles for prediction
      // Search for same make+model with all years, then filter to ±5 year window
      const allSimilarVehicles = await storage.searchVehicles({
        make: normalizedMake,
        model: normalizedModel,
        limit: 1000, // Get more to ensure we have enough in the year range
        offset: 0,
        sortBy: "year",
        sortOrder: "desc"
      });

      // Filter to vehicles within ±5 years of requested year
      const yearWindow = 5;
      const nearbyYearVehicles = allSimilarVehicles.vehicles.filter(v => {
        // Check if vehicle matches using either single year or year range
        if (v.year !== null && v.year !== undefined) {
          return Math.abs(v.year - yearNum) <= yearWindow;
        } else if (v.yearFrom !== null && v.yearTo !== null) {
          // Check if either the range overlaps with the window or the requested year is in range
          return (yearNum >= v.yearFrom && yearNum <= v.yearTo) ||
                 (Math.abs(v.yearFrom - yearNum) <= yearWindow) ||
                 (Math.abs(v.yearTo - yearNum) <= yearWindow);
        }
        return false;
      });

      if (nearbyYearVehicles.length === 0) {
        // No similar vehicles in ±5 year range - try broader ±10 year match (same make+model)
        const allSimilarVehiclesBroader = await storage.searchVehicles({
          make: normalizedMake,
          model: normalizedModel,
          limit: 1000,
          offset: 0,
          sortBy: "year",
          sortOrder: "desc"
        });

        // Filter to vehicles within ±10 years of requested year
        const broaderYearWindow = 10;
        const nearbyManufacturerVehicles = allSimilarVehiclesBroader.vehicles.filter(v => {
          // Check if vehicle matches using either single year or year range
          if (v.year !== null && v.year !== undefined) {
            return Math.abs(v.year - yearNum) <= broaderYearWindow;
          } else if (v.yearFrom !== null && v.yearTo !== null) {
            // Check if either the range overlaps with the window or the requested year is in range
            return (yearNum >= v.yearFrom && yearNum <= v.yearTo) ||
                   (Math.abs(v.yearFrom - yearNum) <= broaderYearWindow) ||
                   (Math.abs(v.yearTo - yearNum) <= broaderYearWindow);
          }
          return false;
        });

        if (nearbyManufacturerVehicles.length === 0) {
          // No database matches found - try Tier 3: Gemini AI
          console.log(`No database matches for ${make} ${model} ${yearNum}, calling Gemini AI...`);
          
          const geminiPrediction = await predictVehicleSpecs(make as string, model as string, yearNum);

          if (geminiPrediction) {
            // Log Gemini AI search (Tier 3 - Estimated $0.001-0.01 per request)
            // Using 10 as cost = $0.01 (1 cent) as conservative estimate
            await storage.logAiSearch({
              make: normalizedMake || String(make),
              model: String(model),
              year: yearNum,
              source: 'gemini_api',
              confidence: geminiPrediction.confidence,
              cost: 10 // 10 tenths of a cent = $0.01 (conservative estimate)
            });

            // Store Gemini result as pending vehicle for admin approval
            await storage.createPendingVehicle({
              make: normalizedMake || '',
              model: String(model),
              year: yearNum,
              deviceType: geminiPrediction.deviceType,
              portType: geminiPrediction.portType,
              confidence: geminiPrediction.confidence,
              googleSearchResults: JSON.stringify({ reasoning: geminiPrediction.reasoning }),
              status: 'pending'
            });

            return res.json({
              found: false,
              pendingApproval: true,
              message: 'Prediction submitted for admin approval',
              predictions: {
                portType: geminiPrediction.portType,
                portConfidence: geminiPrediction.confidence,
                deviceType: geminiPrediction.deviceType,
                deviceConfidence: geminiPrediction.confidence,
                basedOn: 0,
                source: 'gemini',
                searchResults: geminiPrediction.reasoning,
                similarVehicles: []
              },
              yearWarning,
              makeModelWarning,
              searchPath: [
                { source: 'Database (Exact Match)', checked: true, found: false },
                { source: 'Database (±5 years)', checked: true, found: false },
                { source: 'Database (±10 years)', checked: true, found: false },
                { source: 'Gemini AI', checked: true, found: true }
              ]
            });
          }

          // Gemini failed - no more prediction sources available
          return res.json({
            found: false,
            predictions: null,
            yearWarning,
            makeModelWarning,
            searchPath: [
              { source: 'Database (Exact Match)', checked: true, found: false },
              { source: 'Database (±5 years)', checked: true, found: false },
              { source: 'Database (±10 years)', checked: true, found: false },
              { source: 'Gemini AI', checked: true, found: false }
            ]
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

        const tier2PortConfidence = Math.round(portConfidence * 0.6);
        const tier2DeviceConfidence = Math.round(deviceConfidence * 0.6);
        const avgConfidence = Math.round((tier2PortConfidence + tier2DeviceConfidence) / 2);

        // Log Tier 2 search (Database - Free)
        await storage.logAiSearch({
          make: normalizedMake || String(make),
          model: String(model),
          year: yearNum,
          source: 'database_tier2',
          confidence: avgConfidence,
          cost: 0 // Database searches are free
        });

        // Save Tier 2 prediction to pending for admin approval
        await storage.createPendingVehicle({
          make: normalizedMake || '',
          model: String(model),
          year: yearNum,
          deviceType: mostCommonDevice[0],
          portType: mostCommonPort[0],
          confidence: avgConfidence,
          googleSearchResults: JSON.stringify({
            source: 'database_tier2',
            similarVehicles: nearbyManufacturerVehicles.slice(0, 10)
          }),
          status: 'pending'
        });

        return res.json({
          found: false,
          pendingApproval: true,
          message: 'Prediction submitted for admin approval',
          predictions: {
            portType: mostCommonPort[0],
            portConfidence: tier2PortConfidence,
            deviceType: mostCommonDevice[0],
            deviceConfidence: tier2DeviceConfidence,
            basedOn: nearbyManufacturerVehicles.length,
            source: 'database_tier2',
            similarVehicles: nearbyManufacturerVehicles.slice(0, 10)
          },
          yearWarning,
          makeModelWarning,
          searchPath: [
            { source: 'Database (Exact Match)', checked: true, found: false },
            { source: 'Database (±5 years)', checked: true, found: false },
            { source: 'Database (±10 years)', checked: true, found: true }
          ]
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

      const tier1PortConfidence = Math.round(portConfidence);
      const tier1DeviceConfidence = Math.round(deviceConfidence);
      const avgConfidence = Math.round((tier1PortConfidence + tier1DeviceConfidence) / 2);

      // Log Tier 1 search (Database - Free)
      await storage.logAiSearch({
        make: normalizedMake || String(make),
        model: String(model),
        year: yearNum,
        source: 'database_tier1',
        confidence: avgConfidence,
        cost: 0 // Database searches are free
      });

      // Save Tier 1 prediction to pending for admin approval
      await storage.createPendingVehicle({
        make: normalizedMake || '',
        model: String(model),
        year: yearNum,
        deviceType: mostCommonDevice[0],
        portType: mostCommonPort[0],
        confidence: avgConfidence,
        googleSearchResults: JSON.stringify({
          source: 'database_tier1',
          similarVehicles: nearbyYearVehicles.slice(0, 10)
        }),
        status: 'pending'
      });

      res.json({
        found: false,
        pendingApproval: true,
        message: 'Prediction submitted for admin approval',
        predictions: {
          portType: mostCommonPort[0],
          portConfidence: tier1PortConfidence,
          deviceType: mostCommonDevice[0],
          deviceConfidence: tier1DeviceConfidence,
          basedOn: nearbyYearVehicles.length,
          source: 'database_tier1',
          similarVehicles: nearbyYearVehicles.slice(0, 10)
        },
        yearWarning,
        makeModelWarning,
        searchPath: [
          { source: 'Database (Exact Match)', checked: true, found: false },
          { source: 'Database (±5 years)', checked: true, found: true }
        ]
      });
    } catch (error) {
      console.error("AI prediction error:", error);
      res.status(500).json({ message: "Failed to generate prediction" });
    }
  });

  // Get billing stats for AI Search
  app.get("/api/billing/stats", async (req, res) => {
    try {
      const stats = await storage.getBillingStats();
      res.json(stats);
    } catch (error) {
      console.error("Billing stats error:", error);
      res.status(500).json({ message: "Failed to get billing stats" });
    }
  });

  // Get comprehensive search analytics
  app.get("/api/analytics/search", async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      
      const from = fromDate ? new Date(fromDate as string) : undefined;
      const to = toDate ? new Date(toDate as string) : undefined;
      
      const analytics = await storage.getSearchAnalytics(from, to);
      res.json(analytics);
    } catch (error) {
      console.error("Search analytics error:", error);
      res.status(500).json({ message: "Failed to get search analytics" });
    }
  });

  // Export search analytics as CSV
  app.get("/api/analytics/export/csv", async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      
      const from = fromDate ? new Date(fromDate as string) : undefined;
      const to = toDate ? new Date(toDate as string) : undefined;
      
      const analytics = await storage.getSearchAnalytics(from, to);
      
      // Build CSV
      const headers = ['Timestamp', 'Search Type', 'Make', 'Model', 'Year', 'Country', 'IP Address', 'Results Count'];
      const rows = analytics.recentLogs.map(log => [
        log.timestamp.toISOString(),
        log.searchType,
        log.make || '',
        log.model || '',
        log.year?.toString() || '',
        log.country || '',
        log.ipAddress || '',
        log.resultsCount.toString()
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=search-analytics.csv');
      res.send(csv);
    } catch (error) {
      console.error("Export CSV error:", error);
      res.status(500).json({ message: "Failed to export analytics" });
    }
  });

  // Export search analytics as JSON
  app.get("/api/analytics/export/json", async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      
      const from = fromDate ? new Date(fromDate as string) : undefined;
      const to = toDate ? new Date(toDate as string) : undefined;
      
      const analytics = await storage.getSearchAnalytics(from, to);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=search-analytics.json');
      res.json(analytics);
    } catch (error) {
      console.error("Export JSON error:", error);
      res.status(500).json({ message: "Failed to export analytics" });
    }
  });

  // Get approval analytics (protected - admin only)
  app.get("/api/analytics/approvals", requireAuth, async (req, res) => {
    try {
      const { status } = req.query;
      const filterStatus = status === 'pending' || status === 'approved' || status === 'rejected' 
        ? status 
        : undefined;
      
      const allPending = await storage.getAllPendingVehicles(filterStatus);
      
      // Calculate stats
      const totalSent = allPending.length;
      const totalApproved = allPending.filter(p => p.status === 'approved').length;
      const totalPending = allPending.filter(p => p.status === 'pending').length;
      const totalRejected = allPending.filter(p => p.status === 'rejected').length;
      
      res.json({
        totalSent,
        totalApproved,
        totalPending,
        totalRejected,
        records: allPending
      });
    } catch (error) {
      console.error("Approval analytics error:", error);
      res.status(500).json({ message: "Failed to get approval analytics" });
    }
  });

  // Get pending vehicles (protected - admin only)
  app.get("/api/pending-vehicles", requireAuth, async (req, res) => {
    try {
      const pending = await storage.getPendingVehicles();
      res.json(pending);
    } catch (error) {
      console.error("Get pending vehicles error:", error);
      res.status(500).json({ message: "Failed to get pending vehicles" });
    }
  });

  // Approve pending vehicle (protected - admin only)
  app.post("/api/pending-vehicles/:id/approve", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.approvePendingVehicle(id);
      res.json({ message: "Vehicle approved and added to database" });
    } catch (error) {
      console.error("Approve pending vehicle error:", error);
      res.status(500).json({ message: "Failed to approve vehicle" });
    }
  });

  // Reject pending vehicle (protected - admin only)
  app.post("/api/pending-vehicles/:id/reject", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.rejectPendingVehicle(id);
      res.json({ message: "Vehicle rejected" });
    } catch (error) {
      console.error("Reject pending vehicle error:", error);
      res.status(500).json({ message: "Failed to reject vehicle" });
    }
  });

  // Delete pending vehicle (protected - admin only)
  app.delete("/api/pending-vehicles/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePendingVehicle(id);
      res.json({ message: "Pending vehicle deleted" });
    } catch (error) {
      console.error("Delete pending vehicle error:", error);
      res.status(500).json({ message: "Failed to delete pending vehicle" });
    }
  });

  // Import from Pentaho JBusPortFinder report (protected - admin only)
  app.post("/api/import/pentaho", requireAuth, async (req, res) => {
    try {
      // Try different output formats - Pentaho supports multiple export formats
      const baseUrl = "http://pentaho8.azuga.com/pentaho/api/repos/%3Ahome%3Aazuga%3A996-JBusPortFinder.prpt";
      
      // First try to get CSV output (append output-target=table/csv)
      const csvUrl = `${baseUrl}/generatedContent?userid=azuga&password=azuga&output-target=table/csv`;
      
      let response;
      let responseData;
      
      try {
        response = await axios.get(csvUrl, {
          headers: {
            'Accept': 'text/csv, application/json, text/plain, */*'
          }
        });
        responseData = response.data;
      } catch (csvError) {
        // If CSV fails, try the viewer endpoint
        response = await axios.get(`${baseUrl}/viewer?userid=azuga&password=azuga`, {
          headers: {
            'Accept': 'text/html, application/json, */*'
          }
        });
        responseData = response.data;
      }

      let importedCount = 0;
      let skippedCount = 0;
      let format = 'unknown';
      
      // Check if it's CSV
      if (typeof responseData === 'string' && (responseData.includes(',') || responseData.includes('\n'))) {
        format = 'csv';
        const lines = responseData.split('\n').filter(line => line.trim());
        
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          // Find column indices
          const makeIdx = headers.findIndex(h => h.includes('make'));
          const modelIdx = headers.findIndex(h => h.includes('model'));
          const yearIdx = headers.findIndex(h => h.includes('year'));
          const deviceIdx = headers.findIndex(h => h.includes('device'));
          const portIdx = headers.findIndex(h => h.includes('port'));
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            const make = makeIdx >= 0 ? normalizeText(values[makeIdx] || '') : '';
            const model = modelIdx >= 0 ? normalizeText(values[modelIdx] || '') : '';
            const year = yearIdx >= 0 ? parseInt(values[yearIdx]) || 0 : 0;
            const deviceType = deviceIdx >= 0 ? normalizeText(values[deviceIdx] || '') : '';
            const portType = portIdx >= 0 ? normalizeText(values[portIdx] || '') : '';
            
            if (!make || !model || !year || !deviceType || !portType) {
              skippedCount++;
              continue;
            }
            
            const existing = await storage.searchVehicles({ make, model, year });
            
            if (existing.vehicles.length === 0) {
              await storage.createVehicle({ make, model, year, deviceType, portType });
              importedCount++;
            } else {
              skippedCount++;
            }
          }
        }
      }
      
      res.json({ 
        message: `Pentaho import completed (${format} format)`,
        imported: importedCount,
        skipped: skippedCount,
        format,
        previewData: typeof responseData === 'string' ? responseData.substring(0, 500) : 'Binary or complex data'
      });
    } catch (error: any) {
      console.error("Pentaho import error:", error);
      res.status(500).json({ 
        message: "Failed to import from Pentaho",
        error: error.message,
        hint: "The Pentaho report may require different authentication or output format parameters"
      });
    }
  });

  // VIN Decoder endpoint
  app.post("/api/vin/decode", async (req, res) => {
    try {
      const { vins } = req.body;
      
      if (!Array.isArray(vins) || vins.length === 0) {
        return res.status(400).json({ message: "Please provide an array of VINs" });
      }

      if (vins.length > 50) {
        return res.status(400).json({ message: "Maximum 50 VINs per request" });
      }

      // Log the VIN decode search
      await storage.logSearch({
        searchType: 'vin',
        make: null,
        model: null,
        year: null,
        country: getClientCountry(req),
        ipAddress: getClientIp(req),
        resultsCount: 0, // Will be updated after processing
        queryDetails: JSON.stringify({ vinCount: vins.length }),
      });

      const results = [];

      for (const vin of vins) {
        const cleanVin = vin.trim().toUpperCase();
        
        // Validate VIN format (17 characters, alphanumeric except I, O, Q)
        if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) {
          results.push({
            vin: cleanVin,
            success: false,
            error: "Invalid VIN format"
          });
          continue;
        }

        try {
          // Call NHTSA API to decode VIN
          const nhtsaResponse = await axios.get(
            `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${cleanVin}?format=json`,
            { timeout: 10000 }
          );

          const decodedData = nhtsaResponse.data?.Results;
          
          if (!decodedData || !Array.isArray(decodedData)) {
            results.push({
              vin: cleanVin,
              success: false,
              error: "Failed to decode VIN"
            });
            continue;
          }

          // Extract make, model, year from NHTSA response
          const makeData = decodedData.find((item: any) => item.Variable === "Make");
          const modelData = decodedData.find((item: any) => item.Variable === "Model");
          const yearData = decodedData.find((item: any) => item.Variable === "Model Year");

          const make = makeData?.Value?.trim();
          const model = modelData?.Value?.trim();
          const yearStr = yearData?.Value?.trim();
          const year = yearStr ? parseInt(yearStr) : null;

          if (!make || !model || !year) {
            results.push({
              vin: cleanVin,
              success: false,
              error: "Incomplete vehicle data from NHTSA"
            });
            continue;
          }

          // Now run AI prediction for this vehicle
          const normalizedMake = normalizeText(make);
          const normalizedModel = normalizeText(model);

          // First try exact match
          const exactMatch = await storage.searchVehicles({
            make: normalizedMake,
            model: normalizedModel,
            year: year,
            limit: 1,
            offset: 0,
            sortBy: "year",
            sortOrder: "asc"
          });

          if (exactMatch.vehicles.length > 0) {
            const vehicle = exactMatch.vehicles[0];
            results.push({
              vin: cleanVin,
              success: true,
              make,
              model,
              year,
              portType: vehicle.portType,
              deviceType: vehicle.deviceType,
              confidence: 100,
              source: "Database (Exact Match)"
            });
            continue;
          }

          // Try ±5 year match
          const similarVehicles = await storage.searchVehicles({
            make: normalizedMake,
            model: normalizedModel,
            limit: 1000,
            offset: 0,
            sortBy: "year",
            sortOrder: "desc"
          });

          const nearbyVehicles = similarVehicles.vehicles.filter(v => {
            if (v.year !== null && v.year !== undefined) {
              return Math.abs(v.year - year) <= 5;
            } else if (v.yearFrom !== null && v.yearTo !== null) {
              return (year >= v.yearFrom && year <= v.yearTo) ||
                     (Math.abs(v.yearFrom - year) <= 5) ||
                     (Math.abs(v.yearTo - year) <= 5);
            }
            return false;
          });

          if (nearbyVehicles.length > 0) {
            // Use two-step prediction (Tier 1)
            const portTypeCounts = new Map<string, number>();
            nearbyVehicles.forEach(v => {
              portTypeCounts.set(v.portType, (portTypeCounts.get(v.portType) || 0) + 1);
            });

            const mostCommonPort = Array.from(portTypeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
            const portConfidence = (mostCommonPort[1] / nearbyVehicles.length) * 100;

            const vehiclesWithPort = nearbyVehicles.filter(v => v.portType === mostCommonPort[0]);
            const deviceTypeCounts = new Map<string, number>();
            vehiclesWithPort.forEach(v => {
              deviceTypeCounts.set(v.deviceType, (deviceTypeCounts.get(v.deviceType) || 0) + 1);
            });

            const mostCommonDevice = Array.from(deviceTypeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
            const deviceConfidence = (mostCommonDevice[1] / vehiclesWithPort.length) * 100;
            
            // Tier 1: Full confidence (±5 years) - matches AI Search
            const tier1PortConfidence = Math.round(portConfidence);
            const tier1DeviceConfidence = Math.round(deviceConfidence);
            const avgConfidence = Math.round((tier1PortConfidence + tier1DeviceConfidence) / 2);

            // Log Tier 1 search (Database - Free)
            await storage.logAiSearch({
              make: normalizedMake || make,
              model: model,
              year: year,
              source: 'database_tier1',
              confidence: avgConfidence,
              cost: 0 // Database searches are free
            });

            // Save Tier 1 prediction to pending for admin approval
            await storage.createPendingVehicle({
              make: normalizedMake || make,
              model: model,
              year: year,
              deviceType: mostCommonDevice[0],
              portType: mostCommonPort[0],
              confidence: avgConfidence,
              googleSearchResults: JSON.stringify({
                source: 'vin_database_tier1',
                vin: cleanVin,
                similarVehicles: nearbyVehicles.slice(0, 10)
              }),
              status: 'pending'
            });

            results.push({
              vin: cleanVin,
              success: true,
              make,
              model,
              year,
              portType: mostCommonPort[0],
              deviceType: mostCommonDevice[0],
              confidence: avgConfidence,
              source: `Database (±5 years, ${nearbyVehicles.length} similar vehicles) - Pending Approval`
            });
            continue;
          }

          // Try ±10 year match
          const broaderVehicles = similarVehicles.vehicles.filter(v => {
            if (v.year !== null && v.year !== undefined) {
              return Math.abs(v.year - year) <= 10;
            } else if (v.yearFrom !== null && v.yearTo !== null) {
              return (year >= v.yearFrom && year <= v.yearTo) ||
                     (Math.abs(v.yearFrom - year) <= 10) ||
                     (Math.abs(v.yearTo - year) <= 10);
            }
            return false;
          });

          if (broaderVehicles.length > 0) {
            const portTypeCounts = new Map<string, number>();
            broaderVehicles.forEach(v => {
              portTypeCounts.set(v.portType, (portTypeCounts.get(v.portType) || 0) + 1);
            });

            const mostCommonPort = Array.from(portTypeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
            const portConfidence = (mostCommonPort[1] / broaderVehicles.length) * 100;

            const vehiclesWithPort = broaderVehicles.filter(v => v.portType === mostCommonPort[0]);
            const deviceTypeCounts = new Map<string, number>();
            vehiclesWithPort.forEach(v => {
              deviceTypeCounts.set(v.deviceType, (deviceTypeCounts.get(v.deviceType) || 0) + 1);
            });

            const mostCommonDevice = Array.from(deviceTypeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
            const deviceConfidence = (mostCommonDevice[1] / vehiclesWithPort.length) * 100;
            
            // Tier 2: Reduced confidence (±10 years) - matches AI Search
            const tier2PortConfidence = Math.round(portConfidence * 0.6);
            const tier2DeviceConfidence = Math.round(deviceConfidence * 0.6);
            const avgConfidence = Math.round((tier2PortConfidence + tier2DeviceConfidence) / 2);

            // Log Tier 2 search (Database - Free)
            await storage.logAiSearch({
              make: normalizedMake || make,
              model: model,
              year: year,
              source: 'database_tier2',
              confidence: avgConfidence,
              cost: 0 // Database searches are free
            });

            // Save Tier 2 prediction to pending for admin approval
            await storage.createPendingVehicle({
              make: normalizedMake || make,
              model: model,
              year: year,
              deviceType: mostCommonDevice[0],
              portType: mostCommonPort[0],
              confidence: avgConfidence,
              googleSearchResults: JSON.stringify({
                source: 'vin_database_tier2',
                vin: cleanVin,
                similarVehicles: broaderVehicles.slice(0, 10)
              }),
              status: 'pending'
            });

            results.push({
              vin: cleanVin,
              success: true,
              make,
              model,
              year,
              portType: mostCommonPort[0],
              deviceType: mostCommonDevice[0],
              confidence: avgConfidence,
              source: `Database (±10 years, ${broaderVehicles.length} similar vehicles) - Pending Approval`
            });
            continue;
          }

          // No database match - use Gemini AI
          try {
            const geminiPrediction = await predictVehicleSpecs(make, model, year);
            
            if (geminiPrediction) {
              // Log Gemini AI search (Tier 3 - Estimated $0.01 per request)
              await storage.logAiSearch({
                make: normalizedMake || make,
                model: model,
                year: year,
                source: 'gemini_api',
                confidence: geminiPrediction.confidence,
                cost: 10 // 10 tenths of a cent = $0.01 (conservative estimate)
              });

              // Save Gemini result to pending for admin approval
              await storage.createPendingVehicle({
                make: normalizedMake || make,
                model: model,
                year: year,
                deviceType: geminiPrediction.deviceType,
                portType: geminiPrediction.portType,
                confidence: geminiPrediction.confidence,
                googleSearchResults: JSON.stringify({ 
                  source: 'vin_gemini',
                  vin: cleanVin,
                  reasoning: geminiPrediction.reasoning 
                }),
                status: 'pending'
              });

              results.push({
                vin: cleanVin,
                success: true,
                make,
                model,
                year,
                portType: geminiPrediction.portType,
                deviceType: geminiPrediction.deviceType,
                confidence: geminiPrediction.confidence,
                source: "Gemini AI - Pending Approval"
              });
            } else {
              results.push({
                vin: cleanVin,
                success: true,
                make,
                model,
                year,
                portType: "Unknown",
                deviceType: "Unknown",
                confidence: 0,
                source: "No prediction available"
              });
            }
          } catch (geminiError) {
            console.error("Gemini prediction error for VIN:", cleanVin, geminiError);
            results.push({
              vin: cleanVin,
              success: true,
              make,
              model,
              year,
              portType: "Unknown",
              deviceType: "Unknown",
              confidence: 0,
              source: "Prediction failed"
            });
          }

        } catch (error: any) {
          console.error(`VIN decode error for ${cleanVin}:`, error.message);
          results.push({
            vin: cleanVin,
            success: false,
            error: error.message || "Failed to decode VIN"
          });
        }
      }

      res.json({ results });
    } catch (error: any) {
      console.error("VIN decode endpoint error:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

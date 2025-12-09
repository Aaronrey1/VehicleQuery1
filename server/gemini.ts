import { GoogleGenAI } from "@google/genai";

// This is using Replit's AI Integrations service
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

export interface VehiclePrediction {
  portType: string;
  deviceType: string;
  confidence: number;
  reasoning: string;
}

export interface DebugPrediction extends VehiclePrediction {
  rawResponse: string;
  prompt: string;
  timestamp: string;
}

/**
 * Use Gemini AI to predict vehicle port type and device type
 * Much more accurate than Google Custom Search web scraping
 */
// Build the standard prompt for vehicle prediction
function buildPredictionPrompt(year: number, make: string, model: string): string {
  return `You are an expert automotive diagnostic technician specializing in OBD and J-Bus diagnostic ports for fleet telematics devices.

Vehicle: ${year} ${make} ${model}

Task: Determine the EXACT diagnostic port type for this specific vehicle. Be very specific and accurate.

Port Type Options (choose the MOST SPECIFIC one that applies):
- OBD (standard OBD-II port, 16-pin trapezoid connector - most passenger vehicles 1996+)
- OBD WITH EXTENSION CABLE (OBD port but needs extension for access)
- HARDWIRED (no standard diagnostic port, requires direct wiring to vehicle ECU)
- JBUS 6PIN (6-pin Deutsch connector, common on some medium-duty trucks)
- JBUS 9PIN TYPE 1 STANDARD (9-pin Deutsch connector, standard J1939 pinout)
- JBUS 9PIN TYPE 1 T & L (9-pin Type 1 with T-harness and L-harness capability)
- JBUS 9PIN TYPE 2 T & L (9-pin Type 2 variant with different pinout)
- JBUS 16 PIN (16-pin heavy-duty connector, common on newer Class 8 trucks)

Device Type Options (based on port type):
- DCM97021ZB (for OBD and OBD WITH EXTENSION CABLE)
- DCM97021ZB1 (for HARDWIRED installations)
- DCM97021ZB2 (for JBUS 6PIN and most 9PIN variants)
- DCM97021ZB4 (for JBUS 16PIN)

Important Guidelines:
1. Light-duty passenger vehicles (Class 1-3: cars, SUVs, pickups under 14,000 lbs GVWR) = OBD
2. Medium-duty trucks (Class 4-6: ISUZU NPR, Ford F-650, Hino) = Usually JBUS 6PIN or 9PIN
3. Heavy-duty trucks (Class 7-8: Freightliner, Peterbilt, Kenworth, Volvo VNL) = Usually JBUS 9PIN or 16PIN
4. Pre-1996 vehicles or specialty vehicles = May require HARDWIRED
5. For commercial trucks, consider the specific chassis and engine manufacturer

CRITICAL: For trucks like ISUZU NPR, NPR-HD, NQR, NRR - these are medium-duty commercial trucks that typically use J-Bus connectors, NOT standard OBD.

Respond in this EXACT JSON format (no markdown, just raw JSON):
{
  "portType": "JBUS 9PIN TYPE 1 STANDARD",
  "deviceType": "DCM97021ZB2",
  "confidence": 85,
  "reasoning": "Detailed explanation of why this port type was selected based on vehicle class, manufacturer specifications, and typical fleet telematics setup"
}`;
}

export async function predictVehicleSpecs(
  make: string,
  model: string,
  year: number
): Promise<VehiclePrediction | null> {
  try {
    const prompt = buildPredictionPrompt(year, make, model);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) {
      console.error("Gemini returned empty response");
      return null;
    }

    // Parse the JSON response
    const parsed = JSON.parse(text);
    
    // Validate the response structure
    if (!parsed.portType || !parsed.deviceType || typeof parsed.confidence !== 'number') {
      console.error("Gemini response missing required fields:", parsed);
      return null;
    }

    const result = {
      portType: parsed.portType.toUpperCase(),
      deviceType: parsed.deviceType.toUpperCase(),
      confidence: Math.min(100, Math.max(0, parsed.confidence)), // Clamp 0-100
      reasoning: parsed.reasoning || 'No reasoning provided'
    };
    
    console.log(`[Gemini Prediction] ${year} ${make} ${model} => Port: ${result.portType}, Device: ${result.deviceType}, Confidence: ${result.confidence}%`);
    console.log(`[Gemini Reasoning] ${result.reasoning}`);
    
    return result;

  } catch (error) {
    console.error("Gemini prediction error:", error);
    return null;
  }
}

/**
 * Debug version of prediction that returns full details including raw response and prompt
 */
export async function predictVehicleSpecsDebug(
  make: string,
  model: string,
  year: number
): Promise<DebugPrediction | null> {
  const prompt = buildPredictionPrompt(year, make, model);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    
    if (!text) {
      console.error("Gemini returned empty response");
      return null;
    }

    // Parse the JSON response
    const parsed = JSON.parse(text);
    
    return {
      portType: parsed.portType?.toUpperCase() || "UNKNOWN",
      deviceType: parsed.deviceType?.toUpperCase() || "UNKNOWN",
      confidence: Math.min(100, Math.max(0, parsed.confidence || 0)),
      reasoning: parsed.reasoning || 'No reasoning provided',
      rawResponse: text,
      prompt: prompt,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error("Gemini debug prediction error:", error);
    return {
      portType: "ERROR",
      deviceType: "ERROR",
      confidence: 0,
      reasoning: `Error: ${error.message}`,
      rawResponse: error.message,
      prompt: prompt,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check if a vehicle is heavy duty using Gemini's knowledge
 */
export async function checkIfHeavyVehicle(make: string, model: string): Promise<boolean> {
  try {
    const prompt = `Is the ${make} ${model} a heavy-duty commercial vehicle, medium/heavy truck, or commercial truck? 
    
Answer with just TRUE or FALSE.

Consider:
- Weight class (Class 4-8 trucks are heavy duty)
- Typical use (commercial hauling, construction, etc.)
- GVWR (over 14,000 lbs is typically heavy duty)

Examples of heavy duty: Ford F-350, RAM 3500, Freightliner Cascadia, International ProStar
Examples of NOT heavy duty: Ford F-150, Toyota Camry, Honda Civic, Chevrolet Silverado 1500`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const text = response.text?.trim().toUpperCase();
    return text === 'TRUE';

  } catch (error) {
    console.error("Gemini heavy vehicle check error:", error);
    return false;
  }
}

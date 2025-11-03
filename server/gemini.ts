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

/**
 * Use Gemini AI to predict vehicle port type and device type
 * Much more accurate than Google Custom Search web scraping
 */
export async function predictVehicleSpecs(
  make: string,
  model: string,
  year: number
): Promise<VehiclePrediction | null> {
  try {
    const prompt = `You are an expert automotive diagnostic technician specializing in OBD and J-Bus diagnostic ports.

Vehicle: ${year} ${make} ${model}

Task: Determine the diagnostic port type for this vehicle. Be specific and accurate.

Port Type Options (choose ONE):
- OBD (standard OBD-II port, most common in passenger vehicles)
- HARDWIRED (no standard port, requires hardwiring)
- JBUS 6PIN
- JBUS 9PIN TYPE 1 STANDARD
- JBUS 9PIN TYPE 1 T & L
- JBUS 9PIN TYPE 2 T & L
- JBUS 16 PIN

Device Type Options (based on port type):
- DCM97021ZB (for OBD ports)
- DCM97021ZB1 (for HARDWIRED)
- DCM97021ZB2 (for most JBUS 6PIN and 9PIN variants)
- DCM97021ZB4 (for JBUS 16PIN)

Guidelines:
1. Light-duty passenger vehicles (cars, SUVs, light trucks) typically use OBD
2. Heavy-duty commercial vehicles, medium/heavy trucks typically use JBUS variants
3. Very old vehicles (pre-1996) may require HARDWIRED
4. Consider the vehicle's class, weight rating, and typical use case

Respond in this EXACT JSON format (no markdown, just raw JSON):
{
  "portType": "OBD",
  "deviceType": "DCM97021ZB",
  "confidence": 85,
  "reasoning": "This is a light-duty passenger vehicle manufactured after 1996, so it uses standard OBD-II diagnostic port"
}`;

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

    return {
      portType: parsed.portType.toUpperCase(),
      deviceType: parsed.deviceType.toUpperCase(),
      confidence: Math.min(100, Math.max(0, parsed.confidence)), // Clamp 0-100
      reasoning: parsed.reasoning || 'No reasoning provided'
    };

  } catch (error) {
    console.error("Gemini prediction error:", error);
    return null;
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

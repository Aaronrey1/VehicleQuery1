import axios from 'axios';

interface VecoCompatibilityResult {
  found: boolean;
  isOBDII: boolean;
  compatibleText?: string;
  compatibleCode?: number;
  deviceGeneration?: string;
  error?: string;
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getVecoToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const username = process.env.VECO_USERNAME;
  const password = process.env.VECO_PASSWORD;

  if (!username || !password) {
    throw new Error('VECO credentials not configured');
  }

  try {
    const response = await axios.post('https://veco.danlawinc.com/api/Auth/login', {
      username,
      password
    });

    if (response.data && response.data.jwt) {
      const token = response.data.jwt as string;
      cachedToken = token;
      // Cache token for 1 hour
      tokenExpiry = Date.now() + (60 * 60 * 1000);
      return token;
    }

    throw new Error('No JWT token in login response');
  } catch (error) {
    console.error('VECO login error:', error);
    throw new Error('Failed to authenticate with VECO');
  }
}

export async function checkVecoCompatibility(
  make: string,
  model: string,
  year: number
): Promise<VecoCompatibilityResult> {
  try {
    const token = await getVecoToken();

    // Try the /vehicle/find endpoint
    const url = `https://veco.danlawinc.com/api/vehicle/find/${encodeURIComponent(make)}/${encodeURIComponent(model)}/${year}`;
    
    const response = await axios.get(url, {
      headers: {
        'token': token,
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      const vehicleData = response.data[0];
      
      // Parse compatibility from VECO response
      // VECO typically returns compatibility information in the vehicle data
      const isCompatible = vehicleData.isCompatible !== false;
      
      return {
        found: true,
        isOBDII: isCompatible,
        compatibleText: vehicleData.compatibleText || (isCompatible ? 'Compatible' : 'Not Compatible'),
        compatibleCode: vehicleData.compatibleCode
      };
    }

    // If no data returned, vehicle not found in VECO
    return {
      found: false,
      isOBDII: false,
      error: 'Vehicle not found in VECO database'
    };

  } catch (error) {
    // Handle specific error cases
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403 || error.response?.data?.message === 'Forbidden') {
        // API access forbidden - account doesn't have API permissions
        return {
          found: false,
          isOBDII: false,
          error: 'VECO API access not available (requires API subscription)'
        };
      }
      
      if (error.response?.status === 404) {
        return {
          found: false,
          isOBDII: false,
          error: 'Vehicle not found in VECO database'
        };
      }
    }

    console.error('VECO compatibility check error:', error);
    return {
      found: false,
      isOBDII: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// For testing/debugging
export async function testVecoConnection(): Promise<boolean> {
  try {
    const token = await getVecoToken();
    return !!token;
  } catch (error) {
    console.error('VECO connection test failed:', error);
    return false;
  }
}

// Vehicle image fetching using Google Custom Search API

const GOOGLE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

// Cache for vehicle images to avoid repeated API calls
const imageCache = new Map<string, string>();

/**
 * Search Google Images for a specific vehicle and return the first result
 */
export async function searchVehicleImage(year: number | string, make: string, model: string): Promise<string | null> {
  const cacheKey = `${year}-${make}-${model}`.toUpperCase();
  
  // Check cache first
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey) || null;
  }
  
  if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.log('[Image Search] Google API keys not configured');
    return null;
  }
  
  try {
    // Search for official/press photos, exclude dealer ads
    const searchQuery = `${year} ${make} ${model} official press photo -dealer -price -sale`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=5&safe=active&imgSize=large&imgType=photo`;
    
    console.log(`[Image Search] Searching for: ${searchQuery}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[Image Search] API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      // Filter out low-quality results (dealer ads, small images, etc.)
      const validImages = data.items.filter((item: any) => {
        const url = item.link.toLowerCase();
        const title = (item.title || '').toLowerCase();
        
        // Skip dealer/ad images
        if (url.includes('dealer') || url.includes('inventory') || url.includes('listing')) return false;
        if (title.includes('for sale') || title.includes('price') || title.includes('dealer')) return false;
        
        // Prefer larger images
        if (item.image && item.image.width < 300) return false;
        
        return true;
      });
      
      // Use first valid image, or fall back to first result
      const selectedImage = validImages.length > 0 ? validImages[0] : data.items[0];
      const imageUrl = selectedImage.link;
      
      console.log(`[Image Search] Found image: ${imageUrl}`);
      
      // Cache the result
      imageCache.set(cacheKey, imageUrl);
      
      return imageUrl;
    }
    
    console.log('[Image Search] No images found');
    return null;
  } catch (error) {
    console.error('[Image Search] Error:', error);
    return null;
  }
}

/**
 * Get vehicle image - tries Google search first, falls back to generic
 */
export async function getVehicleImageAsync(year: number | string, make: string, model: string): Promise<string | null> {
  // Try Google Image Search
  const googleImage = await searchVehicleImage(year, make, model);
  if (googleImage) {
    return googleImage;
  }
  
  // No fallback - return null if no image found
  return null;
}

// Legacy synchronous function - returns null (use async version instead)
export function getVehicleImage(make: string): string | null {
  return null;
}

// Legacy function - no longer used
export function getPortTypeImage(portType: string): string | null {
  return null;
}

// Legacy function - no longer used
export function getPredictionImages(make: string, portType: string): { vehicleImageUrl: string | null; portImageUrl: string | null } {
  return {
    vehicleImageUrl: null,
    portImageUrl: null
  };
}

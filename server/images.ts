// Port type image mappings - static URLs for each port type
// These are placeholder URLs that can be replaced with actual hosted images

const PORT_TYPE_IMAGES: Record<string, string> = {
  'OBD': '/assets/stock_images/car_vehicle_obd2_16-_80f77f06.jpg',
  'OBD WITH EXTENSION CABLE': '/assets/stock_images/car_vehicle_obd2_16-_7b864454.jpg',
  'OBD WITH FLAT CABLES': '/assets/stock_images/car_vehicle_obd2_16-_9ae1bcf2.jpg',
  'OBD WITH FLAT EXTENSION CABLE': '/assets/stock_images/car_vehicle_obd2_16-_5b2e963f.jpg',
  'OBD WITH OBD EXTENSION CABLE': '/assets/stock_images/car_vehicle_obd2_16-_3d85096d.jpg',
  'OBD/PORT PICTURE REQUIRED': '/assets/stock_images/car_vehicle_obd2_16-_80f77f06.jpg',
  'HARDWIRED': 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&h=300&fit=crop',
  'JBUS 6PIN': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
  'JBUS 9PIN TYPE 1 STANDARD': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
  'JBUS 9PIN TYPE 1 T & L': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
  'JBUS 9PIN TYPE 2 T & L': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
  'JBUS 9PIN TYPE 1 T': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
  'JBUS 9PIN TYPE 2': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
  '9PIN TYPE 1 STANDARD CABLE': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
  'JBUS 16 PIN': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
  'JBUS 16PIN': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
};

// Default port image if type not found
const DEFAULT_PORT_IMAGE = '/assets/stock_images/car_vehicle_obd2_16-_80f77f06.jpg';

// Vehicle type image mappings based on common vehicle categories
const VEHICLE_CATEGORY_IMAGES: Record<string, string> = {
  // Heavy duty trucks
  'FREIGHTLINER': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop',
  'PETERBILT': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop',
  'KENWORTH': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop',
  'MACK': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop',
  'VOLVO': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop',
  'INTERNATIONAL': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop',
  'WESTERN STAR': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=300&fit=crop',
  
  // Medium duty trucks
  'ISUZU': 'https://images.unsplash.com/photo-1566933293069-b55c7f326dd4?w=400&h=300&fit=crop',
  'HINO': 'https://images.unsplash.com/photo-1566933293069-b55c7f326dd4?w=400&h=300&fit=crop',
  'FUSO': 'https://images.unsplash.com/photo-1566933293069-b55c7f326dd4?w=400&h=300&fit=crop',
  
  // Pickup trucks
  'FORD': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop',
  'CHEVROLET': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop',
  'GMC': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop',
  'RAM': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop',
  'DODGE': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop',
  'TOYOTA': 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400&h=300&fit=crop',
  'NISSAN': 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400&h=300&fit=crop',
  
  // Vans
  'MERCEDES-BENZ': 'https://images.unsplash.com/photo-1570829460005-c840387bb1ca?w=400&h=300&fit=crop',
  'SPRINTER': 'https://images.unsplash.com/photo-1570829460005-c840387bb1ca?w=400&h=300&fit=crop',
  
  // Default for cars and SUVs
  'DEFAULT': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop',
};

/**
 * Get the port type image URL based on port type
 */
export function getPortTypeImage(portType: string): string {
  const normalized = portType.toUpperCase().trim();
  return PORT_TYPE_IMAGES[normalized] || DEFAULT_PORT_IMAGE;
}

/**
 * Get the vehicle image URL based on make
 */
export function getVehicleImage(make: string): string {
  const normalized = make.toUpperCase().trim();
  return VEHICLE_CATEGORY_IMAGES[normalized] || VEHICLE_CATEGORY_IMAGES['DEFAULT'];
}

/**
 * Get both vehicle and port images for a prediction
 */
export function getPredictionImages(make: string, portType: string): { vehicleImageUrl: string; portImageUrl: string } {
  return {
    vehicleImageUrl: getVehicleImage(make),
    portImageUrl: getPortTypeImage(portType)
  };
}

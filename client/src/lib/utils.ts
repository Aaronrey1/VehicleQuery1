import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatForDisplay(text: string): string {
  if (!text) return text;
  
  return text
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function formatYearDisplay(vehicle: { year?: number | null, yearFrom?: number | null, yearTo?: number | null }): string {
  // If single year field is set, use it
  if (vehicle.year !== null && vehicle.year !== undefined) {
    return vehicle.year.toString();
  }
  
  // If year range is set
  if (vehicle.yearFrom !== null && vehicle.yearFrom !== undefined && 
      vehicle.yearTo !== null && vehicle.yearTo !== undefined) {
    // If yearFrom equals yearTo, show as single year
    if (vehicle.yearFrom === vehicle.yearTo) {
      return vehicle.yearFrom.toString();
    }
    // Otherwise show as range
    return `${vehicle.yearFrom}-${vehicle.yearTo}`;
  }
  
  return 'N/A';
}

// Map port types to their most common device types based on database patterns
export function suggestDeviceType(portType: string): string {
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

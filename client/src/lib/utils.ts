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

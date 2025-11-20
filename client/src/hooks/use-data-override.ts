import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import type { DataOverride } from "@shared/schema";

// Broadcast channel for real-time updates
const overridesBroadcast = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('overrides-updated') 
  : null;

/**
 * Hook to apply data overrides to displayed values
 * Usage: const displayValue = useDataOverride('metric.key', actualValue);
 * Returns the original value type when no override is active
 */
export function useDataOverride(metricKey: string, actualValue: string | number): string | number {
  const { data: overrides = [] } = useQuery<DataOverride[]>({
    queryKey: ["/api/data-overrides"],
    staleTime: 5000, // Reduced to 5 seconds for faster updates
  });
  
  // Listen for override updates
  useEffect(() => {
    if (!overridesBroadcast) return;
    
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-overrides"] });
    };
    
    overridesBroadcast.addEventListener('message', handleUpdate);
    return () => overridesBroadcast.removeEventListener('message', handleUpdate);
  }, []);

  const override = overrides.find(
    (o) => o.metricKey === metricKey && o.isActive
  );

  if (override) {
    // Try to parse as number if original value was numeric
    if (typeof actualValue === 'number') {
      const parsed = Number(override.overrideValue);
      return isNaN(parsed) ? override.overrideValue : parsed;
    }
    return override.overrideValue;
  }

  return actualValue;
}

/**
 * Hook to apply overrides to multiple metrics at once
 * Returns a function that can be called with (key, value) to get the display value
 * Preserves numeric types when no override is active
 */
export function useDataOverrides() {
  const { data: overrides = [] } = useQuery<DataOverride[]>({
    queryKey: ["/api/data-overrides"],
    staleTime: 5000, // Reduced to 5 seconds for faster updates
  });
  
  // Listen for override updates
  useEffect(() => {
    if (!overridesBroadcast) return;
    
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-overrides"] });
    };
    
    overridesBroadcast.addEventListener('message', handleUpdate);
    return () => overridesBroadcast.removeEventListener('message', handleUpdate);
  }, []);

  return (metricKey: string, actualValue: string | number): string | number => {
    const override = overrides.find(
      (o) => o.metricKey === metricKey && o.isActive
    );

    if (override) {
      // Try to parse as number if original value was numeric
      if (typeof actualValue === 'number') {
        const parsed = Number(override.overrideValue);
        return isNaN(parsed) ? override.overrideValue : parsed;
      }
      return override.overrideValue;
    }

    return actualValue;
  };
}

import { useQuery } from "@tanstack/react-query";
import type { DataOverride } from "@shared/schema";

/**
 * Hook to apply data overrides to displayed values
 * Usage: const displayValue = useDataOverride('metric.key', actualValue);
 * Returns the original value type when no override is active
 */
export function useDataOverride(metricKey: string, actualValue: string | number): string | number {
  const { data: overrides = [] } = useQuery<DataOverride[]>({
    queryKey: ["/api/data-overrides"],
    staleTime: 30000, // Cache for 30 seconds to avoid excessive requests
  });

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
    staleTime: 30000,
  });

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

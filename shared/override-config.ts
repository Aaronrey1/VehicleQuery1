/**
 * Centralized configuration for all overrideable metrics in the application
 * This ensures consistency across the UI and provides a single source of truth
 */

export type OverrideMetric = {
  key: string;
  label: string;
  category: 'dashboard' | 'billing' | 'analytics' | 'pending_approvals' | 'database';
  dataType: 'number' | 'string';
  description?: string;
};

export const OVERRIDE_METRICS: OverrideMetric[] = [
  // Dashboard Analytics
  {
    key: 'dashboard.totalSearches',
    label: 'Total Searches',
    category: 'dashboard',
    dataType: 'number',
    description: 'Total number of searches performed',
  },
  {
    key: 'dashboard.mostSearchedMake',
    label: 'Most Searched Make',
    category: 'dashboard',
    dataType: 'string',
    description: 'Most frequently searched vehicle manufacturer',
  },
  {
    key: 'dashboard.totalVehicles',
    label: 'Total Vehicles (Analytics)',
    category: 'dashboard',
    dataType: 'number',
    description: 'Total vehicles in analytics view',
  },

  // Database Stats
  {
    key: 'database.totalVehicles',
    label: 'Database Records',
    category: 'database',
    dataType: 'number',
    description: 'Total vehicle records in database',
  },
  {
    key: 'database.totalMakes',
    label: 'Vehicle Makes',
    category: 'database',
    dataType: 'number',
    description: 'Number of unique vehicle makes',
  },
  {
    key: 'database.totalModels',
    label: 'Vehicle Models',
    category: 'database',
    dataType: 'number',
    description: 'Number of unique vehicle models',
  },
  {
    key: 'database.deviceTypes',
    label: 'Device Types',
    category: 'database',
    dataType: 'number',
    description: 'Number of unique device types',
  },

  // Billing Stats
  {
    key: 'billing.totalCost',
    label: 'Total Cost',
    category: 'billing',
    dataType: 'number',
    description: 'Total cost in dollars',
  },
  {
    key: 'billing.totalSearches',
    label: 'Total Searches (Billing)',
    category: 'billing',
    dataType: 'number',
    description: 'Total searches for billing',
  },
  {
    key: 'billing.databaseSearches',
    label: 'Free Searches',
    category: 'billing',
    dataType: 'number',
    description: 'Number of free database searches',
  },
  {
    key: 'billing.freeSearchPercentage',
    label: 'Free Search Percentage',
    category: 'billing',
    dataType: 'number',
    description: 'Percentage of searches that were free',
  },
  {
    key: 'billing.geminiSearches',
    label: 'Gemini AI Calls',
    category: 'billing',
    dataType: 'number',
    description: 'Number of Gemini AI API calls',
  },
  {
    key: 'billing.averageCost',
    label: 'Average Cost per Search',
    category: 'billing',
    dataType: 'number',
    description: 'Average cost per search',
  },
];

/**
 * Get metric metadata by key
 */
export function getMetricByKey(key: string): OverrideMetric | undefined {
  return OVERRIDE_METRICS.find(m => m.key === key);
}

/**
 * Get all metrics grouped by category
 */
export function getMetricsByCategory() {
  return OVERRIDE_METRICS.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, OverrideMetric[]>);
}

/**
 * Get category display name
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    billing: 'Billing',
    analytics: 'Analytics',
    pending_approvals: 'Pending Approvals',
    database: 'Database Stats',
  };
  return labels[category] || category;
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { VehicleStats } from "@shared/schema";

type DashboardAnalytics = {
  totalSearches: number;
  mostSearchedMake: string;
  totalVehicles: number;
  topSearchedVehicles: Array<{
    make: string;
    model: string;
    year: number | null;
    searches: number;
  }>;
};

export default function AnalyticsDashboard() {
  const { data: stats } = useQuery<VehicleStats>({
    queryKey: ["/api/vehicles/stats"],
  });

  const { data: analytics, isLoading } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
  });

  return (
    <section>
      <Card>
        <CardHeader className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Database Analytics</h3>
            <Select defaultValue="30">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="analytics-searches">
                    {analytics.totalSearches.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Searches</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="analytics-top-make">
                    {analytics.mostSearchedMake}
                  </div>
                  <div className="text-sm text-muted-foreground">Most Searched Make</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="analytics-vehicles">
                    {analytics.totalVehicles.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Vehicles</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No analytics data available</div>
          )}

          {/* Database Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary mb-2" data-testid="db-vehicles">
                  {stats.totalVehicles.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Database Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary mb-2" data-testid="db-makes">
                  {stats.totalMakes}
                </div>
                <div className="text-sm text-muted-foreground">Vehicle Makes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary mb-2" data-testid="db-models">
                  {stats.totalModels}
                </div>
                <div className="text-sm text-muted-foreground">Vehicle Models</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary mb-2" data-testid="db-device-types">
                  {stats.deviceTypes}
                </div>
                <div className="text-sm text-muted-foreground">Device Types</div>
              </div>
            </div>
          )}

          {/* Top Searched Vehicles */}
          {analytics && analytics.topSearchedVehicles.length > 0 && (
            <div className="border-t border-border pt-6">
              <h4 className="font-semibold text-foreground mb-4">Most Searched Vehicles</h4>
              <div className="space-y-3">
                {analytics.topSearchedVehicles.map((vehicle, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`top-vehicle-${index + 1}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {vehicle.make} {vehicle.model} {vehicle.year || ''}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Search history
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{vehicle.searches.toLocaleString()} searches</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { VehicleStats } from "@shared/schema";

export default function AnalyticsDashboard() {
  const { data: stats } = useQuery<VehicleStats>({
    queryKey: ["/api/vehicles/stats"],
  });

  // Mock data for analytics - in a real app this would come from the backend
  const analyticsData = {
    searches: 12847,
    avgResponseTime: "0.12s",
    topMake: "Toyota",
    coverage: "94.2%",
    topSearchedVehicles: [
      { rank: 1, vehicle: "Toyota Camry 2018", deviceTypes: 3, searches: 1247 },
      { rank: 2, vehicle: "Honda Accord 2019", deviceTypes: 2, searches: 982 },
      { rank: 3, vehicle: "Ford F-150 2020", deviceTypes: 4, searches: 756 },
    ]
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2" data-testid="analytics-searches">
                {analyticsData.searches.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Searches</div>
              <div className="text-xs text-green-600 mt-1">+23% from last month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2" data-testid="analytics-response-time">
                {analyticsData.avgResponseTime}
              </div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
              <div className="text-xs text-green-600 mt-1">-15% from last month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2" data-testid="analytics-top-make">
                {analyticsData.topMake}
              </div>
              <div className="text-sm text-muted-foreground">Most Searched Make</div>
              <div className="text-xs text-muted-foreground mt-1">34% of searches</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2" data-testid="analytics-coverage">
                {analyticsData.coverage}
              </div>
              <div className="text-sm text-muted-foreground">Database Coverage</div>
              <div className="text-xs text-green-600 mt-1">+2.1% from last month</div>
            </div>
          </div>

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
          <div className="border-t border-border pt-6">
            <h4 className="font-semibold text-foreground mb-4">Most Searched Vehicles</h4>
            <div className="space-y-3">
              {analyticsData.topSearchedVehicles.map((vehicle) => (
                <div
                  key={vehicle.rank}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  data-testid={`top-vehicle-${vehicle.rank}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">{vehicle.rank}</span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{vehicle.vehicle}</div>
                      <div className="text-sm text-muted-foreground">
                        {vehicle.deviceTypes} device types available
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {vehicle.searches.toLocaleString()} searches
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

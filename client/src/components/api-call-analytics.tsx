import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, X, Activity } from "lucide-react";
import { format } from "date-fns";
import type { ApiCallAnalytics } from "@shared/schema";

export default function ApiCallAnalyticsComponent() {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  // Build query key with date range
  const buildQueryKey = () => {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromDate', fromDate.toISOString());
    if (toDate) params.set('toDate', toDate.toISOString());
    const queryString = params.toString();
    return queryString ? `/api/analytics/api-calls?${queryString}` : '/api/analytics/api-calls';
  };

  const { data: analytics, isLoading } = useQuery<ApiCallAnalytics>({
    queryKey: [buildQueryKey()],
  });

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromDate', fromDate.toISOString());
    if (toDate) params.set('toDate', toDate.toISOString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    window.location.href = `/api/analytics/api-calls/export/csv${queryString}`;
  };

  const handleClearDates = () => {
    setFromDate(undefined);
    setToDate(undefined);
  };

  const getEndpointBadgeColor = (endpoint: string) => {
    const colors: Record<string, string> = {
      '/api/ai/predict': 'bg-green-500',
      '/api/vin/decode': 'bg-orange-500',
      '/api/vehicles/bulk-search': 'bg-purple-500',
      '/api/harnesses/search': 'bg-pink-500',
      '/api/vehicles/search': 'bg-blue-500',
    };
    return colors[endpoint] || 'bg-gray-500';
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                API Call Analytics
              </CardTitle>
              <CardDescription className="mt-2">
                Track API usage by API key and endpoint. Monitor external integrations like Salesforce.
              </CardDescription>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
              {/* Date Range Selectors */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-api-from-date">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, 'PP') : 'From Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-api-to-date">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, 'PP') : 'To Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {(fromDate || toDate) && (
                  <Button variant="ghost" size="sm" onClick={handleClearDates} data-testid="button-api-clear-dates">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Export Button */}
              <Button variant="outline" size="sm" onClick={handleExportCSV} data-testid="button-export-api-csv">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading API call analytics...</div>
          ) : analytics ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-total-api-calls">
                    {analytics.totalCalls.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total API Calls</div>
                </div>
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-active-keys">
                    {analytics.callsByKey.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active API Keys</div>
                </div>
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-endpoints">
                    {analytics.callsByEndpoint.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Unique Endpoints</div>
                </div>
              </div>

              {/* Calls by Endpoint */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Calls by Endpoint</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.callsByEndpoint.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`endpoint-stat-${index}`}>
                      <div className="flex items-center gap-3">
                        <Badge className={getEndpointBadgeColor(item.endpoint)}>
                          {item.endpoint.split('/').pop()}
                        </Badge>
                        <span className="text-sm text-muted-foreground font-mono">{item.endpoint}</span>
                      </div>
                      <span className="font-semibold">{item.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calls by API Key */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Calls by API Key</h3>
                <div className="space-y-4">
                  {analytics.callsByKey.map((keyData, index) => (
                    <Card key={index} data-testid={`api-key-${index}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{keyData.keyName}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              Key: <code className="bg-muted px-1 py-0.5 rounded">{keyData.keyPrefix}••••••••</code>
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{keyData.totalCalls.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">total calls</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {keyData.callsByEndpoint.length > 0 ? (
                          <div className="space-y-2">
                            {keyData.callsByEndpoint.map((endpoint, eIdx) => (
                              <div key={eIdx} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{endpoint.endpoint}</span>
                                <Badge variant="secondary">{endpoint.count} calls</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No endpoint data available</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent API Calls */}
              {analytics.recentLogs && analytics.recentLogs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent API Calls</h3>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Endpoint</TableHead>
                          <TableHead>Search Type</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Results</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.recentLogs.slice(0, 50).map((log, index) => (
                          <TableRow key={index} data-testid={`api-log-${index}`}>
                            <TableCell className="text-xs">
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={getEndpointBadgeColor(log.endpoint || '')}>
                                {log.endpoint?.split('/').pop() || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.searchType}</Badge>
                            </TableCell>
                            <TableCell>{log.country || 'Unknown'}</TableCell>
                            <TableCell>{log.resultsCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No API call data available</div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

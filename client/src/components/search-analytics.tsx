import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, X } from "lucide-react";
import { format } from "date-fns";
import type { SearchAnalytics } from "@shared/schema";

export default function SearchAnalyticsComponent() {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  // Build query key with date range
  const buildQueryKey = () => {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromDate', fromDate.toISOString());
    if (toDate) params.set('toDate', toDate.toISOString());
    const queryString = params.toString();
    return queryString ? `/api/analytics/search?${queryString}` : '/api/analytics/search';
  };

  const { data: analytics, isLoading } = useQuery<SearchAnalytics>({
    queryKey: [buildQueryKey()],
  });

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromDate', fromDate.toISOString());
    if (toDate) params.set('toDate', toDate.toISOString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    window.location.href = `/api/analytics/export/csv${queryString}`;
  };

  const handleExportJSON = () => {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromDate', fromDate.toISOString());
    if (toDate) params.set('toDate', toDate.toISOString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    window.location.href = `/api/analytics/export/json${queryString}`;
  };

  const handleClearDates = () => {
    setFromDate(undefined);
    setToDate(undefined);
  };

  const getSearchTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      regular: 'bg-blue-500',
      bulk: 'bg-purple-500',
      ai: 'bg-green-500',
      vin: 'bg-orange-500',
      geometris: 'bg-pink-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <section className="space-y-6">
      {/* Header with Date Range and Export */}
      <Card>
        <CardHeader className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle>Search Analytics</CardTitle>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
              {/* Date Range Selectors */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-from-date">
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
                    <Button variant="outline" size="sm" data-testid="button-to-date">
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
                  <Button variant="ghost" size="sm" onClick={handleClearDates} data-testid="button-clear-dates">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV} data-testid="button-export-csv">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportJSON} data-testid="button-export-json">
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
          ) : analytics ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="analytics-total-searches">
                    {analytics.totalSearches.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Searches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2" data-testid="analytics-regular-searches">
                    {analytics.searchesByType.regular.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Regular</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2" data-testid="analytics-bulk-searches">
                    {analytics.searchesByType.bulk.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Bulk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2" data-testid="analytics-ai-searches">
                    {analytics.searchesByType.ai.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">AI</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2" data-testid="analytics-vin-searches">
                    {analytics.searchesByType.vin.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">VIN</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600 mb-2" data-testid="analytics-geometris-searches">
                    {analytics.searchesByType.geometris.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Geometris</div>
                </div>
              </div>

              {/* Countries Table */}
              {analytics.searchesByCountry.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-semibold text-foreground mb-4">Searches by Country</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {analytics.searchesByCountry.map((country) => (
                      <div
                        key={country.country}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        data-testid={`country-stat-${country.country}`}
                      >
                        <span className="font-medium text-sm">{country.country}</span>
                        <Badge variant="secondary">{country.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Search Logs */}
              <div className="border-t border-border pt-6">
                <h4 className="font-semibold text-foreground mb-4">
                  Recent Search Logs (Last {Math.min(100, analytics.recentLogs.length)})
                </h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Make</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Results</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.recentLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No search logs yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        analytics.recentLogs.map((log, idx) => (
                          <TableRow key={log.id} data-testid={`search-log-${idx}`}>
                            <TableCell className="text-sm">
                              {format(new Date(log.timestamp), 'PPp')}
                            </TableCell>
                            <TableCell>
                              <Badge className={getSearchTypeBadgeColor(log.searchType)}>
                                {log.searchType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{log.make || '-'}</TableCell>
                            <TableCell className="text-sm">{log.model || '-'}</TableCell>
                            <TableCell className="text-sm">{log.year || '-'}</TableCell>
                            <TableCell className="text-sm">{log.country || 'Unknown'}</TableCell>
                            <TableCell className="text-sm">{log.resultsCount}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No analytics data available</div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DollarSign, TrendingUp, Database, Sparkles, AlertCircle, CreditCard, CalendarIcon, PieChart as PieChartIcon } from "lucide-react";
import type { BillingStats, BillingPieCharts } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function Billing() {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const { data: stats, isLoading } = useQuery<BillingStats>({
    queryKey: ['/api/billing/stats'],
  });

  const { data: pieCharts, isLoading: pieChartsLoading } = useQuery<BillingPieCharts>({
    queryKey: ['/api/billing/pie-charts'],
  });

  // Filter logs based on date range
  const filteredLogs = stats?.recentLogs.filter((log) => {
    const logDate = new Date(log.timestamp);
    if (dateFrom && logDate < dateFrom) return false;
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (logDate > endOfDay) return false;
    }
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              AI Search Billing
            </CardTitle>
            <CardDescription>Loading billing information...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load billing stats</AlertDescription>
      </Alert>
    );
  }

  const totalCostDollars = (stats.totalCostCents / 1000).toFixed(3);
  const freeSearchPercentage = stats.totalSearches > 0 
    ? Math.round((stats.databaseSearches / stats.totalSearches) * 100) 
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" data-testid="heading-billing">
            <DollarSign className="h-6 w-6 text-primary" />
            AI Search Billing & Usage
          </h2>
          <p className="text-muted-foreground mt-1">
            Track your AI Search costs and usage patterns
          </p>
        </div>
        {stats.totalCostCents > 0 && (
          <Button 
            onClick={() => window.open('https://buy.stripe.com/test_payment', '_blank')}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-make-payment"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Make Payment
          </Button>
        )}
      </div>

      {/* Cost Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-cost">
              ${totalCostDollars}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalSearches} total searches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Free Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-free-searches">
              {stats.databaseSearches}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {freeSearchPercentage}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gemini AI Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-gemini-searches">
              {stats.geminiSearches}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${totalCostDollars} spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cost per Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-cost">
              ${stats.totalSearches > 0 ? (stats.totalCostCents / 1000 / stats.totalSearches).toFixed(4) : '0.000'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average cost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Search Tier Breakdown
          </CardTitle>
          <CardDescription>
            How your searches are distributed across free and paid tiers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Database Searches</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <Database className="h-3 w-3 mr-1" />
                  FREE
                </Badge>
              </div>
              <div className="text-2xl font-bold" data-testid="text-database-count">{stats.tier1Searches + stats.tier2Searches}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pattern matching (±5 and ±10 years)
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Google API</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                  <Sparkles className="h-3 w-3 mr-1" />
                  PAID
                </Badge>
              </div>
              <div className="text-2xl font-bold" data-testid="text-google-count">{stats.googleSearches}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Historical - $0.01 per call
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Gemini AI</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  <Sparkles className="h-3 w-3 mr-1" />
                  PAID
                </Badge>
              </div>
              <div className="text-2xl font-bold" data-testid="text-gemini-count">{stats.geminiSearches}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Current - $0.01 per AI prediction
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">VECO API</span>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                  <Database className="h-3 w-3 mr-1" />
                  FREE
                </Badge>
              </div>
              <div className="text-2xl font-bold" data-testid="text-veco-count">{stats.vecoSearches || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                OBD-II compatibility check
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pie Charts Section */}
      {!pieChartsLoading && pieCharts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Search Tier Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of searches by tier (exact, database pattern, AI)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieCharts.searchTierBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(1)}%)` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieCharts.searchTierBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pricing Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Cost Structure:</strong> Database predictions (exact match and pattern matching within ±5/±10 years) are completely free. 
          Google API (historical) and Gemini AI (current) predictions cost $0.01 per request and are only used when no database matches are found.
        </AlertDescription>
      </Alert>

      {/* Recent Search Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent AI Searches</CardTitle>
              <CardDescription>
                {dateFrom || dateTo ? `Filtered ${filteredLogs.length} of ${stats.recentLogs.length} AI prediction queries` : `Last ${stats.recentLogs.length} AI prediction queries`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")} data-testid="button-date-from">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")} data-testid="button-date-to">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }} data-testid="button-clear-dates">
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {dateFrom || dateTo ? "No AI searches found in selected date range" : "No AI searches recorded yet"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.make} {log.model} {log.year}
                      </TableCell>
                      <TableCell>
                        {log.source === 'database_tier1' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Database ±5
                          </Badge>
                        )}
                        {log.source === 'database_tier2' && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            Database ±10
                          </Badge>
                        )}
                        {log.source === 'google_api' && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Google API
                          </Badge>
                        )}
                        {log.source === 'gemini_api' && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Gemini AI
                          </Badge>
                        )}
                        {log.source === 'veco' && (
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                            VECO API
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{log.confidence}%</TableCell>
                      <TableCell className="font-mono">
                        {log.cost === 0 ? (
                          <span className="text-green-600 dark:text-green-400">FREE</span>
                        ) : (
                          <span>${(log.cost / 1000).toFixed(3)}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

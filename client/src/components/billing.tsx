import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, Database, Globe, AlertCircle, CreditCard } from "lucide-react";
import type { BillingStats } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Billing() {
  const { data: stats, isLoading } = useQuery<BillingStats>({
    queryKey: ['/api/billing/stats'],
  });

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Google API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-google-searches">
              {stats.googleSearches}
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tier 1 (Database)</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <Database className="h-3 w-3 mr-1" />
                  FREE
                </Badge>
              </div>
              <div className="text-2xl font-bold" data-testid="text-tier1-count">{stats.tier1Searches}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ±5 year match, high confidence
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tier 2 (Database)</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <Database className="h-3 w-3 mr-1" />
                  FREE
                </Badge>
              </div>
              <div className="text-2xl font-bold" data-testid="text-tier2-count">{stats.tier2Searches}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ±10 year match, medium confidence
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tier 3 (Google API)</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  <Globe className="h-3 w-3 mr-1" />
                  100 FREE/DAY
                </Badge>
              </div>
              <div className="text-2xl font-bold" data-testid="text-tier3-count">{stats.googleSearches}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Free (100/day), then $0.005 each
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tier 4 (VECO)</span>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                  <Database className="h-3 w-3 mr-1" />
                  FREE
                </Badge>
              </div>
              <div className="text-2xl font-bold" data-testid="text-tier4-count">{stats.vecoSearches || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                OBD-II compatibility check
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Cost Structure:</strong> Database predictions (Tier 1 & 2) and VECO (Tier 4) are completely free. 
          Google API searches cost $5 per 1,000 queries ($0.005 each) and are only used when database and VECO 
          predictions fail. First 100 Google searches per day are free.
        </AlertDescription>
      </Alert>

      {/* Recent Search Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Searches</CardTitle>
          <CardDescription>
            Last {stats.recentLogs.length} AI prediction queries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No AI searches recorded yet</p>
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
                  {stats.recentLogs.map((log) => (
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
                            Tier 1
                          </Badge>
                        )}
                        {log.source === 'database_tier2' && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                            Tier 2
                          </Badge>
                        )}
                        {log.source === 'google_api' && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                            Google
                          </Badge>
                        )}
                        {log.source === 'veco' && (
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                            VECO
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

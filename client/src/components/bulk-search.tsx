import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Upload, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Vehicle, SearchResults } from "@shared/schema";
import { formatForDisplay, formatYearDisplay } from "@/lib/utils";

export default function BulkSearch() {
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState<Vehicle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [oneToOneMode, setOneToOneMode] = useState(true);
  const { toast } = useToast();

  // Bulk search mutation
  const bulkSearchMutation = useMutation({
    mutationFn: async (queries: Array<{ make: string; model: string; year: number }>) => {
      const response = await apiRequest("POST", "/api/vehicles/bulk-search", { 
        queries,
        oneToOne: oneToOneMode 
      });
      const data: SearchResults = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setResults(data.vehicles);
      setIsSearching(true);
      toast({
        title: "Search Complete",
        description: `Found ${data.total} vehicle(s)`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to perform bulk search",
        variant: "destructive",
      });
    },
  });

  const handleParseInput = () => {
    const lines = inputText.trim().split("\n").filter(line => line.trim());
    const queries: Array<{ make: string; model: string; year: number }> = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Support formats: "Make,Model,Year" or "Make Model Year" or tab-separated
      const parts = line.includes(",") 
        ? line.split(",").map(p => p.trim())
        : line.includes("\t")
        ? line.split("\t").map(p => p.trim())
        : line.split(/\s+/);

      if (parts.length >= 3) {
        // For space-separated: last part is year, first part is make, middle parts are model
        // This handles multi-word makes like "ALFA ROMEO" or "LAND ROVER"
        const year = parseInt(parts[parts.length - 1]);
        const make = parts[0];
        // Join all middle parts as the model (handles multi-word models too)
        const model = parts.slice(1, parts.length - 1).join(" ");

        if (make && model && !isNaN(year)) {
          queries.push({ make, model, year });
        } else {
          errors.push(`Line ${i + 1}: Invalid format`);
        }
      } else {
        errors.push(`Line ${i + 1}: Expected 3 fields (Make, Model, Year)`);
      }
    }

    if (errors.length > 0) {
      toast({
        title: "Parsing Warnings",
        description: `${errors.length} line(s) skipped. ${queries.length} valid entries found.`,
        variant: "default",
      });
    }

    if (queries.length === 0) {
      toast({
        title: "No Valid Entries",
        description: "Please enter vehicles in the format: Make Model Year (one per line)",
        variant: "destructive",
      });
      return;
    }

    bulkSearchMutation.mutate(queries);
  };

  const handleClear = () => {
    setInputText("");
    setResults([]);
    setIsSearching(false);
  };

  const handleExport = () => {
    if (!results || results.length === 0) return;

    let csv = "make,model,year,device_type,port_type\n";
    results.forEach(vehicle => {
      csv += `${vehicle.make},${vehicle.model},${formatYearDisplay(vehicle)},${vehicle.deviceType},${vehicle.portType}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-search-results.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getDeviceTypeColor = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "obd-ii scanner":
        return "bg-primary/10 text-primary";
      case "fleet tracker":
        return "bg-secondary/10 text-secondary";
      case "gps tracker":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Bulk Vehicle Search</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Search multiple vehicles at once by entering Make, Model, and Year (one per line)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Enter Vehicles (Format: Make Model Year)
            </label>
            <Textarea
              placeholder="Example:&#10;Toyota Camry 2019&#10;Honda Accord 2018&#10;Ford F-150 2020"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              data-testid="textarea-bulk-search"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Supported formats: comma-separated, space-separated, or tab-separated
            </p>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
            <Switch
              id="one-to-one-mode"
              checked={oneToOneMode}
              onCheckedChange={setOneToOneMode}
              data-testid="switch-one-to-one"
            />
            <Label htmlFor="one-to-one-mode" className="text-sm cursor-pointer">
              <span className="font-medium">1-to-1 Lookup</span>
              <span className="text-muted-foreground block text-xs">
                {oneToOneMode 
                  ? "Returns one result per vehicle (recommended)" 
                  : "Returns all matching results"}
              </span>
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Button onClick={handleParseInput} disabled={!inputText.trim()} data-testid="button-search-bulk">
              <Search className="mr-2 h-4 w-4" />
              Search All
            </Button>
            <Button variant="ghost" onClick={handleClear} data-testid="button-clear-bulk">
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {isSearching && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Search Results
                {results && <span className="ml-2 text-muted-foreground">({results.length} found)</span>}
              </CardTitle>
              {results && results.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-bulk">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {bulkSearchMutation.isPending ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Searching vehicles...</p>
              </div>
            ) : results && results.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Make</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Device Type</TableHead>
                      <TableHead>Port Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((vehicle, index) => (
                      <TableRow key={index} data-testid={`row-bulk-result-${index}`}>
                        <TableCell className="font-medium" data-testid={`cell-make-${index}`}>{formatForDisplay(vehicle.make)}</TableCell>
                        <TableCell data-testid={`cell-model-${index}`}>{formatForDisplay(vehicle.model)}</TableCell>
                        <TableCell data-testid={`cell-year-${index}`}>{formatYearDisplay(vehicle)}</TableCell>
                        <TableCell>
                          <Badge className={getDeviceTypeColor(vehicle.deviceType)} data-testid={`cell-device-${index}`}>
                            {formatForDisplay(vehicle.deviceType)}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`cell-port-${index}`}>{formatForDisplay(vehicle.portType)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No vehicles found matching your search criteria.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  No results found for the entered vehicles
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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
import VehicleFeaturesDisplay from "./vehicle-features-display";

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
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Results area - LEFT side on desktop */}
      <div className="lg:flex-1 lg:order-1 order-2">
        {isSearching ? (
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Search Results
                  {results && <span className="ml-2 text-muted-foreground text-sm">({results.length} found)</span>}
                </CardTitle>
                {results && results.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-bulk">
                    <Download className="mr-2 h-3 w-3" />
                    Export
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
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Make</TableHead>
                          <TableHead className="text-xs">Model</TableHead>
                          <TableHead className="text-xs">Year</TableHead>
                          <TableHead className="text-xs">Device Type</TableHead>
                          <TableHead className="text-xs">Port Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((vehicle, index) => (
                          <TableRow key={index} data-testid={`row-bulk-result-${index}`}>
                            <TableCell className="font-medium text-sm py-2" data-testid={`cell-make-${index}`}>{formatForDisplay(vehicle.make)}</TableCell>
                            <TableCell className="text-sm py-2" data-testid={`cell-model-${index}`}>{formatForDisplay(vehicle.model)}</TableCell>
                            <TableCell className="text-sm py-2" data-testid={`cell-year-${index}`}>{formatYearDisplay(vehicle)}</TableCell>
                            <TableCell className="py-2">
                              <Badge className={`${getDeviceTypeColor(vehicle.deviceType)} text-xs`} data-testid={`cell-device-${index}`}>
                                {formatForDisplay(vehicle.deviceType)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm py-2" data-testid={`cell-port-${index}`}>{formatForDisplay(vehicle.portType)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {results.length === 1 && (
                    <VehicleFeaturesDisplay 
                      make={results[0].make} 
                      model={results[0].model} 
                      year={typeof results[0].year === 'number' ? results[0].year : parseInt(String(results[0].year))} 
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No vehicles found matching your search criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/20">
            <div className="text-center text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Search Results</p>
              <p className="text-sm">Enter vehicles and click "Search All"</p>
            </div>
          </div>
        )}
      </div>

      {/* Form area - RIGHT side on desktop */}
      <div className="lg:w-80 lg:order-2 order-1 lg:flex-shrink-0">
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Search className="h-5 w-5" />
              <span>Bulk Search</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Search multiple vehicles at once
            </p>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Vehicles (Make Model Year)
              </label>
              <Textarea
                placeholder="Toyota Camry 2019&#10;Honda Accord 2018&#10;Ford F-150 2020"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                className="font-mono text-xs"
                data-testid="textarea-bulk-search"
              />
              <p className="text-xs text-muted-foreground mt-1">
                One vehicle per line
              </p>
            </div>

            <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg">
              <Switch
                id="one-to-one-mode"
                checked={oneToOneMode}
                onCheckedChange={setOneToOneMode}
                className="scale-90"
                data-testid="switch-one-to-one"
              />
              <Label htmlFor="one-to-one-mode" className="text-xs cursor-pointer">
                <span className="font-medium">1-to-1 Lookup</span>
                <span className="text-muted-foreground block text-xs">
                  {oneToOneMode ? "One result per vehicle" : "All matches"}
                </span>
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleParseInput} disabled={!inputText.trim()} className="flex-1 h-9" data-testid="button-search-bulk">
                <Search className="mr-2 h-4 w-4" />
                Search All
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClear} data-testid="button-clear-bulk">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

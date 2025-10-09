import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Upload, Trash2, Download, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import type { Harness, HarnessStats } from "@shared/schema";

export default function Geometris() {
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch makes
  const { data: makes = [] } = useQuery<string[]>({
    queryKey: ["/api/harnesses/makes"],
  });

  // Fetch models when make is selected
  const { data: models = [] } = useQuery<string[]>({
    queryKey: ["/api/harnesses/models", selectedMake],
    queryFn: async () => {
      if (!selectedMake) return [];
      const response = await fetch(`/api/harnesses/models/${selectedMake}`);
      if (!response.ok) throw new Error("Failed to fetch models");
      return response.json();
    },
    enabled: !!selectedMake,
  });

  // Fetch harness stats
  const { data: stats } = useQuery<HarnessStats>({
    queryKey: ["/api/harnesses/stats"],
  });

  // Search harnesses
  const { data: searchResults, isLoading } = useQuery<{ harnesses: Harness[], total: number }>({
    queryKey: ["/api/harnesses/search", selectedMake, selectedModel, selectedYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedMake) params.append("make", selectedMake);
      if (selectedModel) params.append("model", selectedModel);
      if (selectedYear) params.append("year", selectedYear);
      params.append("limit", "100");
      
      const response = await fetch(`/api/harnesses/search?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to search harnesses");
      return response.json();
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/harnesses/import", formData);
      return response.json();
    },
    onSuccess: (data) => {
      const errorMessage = data.errors > 0 && data.errorDetails 
        ? `First error: ${data.errorDetails[0]?.error || 'Unknown error'} (Row ${data.errorDetails[0]?.row || '?'})`
        : '';
      
      toast({
        title: data.imported > 0 ? "Import Completed" : "Import Failed",
        description: `Successfully imported ${data.imported} harnesses. ${data.errors} errors encountered. ${errorMessage}`,
        variant: data.imported === 0 && data.errors > 0 ? "destructive" : "default",
      });
      
      queryClient.refetchQueries({ queryKey: ["/api/harnesses/makes"] });
      queryClient.refetchQueries({ queryKey: ["/api/harnesses/models"] });
      queryClient.refetchQueries({ queryKey: ["/api/harnesses/stats"] });
      queryClient.refetchQueries({ queryKey: ["/api/harnesses/search"] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear data mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/harnesses");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Data Cleared",
        description: "All harness data has been deleted successfully.",
      });
      queryClient.refetchQueries({ queryKey: ["/api/harnesses/makes"] });
      queryClient.refetchQueries({ queryKey: ["/api/harnesses/models"] });
      queryClient.refetchQueries({ queryKey: ["/api/harnesses/stats"] });
      queryClient.refetchQueries({ queryKey: ["/api/harnesses/search"] });
    },
    onError: (error) => {
      toast({
        title: "Clear Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset dependent fields when parent field changes
  useEffect(() => {
    setSelectedModel("");
    setSelectedYear("");
  }, [selectedMake]);

  useEffect(() => {
    setSelectedYear("");
  }, [selectedModel]);

  const handleClearAll = () => {
    setSelectedMake("");
    setSelectedModel("");
    setSelectedYear("");
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or JSON file.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', 'append');

    importMutation.mutate(formData);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3">Geometris Harness Lookup</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Search our database of {stats?.totalHarnesses?.toLocaleString() || "0"} harness configurations to find the correct harness type for your vehicle
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Make Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="make" className="text-sm font-medium text-foreground">Make</Label>
              <Select value={selectedMake} onValueChange={setSelectedMake}>
                <SelectTrigger data-testid="select-harness-make">
                  <SelectValue placeholder="Select Make" />
                </SelectTrigger>
                <SelectContent>
                  {makes.map((make: string) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm font-medium text-foreground">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedMake}>
                <SelectTrigger data-testid="select-harness-model">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model: string) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Input */}
            <div className="space-y-2">
              <Label htmlFor="year" className="text-sm font-medium text-foreground">Year</Label>
              <Input
                type="number"
                placeholder="Enter Year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={!selectedModel}
                data-testid="input-harness-year"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 flex items-end">
              <Button 
                variant="outline" 
                onClick={handleClearAll}
                className="w-full"
                data-testid="button-clear-harness-search"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Search Results</CardTitle>
            <div className="flex gap-2">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('harness-file-input')?.click()}
                    data-testid="button-import-harness"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                  </Button>
                  <input
                    id="harness-file-input"
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  {stats && stats.totalHarnesses > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete all harness data? This action cannot be undone.")) {
                          clearDataMutation.mutate();
                        }
                      }}
                      disabled={clearDataMutation.isPending}
                      data-testid="button-clear-harness-data"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Data
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/login")}
                  data-testid="button-login-for-import"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Login to Import
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading results...</p>
            </div>
          ) : searchResults && searchResults.harnesses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Make</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Year Range</TableHead>
                    <TableHead>Harness Type</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.harnesses.map((harness) => (
                    <TableRow key={harness.id} data-testid={`row-harness-${harness.id}`}>
                      <TableCell className="font-medium">{harness.make}</TableCell>
                      <TableCell>{harness.model}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {harness.yearFrom} - {harness.yearTo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary text-primary-foreground">
                          {harness.harnessType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{harness.comments || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {searchResults.harnesses.length} of {searchResults.total} results
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedMake || selectedModel || selectedYear
                  ? "No harness configurations found for the selected criteria."
                  : "Select make, model, and year to search for harness configurations."}
              </p>
              {!stats || stats.totalHarnesses === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">
                  Import your harness data to get started.
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Format Info */}
      {(!stats || stats.totalHarnesses === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Expected CSV Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4">
              <div className="bg-card rounded border border-border p-3 text-sm font-mono text-muted-foreground overflow-x-auto">
                <div>year_from,year_to,make,model,harness_type,comments</div>
                <div>2018,2020,Toyota,Camry,T-Harness,Standard configuration</div>
                <div>2015,2022,Honda,Accord,AX-ADBOX2,Requires adapter</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

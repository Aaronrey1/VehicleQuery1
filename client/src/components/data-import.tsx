import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, Download, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { VehicleStats } from "@shared/schema";

export default function DataImport() {
  const [importMode, setImportMode] = useState("append");
  const [validationLevel, setValidationLevel] = useState("strict");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get vehicle stats for display
  const { data: stats } = useQuery<VehicleStats>({
    queryKey: ["/api/vehicles/stats"],
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/vehicles/import", formData);
      return response.json();
    },
    onSuccess: (data) => {
      const errorMessage = data.errors > 0 && data.errorDetails 
        ? `First error: ${data.errorDetails[0]?.error || 'Unknown error'} (Row ${data.errorDetails[0]?.row || '?'})`
        : '';
      
      toast({
        title: data.imported > 0 ? "Import Completed" : "Import Failed",
        description: `Successfully imported ${data.imported} vehicles. ${data.errors} errors encountered. ${errorMessage}`,
        variant: data.imported === 0 && data.errors > 0 ? "destructive" : "default",
      });
      
      // Log all error details to console for debugging
      if (data.errorDetails && data.errorDetails.length > 0) {
        console.log("Import errors:", data.errorDetails);
      }
      
      // Invalidate all vehicle-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/makes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/years"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/search"] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      window.open("/api/vehicles/export", "_blank");
    },
  });

  // Clear data mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/vehicles");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Data Cleared",
        description: "All vehicle data has been deleted successfully.",
      });
      // Invalidate all vehicle-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/makes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/years"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/search"] });
    },
    onError: (error) => {
      toast({
        title: "Clear Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Pentaho import mutation
  const pentahoImportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/import/pentaho");
      return response.json();
    },
    onSuccess: (data) => {
      const successMessage = data.imported > 0 
        ? `Imported ${data.imported} vehicles, skipped ${data.skipped}. Format: ${data.format}`
        : `No new vehicles imported. Skipped ${data.skipped}. Check console for details.`;
      
      toast({
        title: data.imported > 0 ? "Pentaho Import Completed" : "Import Completed - No New Data",
        description: successMessage,
        variant: data.imported > 0 ? "default" : "destructive",
      });
      
      console.log("Pentaho import result:", {
        imported: data.imported,
        skipped: data.skipped,
        format: data.format,
        preview: data.previewData
      });
      
      // Invalidate all vehicle-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/makes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/years"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/search"] });
    },
    onError: (error: any) => {
      toast({
        title: "Pentaho Import Failed",
        description: error.message || "Failed to import from Pentaho. Check console for details.",
        variant: "destructive",
      });
      console.error("Pentaho import error:", error);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
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
    formData.append('mode', importMode);
    formData.append('validationLevel', validationLevel);

    importMutation.mutate(formData);
  };

  return (
    <section className="mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Data Import Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="p-6">
              <div className="flex items-center space-x-3">
                <CloudUpload className="text-primary text-xl" />
                <h3 className="text-lg font-semibold text-foreground">Import Vehicle Data</h3>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                data-testid="file-drop-zone"
              >
                <CloudUpload className="text-4xl text-muted-foreground mb-4 mx-auto" />
                <h4 className="text-lg font-medium text-foreground mb-2">Upload CSV or JSON File</h4>
                <p className="text-muted-foreground mb-4">Drag and drop your file here, or click to browse</p>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-choose-file">
                  Choose File
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  Supports CSV, JSON files up to 50MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-file"
                />
              </div>

              {/* Import Progress */}
              {importMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing data...</span>
                    <span>Processing</span>
                  </div>
                  <Progress value={50} className="w-full" />
                </div>
              )}

              {/* Import Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Import Mode</Label>
                  <Select value={importMode} onValueChange={setImportMode}>
                    <SelectTrigger data-testid="select-import-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="replace">Replace existing data</SelectItem>
                      <SelectItem value="append">Append to existing data</SelectItem>
                      <SelectItem value="update">Update existing records</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Validation Level</Label>
                  <Select value={validationLevel} onValueChange={setValidationLevel}>
                    <SelectTrigger data-testid="select-validation-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict validation</SelectItem>
                      <SelectItem value="moderate">Moderate validation</SelectItem>
                      <SelectItem value="basic">Basic validation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview Sample */}
              <div className="bg-muted rounded-lg p-4">
                <h5 className="font-medium text-foreground mb-3">Expected Data Format</h5>
                <div className="bg-card rounded border border-border p-3 text-sm font-mono text-muted-foreground overflow-x-auto">
                  <div>make,model,year,device_type,port_type</div>
                  <div>Toyota,Camry,2018,OBD-II Scanner,16-pin</div>
                  <div>Honda,Accord,2019,Fleet Tracker,CAN Bus</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Import Status & History */}
        <div className="space-y-6">
          {/* Current Import Status */}
          <Card>
            <CardHeader className="p-6">
              <h4 className="font-semibold text-foreground">Import Status</h4>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Records</span>
                <span className="text-sm text-foreground" data-testid="text-total-records">
                  {stats?.totalVehicles?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Import</span>
                <span className="text-sm text-foreground">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Import Status</span>
                <span className="text-sm font-medium text-green-600">Ready</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="p-6">
              <h4 className="font-semibold text-foreground">Quick Actions</h4>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                data-testid="button-export-db"
              >
                <Download className="mr-2 h-4 w-4 text-primary" />
                Export Current Database
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] })}
                data-testid="button-rebuild-index"
              >
                <RefreshCw className="mr-2 h-4 w-4 text-primary" />
                Rebuild Search Index
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  if (confirm("Import JBus port data from Pentaho report? This will add new vehicles to the database.")) {
                    pentahoImportMutation.mutate();
                  }
                }}
                disabled={pentahoImportMutation.isPending}
                data-testid="button-pentaho-import"
              >
                <CloudUpload className="mr-2 h-4 w-4 text-primary" />
                {pentahoImportMutation.isPending ? "Importing from Pentaho..." : "Import from Pentaho JBus"}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm("Are you sure you want to delete all vehicle data? This action cannot be undone.")) {
                    clearDataMutation.mutate();
                  }
                }}
                disabled={clearDataMutation.isPending}
                data-testid="button-clear-data"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

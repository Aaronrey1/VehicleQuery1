import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import type { VehicleStats } from "@shared/schema";

interface VehicleSearchProps {
  onSearch: (params: { make?: string; model?: string; year?: number }) => void;
}

export default function VehicleSearch({ onSearch }: VehicleSearchProps) {
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  // Fetch makes
  const { data: makes = [] } = useQuery<string[]>({
    queryKey: ["/api/vehicles/makes"],
  });

  // Fetch models when make is selected
  const { data: models = [] } = useQuery<string[]>({
    queryKey: ["/api/vehicles/models", selectedMake],
    enabled: !!selectedMake,
  });

  // Fetch years when make and model are selected
  const { data: years = [] } = useQuery<number[]>({
    queryKey: ["/api/vehicles/years", selectedMake, selectedModel],
    enabled: !!selectedMake && !!selectedModel,
  });

  // Fetch vehicle stats
  const { data: stats } = useQuery<VehicleStats>({
    queryKey: ["/api/vehicles/stats"],
  });

  // Reset dependent fields when parent field changes
  useEffect(() => {
    setSelectedModel("");
    setSelectedYear("");
  }, [selectedMake]);

  useEffect(() => {
    setSelectedYear("");
  }, [selectedModel]);

  // Auto-search when any field changes
  useEffect(() => {
    const searchParams = {
      make: selectedMake || undefined,
      model: selectedModel || undefined,
      year: selectedYear ? parseInt(selectedYear) : undefined,
    };
    onSearch(searchParams);
  }, [selectedMake, selectedModel, selectedYear, onSearch]);

  const handleClearAll = () => {
    setSelectedMake("");
    setSelectedModel("");
    setSelectedYear("");
  };

  const handleSearch = () => {
    const searchParams = {
      make: selectedMake || undefined,
      model: selectedModel || undefined,
      year: selectedYear ? parseInt(selectedYear) : undefined,
    };
    onSearch(searchParams);
  };

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-3">Vehicle Device Lookup</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Search our database of {stats?.totalVehicles?.toLocaleString() || "30,000+"}+ vehicles to find compatible device types and port configurations
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Make Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="make" className="text-sm font-medium text-foreground">Make</Label>
                <Select value={selectedMake} onValueChange={setSelectedMake}>
                  <SelectTrigger data-testid="select-make">
                    <SelectValue placeholder="Select Make" />
                  </SelectTrigger>
                  <SelectContent>
                    {makes.map((make: string) => (
                      <SelectItem key={make} value={make} data-testid={`option-make-${make.toLowerCase()}`}>
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
                  <SelectTrigger data-testid="select-model">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model: string) => (
                      <SelectItem key={model} value={model} data-testid={`option-model-${model.toLowerCase()}`}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="year" className="text-sm font-medium text-foreground">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!selectedModel}>
                  <SelectTrigger data-testid="select-year">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year: number) => (
                      <SelectItem key={year} value={year.toString()} data-testid={`option-year-${year}`}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Search Toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button type="button" variant="ghost" className="text-primary hover:text-primary/80 text-sm font-medium" data-testid="button-advanced">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Advanced Search
              </Button>
              <div className="flex items-center space-x-3">
                <Button type="button" variant="ghost" onClick={handleClearAll} data-testid="button-clear">
                  Clear All
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-search">
                  <Search className="mr-2 h-4 w-4" />
                  Search Devices
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary" data-testid="stat-vehicles">{stats.totalVehicles.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Vehicles</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary" data-testid="stat-makes">{stats.totalMakes}</div>
            <div className="text-sm text-muted-foreground">Makes</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary" data-testid="stat-models">{stats.totalModels}</div>
            <div className="text-sm text-muted-foreground">Models</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary" data-testid="stat-device-types">{stats.deviceTypes}</div>
            <div className="text-sm text-muted-foreground">Device Types</div>
          </Card>
        </div>
      )}
    </section>
  );
}

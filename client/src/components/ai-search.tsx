import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, TrendingUp, Search, AlertCircle, CheckCircle2, XCircle, Mail, User, ChevronDown } from "lucide-react";
import { formatForDisplay, formatYearDisplay } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import VehicleFeaturesDisplay from "./vehicle-features-display";

interface SearchPathStep {
  source: string;
  checked: boolean;
  found: boolean;
}

interface PredictionResult {
  found: boolean;
  exactMatch?: any;
  isAllModelsFallback?: boolean;
  pendingApproval?: boolean;
  message?: string;
  predictions?: {
    portType: string;
    portConfidence: number;
    deviceType: string;
    deviceConfidence: number;
    basedOn: number;
    source?: string;
    vehicleImageUrl?: string;
    searchResults?: Array<{
      title: string;
      link: string;
      snippet: string;
    }>;
    similarVehicles: Array<{
      make: string;
      model: string;
      year: number;
      deviceType: string;
      portType: string;
    }>;
  };
  yearWarning?: string | null;
  makeModelWarning?: string | null;
  searchPath?: SearchPathStep[];
}

export default function AISearch() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch make suggestions
  const { data: makeSuggestions = [] } = useQuery({
    queryKey: ['/api/suggestions/makes', make],
    queryFn: async () => {
      if (!make) return [];
      const response = await fetch(`/api/suggestions/makes?q=${encodeURIComponent(make)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.suggestions || [];
    },
    enabled: make.length > 0,
  });

  // Fetch model suggestions
  const { data: modelSuggestions = [] } = useQuery({
    queryKey: ['/api/suggestions/models', make, model],
    queryFn: async () => {
      if (!make || !model) return [];
      const response = await fetch(`/api/suggestions/models?make=${encodeURIComponent(make)}&q=${encodeURIComponent(model)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.suggestions || [];
    },
    enabled: make.length > 0 && model.length > 0,
  });

  // AI prediction mutation
  const searchMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ make, model, year });
      if (userName) params.append('userName', userName);
      if (userEmail) params.append('userEmail', userEmail);
      
      const response = await fetch(`/api/ai/predict?${params}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    onSuccess: (data) => {
      setPrediction(data);
    }
  });

  // Clean up input: trim, remove duplicate words only
  const cleanInput = (input: string) => {
    return input
      .trim()
      .split(/\s+/)
      .filter((word, index, arr) => index === 0 || word !== arr[index - 1]) // Remove consecutive duplicates only
      .join(" ")
      .trim();
  };

  const handleSearch = () => {
    const cleanMake = cleanInput(make);
    const cleanModel = cleanInput(model);
    const cleanYear = year.trim();

    if (cleanMake && cleanModel && cleanYear) {
      // Update state with cleaned values and search
      setMake(cleanMake);
      setModel(cleanModel);
      setYear(cleanYear);
      setIsSearching(true);
      setPrediction(null);
      
      // Scroll to results area immediately
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
      // Create a temporary mutation with clean data
      const params = new URLSearchParams({ 
        make: cleanMake, 
        model: cleanModel, 
        year: cleanYear 
      });
      if (userName) params.append('userName', userName);
      if (userEmail) params.append('userEmail', userEmail);
      
      const searchClean = async () => {
        const response = await fetch(`/api/ai/predict?${params}`);
        if (!response.ok) throw new Error('Search failed');
        return response.json();
      };
      
      searchClean().then((data) => {
        setPrediction(data);
        setIsSearching(false);
      }).catch(e => {
        console.error('Search error:', e);
        setPrediction(null);
        setIsSearching(false);
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "High Confidence";
    if (confidence >= 60) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Form area - LEFT side on desktop */}
      <div className="lg:w-80 lg:order-1 order-1 lg:flex-shrink-0">
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI Smart Search</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Get intelligent predictions for any vehicle
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="ai-make" className="text-xs">Make</Label>
                  <div className="relative">
                    <Input
                      id="ai-make"
                      type="text"
                      placeholder="Tesla, BMW..."
                      value={make}
                      onChange={(e) => { 
                        setMake(e.target.value); 
                        setPrediction(null);
                        setShowMakeSuggestions(true);
                      }}
                      onFocus={() => setShowMakeSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowMakeSuggestions(false), 200)}
                      className="h-8 text-sm"
                      data-testid="input-ai-make"
                    />
                    {showMakeSuggestions && makeSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-32 overflow-y-auto">
                        {makeSuggestions.map((suggestion: string, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full text-left px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setMake(suggestion);
                              setModel("");
                              setShowMakeSuggestions(false);
                              setPrediction(null);
                            }}
                            data-testid={`suggestion-make-${idx}`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ai-year" className="text-xs">Year</Label>
                  <Input
                    id="ai-year"
                    type="number"
                    placeholder="2024"
                    value={year}
                    onChange={(e) => { setYear(e.target.value); setPrediction(null); }}
                    className="h-8 text-sm"
                    data-testid="input-ai-year"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="ai-model" className="text-xs">Model</Label>
                <div className="relative">
                  <Input
                    id="ai-model"
                    type="text"
                    placeholder="e.g., Model 3, NPR"
                    value={model}
                    onChange={(e) => { 
                      setModel(e.target.value); 
                      setPrediction(null);
                      setShowModelSuggestions(true);
                    }}
                    onFocus={() => setShowModelSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowModelSuggestions(false), 200)}
                    disabled={!make}
                    className="h-8 text-sm"
                    data-testid="input-ai-model"
                  />
                  {showModelSuggestions && modelSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-32 overflow-y-auto">
                      {modelSuggestions.map((suggestion: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs cursor-pointer"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setModel(suggestion);
                            setShowModelSuggestions(false);
                            setPrediction(null);
                          }}
                          data-testid={`suggestion-model-${idx}`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="ai-user-name" className="text-xs">Your Name <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input
                      id="ai-user-name"
                      type="text"
                      placeholder="John Doe"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="pl-7 h-8 text-sm"
                      required
                      data-testid="input-ai-user-name"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ai-user-email" className="text-xs text-muted-foreground">Email (optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input
                      id="ai-user-email"
                      type="email"
                      placeholder="john@example.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="pl-7 h-8 text-sm"
                      data-testid="input-ai-user-email"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSearch} 
                disabled={!make || !model || !year || !userName.trim() || searchMutation.isPending}
                className="w-full h-9"
                data-testid="button-ai-search"
              >
                <Search className="mr-2 h-4 w-4" />
                {searchMutation.isPending ? "Analyzing..." : "Smart Search"}
              </Button>

              <Alert className="py-2 px-3">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs ml-2">
                  <strong>Confidence:</strong> 100% (Exact) • 80-95% (DB ±5yr) • 60-100% (AI)
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results area - RIGHT side on desktop */}
      <div ref={resultsRef} className="lg:flex-1 lg:order-2 order-2">
        {isSearching && (
          <Card>
            <CardContent className="py-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm font-medium">Analyzing vehicle data...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isSearching && prediction && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                <span>{prediction.found ? "Exact Match" : "AI Prediction"}:</span>
                <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-sm">
                  {year} {make.toUpperCase()} {model.toUpperCase()}
                </span>
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4 pt-0">
            {prediction.makeModelWarning && (
              <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {prediction.makeModelWarning}
                </AlertDescription>
              </Alert>
            )}
            
            {prediction.yearWarning && (
              <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {prediction.yearWarning}
                </AlertDescription>
              </Alert>
            )}

            {/* Search Path Visualization - Compact */}
            {prediction.searchPath && prediction.searchPath.length > 0 && (
              <div className="border rounded p-2 bg-muted/50">
                <p className="text-xs font-semibold mb-1">Search Path</p>
                <div className="flex flex-wrap gap-1">
                  {prediction.searchPath.map((step, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs bg-background px-2 py-0.5 rounded border">
                      <span className="font-medium">{index + 1}.</span>
                      <span>{step.source}</span>
                      {step.found ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {prediction.found && prediction.exactMatch ? (
              <>
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950 py-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">Vehicle found in database!</p>
                        {prediction.isAllModelsFallback && (
                          <Badge variant="outline" className="text-amber-700 border-amber-500 bg-amber-100 dark:bg-amber-950 text-xs">
                            ALL MODELS
                          </Badge>
                        )}
                      </div>
                      {prediction.isAllModelsFallback && (
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                          Showing data for "{formatForDisplay(prediction.exactMatch.make)} ALL MODELS".
                        </p>
                      )}
                      <div className="flex gap-3 mt-2">
                        {prediction.exactMatch.vehicleImageUrl && (
                          <img 
                            src={prediction.exactMatch.vehicleImageUrl} 
                            alt="Vehicle"
                            className="w-24 h-20 object-cover rounded border shadow-sm"
                            data-testid="img-exact-match-vehicle"
                          />
                        )}
                        <div className="flex gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Device Type</p>
                            <Badge variant="secondary" className="text-xs">{formatForDisplay(prediction.exactMatch.deviceType)}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Port Type</p>
                            <Badge variant="secondary" className="text-xs">{formatForDisplay(prediction.exactMatch.portType)}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                {/* Device Capabilities for exact match */}
                {year && make && model && (
                  <VehicleFeaturesDisplay 
                    make={make} 
                    model={model} 
                    year={parseInt(year)} 
                  />
                )}
              </>
            ) : prediction.predictions ? (
              <div className="space-y-2">
                <Alert className={
                  prediction.predictions.source === 'google' ? "border-purple-500 bg-purple-50 dark:bg-purple-950 py-2" : 
                  "border-blue-500 bg-blue-50 dark:bg-blue-950 py-2"
                }>
                  <Sparkles className={
                    prediction.predictions.source === 'google' ? "h-3 w-3 text-purple-600" : 
                    "h-3 w-3 text-blue-600"
                  } />
                  <AlertDescription className={
                    prediction.predictions.source === 'google' ? "text-purple-800 dark:text-purple-200" : 
                    "text-blue-800 dark:text-blue-200"
                  }>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">
                          {prediction.predictions.source === 'google' ? 'Google AI Prediction' : 
                           'Two-Step AI Prediction'}
                        </p>
                        {prediction.predictions.source === 'google' && (
                          <Badge variant="outline" className="text-purple-600 border-purple-400 text-xs">
                            Google Search
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border rounded p-2 bg-background">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium">Port Type</p>
                            <span className="text-xs">{prediction.predictions.portConfidence}%</span>
                          </div>
                          <Badge className={`text-xs ${getConfidenceColor(prediction.predictions.portConfidence)}`}>{formatForDisplay(prediction.predictions.portType)}</Badge>
                        </div>

                        <div className="border rounded p-2 bg-background">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium">Device Type</p>
                            <span className="text-xs">{prediction.predictions.deviceConfidence}%</span>
                          </div>
                          <Badge className={`text-xs ${getConfidenceColor(prediction.predictions.deviceConfidence)}`}>{formatForDisplay(prediction.predictions.deviceType)}</Badge>
                        </div>
                      </div>
                        
                      {prediction.predictions.vehicleImageUrl && (
                        <div className="flex gap-2 items-center">
                          <img 
                            src={prediction.predictions.vehicleImageUrl} 
                            alt="Vehicle"
                            className="w-24 h-20 object-cover rounded border shadow-sm"
                            data-testid="img-prediction-vehicle"
                          />
                          <p className="text-xs">Based on {prediction.predictions.basedOn} similar vehicles</p>
                        </div>
                      )}
                      
                      {!prediction.predictions.vehicleImageUrl && (
                        <p className="text-xs flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Based on {prediction.predictions.basedOn} similar vehicles
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

{prediction.predictions.source === 'google' ? (
                  <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950 py-1">
                    <AlertCircle className="h-3 w-3 text-orange-600" />
                    <AlertDescription className="text-xs text-orange-800 dark:text-orange-200">
                      External search data - lower confidence. Consider adding to database.
                    </AlertDescription>
                  </Alert>
                ) : prediction.predictions.source === 'exact_match' ? (
                  <Alert className="border-indigo-500 bg-indigo-50 dark:bg-indigo-950 py-1">
                    <AlertCircle className="h-3 w-3 text-indigo-600" />
                    <AlertDescription className="text-xs text-indigo-800 dark:text-indigo-200">
                      Exact match found. Will be added once admin approves.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {/* Device Capabilities - shown before similar vehicles */}
                {year && make && model && (
                  <VehicleFeaturesDisplay 
                    make={make} 
                    model={model} 
                    year={parseInt(year)} 
                  />
                )}

                {/* Similar Vehicles - shown after device capabilities */}
                {prediction.predictions.similarVehicles && prediction.predictions.similarVehicles.length > 0 && (
                  <div className="border rounded p-2 bg-muted/30">
                    <p className="text-xs font-medium mb-1">Similar Vehicles ({prediction.predictions.similarVehicles.length})</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {prediction.predictions.similarVehicles.slice(0, 5).map((vehicle, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between text-xs p-1.5 bg-background rounded border"
                          data-testid={`similar-vehicle-${idx}`}
                        >
                          <span>{formatYearDisplay(vehicle)} {formatForDisplay(vehicle.make)} {formatForDisplay(vehicle.model)}</span>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs px-1 py-0">{formatForDisplay(vehicle.deviceType)}</Badge>
                            <Badge variant="outline" className="text-xs px-1 py-0">{formatForDisplay(vehicle.portType)}</Badge>
                          </div>
                        </div>
                      ))}
                      {prediction.predictions.similarVehicles.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">+{prediction.predictions.similarVehicles.length - 5} more</p>
                      )}
                    </div>
                  </div>
                )}
                
                {prediction.pendingApproval && (
                  <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950 py-1">
                    <Sparkles className="h-3 w-3 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs">
                      Saved for admin review. Check "Pending" tab in Admin to approve.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  No similar vehicles found in the database to make a prediction. Try a different make or model.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        )}

        {/* Empty state when no search yet */}
        {!prediction && !isSearching && (
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/20">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Search Results</p>
              <p className="text-sm">Enter vehicle details and click "Smart Search"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

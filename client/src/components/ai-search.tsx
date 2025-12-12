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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">AI-Powered Smart Search</CardTitle>
          </div>
          <CardDescription>
            Get intelligent predictions for vehicles not in the database, based on pattern analysis of 31,000+ existing records
          </CardDescription>
          
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>How Prediction Confidence Works:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• <strong>100% (Exact Match):</strong> Direct database match - completely reliable</li>
                <li>• <strong>80-95% (High):</strong> Database pattern matching within ±5 years - highly reliable</li>
                <li>• <strong>60-100% (High):</strong> AI-powered prediction via Gemini - very accurate, often 90%+ confidence</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ai-make">Make</Label>
                <div className="relative">
                  <Input
                    id="ai-make"
                    type="text"
                    placeholder="e.g., Tesla, ISUZU, BMW"
                    value={make}
                    onChange={(e) => { 
                      setMake(e.target.value); 
                      setPrediction(null);
                      setShowMakeSuggestions(true);
                    }}
                    onFocus={() => setShowMakeSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowMakeSuggestions(false), 200)}
                    data-testid="input-ai-make"
                  />
                  {showMakeSuggestions && makeSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                      {makeSuggestions.map((suggestion: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm cursor-pointer"
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

              <div className="space-y-2">
                <Label htmlFor="ai-model">Model</Label>
                <div className="relative">
                  <Input
                    id="ai-model"
                    type="text"
                    placeholder="e.g., NPR, NPR Dump Truck, Model 3"
                    value={model}
                    onChange={(e) => { 
                      setModel(e.target.value); 
                      setPrediction(null);
                      setShowModelSuggestions(true);
                    }}
                    onFocus={() => setShowModelSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowModelSuggestions(false), 200)}
                    disabled={!make}
                    data-testid="input-ai-model"
                  />
                  {showModelSuggestions && modelSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                      {modelSuggestions.map((suggestion: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm cursor-pointer"
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

              <div className="space-y-2">
                <Label htmlFor="ai-year">Year</Label>
                <Input
                  id="ai-year"
                  type="number"
                  placeholder="2024"
                  value={year}
                  onChange={(e) => { setYear(e.target.value); setPrediction(null); }}
                  data-testid="input-ai-year"
                />
              </div>
            </div>

            <div className="border-t pt-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-user-name" className="text-sm">Your Name <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ai-user-name"
                      type="text"
                      placeholder="John Doe"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="pl-9"
                      required
                      data-testid="input-ai-user-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-user-email" className="text-sm text-muted-foreground">Your Email (optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ai-user-email"
                      type="email"
                      placeholder="john@example.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="pl-9"
                      data-testid="input-ai-user-email"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSearch} 
              disabled={!make || !model || !year || !userName.trim() || searchMutation.isPending}
              className="w-full"
              data-testid="button-ai-search"
            >
              <Search className="mr-2 h-4 w-4" />
              {searchMutation.isPending ? "Analyzing..." : "Smart Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results area - shows loading or results */}
      <div ref={resultsRef}>
        {isSearching && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-lg font-medium">Analyzing vehicle data...</p>
                <p className="text-sm text-muted-foreground">Searching database and AI models</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isSearching && prediction && (
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <span>{prediction.found ? "Exact Match Found" : "AI Prediction"}:</span>
                <span className="text-primary font-bold bg-primary/10 px-2 py-1 rounded-md">
                  {year} {make.toUpperCase()} {model.toUpperCase()}
                </span>
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
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

            {/* Search Path Visualization */}
            {prediction.searchPath && prediction.searchPath.length > 0 && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm font-semibold mb-3">Search Path</p>
                <div className="space-y-2">
                  {prediction.searchPath.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background border">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm">{step.source}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {step.found ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-medium text-green-600">Found</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Not found</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {prediction.found && prediction.exactMatch ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Vehicle found in database!</p>
                      {prediction.isAllModelsFallback && (
                        <Badge variant="outline" className="text-amber-700 border-amber-500 bg-amber-100 dark:bg-amber-950">
                          ALL MODELS Fallback
                        </Badge>
                      )}
                    </div>
                    {prediction.isAllModelsFallback && (
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        No exact model match found. Showing data for "{formatForDisplay(prediction.exactMatch.make)} ALL MODELS" as a general reference.
                      </p>
                    )}
                    <div className="flex gap-4 mt-3">
                      {prediction.exactMatch.vehicleImageUrl && (
                        <img 
                          src={prediction.exactMatch.vehicleImageUrl} 
                          alt="Vehicle"
                          className="w-40 h-32 object-cover rounded-lg border shadow-md"
                          data-testid="img-exact-match-vehicle"
                        />
                      )}
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <div>
                          <p className="text-sm text-muted-foreground">Device Type</p>
                          <Badge variant="secondary" className="mt-1">{formatForDisplay(prediction.exactMatch.deviceType)}</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Port Type</p>
                          <Badge variant="secondary" className="mt-1">{formatForDisplay(prediction.exactMatch.portType)}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : prediction.predictions ? (
              <div className="space-y-4">
                <Alert className={
                  prediction.predictions.source === 'google' ? "border-purple-500 bg-purple-50 dark:bg-purple-950" : 
                  "border-blue-500 bg-blue-50 dark:bg-blue-950"
                }>
                  <Sparkles className={
                    prediction.predictions.source === 'google' ? "h-4 w-4 text-purple-600" : 
                    "h-4 w-4 text-blue-600"
                  } />
                  <AlertDescription className={
                    prediction.predictions.source === 'google' ? "text-purple-800 dark:text-purple-200" : 
                    "text-blue-800 dark:text-blue-200"
                  }>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">
                          {prediction.predictions.source === 'google' ? 'Google AI Prediction' : 
                           'Two-Step AI Prediction'}
                        </p>
                        {prediction.predictions.source === 'google' && (
                          <Badge variant="outline" className="text-purple-600 border-purple-400">
                            From Google Search
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="border rounded-lg p-3 bg-background">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Step 1: Port Type Prediction</p>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${getConfidenceColor(prediction.predictions.portConfidence)}`} />
                              <span className="text-xs">{prediction.predictions.portConfidence}%</span>
                            </div>
                          </div>
                          <Badge className={getConfidenceColor(prediction.predictions.portConfidence)}>{formatForDisplay(prediction.predictions.portType)}</Badge>
                        </div>

                        <div className="border rounded-lg p-3 bg-background">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Step 2: Device Type (for {formatForDisplay(prediction.predictions.portType)})</p>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${getConfidenceColor(prediction.predictions.deviceConfidence)}`} />
                              <span className="text-xs">{prediction.predictions.deviceConfidence}%</span>
                            </div>
                          </div>
                          <Badge className={getConfidenceColor(prediction.predictions.deviceConfidence)}>{formatForDisplay(prediction.predictions.deviceType)}</Badge>
                        </div>
                        
                        {prediction.predictions.vehicleImageUrl && (
                          <div className="border rounded-lg p-3 bg-background">
                            <p className="text-sm font-medium mb-2">Vehicle Reference</p>
                            <div className="flex gap-4">
                              <div className="text-center">
                                <img 
                                  src={prediction.predictions.vehicleImageUrl} 
                                  alt="Vehicle"
                                  className="w-48 h-36 object-cover rounded-lg border shadow-md"
                                  data-testid="img-prediction-vehicle"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4" />
                        <span>
                          Based on analysis of {prediction.predictions.basedOn} similar vehicles
                        </span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

{prediction.predictions.source === 'google' ? (
                  <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-xs text-orange-800 dark:text-orange-200">
                      Note: This prediction is based on external search data and has lower confidence. Consider adding this vehicle to your database for accurate future predictions.
                    </AlertDescription>
                  </Alert>
                ) : prediction.predictions.source === 'exact_match' ? (
                  <Alert className="border-indigo-500 bg-indigo-50 dark:bg-indigo-950">
                    <AlertCircle className="h-4 w-4 text-indigo-600" />
                    <AlertDescription className="text-xs text-indigo-800 dark:text-indigo-200">
                      Note: This prediction comes from an exact match in the database. The data will be added once approved by an admin.
                    </AlertDescription>
                  </Alert>
                ) : prediction.predictions.similarVehicles && prediction.predictions.similarVehicles.length > 0 ? (
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Similar Vehicles Used for Prediction</CardTitle>
                      <CardDescription>
                        These {prediction.predictions.similarVehicles.length} vehicles were analyzed to make this prediction
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {prediction.predictions.similarVehicles.slice(0, 10).map((vehicle, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-3 bg-background rounded-lg border"
                            data-testid={`similar-vehicle-${idx}`}
                          >
                            <div className="flex-1">
                              <p className="font-medium">
                                {formatYearDisplay(vehicle)} {formatForDisplay(vehicle.make)} {formatForDisplay(vehicle.model)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">{formatForDisplay(vehicle.deviceType)}</Badge>
                              <Badge variant="outline" className="text-xs">{formatForDisplay(vehicle.portType)}</Badge>
                            </div>
                          </div>
                        ))}
                        {prediction.predictions.similarVehicles.length > 10 && (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            ... and {prediction.predictions.similarVehicles.length - 10} more
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
                
                {prediction.pendingApproval && (
                  <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <div className="space-y-2">
                        <p className="text-lg font-bold">{prediction.message}</p>
                        <p className="font-medium">
                          This prediction has been saved for admin review. Once approved, it will be added to the database for future searches.
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          💡 Check the "Pending" tab in the Admin section to review predictions
                        </p>
                      </div>
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
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">How Two-Step Prediction Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">1</Badge>
            <p>Search for any vehicle - even if it's not in the database</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">2</Badge>
            <p>AI finds similar vehicles (same make/model from nearby years)</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">3</Badge>
            <p><strong>Step 1:</strong> Predicts Port Type from all similar vehicles</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">4</Badge>
            <p><strong>Step 2:</strong> Filters to vehicles with that port, then predicts Device Type</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">5</Badge>
            <p>Shows separate confidence scores for each prediction step</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

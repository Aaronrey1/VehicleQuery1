import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, TrendingUp, Search, AlertCircle } from "lucide-react";

interface PredictionResult {
  found: boolean;
  exactMatch?: any;
  pendingApproval?: boolean;
  message?: string;
  predictions?: {
    portType: string;
    portConfidence: number;
    deviceType: string;
    deviceConfidence: number;
    basedOn: number;
    source?: string;
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
}

export default function AISearch() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  // AI prediction query
  const { data: prediction, isLoading, refetch } = useQuery<PredictionResult>({
    queryKey: [`/api/ai/predict?make=${make}&model=${model}&year=${year}`],
    enabled: false, // Manual trigger
  });

  const handleSearch = () => {
    if (make && model && year) {
      setSearchTriggered(true);
      refetch();
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
                <li>• <strong>80-100% (High):</strong> Based on very similar vehicles (same make/model, ±5 years) - highly reliable</li>
                <li>• <strong>60-79% (Medium):</strong> Based on manufacturer patterns (same make, ±10 years) - generally accurate</li>
                <li>• <strong>20-59% (Low):</strong> Based on external search data - use with caution, consider adding to database</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ai-make">Make</Label>
              <Input
                id="ai-make"
                type="text"
                placeholder="Type any make (e.g., Tesla)"
                value={make}
                onChange={(e) => { setMake(e.target.value); setSearchTriggered(false); }}
                data-testid="input-ai-make"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-model">Model</Label>
              <Input
                id="ai-model"
                type="text"
                placeholder="Type any model (e.g., Model 3)"
                value={model}
                onChange={(e) => { setModel(e.target.value); setSearchTriggered(false); }}
                data-testid="input-ai-model"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-year">Year</Label>
              <Input
                id="ai-year"
                type="number"
                placeholder="2024"
                value={year}
                onChange={(e) => { setYear(e.target.value); setSearchTriggered(false); }}
                data-testid="input-ai-year"
              />
            </div>

            <div className="space-y-2 flex items-end">
              <Button 
                onClick={handleSearch} 
                disabled={!make || !model || !year || isLoading}
                className="w-full"
                data-testid="button-ai-search"
              >
                <Search className="mr-2 h-4 w-4" />
                {isLoading ? "Analyzing..." : "Smart Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {searchTriggered && prediction && (
        <Card>
          <CardHeader>
            <CardTitle>
              {prediction.found ? "Exact Match Found" : "AI Prediction"}
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
            
            {prediction.found && prediction.exactMatch ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <div className="space-y-2">
                    <p className="font-semibold">Vehicle found in database!</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Device Type</p>
                        <Badge variant="secondary" className="mt-1">{prediction.exactMatch.deviceType}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Port Type</p>
                        <Badge variant="secondary" className="mt-1">{prediction.exactMatch.portType}</Badge>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : prediction.pendingApproval ? (
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <div className="space-y-2">
                    <p className="font-semibold">{prediction.message}</p>
                    <p className="text-sm">
                      An AI prediction has been generated and saved for admin review. 
                      Once approved by an admin, it will be added to the database for future searches.
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      💡 Check the "Pending" tab in the Admin section to review predictions
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : prediction.predictions ? (
              <div className="space-y-4">
                <Alert className={prediction.predictions.source === 'google' ? "border-purple-500 bg-purple-50 dark:bg-purple-950" : "border-blue-500 bg-blue-50 dark:bg-blue-950"}>
                  <Sparkles className={prediction.predictions.source === 'google' ? "h-4 w-4 text-purple-600" : "h-4 w-4 text-blue-600"} />
                  <AlertDescription className={prediction.predictions.source === 'google' ? "text-purple-800 dark:text-purple-200" : "text-blue-800 dark:text-blue-200"}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">
                          {prediction.predictions.source === 'google' ? 'Google AI Prediction' : 'Two-Step AI Prediction'}
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
                          <Badge className={getConfidenceColor(prediction.predictions.portConfidence)}>{prediction.predictions.portType}</Badge>
                        </div>

                        <div className="border rounded-lg p-3 bg-background">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Step 2: Device Type (for {prediction.predictions.portType})</p>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${getConfidenceColor(prediction.predictions.deviceConfidence)}`} />
                              <span className="text-xs">{prediction.predictions.deviceConfidence}%</span>
                            </div>
                          </div>
                          <Badge className={getConfidenceColor(prediction.predictions.deviceConfidence)}>{prediction.predictions.deviceType}</Badge>
                        </div>
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
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">{vehicle.deviceType}</Badge>
                              <Badge variant="outline" className="text-xs">{vehicle.portType}</Badge>
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

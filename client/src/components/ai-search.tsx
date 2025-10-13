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
  predictions?: {
    portType: string;
    portConfidence: number;
    deviceType: string;
    deviceConfidence: number;
    basedOn: number;
    similarVehicles: Array<{
      make: string;
      model: string;
      year: number;
      deviceType: string;
      portType: string;
    }>;
  };
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
            ) : prediction.predictions ? (
              <div className="space-y-4">
                <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">AI Prediction Based on Similar Vehicles</p>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${getConfidenceColor(prediction.predictions.confidence)}`} />
                          <span className="text-xs font-medium">{getConfidenceLabel(prediction.predictions.confidence)}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Predicted Device Type</p>
                          <Badge className="mt-1 bg-blue-600">{prediction.predictions.deviceType}</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Predicted Port Type</p>
                          <Badge className="mt-1 bg-blue-600">{prediction.predictions.portType}</Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4" />
                        <span>
                          {prediction.predictions.confidence.toFixed(0)}% confidence based on {prediction.predictions.basedOn} similar vehicles
                        </span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

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
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">1</Badge>
            <p>Search for any vehicle - even if it's not in the database</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">2</Badge>
            <p>AI analyzes similar vehicles (same make/model from nearby years)</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">3</Badge>
            <p>Predicts most likely Device Type and Port Type with confidence score</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">4</Badge>
            <p>Shows which vehicles were used to make the prediction</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

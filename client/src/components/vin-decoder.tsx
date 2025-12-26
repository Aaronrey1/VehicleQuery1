import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2, CheckCircle, XCircle, Hash, Mail, User, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import VehicleFeaturesDisplay from "./vehicle-features-display";

interface VinResult {
  vin: string;
  success: boolean;
  make?: string;
  model?: string;
  year?: number;
  portType?: string;
  deviceType?: string;
  confidence?: number;
  error?: string;
  source?: string;
  nhtsaWarning?: string;
  manualDecodeUrl?: string;
}

interface NhtsaResult {
  Variable: string;
  Value: string | null;
}

async function checkVinCache(vin: string): Promise<{ make: string; model: string; year: number } | null> {
  try {
    const response = await fetch(`/api/vin/cache/${vin}`);
    if (response.ok) {
      const data = await response.json();
      if (data.found) {
        console.log('VIN found in cache:', data);
        return { make: data.make, model: data.model, year: data.year };
      }
    }
  } catch (error) {
    console.log('Cache check failed:', error);
  }
  return null;
}

async function saveVinToCache(vin: string, make: string, model: string, year: number): Promise<void> {
  try {
    await fetch('/api/vin/cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vin, make, model, year })
    });
  } catch (error) {
    console.log('Cache save failed:', error);
  }
}

async function decodeVinFromBrowser(vin: string): Promise<{ make: string; model: string; year: number; warning?: string; fromCache?: boolean } | null> {
  // Step 1: Check cache first
  const cached = await checkVinCache(vin);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // Step 2: Use server-side endpoint (more reliable than browser-side calls)
  // Server uses Cloudflare Worker + direct NHTSA with proper timeouts
  try {
    const cleanVin = vin.trim().toUpperCase();
    console.log('Decoding VIN via server:', cleanVin);
    
    const response = await fetch(`/api/vin/decode-internal/${cleanVin}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.success && data.make && data.model && data.year) {
      console.log('VIN decoded successfully via server');
      
      // Save to cache for future use
      saveVinToCache(vin, data.make, data.model, data.year);
      
      return { 
        make: data.make, 
        model: data.model, 
        year: data.year, 
        warning: data.warning 
      };
    } else {
      console.error('Server VIN decode failed:', data.error);
      return null;
    }
  } catch (error: any) {
    console.error('VIN decode error:', error.message);
    return null;
  }
}

export default function VinDecoder() {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [singleVin, setSingleVin] = useState("");
  const [bulkVins, setBulkVins] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [results, setResults] = useState<VinResult[]>([]);
  const [decodeStatus, setDecodeStatus] = useState<string>("");

  const decodeMutation = useMutation({
    mutationFn: async (vins: string[]) => {
      const allResults: VinResult[] = [];
      
      for (let i = 0; i < vins.length; i++) {
        const vin = vins[i];
        setDecodeStatus(`Decoding VIN ${i + 1} of ${vins.length}...`);
        
        // Step 1: Decode VIN using browser (bypasses server IP block)
        const nhtsaData = await decodeVinFromBrowser(vin);
        
        if (!nhtsaData) {
          allResults.push({
            vin,
            success: false,
            error: `NHTSA is currently under maintenance. Please try again later or use AI Search - enter Make, Model, Year directly.`,
            manualDecodeUrl: `https://vpic.nhtsa.dot.gov/decoder/?vin=${vin}`
          });
          continue;
        }
        
        // Step 2: Get AI prediction from our server
        setDecodeStatus(`Getting prediction for ${nhtsaData.make} ${nhtsaData.model}...`);
        
        try {
          const payload: any = {
            make: nhtsaData.make,
            model: nhtsaData.model,
            year: nhtsaData.year,
          };
          if (userName) payload.userName = userName;
          if (userEmail) payload.userEmail = userEmail;
          
          console.log('Calling AI prediction for:', payload);
          const response = await apiRequest("POST", "/api/ai/predict", payload);
          
          if (!response.ok) {
            console.error('AI prediction failed with status:', response.status);
            throw new Error(`AI prediction failed: ${response.status}`);
          }
          
          const prediction = await response.json();
          console.log('AI prediction response:', prediction);
          
          if (prediction.predictions) {
            const isExactMatch = prediction.exactMatch === true || prediction.predictions.source === 'database_exact';
            allResults.push({
              vin,
              success: true,
              make: nhtsaData.make,
              model: nhtsaData.model,
              year: nhtsaData.year,
              portType: prediction.predictions.portType,
              deviceType: prediction.predictions.deviceType,
              confidence: prediction.predictions.portConfidence || 100,
              source: isExactMatch ? "Database (Exact Match)" : 
                      prediction.predictions.source === 'gemini_api' ? 'Gemini AI - Pending Approval' : 
                      prediction.predictions.source === 'database_tier1' ? 'Database (±5 years) - Pending Approval' : 
                      'AI Prediction',
              nhtsaWarning: nhtsaData.warning
            });
          } else {
            allResults.push({
              vin,
              success: true,
              make: nhtsaData.make,
              model: nhtsaData.model,
              year: nhtsaData.year,
              portType: "Unknown",
              deviceType: "Unknown",
              confidence: 0,
              source: "No prediction available",
              nhtsaWarning: nhtsaData.warning
            });
          }
        } catch (predError) {
          allResults.push({
            vin,
            success: true,
            make: nhtsaData.make,
            model: nhtsaData.model,
            year: nhtsaData.year,
            portType: "Unknown",
            deviceType: "Unknown",
            confidence: 0,
            source: "Prediction failed",
            nhtsaWarning: nhtsaData.warning
          });
        }
      }
      
      setDecodeStatus("");
      return { results: allResults };
    },
    onSuccess: (data) => {
      setResults(data.results);
    },
  });

  const handleSingleDecode = () => {
    if (!singleVin.trim()) return;
    const cleanVin = singleVin.trim().toUpperCase();
    setResults([]);
    decodeMutation.mutate([cleanVin]);
  };

  const handleBulkDecode = () => {
    if (!bulkVins.trim()) return;
    const vins = bulkVins
      .split('\n')
      .map(v => v.trim().toUpperCase())
      .filter(v => v.length > 0);
    
    if (vins.length === 0) return;
    setResults([]);
    decodeMutation.mutate(vins);
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "bg-gray-500";
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return "N/A";
    if (confidence >= 80) return "High";
    if (confidence >= 60) return "Medium";
    return "Low";
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Form area - LEFT side on desktop */}
      <div className="lg:w-80 lg:order-1 order-1 lg:flex-shrink-0">
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">VIN Decoder</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Decode VINs to get vehicle info and AI predictions
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Tabs defaultValue="single" className="w-full" value={activeTab} onValueChange={(value) => setActiveTab(value as "single" | "bulk")}>
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="single" className="text-xs" data-testid="tab-single-vin">Single</TabsTrigger>
                <TabsTrigger value="bulk" className="text-xs" data-testid="tab-bulk-vin">Bulk</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-2 mt-3">
                <div className="space-y-1">
                  <Label htmlFor="single-vin" className="text-xs">VIN Number</Label>
                  <Input
                    id="single-vin"
                    type="text"
                    placeholder="1HGBH41JXMN109186"
                    value={singleVin}
                    onChange={(e) => setSingleVin(e.target.value.toUpperCase())}
                    maxLength={17}
                    className="h-8 text-sm font-mono"
                    data-testid="input-single-vin"
                  />
                  <p className="text-xs text-muted-foreground">17 characters</p>
                </div>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-2 mt-3">
                <div className="space-y-1">
                  <Label htmlFor="bulk-vins" className="text-xs">VINs (one per line)</Label>
                  <Textarea
                    id="bulk-vins"
                    placeholder="1HGBH41JXMN109186&#10;5UXWX7C5XBA123456"
                    value={bulkVins}
                    onChange={(e) => setBulkVins(e.target.value.toUpperCase())}
                    rows={4}
                    className="font-mono text-xs"
                    data-testid="input-bulk-vins"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="border-t pt-3 mt-3 space-y-2">
              <div className="space-y-1">
                <Label htmlFor="vin-user-name" className="text-xs">Your Name <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <User className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input
                    id="vin-user-name"
                    type="text"
                    placeholder="John Doe"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="pl-7 h-8 text-sm"
                    required
                    data-testid="input-vin-user-name"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="vin-user-email" className="text-xs text-muted-foreground">Email (optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input
                    id="vin-user-email"
                    type="email"
                    placeholder="john@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="pl-7 h-8 text-sm"
                    data-testid="input-vin-user-email"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={activeTab === "single" ? handleSingleDecode : handleBulkDecode}
              disabled={decodeMutation.isPending || !userName.trim() || (activeTab === "single" ? !singleVin.trim() : !bulkVins.trim())}
              className="w-full h-9 mt-3"
              data-testid="button-decode-vin"
            >
              {decodeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Decoding...
                </>
              ) : (
                <>Decode VIN(s)</>
              )}
            </Button>
            
            {decodeStatus && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground" data-testid="text-decode-status">
                <Loader2 className="h-3 w-3 animate-spin" />
                {decodeStatus}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results area - RIGHT side on desktop */}
      <div className="lg:flex-1 lg:order-2 order-2">
        {results.length > 0 ? (
          <Card>
          <CardHeader>
            <CardTitle>Decoded Results ({results.length})</CardTitle>
            <CardDescription>
              VIN information with AI-powered port and device type predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Make</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Port Type</TableHead>
                    <TableHead>Device Type</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index} data-testid={`row-vin-${index}`}>
                      <TableCell>
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" data-testid={`status-success-${index}`} />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" data-testid={`status-error-${index}`} />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs" data-testid={`text-vin-${index}`}>
                        {result.vin}
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-make-${index}`}>
                        {result.make || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-model-${index}`}>
                        {result.model || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-year-${index}`}>
                        {result.year || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-port-${index}`}>
                        {result.portType || (result.error ? '-' : 'N/A')}
                      </TableCell>
                      <TableCell data-testid={`text-device-${index}`}>
                        {result.deviceType || (result.error ? '-' : 'N/A')}
                      </TableCell>
                      <TableCell data-testid={`text-confidence-${index}`}>
                        {result.confidence ? (
                          <Badge variant="secondary" className={`${getConfidenceColor(result.confidence)} text-white`}>
                            {result.confidence}% {getConfidenceLabel(result.confidence)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-source-${index}`}>
                        {result.error ? (
                          <div className="space-y-1">
                            <span className="text-orange-600 text-xs font-medium block">Use AI Search</span>
                            {result.manualDecodeUrl && (
                              <a 
                                href={result.manualDecodeUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-xs block"
                                data-testid={`link-nhtsa-manual-${index}`}
                              >
                                Decode on NHTSA.gov →
                              </a>
                            )}
                          </div>
                        ) : result.source ? (
                          <Badge variant="outline">{result.source}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Show NHTSA warnings if any */}
            {results.some(r => r.nhtsaWarning) && (
              <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950 mt-4">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <div className="space-y-2">
                    <p className="font-semibold">NHTSA Warnings Detected</p>
                    <div className="text-sm space-y-1">
                      {results.filter(r => r.nhtsaWarning).map((result, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="font-mono text-xs font-semibold">{result.vin}:</span>
                          <span className="text-xs">{result.nhtsaWarning}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-2 text-yellow-700 dark:text-yellow-300">
                      These warnings indicate potential VIN validation issues reported by NHTSA. The vehicle data provided may still be accurate despite these warnings.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Show pending approval message if any results are pending */}
            {results.some(r => r.source?.includes("Pending Approval")) && (
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950 mt-4">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <div className="space-y-2">
                    <p className="text-lg font-bold">Predictions Pending Admin Approval</p>
                    <p className="font-medium">
                      Some of your VIN predictions have been saved for admin review. Once approved, they will be added to the database for future searches.
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      💡 Check the "Pending" tab in the Admin section to review predictions
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Show device capabilities for single VIN decode */}
            {results.length === 1 && results[0].success && results[0].make && results[0].model && results[0].year && (
              <VehicleFeaturesDisplay 
                make={results[0].make} 
                model={results[0].model} 
                year={results[0].year} 
              />
            )}
          </CardContent>
        </Card>
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/20">
            <div className="text-center text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Decoded Results</p>
              <p className="text-sm">Enter a VIN and click "Decode VIN(s)"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

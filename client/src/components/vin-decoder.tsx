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
}

export default function VinDecoder() {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [singleVin, setSingleVin] = useState("");
  const [bulkVins, setBulkVins] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [results, setResults] = useState<VinResult[]>([]);

  const decodeMutation = useMutation({
    mutationFn: async (vins: string[]) => {
      const payload: any = { vins };
      if (userName) payload.userName = userName;
      if (userEmail) payload.userEmail = userEmail;
      
      const response = await apiRequest("POST", "/api/vin/decode", payload);
      const data = await response.json() as { results: VinResult[] };
      return data;
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Hash className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">VIN Decoder</CardTitle>
          </div>
          <CardDescription>
            Decode Vehicle Identification Numbers to get make, model, year, and our AI-powered port/device type suggestions
          </CardDescription>
          
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>How it works:</strong> Enter one or more VINs (standard 17-character codes, or partial VINs with 10-16 characters). We'll decode them using the NHTSA database 
              and automatically run our AI prediction to suggest the best port type and device type based on 31,000+ vehicle records.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" className="w-full" value={activeTab} onValueChange={(value) => setActiveTab(value as "single" | "bulk")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" data-testid="tab-single-vin">Single VIN</TabsTrigger>
              <TabsTrigger value="bulk" data-testid="tab-bulk-vin">Bulk VINs</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="single-vin">VIN Number</Label>
                <Input
                  id="single-vin"
                  type="text"
                  placeholder="Enter VIN (e.g., 1HGBH41JXMN109186)"
                  value={singleVin}
                  onChange={(e) => setSingleVin(e.target.value.toUpperCase())}
                  maxLength={17}
                  data-testid="input-single-vin"
                />
                <p className="text-xs text-muted-foreground">
                  Standard VINs are 17 characters. Partial VINs (10-16 characters) may decode with warnings.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-vins">VIN Numbers (one per line)</Label>
                <Textarea
                  id="bulk-vins"
                  placeholder="1HGBH41JXMN109186&#10;5UXWX7C5XBA123456&#10;WBADT43452G123456"
                  value={bulkVins}
                  onChange={(e) => setBulkVins(e.target.value.toUpperCase())}
                  rows={8}
                  data-testid="input-bulk-vins"
                />
                <p className="text-xs text-muted-foreground">
                  Enter multiple VINs, one per line (up to 50 VINs at a time)
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="border-t pt-4 pb-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vin-user-name" className="text-sm text-muted-foreground">Your Name (optional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="vin-user-name"
                    type="text"
                    placeholder="John Doe"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="pl-9"
                    data-testid="input-vin-user-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin-user-email" className="text-sm text-muted-foreground">Your Email (optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="vin-user-email"
                    type="email"
                    placeholder="john@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="pl-9"
                    data-testid="input-vin-user-email"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={activeTab === "single" ? handleSingleDecode : handleBulkDecode}
            disabled={decodeMutation.isPending || (activeTab === "single" ? !singleVin.trim() : !bulkVins.trim())}
            className="w-full"
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
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
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
                          <span className="text-red-500 text-xs">{result.error}</span>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

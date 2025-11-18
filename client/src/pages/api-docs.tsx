import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ApiDocs() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CodeBlock = ({ code, language = "json", id }: { code: string; language?: string; id: string }) => (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(code, id)}
        data-testid={`button-copy-${id}`}
      >
        {copiedId === id ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">API Documentation</h1>
        <p className="text-muted-foreground text-lg">
          Complete reference for VehicleDB Pro API endpoints
        </p>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          <strong>Authentication Required:</strong> All API endpoints require an API key. 
          Include your API key in the <code className="bg-muted px-1 py-0.5 rounded">X-API-Key</code> header.
          Generate API keys from the Admin Panel.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="ai-search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai-search" data-testid="tab-ai-search">AI Search</TabsTrigger>
          <TabsTrigger value="vin-decoder" data-testid="tab-vin-decoder">VIN Decoder</TabsTrigger>
          <TabsTrigger value="vehicle-search" data-testid="tab-vehicle-search">Vehicle Search</TabsTrigger>
          <TabsTrigger value="bulk-search" data-testid="tab-bulk-search">Bulk Search</TabsTrigger>
          <TabsTrigger value="geometris" data-testid="tab-geometris">Geometris</TabsTrigger>
        </TabsList>

        {/* AI Search */}
        <TabsContent value="ai-search" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Search</CardTitle>
                  <CardDescription>Predict vehicle port type and device type using AI</CardDescription>
                </div>
                <Badge variant="default">GET</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Endpoint</h3>
                <code className="bg-muted px-3 py-1.5 rounded block">GET /api/ai/predict</code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Query Parameters</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">make</div>
                    <div className="col-span-2">Vehicle make (required, e.g., FORD)</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">model</div>
                    <div className="col-span-2">Vehicle model (required, e.g., F-150)</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">year</div>
                    <div className="col-span-2">Vehicle year (required, e.g., 2018)</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">userName</div>
                    <div className="col-span-2">Optional: User name for email notifications</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">userEmail</div>
                    <div className="col-span-2">Optional: User email for notifications</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Example Request</h3>
                <CodeBlock
                  id="ai-search-request"
                  language="http"
                  code={`GET /api/ai/predict?make=FORD&model=F-150&year=2018
X-API-Key: vdb_xxxxxxxx_yyyyyyyyyyyyyyyyyyyy`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response (Database Match)</h3>
                <CodeBlock
                  id="ai-search-response-db"
                  code={`{
  "found": true,
  "exactMatch": {
    "id": "abc123...",
    "make": "FORD",
    "model": "F150",
    "year": 2018,
    "deviceType": "DCM97021ZB",
    "portType": "OBD"
  },
  "isAllModelsFallback": false,
  "yearWarning": null,
  "makeModelWarning": null,
  "searchPath": [
    {
      "source": "Database (Exact Match)",
      "checked": true,
      "found": true
    }
  ]
}`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Headers</h3>
                <CodeBlock
                  id="ai-search-headers"
                  language="http"
                  code={`X-API-Key: vdb_xxxxxxxx_yyyyyyyyyyyyyyyyyyyy`}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> The searchPath array shows which data sources were checked in order.
                  When no exact match is found, the system may return AI predictions that require admin approval.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VIN Decoder */}
        <TabsContent value="vin-decoder" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>VIN Decoder</CardTitle>
                  <CardDescription>Decode VINs and predict vehicle compatibility</CardDescription>
                </div>
                <Badge variant="default">POST</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Endpoint</h3>
                <code className="bg-muted px-3 py-1.5 rounded block">POST /api/vin/decode</code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Request Body (Single VIN)</h3>
                <CodeBlock
                  id="vin-single-request"
                  code={`{
  "vins": ["1HGCM82633A004352"],
  "userName": "John Doe",        // Optional
  "userEmail": "john@example.com" // Optional
}`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Request Body (Bulk VINs)</h3>
                <CodeBlock
                  id="vin-bulk-request"
                  code={`{
  "vins": [
    "1HGCM82633A004352",
    "1FTFW1ET5EFC10359",
    "1G1ZT53826F109149"
  ],
  "userName": "John Doe",
  "userEmail": "john@example.com"
}`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response</h3>
                <CodeBlock
                  id="vin-response"
                  code={`{
  "results": [
    {
      "vin": "1HGCM82633A004352",
      "success": true,
      "make": "HONDA",
      "model": "Accord",
      "year": 2003,
      "portType": "OBD",
      "deviceType": "DCM97021ZB",
      "confidence": 100,
      "source": "Database (Exact Match)",
      "nhtsaWarning": "0 - VIN decoded clean. Check Digit (9th position) is correct",
      "requiresApproval": false
    }
  ]
}`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Headers</h3>
                <CodeBlock
                  id="vin-headers"
                  language="http"
                  code={`X-API-Key: vdb_xxxxxxxx_yyyyyyyyyyyyyyyyyyyy
Content-Type: application/json`}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Features:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Supports 10-17 character VINs (partial VINs accepted)</li>
                    <li>Up to 50 VINs per request</li>
                    <li>Uses free NHTSA API for VIN decoding</li>
                    <li>Automatically runs AI predictions after decoding</li>
                    <li>Displays NHTSA warnings (e.g., check digit errors)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle Search */}
        <TabsContent value="vehicle-search" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vehicle Search</CardTitle>
                  <CardDescription>Search the vehicle database</CardDescription>
                </div>
                <Badge variant="default">GET</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Endpoint</h3>
                <code className="bg-muted px-3 py-1.5 rounded block">GET /api/vehicles/search</code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Query Parameters</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">make</div>
                    <div className="col-span-2">Vehicle make (e.g., FORD, HONDA)</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">model</div>
                    <div className="col-span-2">Vehicle model (e.g., F-150, Accord)</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">year</div>
                    <div className="col-span-2">Vehicle year (e.g., 2018)</div>
                  </div>
                  <div className="grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">portType</div>
                    <div className="col-span-2">Port type filter (e.g., OBD, J1939)</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Example Request</h3>
                <CodeBlock
                  id="vehicle-search-request"
                  language="http"
                  code={`GET /api/vehicles/search?make=FORD&model=F-150&year=2018
X-API-Key: vdb_xxxxxxxx_yyyyyyyyyyyyyyyyyyyy`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response</h3>
                <CodeBlock
                  id="vehicle-search-response"
                  code={`{
  "vehicles": [
    {
      "id": "abc123...",
      "make": "FORD",
      "model": "F150",
      "year": 2018,
      "yearFrom": 2018,
      "yearTo": 2018,
      "portType": "OBD",
      "deviceType": "DCM97021ZB"
    },
    {
      "id": "def456...",
      "make": "FORD",
      "model": "F150",
      "year": 2018,
      "yearFrom": 2018,
      "yearTo": 2018,
      "portType": "J1939",
      "deviceType": "DCM97021ZB"
    }
  ],
  "total": 2
}`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Headers</h3>
                <CodeBlock
                  id="vehicle-search-headers"
                  language="http"
                  code={`X-API-Key: vdb_xxxxxxxx_yyyyyyyyyyyyyyyyyyyy`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Search */}
        <TabsContent value="bulk-search" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bulk Search</CardTitle>
                  <CardDescription>Search multiple vehicles at once</CardDescription>
                </div>
                <Badge variant="default">POST</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Endpoint</h3>
                <code className="bg-muted px-3 py-1.5 rounded block">POST /api/vehicles/bulk-search</code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Request Body</h3>
                <CodeBlock
                  id="bulk-search-request"
                  code={`{
  "queries": [
    { "make": "FORD", "model": "F-150", "year": 2018 },
    { "make": "HONDA", "model": "Accord", "year": 2015 },
    { "make": "CHEVROLET", "model": "Silverado", "year": 2020 }
  ],
  "oneToOne": false  // Optional: true = one result per query, false = all matches
}`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response (oneToOne: false)</h3>
                <CodeBlock
                  id="bulk-search-response-all"
                  code={`{
  "vehicles": [
    {
      "id": "abc123...",
      "make": "FORD",
      "model": "F150",
      "year": 2018,
      "yearFrom": 2018,
      "yearTo": 2018,
      "portType": "OBD",
      "deviceType": "DCM97021ZB"
    },
    {
      "id": "def456...",
      "make": "HONDA",
      "model": "Accord",
      "year": 2015,
      "yearFrom": 2015,
      "yearTo": 2015,
      "portType": "OBD",
      "deviceType": "DCM97021ZB"
    }
  ],
  "total": 2
}`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response (oneToOne: true)</h3>
                <CodeBlock
                  id="bulk-search-response-one"
                  code={`{
  "vehicles": [
    {
      "id": "abc123...",
      "make": "FORD",
      "model": "F150",
      "year": 2018,
      "portType": "OBD",
      "deviceType": "DCM97021ZB"
    },
    {
      "id": "ghi789...",
      "make": "HONDA",
      "model": "Accord",
      "year": 2015,
      "portType": "OBD",
      "deviceType": "DCM97021ZB"
    }
  ],
  "total": 2
}`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Headers</h3>
                <CodeBlock
                  id="bulk-search-headers"
                  language="http"
                  code={`X-API-Key: vdb_xxxxxxxx_yyyyyyyyyyyyyyyyyyyy
Content-Type: application/json`}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <strong>oneToOne Mode:</strong> When <code className="bg-muted px-1 py-0.5 rounded">oneToOne: true</code>, 
                  the API returns only the first match for each query. When <code className="bg-muted px-1 py-0.5 rounded">oneToOne: false</code> (default), 
                  all matching vehicles are returned. Invalid queries are skipped automatically.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geometris */}
        <TabsContent value="geometris" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Geometris Harness Search</CardTitle>
                  <CardDescription>Search harness compatibility by year/make/model</CardDescription>
                </div>
                <Badge variant="default">GET</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Endpoint</h3>
                <code className="bg-muted px-3 py-1.5 rounded block">GET /api/harnesses/search</code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Query Parameters</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">make</div>
                    <div className="col-span-2">Vehicle make (e.g., FORD, HONDA)</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">model</div>
                    <div className="col-span-2">Vehicle model (e.g., F-150, Accord)</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">year</div>
                    <div className="col-span-2">Vehicle year (e.g., 2018)</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono bg-muted px-2 py-1 rounded">harnessType</div>
                    <div className="col-span-2">Filter by harness type (optional)</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Example Request</h3>
                <CodeBlock
                  id="geometris-request"
                  language="http"
                  code={`GET /api/harnesses/search?make=FORD&model=F-150&year=2018
X-API-Key: vdb_xxxxxxxx_yyyyyyyyyyyyyyyyyyyy`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response</h3>
                <CodeBlock
                  id="geometris-response"
                  code={`{
  "harnesses": [
    {
      "id": "abc123...",
      "make": "FORD",
      "model": "F-150",
      "yearFrom": 2015,
      "yearTo": 2020,
      "harnessType": "T-Harness",
      "partNumber": "GEO-FORD-F150-TH",
      "notes": "Compatible with all trims"
    }
  ],
  "total": 1
}`}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Headers</h3>
                <CodeBlock
                  id="geometris-headers"
                  language="http"
                  code={`X-API-Key: vdb_xxxxxxxx_yyyyyyyyyyyyyyyyyyyy`}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> Geometris searches support year ranges. A harness with yearFrom=2015 and yearTo=2020 
                  will match any year between 2015 and 2020 (inclusive).
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Error Responses</CardTitle>
          <CardDescription>Common error codes and their meanings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">401 Unauthorized</h3>
            <CodeBlock
              id="error-401"
              code={`{
  "message": "API key required. Please provide a valid API key in the X-API-Key header."
}`}
            />
            <p className="text-sm text-muted-foreground mt-2">
              The API key is missing or invalid. Check that you're including the X-API-Key header.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">400 Bad Request</h3>
            <CodeBlock
              id="error-400"
              code={`{
  "message": "Validation error: Invalid year format"
}`}
            />
            <p className="text-sm text-muted-foreground mt-2">
              The request data is invalid. Check the request body format and required fields.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">500 Internal Server Error</h3>
            <CodeBlock
              id="error-500"
              code={`{
  "message": "An error occurred while processing your request"
}`}
            />
            <p className="text-sm text-muted-foreground mt-2">
              An unexpected error occurred on the server. Contact support if this persists.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Rate Limits & Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>VIN Decoder supports up to 50 VINs per request</li>
            <li>Bulk Search has no hard limit, but batches of 100-500 vehicles are recommended</li>
            <li>AI predictions may take longer (3-5 seconds) due to external API calls</li>
            <li>Include userName and userEmail for email notifications on AI predictions</li>
            <li>All text inputs are case-insensitive and normalize special characters</li>
            <li>Store your API key securely - it provides full access to all endpoints</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

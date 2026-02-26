import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BookOpen, Key, ArrowLeft, Download } from "lucide-react";
import { Link } from "wouter";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

export default function ApiDocs() {
  const { toast } = useToast();
  const baseUrl = window.location.origin;

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    // Helper function to add text with auto-pagination
    const addText = (text: string, fontSize = 10, isBold = false) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.text(text, margin, yPos);
      yPos += lineHeight;
    };

    const addTitle = (text: string) => {
      yPos += 5;
      addText(text, 16, true);
      yPos += 2;
    };

    const addSubtitle = (text: string) => {
      addText(text, 12, true);
    };

    const addCode = (text: string) => {
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(text, 170);
      lines.forEach((line: string) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin, yPos);
        yPos += 5;
      });
      doc.setFont("helvetica", "normal");
      yPos += 3;
    };

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("VehicleDB Pro - API Documentation", margin, yPos);
    yPos += 15;

    // Authentication Section
    addTitle("Authentication");
    addText("All API endpoints require authentication using an API key.", 10);
    yPos += 2;
    
    addSubtitle("Getting an API Key:");
    addText("API keys can be generated from the Admin panel (Admin → API Keys).", 10);
    addText("The full key is only shown once at creation. Store it securely.", 10);
    yPos += 3;

    addSubtitle("Using Your API Key:");
    addText("Include your API key in the X-API-Key header with every request:", 10);
    addCode("X-API-Key: vdb_abc123_your-secret-key-here");
    yPos += 3;

    addSubtitle("Base URL:");
    addCode(baseUrl);
    yPos += 5;

    // 1. AI Search Endpoint
    addTitle("1. AI Search");
    addSubtitle("Endpoint: GET /api/ai/predict");
    addText("Predicts port type and device type using multi-tier AI system.", 10);
    yPos += 3;

    addSubtitle("Query Parameters:");
    addText("• make (required): Vehicle manufacturer", 10);
    addText("• model (required): Vehicle model", 10);
    addText("• year (required): Vehicle year", 10);
    addText("• userName (optional): User name for email notifications", 10);
    addText("• userEmail (optional): User email for notifications when approved", 10);
    yPos += 3;

    addSubtitle("Example Request:");
    addCode(`GET ${baseUrl}/api/ai/predict?make=FORD&model=F-150&year=2020\nX-API-Key: vdb_abc123_your-secret-key-here`);
    yPos += 3;

    addSubtitle("Example Response (Exact Match):");
    addCode(`{
  "found": true,
  "exactMatch": {
    "id": 123,
    "make": "FORD",
    "model": "F-150",
    "year": 2020,
    "portType": "OBD2",
    "deviceType": "STANDARD"
  },
  "searchPath": [
    {"source": "Database (Exact Match)", "checked": true, "found": true}
  ]
}`);
    yPos += 5;

    // 2. VIN Decoder Endpoint
    addTitle("2. VIN Decoder");
    addSubtitle("Endpoint: POST /api/vin/decode");
    addText("Decodes VINs using NHTSA API and predicts vehicle specs.", 10);
    yPos += 3;

    addSubtitle("Request Body:");
    addText("• vins (required): Array of VINs (max 100)", 10);
    addText("• userName (optional): User name for notifications", 10);
    addText("• userEmail (optional): User email for notifications", 10);
    yPos += 3;

    addSubtitle("Example Request:");
    addCode(`POST ${baseUrl}/api/vin/decode\nX-API-Key: vdb_abc123_your-secret-key-here\nContent-Type: application/json\n\n{\n  "vins": ["1FTFW1E84MFA12345"],\n  "userName": "John Doe",\n  "userEmail": "john@example.com"\n}`);
    yPos += 3;

    addSubtitle("Example Response:");
    addCode(`{
  "results": [{
    "vin": "1FTFW1E84MFA12345",
    "success": true,
    "make": "FORD",
    "model": "F-150",
    "year": 2021,
    "portType": "OBD2",
    "deviceType": "STANDARD",
    "confidence": 100,
    "source": "Database (Exact Match)"
  }]
}`);
    yPos += 5;

    // Error Responses
    addTitle("Error Responses");
    addText("All endpoints return standard error responses:", 10);
    yPos += 2;
    addCode(`{
  "message": "Error description"
}`);
    yPos += 3;

    addSubtitle("Common HTTP Status Codes:");
    addText("• 400: Bad Request (invalid parameters, limit exceeded)", 10);
    addText("• 401: Unauthorized (missing/invalid API key)", 10);
    addText("• 404: Not Found (resource does not exist)", 10);
    addText("• 429: Too Many Requests (rate limiting)", 10);
    addText("• 500: Internal Server Error (API or service unavailable)", 10);
    addText("• 503: Service Unavailable (NHTSA down)", 10);
    yPos += 5;

    addSubtitle("Specific Error Messages:");
    addText("• \"Maximum 100 VINs per request\"", 10);
    addText("• \"NHTSA server is not responding. Please try again.\"", 10);
    addText("• \"Invalid VIN format (must be 10-17 alphanumeric characters)\"", 10);
    yPos += 5;

    // Salesforce Integration
    addTitle("Salesforce Integration Tips");
    addText("1. Create a Named Credential in Salesforce", 10);
    addText("2. Set Identity Type to 'Named Principal'", 10);
    addText("3. Choose 'Password Authentication' protocol", 10);
    addText("4. Paste API key in password field", 10);
    addText("5. In Apex code, use header: X-API-Key: {!$Credential.Password}", 10);

    // Save PDF
    doc.save("VehicleDB-Pro-API-Documentation.pdf");
    
    toast({
      title: "Success",
      description: "API documentation PDF downloaded successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <BookOpen className="text-primary text-2xl" />
                <h1 className="text-xl font-semibold text-foreground">API Documentation</h1>
              </div>
            </div>
            <Button onClick={generatePDF} data-testid="button-export-pdf">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Authentication
            </CardTitle>
            <CardDescription>
              All API endpoints require authentication using an API key
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Getting an API Key</h3>
              <p className="text-sm text-muted-foreground mb-2">
                API keys can be generated from the Admin panel. Navigate to <strong>Admin → API Keys</strong> and click <strong>Generate New API Key</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                The full key is only shown once at creation time. Store it securely.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Using Your API Key</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Include your API key in the <code className="bg-muted px-1 py-0.5 rounded">X-API-Key</code> header with every request:
              </p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{`X-API-Key: vdb_abc123_your-secret-key-here`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">Base URL</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{window.location.origin}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="ai-search" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="ai-search">AI Search</TabsTrigger>
            <TabsTrigger value="vin-decoder">VIN Decoder</TabsTrigger>
            <TabsTrigger value="vehicle-search">Vehicle Search</TabsTrigger>
            <TabsTrigger value="bulk-search">Bulk Search</TabsTrigger>
            <TabsTrigger value="geometris">Geometris</TabsTrigger>
          </TabsList>

          <TabsContent value="ai-search" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>AI Search</CardTitle>
                  <Badge variant="secondary">GET</Badge>
                </div>
                <CardDescription>
                  Search for vehicle port and device type using AI-powered predictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Endpoint</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>GET /api/ai/predict</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Query Parameters</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">make</code>
                      <span className="text-muted-foreground">Vehicle make (required)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">model</code>
                      <span className="text-muted-foreground">Vehicle model (required)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">year</code>
                      <span className="text-muted-foreground">Vehicle year (required)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">userName</code>
                      <span className="text-muted-foreground">Optional user name for email notifications</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">userEmail</code>
                      <span className="text-muted-foreground">Optional user email for approval notifications</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Example Request</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`curl -X GET '${window.location.origin}/api/ai/predict?make=FORD&model=F150&year=2020&userName=John%20Doe&userEmail=john@example.com' \\
  -H 'X-API-Key: vdb_abc123_your-secret-key-here'`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Example Response (Exact Database Match)</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`{
  "found": true,
  "exactMatch": {
    "id": 123,
    "make": "FORD",
    "model": "F-150",
    "year": 2020,
    "portType": "OBD2",
    "deviceType": "STANDARD"
  },
  "isAllModelsFallback": false,
  "searchPath": [
    {
      "source": "Database (Exact Match)",
      "checked": true,
      "found": true
    }
  ]
}`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Example Response (AI Prediction - Pending Approval)</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`{
  "found": false,
  "pendingApproval": true,
  "message": "Prediction submitted for admin approval",
  "predictions": {
    "portType": "OBD2",
    "portConfidence": 85,
    "deviceType": "STANDARD",
    "deviceConfidence": 82,
    "basedOn": 15,
    "source": "database_tier1",
    "similarVehicles": [...]
  },
  "searchPath": [
    {
      "source": "Database (Exact Match)",
      "checked": true,
      "found": false
    },
    {
      "source": "Database (±5 years)",
      "checked": true,
      "found": true
    }
  ]
}`}</code>
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    Note: If <code className="bg-muted px-1 py-0.5 rounded">userName</code> and <code className="bg-muted px-1 py-0.5 rounded">userEmail</code> are provided, the user will receive an email notification when the prediction is approved by an admin.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Response Fields</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">found</code>
                      <span className="text-muted-foreground">Whether an exact match was found in the database</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">exactMatch</code>
                      <span className="text-muted-foreground">Vehicle object if exact match found</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">pendingApproval</code>
                      <span className="text-muted-foreground">True if AI prediction requires admin approval</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">predictions</code>
                      <span className="text-muted-foreground">AI prediction details (when no exact match)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">searchPath</code>
                      <span className="text-muted-foreground">Array showing which prediction sources were checked</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">yearWarning</code>
                      <span className="text-muted-foreground">Optional warning if year seems invalid</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">makeModelWarning</code>
                      <span className="text-muted-foreground">Optional warning if make/model seems invalid</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vin-decoder" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>VIN Decoder</CardTitle>
                  <Badge variant="secondary">POST</Badge>
                </div>
                <CardDescription>
                  Decode vehicle VINs and get AI predictions for port and device type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Endpoint</h3>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>POST /api/vin/decode</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Request Body</h3>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{`{
  "vins": ["1FTFW1E84MFA12345", "5FNRL6H76KB123456"],
  "userName": "John Doe",
  "userEmail": "john@example.com"
}`}</code>
                    </pre>
                    <p className="text-sm text-muted-foreground mt-2">
                      Note: <code className="bg-muted px-1 py-0.5 rounded">userName</code> and <code className="bg-muted px-1 py-0.5 rounded">userEmail</code> are optional. Supports 1-100 VINs per request. VINs must be 10-17 alphanumeric characters.
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Error Responses</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-destructive mb-1">400 Bad Request (Limit Exceeded)</p>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{`{ "message": "Maximum 100 VINs per request" }`}</code>
                        </pre>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-destructive mb-1">400 Bad Request (Invalid Format)</p>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{`{
  "results": [
    {
      "vin": "INVALID123",
      "success": false,
      "error": "Invalid VIN format (must be 10-17 alphanumeric characters)"
    }
  ]
}`}</code>
                        </pre>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-destructive mb-1">503 Service Unavailable (NHTSA Down)</p>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{`{ "message": "NHTSA server is not responding. Please try again." }`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>

                  <Separator />

                <div>
                  <h3 className="font-medium mb-2">Example Request</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`curl -X POST '${window.location.origin}/api/vin/decode' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: vdb_abc123_your-secret-key-here' \\
  -d '{
    "vins": ["1FTFW1E84MFA12345"],
    "userName": "John Doe",
    "userEmail": "john@example.com"
  }'`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Example Response (Exact Match)</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`{
  "results": [
    {
      "vin": "1FTFW1E84MFA12345",
      "success": true,
      "make": "FORD",
      "model": "F-150",
      "year": 2021,
      "portType": "OBD2",
      "deviceType": "STANDARD",
      "confidence": 100,
      "source": "Database (Exact Match)"
    }
  ]
}`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Example Response (AI Prediction with NHTSA Warning)</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`{
  "results": [
    {
      "vin": "1FTFW1E84MFA1234X",
      "success": true,
      "make": "FORD",
      "model": "F-150",
      "year": 2021,
      "portType": "OBD2",
      "deviceType": "STANDARD",
      "confidence": 85,
      "source": "Database (±5 years, 12 similar vehicles) - Pending Approval",
      "nhtsaWarning": "Check digit (9th position) does not match the calculated value."
    }
  ]
}`}</code>
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    Note: <code className="bg-muted px-1 py-0.5 rounded">nhtsaWarning</code> indicates potential VIN issues but doesn't prevent successful decoding when NHTSA provides vehicle data. Predictions (except exact matches) require admin approval. If <code className="bg-muted px-1 py-0.5 rounded">userName</code> and <code className="bg-muted px-1 py-0.5 rounded">userEmail</code> are provided, the user will be notified via email when approved.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Response Fields</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">results</code>
                      <span className="text-muted-foreground">Array of VIN decode results</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">vin</code>
                      <span className="text-muted-foreground">The decoded VIN</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">success</code>
                      <span className="text-muted-foreground">Whether VIN was successfully decoded</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">make</code>
                      <span className="text-muted-foreground">Vehicle make from NHTSA</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">model</code>
                      <span className="text-muted-foreground">Vehicle model from NHTSA</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">year</code>
                      <span className="text-muted-foreground">Vehicle year from NHTSA</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">portType</code>
                      <span className="text-muted-foreground">Predicted port type</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">deviceType</code>
                      <span className="text-muted-foreground">Predicted device type</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">confidence</code>
                      <span className="text-muted-foreground">Prediction confidence (0-100)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">source</code>
                      <span className="text-muted-foreground">Prediction source description</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">nhtsaWarning</code>
                      <span className="text-muted-foreground">Optional NHTSA warning message</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">error</code>
                      <span className="text-muted-foreground">Error message (when success is false)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicle-search" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Vehicle Search</CardTitle>
                  <Badge variant="secondary">GET</Badge>
                </div>
                <CardDescription>
                  Search the vehicle database by make, model, year, port type, or device type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Endpoint</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>GET /api/vehicles/search</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Query Parameters</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">make</code>
                      <span className="text-muted-foreground">Vehicle make (optional)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">model</code>
                      <span className="text-muted-foreground">Vehicle model (optional)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">year</code>
                      <span className="text-muted-foreground">Vehicle year (optional)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">portType</code>
                      <span className="text-muted-foreground">Port type (optional)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">deviceType</code>
                      <span className="text-muted-foreground">Device type (optional)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">page</code>
                      <span className="text-muted-foreground">Page number (optional, default: 1)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">limit</code>
                      <span className="text-muted-foreground">Results per page (optional, default: 50)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">sortBy</code>
                      <span className="text-muted-foreground">Sort field (optional, default: make)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">sortOrder</code>
                      <span className="text-muted-foreground">Sort order: asc or desc (optional, default: asc)</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Note: All search inputs are normalized (special characters removed, manufacturer aliases recognized). Example: "Chevy" → "CHEVROLET", "F-150" → "F150".
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Example Request</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`curl -X GET '${window.location.origin}/api/vehicles/search?make=FORD&year=2020&page=1&limit=50' \\
  -H 'X-API-Key: vdb_abc123_your-secret-key-here'`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Example Response</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`{
  "vehicles": [
    {
      "id": 1,
      "make": "FORD",
      "model": "F-150",
      "year": 2020,
      "deviceType": "STANDARD",
      "portType": "OBD2"
    },
    {
      "id": 2,
      "make": "FORD",
      "model": "F-250",
      "year": 2020,
      "deviceType": "HEAVY DUTY",
      "portType": "OBD2"
    }
  ],
  "total": 2
}`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-search" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Bulk Search</CardTitle>
                  <Badge variant="secondary">POST</Badge>
                </div>
                <CardDescription>
                  Search for multiple vehicles at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Endpoint</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>POST /api/vehicles/bulk-search</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Request Body</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`{
  "queries": [
    { "make": "FORD", "model": "F150", "year": 2020 },
    { "make": "TOYOTA", "model": "CAMRY", "year": 2019 },
    { "make": "HONDA", "model": "CIVIC", "year": 2021 }
  ],
  "oneToOne": false
}`}</code>
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    Note: <code className="bg-muted px-1 py-0.5 rounded">oneToOne</code> is optional (default: false). When true, returns only one result per query instead of all matches.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Example Request</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`curl -X POST '${window.location.origin}/api/vehicles/bulk-search' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: vdb_abc123_your-secret-key-here' \\
  -d '{
    "queries": [
      { "make": "FORD", "model": "F150", "year": 2020 },
      { "make": "TOYOTA", "model": "CAMRY", "year": 2019 }
    ]
  }'`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Example Response</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`{
  "vehicles": [
    {
      "id": 1,
      "make": "FORD",
      "model": "F-150",
      "year": 2020,
      "deviceType": "STANDARD",
      "portType": "OBD2"
    },
    {
      "id": 15,
      "make": "TOYOTA",
      "model": "CAMRY",
      "year": 2019,
      "deviceType": "STANDARD",
      "portType": "OBD2"
    }
  ],
  "total": 2
}`}</code>
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    Note: Invalid queries are automatically skipped. The response contains a flat array of all matching vehicles.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geometris" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Geometris (Harness Search)</CardTitle>
                  <Badge variant="secondary">GET</Badge>
                </div>
                <CardDescription>
                  Search for harness types by make, model, and year
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Endpoint</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>GET /api/harnesses/search</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Query Parameters</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">make</code>
                      <span className="text-muted-foreground">Vehicle make (required)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">model</code>
                      <span className="text-muted-foreground">Vehicle model (required)</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">year</code>
                      <span className="text-muted-foreground">Vehicle year (required)</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Example Request</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`curl -X GET '${window.location.origin}/api/harnesses/search?make=FORD&model=F150&year=2020' \\
  -H 'X-API-Key: vdb_abc123_your-secret-key-here'`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Example Response</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`{
  "harnesses": [
    {
      "id": 42,
      "make": "FORD",
      "model": "F-150",
      "yearFrom": 2015,
      "yearTo": 2020,
      "harnessType": "FORD-2015-UP"
    },
    {
      "id": 43,
      "make": "FORD",
      "model": "F-150",
      "yearFrom": 2018,
      "yearTo": 2023,
      "harnessType": "FORD-GEN2"
    }
  ],
  "total": 2
}`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Response Fields</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">harnesses</code>
                      <span className="text-muted-foreground">Array of matching harness records</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">total</code>
                      <span className="text-muted-foreground">Total number of matching harnesses</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">id</code>
                      <span className="text-muted-foreground">Harness record ID</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">make</code>
                      <span className="text-muted-foreground">Vehicle make</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">model</code>
                      <span className="text-muted-foreground">Vehicle model</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">yearFrom</code>
                      <span className="text-muted-foreground">Starting year of applicability</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">yearTo</code>
                      <span className="text-muted-foreground">Ending year of applicability</span>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] gap-4">
                      <code className="bg-muted px-2 py-1 rounded">harnessType</code>
                      <span className="text-muted-foreground">Harness type identifier</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Error Responses</CardTitle>
            <CardDescription>
              Standard error response format across all endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">401 Unauthorized - Missing API Key</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{`{
  "error": "API key required"
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">401 Unauthorized - Invalid API Key</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{`{
  "error": "Invalid API key"
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">400 Bad Request - Validation Error</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{`{
  "error": "Validation error message"
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">404 Not Found</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{`{
  "error": "No matches found"
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">500 Internal Server Error</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{`{
  "error": "Internal server error"
}`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Integration Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>Salesforce Integration:</strong>
              <p className="text-muted-foreground mt-1">
                Store your API key in a Named Credential with the key in the <code className="bg-muted px-1 py-0.5 rounded">X-API-Key</code> header field. This allows secure callouts without exposing the key in your Apex code.
              </p>
            </div>
            <div>
              <strong>Rate Limiting:</strong>
              <p className="text-muted-foreground mt-1">
                There are currently no rate limits, but please use the API responsibly. Bulk operations are preferred for multiple queries.
              </p>
            </div>
            <div>
              <strong>Email Notifications:</strong>
              <p className="text-muted-foreground mt-1">
                When predictions require approval, providing <code className="bg-muted px-1 py-0.5 rounded">userName</code> and <code className="bg-muted px-1 py-0.5 rounded">userEmail</code> will trigger an automatic email notification when the prediction is approved by an admin.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

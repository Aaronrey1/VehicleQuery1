import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Copy, Key, Trash2, Ban, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertApiKeySchema, type ApiKey, type ApiKeyWithPlaintext } from "@shared/schema";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ApiKeysManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const form = useForm<z.infer<typeof insertApiKeySchema>>({
    resolver: zodResolver(insertApiKeySchema),
    defaultValues: {
      name: "",
      active: true,
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertApiKeySchema>) => {
      const response = await apiRequest("POST", "/api/api-keys", data);
      return response.json();
    },
    onSuccess: (data: ApiKeyWithPlaintext) => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setNewlyCreatedKey(data.key);
      form.reset();
      toast({
        title: "Success",
        description: "API key created successfully. Make sure to copy it now - you won't be able to see it again!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  // Revoke mutation
  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/api-keys/${id}/revoke`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "Success",
        description: "API key revoked successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertApiKeySchema>) => {
    createMutation.mutate(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys Management
              </CardTitle>
              <CardDescription className="mt-2">
                Manage API keys for external integrations like Salesforce
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-api-key">
                  <Plus className="mr-2 h-4 w-4" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for external applications to access VehicleDB Pro
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name / Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Salesforce Production"
                              {...field}
                              data-testid="input-api-key-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        data-testid="button-submit-api-key"
                      >
                        {createMutation.isPending ? "Creating..." : "Create API Key"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {newlyCreatedKey && (
            <Alert className="mt-4 border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    API Key Created Successfully!
                  </p>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-3 rounded border">
                    <code className="flex-1 text-sm break-all" data-testid="text-new-api-key">
                      {newlyCreatedKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(newlyCreatedKey)}
                      data-testid="button-copy-new-key"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    ⚠️ Make sure to copy this key now. You won't be able to see it again!
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setNewlyCreatedKey(null)}
                    data-testid="button-dismiss-key"
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>For Salesforce Integration:</strong> Create an API key, then store it in a Salesforce Named Credential.
              Use the header <code className="bg-muted px-1 py-0.5 rounded">X-API-Key</code> when making requests.
            </AlertDescription>
          </Alert>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No API keys yet. Create one to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id} data-testid={`row-api-key-${key.id}`}>
                      <TableCell className="font-medium" data-testid={`text-key-name-${key.id}`}>
                        {key.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {key.keyPrefix}••••••••
                        </code>
                        <p className="text-xs text-muted-foreground mt-1">
                          Full key hidden for security
                        </p>
                      </TableCell>
                      <TableCell>
                        {key.active ? (
                          <Badge variant="default" className="bg-green-500" data-testid={`badge-active-${key.id}`}>
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" data-testid={`badge-revoked-${key.id}`}>
                            Revoked
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(key.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(key.lastUsedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {key.active && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revokeMutation.mutate(key.id)}
                              disabled={revokeMutation.isPending}
                              data-testid={`button-revoke-${key.id}`}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
                                deleteMutation.mutate(key.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${key.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">For Salesforce Integration:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Create a Named Credential in Salesforce (Setup → Named Credentials)</li>
              <li>Set Identity Type to "Named Principal"</li>
              <li>Choose "Password Authentication" protocol</li>
              <li>Paste your API key in the password field</li>
              <li>Enable "Allow Merge Fields in HTTP Header"</li>
              <li>In your Apex code, set the header: <code className="bg-muted px-1 py-0.5 rounded">X-API-Key: {'{!$Credential.Password}'}</code></li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Example API Calls:</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">AI Search:</p>
                <code className="block bg-muted p-2 rounded text-xs overflow-x-auto">
                  GET /api/ai/predict?make=HONDA&model=Accord&year=2003<br/>
                  Headers: X-API-Key: your-api-key-here
                </code>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">VIN Decoder:</p>
                <code className="block bg-muted p-2 rounded text-xs overflow-x-auto">
                  POST /api/vin/decode<br/>
                  Headers: X-API-Key: your-api-key-here<br/>
                  Body: {`{"vins": ["1HGCM82633A004352"]}`}
                </code>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Vehicle Search:</p>
                <code className="block bg-muted p-2 rounded text-xs overflow-x-auto">
                  GET /api/vehicles/search?make=HONDA&model=ACCORD&year=2003<br/>
                  Headers: X-API-Key: your-api-key-here
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

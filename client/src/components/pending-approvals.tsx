import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Trash2, Clock, AlertCircle, ExternalLink, Lock } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PendingVehicle } from "@shared/schema";
import { formatYearDisplay } from "@/lib/utils";

export function PendingApprovals() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Fetch pending vehicles
  const { data: pendingVehicles, isLoading, isError, error } = useQuery<PendingVehicle[]>({
    queryKey: ["/api/pending-vehicles"],
  });

  // Handle authentication errors
  useEffect(() => {
    if (isError) {
      const errorMessage = error?.message || "";
      if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view pending approvals.",
          variant: "destructive",
        });
        setLocation("/login");
      }
    }
  }, [isError, error, setLocation, toast]);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/pending-vehicles/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/pending-vehicles"] });
      toast({
        title: "Vehicle Approved",
        description: "The vehicle has been added to the database.",
      });
    },
    onError: () => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve the vehicle. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/pending-vehicles/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/pending-vehicles"] });
      toast({
        title: "Vehicle Rejected",
        description: "The vehicle has been marked as rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the vehicle. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/pending-vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/pending-vehicles"] });
      toast({
        title: "Vehicle Deleted",
        description: "The pending vehicle has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the vehicle. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return <Badge variant="default" className="bg-green-500 dark:bg-green-600">High ({confidence}%)</Badge>;
    } else if (confidence >= 60) {
      return <Badge variant="default" className="bg-yellow-500 dark:bg-yellow-600">Medium ({confidence}%)</Badge>;
    } else {
      return <Badge variant="default" className="bg-orange-500 dark:bg-orange-600">Low ({confidence}%)</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    const errorMessage = error?.message || "Unknown error";
    const isAuthError = errorMessage.includes("401") || errorMessage.includes("Unauthorized");
    
    if (isAuthError) {
      return (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <strong>Authentication Required:</strong> You must be logged in to view pending approvals. Redirecting to login...
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Error Loading Pending Vehicles:</strong> {errorMessage}. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const hasPending = pendingVehicles && pendingVehicles.length > 0;

  return (
    <div className="space-y-6">
      <Alert className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950">
        <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <AlertDescription className="text-purple-800 dark:text-purple-200">
          <strong>Google API Predictions:</strong> When AI Search finds no database matches, it calls Google Custom Search API ($0.005 per search).
          Those predictions appear here for your review before being added to the main database.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Vehicle Approvals
          </CardTitle>
          <CardDescription>
            Review and approve vehicles predicted by Google Custom Search API
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasPending ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending approvals</p>
              <p className="text-sm mt-2">Google API predictions will appear here for review</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                {pendingVehicles.length} vehicle{pendingVehicles.length !== 1 ? 's' : ''} pending approval
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Predicted Port</TableHead>
                    <TableHead>Predicted Device</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingVehicles.map((vehicle) => (
                    <>
                      <TableRow key={vehicle.id} data-testid={`row-pending-${vehicle.id}`}>
                        <TableCell className="font-medium" data-testid={`text-vehicle-${vehicle.id}`}>
                          {formatYearDisplay(vehicle)} {vehicle.make} {vehicle.model}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-port-${vehicle.id}`}>{vehicle.portType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-device-${vehicle.id}`}>{vehicle.deviceType}</Badge>
                        </TableCell>
                        <TableCell>{getConfidenceBadge(vehicle.confidence)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(vehicle.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                            onClick={() => approveMutation.mutate(vehicle.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${vehicle.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMutation.mutate(vehicle.id)}
                            disabled={rejectMutation.isPending}
                            data-testid={`button-reject-${vehicle.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedRow(expandedRow === vehicle.id ? null : vehicle.id)}
                            data-testid={`button-toggle-${vehicle.id}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(vehicle.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${vehicle.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRow === vehicle.id && vehicle.googleSearchResults && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/50">
                            <div className="p-4 space-y-2">
                              <h4 className="font-semibold text-sm">Google Search Results:</h4>
                              <div className="text-sm text-muted-foreground space-y-2 max-h-60 overflow-y-auto">
                                {(() => {
                                  try {
                                    const results = JSON.parse(vehicle.googleSearchResults);
                                    return Array.isArray(results) && results.length > 0 ? (
                                      results.map((result: any, idx: number) => (
                                        <div key={idx} className="border-l-2 border-primary pl-3">
                                          <div className="font-medium">{result.title}</div>
                                          <div className="text-xs">{result.snippet}</div>
                                        </div>
                                      ))
                                    ) : (
                                      <div>No search results available</div>
                                    );
                                  } catch {
                                    return <div>Unable to parse search results</div>;
                                  }
                                })()}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

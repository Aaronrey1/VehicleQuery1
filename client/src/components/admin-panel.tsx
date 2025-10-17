import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertVehicleSchema, type Vehicle, type InsertVehicle } from "@shared/schema";
import { z } from "zod";
import { formatYearDisplay, suggestDeviceType } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900).max(2100).optional(),
  yearFrom: z.coerce.number().min(1900).max(2100).optional(),
  yearTo: z.coerce.number().min(1900).max(2100).optional(),
  deviceType: z.string().optional(),
  portType: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasYear = data.year !== undefined && data.year !== null;
  const hasYearFrom = data.yearFrom !== undefined && data.yearFrom !== null;
  const hasYearTo = data.yearTo !== undefined && data.yearTo !== null;
  const hasYearRange = hasYearFrom || hasYearTo;
  
  // Cannot have both single year AND year range
  if (hasYear && hasYearRange) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cannot provide both single year and year range. Choose one.",
      path: ['year'],
    });
    return;
  }
  
  // Must have either single year OR both yearFrom and yearTo
  if (!hasYear && (!hasYearFrom || !hasYearTo)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Must provide either a single year or both from/to years",
      path: ['year'],
    });
  }
  
  // If using year range, yearFrom must be <= yearTo
  if (hasYearFrom && hasYearTo && data.yearFrom! > data.yearTo!) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "From Year must be less than or equal to To Year",
      path: ['yearFrom'],
    });
  }
});

export default function AdminPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isYearRange, setIsYearRange] = useState(false);
  const { toast } = useToast();

  const limit = 20;

  // Fetch vehicles with pagination
  const { data: vehicleData, isLoading } = useQuery<{ vehicles: Vehicle[]; total: number }>({
    queryKey: ["/api/vehicles/search", { page: currentPage, limit, searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
      });
      if (searchTerm) {
        params.append("make", searchTerm);
      }
      const response = await fetch(`/api/vehicles/search?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch vehicles");
      return response.json();
    },
  });

  // Fetch device types and port types for dropdowns
  const { data: deviceTypes = [] } = useQuery<string[]>({
    queryKey: ["/api/vehicles/device-types"],
  });

  const { data: portTypes = [] } = useQuery<string[]>({
    queryKey: ["/api/vehicles/port-types"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      yearFrom: undefined,
      yearTo: undefined,
      deviceType: undefined,
      portType: undefined,
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertVehicle) => {
      const response = await apiRequest("POST", "/api/vehicles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/vehicles/search"] });
      queryClient.refetchQueries({ queryKey: ["/api/vehicles/stats"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Vehicle created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create vehicle",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertVehicle> }) => {
      const response = await apiRequest("PATCH", `/api/vehicles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/vehicles/search"] });
      queryClient.refetchQueries({ queryKey: ["/api/vehicles/stats"] });
      setEditingVehicle(null);
      form.reset();
      toast({
        title: "Success",
        description: "Vehicle updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update vehicle",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/vehicles/${id}`, undefined);
      return response;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/vehicles/search"] });
      queryClient.refetchQueries({ queryKey: ["/api/vehicles/stats"] });
      toast({
        title: "Success",
        description: "Vehicle deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete vehicle",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    // Validate year fields
    const hasYear = data.year !== undefined && data.year !== null;
    const hasYearFrom = data.yearFrom !== undefined && data.yearFrom !== null;
    const hasYearTo = data.yearTo !== undefined && data.yearTo !== null;
    const hasYearRange = hasYearFrom || hasYearTo;
    
    // Cannot have both single year AND year range
    if (hasYear && hasYearRange) {
      toast({
        title: "Validation Error",
        description: "Cannot provide both single year and year range. Choose one.",
        variant: "destructive",
      });
      return;
    }
    
    if (!hasYear && (!hasYearFrom || !hasYearTo)) {
      toast({
        title: "Validation Error",
        description: "Please provide either a single year or both from/to years",
        variant: "destructive",
      });
      return;
    }
    
    if (hasYearFrom && hasYearTo && data.yearFrom! > data.yearTo!) {
      toast({
        title: "Validation Error",
        description: "From Year must be less than or equal to To Year",
        variant: "destructive",
      });
      return;
    }
    
    // Validate required fields on create
    if (!editingVehicle) {
      if (!data.deviceType || !data.portType) {
        toast({
          title: "Validation Error",
          description: "Device Type and Port Type are required",
          variant: "destructive",
        });
        return;
      }
    } else {
      // For edits: if port type is being changed, device type must also be set
      if (data.portType !== undefined && !data.deviceType) {
        toast({
          title: "Validation Error",
          description: "Device Type is required when changing Port Type",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Remove empty strings to prevent validation errors
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== "" && value !== undefined)
    ) as InsertVehicle;
    
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data: cleanedData });
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    // Determine if this is a year range or single year
    const hasYearRange = vehicle.yearFrom !== null && vehicle.yearTo !== null;
    setIsYearRange(hasYearRange);
    
    form.reset({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year ?? undefined,
      yearFrom: vehicle.yearFrom ?? undefined,
      yearTo: vehicle.yearTo ?? undefined,
      deviceType: vehicle.deviceType,
      portType: vehicle.portType,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingVehicle(null);
    setIsYearRange(false);
    form.reset();
  };

  const totalPages = Math.ceil((vehicleData?.total || 0) / limit);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-2xl">Vehicle Management</CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by make..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-admin-search"
              />
            </div>
            <Dialog open={isCreateDialogOpen || !!editingVehicle} onOpenChange={(open) => !open && handleCloseDialog()}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-vehicle">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" data-testid="dialog-vehicle-form">
                <DialogHeader>
                  <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="make"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Make</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Toyota" data-testid="input-make" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Camry" data-testid="input-model" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="year-range-toggle"
                          checked={isYearRange}
                          onCheckedChange={(checked) => {
                            setIsYearRange(checked);
                            // Clear opposite fields when toggling
                            if (checked) {
                              form.setValue('year', undefined);
                            } else {
                              form.setValue('yearFrom', undefined);
                              form.setValue('yearTo', undefined);
                            }
                          }}
                          data-testid="switch-year-range"
                        />
                        <Label htmlFor="year-range-toggle">Year Range</Label>
                      </div>
                      
                      {!isYearRange ? (
                        <FormField
                          control={form.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" placeholder="2020" data-testid="input-year" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="yearFrom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>From Year</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" placeholder="1996" data-testid="input-year-from" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="yearTo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>To Year</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" placeholder="2002" data-testid="input-year-to" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                    <FormField
                      control={form.control}
                      name="deviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Device Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-device-type">
                                <SelectValue placeholder="Select device type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {deviceTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="portType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port Type</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Auto-suggest device type based on port type
                              const suggested = suggestDeviceType(value);
                              if (suggested) {
                                form.setValue('deviceType', suggested);
                              } else {
                                // Clear device type if no suggestion available
                                form.setValue('deviceType', undefined);
                              }
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-port-type">
                                <SelectValue placeholder="Select port type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {portTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-submit-vehicle"
                      >
                        {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingVehicle ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading vehicles...</p>
          </div>
        ) : vehicleData && vehicleData.vehicles.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Make</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Device Type</TableHead>
                    <TableHead>Port Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleData.vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} data-testid={`row-vehicle-${vehicle.id}`}>
                      <TableCell className="font-medium">{vehicle.make}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{formatYearDisplay(vehicle)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{vehicle.deviceType}</Badge>
                      </TableCell>
                      <TableCell>{vehicle.portType}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(vehicle)}
                            data-testid={`button-edit-${vehicle.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(vehicle.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${vehicle.id}`}
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({vehicleData.total} total vehicles)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No vehicles found. Add your first vehicle to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

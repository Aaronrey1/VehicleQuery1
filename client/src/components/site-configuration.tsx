import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Settings, Plus, Trash2, Edit, Save, BarChart, PieChart, LineChart } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DataOverride, CustomChart } from "@shared/schema";

export function SiteConfiguration() {
  const { toast } = useToast();
  const [editingOverride, setEditingOverride] = useState<DataOverride | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChartDialogOpen, setIsChartDialogOpen] = useState(false);

  // Fetch data overrides
  const { data: overrides = [] } = useQuery<DataOverride[]>({
    queryKey: ["/api/data-overrides"],
  });

  // Fetch custom charts
  const { data: charts = [] } = useQuery<CustomChart[]>({
    queryKey: ["/api/custom-charts"],
  });

  // Create override mutation
  const createOverrideMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/data-overrides", data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/data-overrides"] });
      toast({ title: "Override Created", description: "Data override created successfully" });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create override", variant: "destructive" });
    },
  });

  // Update override mutation
  const updateOverrideMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => 
      apiRequest("PATCH", `/api/data-overrides/${id}`, data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/data-overrides"] });
      toast({ title: "Override Updated", description: "Data override updated successfully" });
      setEditingOverride(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update override", variant: "destructive" });
    },
  });

  // Delete override mutation
  const deleteOverrideMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/data-overrides/${id}`),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/data-overrides"] });
      toast({ title: "Override Deleted", description: "Data override deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete override", variant: "destructive" });
    },
  });

  // Create chart mutation
  const createChartMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/custom-charts", data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/custom-charts"] });
      toast({ title: "Chart Created", description: "Custom chart created successfully" });
      setIsChartDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create chart", variant: "destructive" });
    },
  });

  // Delete chart mutation
  const deleteChartMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/custom-charts/${id}`),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/custom-charts"] });
      toast({ title: "Chart Deleted", description: "Custom chart deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete chart", variant: "destructive" });
    },
  });

  const handleCreateOverride = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createOverrideMutation.mutate({
      metricKey: formData.get("metricKey"),
      displayName: formData.get("displayName"),
      overrideValue: formData.get("overrideValue"),
      category: formData.get("category"),
      isActive: true,
    });
  };

  const handleCreateChart = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const chartData = formData.get("chartData") as string;
    
    try {
      JSON.parse(chartData); // Validate JSON
      createChartMutation.mutate({
        title: formData.get("title"),
        description: formData.get("description"),
        page: formData.get("page"),
        chartType: formData.get("chartType"),
        chartData: chartData,
        position: 0,
        isActive: true,
      });
    } catch {
      toast({ title: "Invalid JSON", description: "Chart data must be valid JSON", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Site Configuration
          </CardTitle>
          <CardDescription>
            Manage data overrides and custom charts for all pages
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overrides">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overrides">Data Overrides</TabsTrigger>
          <TabsTrigger value="charts">Custom Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="overrides" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Overrides</CardTitle>
                  <CardDescription>
                    Manually override any number displayed on the site
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-override">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Override
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Data Override</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateOverride} className="space-y-4">
                      <div>
                        <Label htmlFor="metricKey">Metric Key</Label>
                        <Input
                          id="metricKey"
                          name="metricKey"
                          placeholder="e.g., dashboard.totalSearches"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          name="displayName"
                          placeholder="e.g., Total Searches"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dashboard">Dashboard</SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="analytics">Analytics</SelectItem>
                            <SelectItem value="pending_approvals">Pending Approvals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="overrideValue">Override Value</Label>
                        <Input
                          id="overrideValue"
                          name="overrideValue"
                          placeholder="e.g., 1500"
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={createOverrideMutation.isPending}>
                          Create Override
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {overrides.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data overrides configured</p>
                  <p className="text-sm mt-2">Create an override to manually control any displayed number</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Metric Key</TableHead>
                      <TableHead>Override Value</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overrides.map((override) => (
                      <TableRow key={override.id} data-testid={`row-override-${override.id}`}>
                        <TableCell className="font-medium">{override.displayName}</TableCell>
                        <TableCell className="font-mono text-sm">{override.metricKey}</TableCell>
                        <TableCell>
                          {editingOverride?.id === override.id ? (
                            <Input
                              defaultValue={override.overrideValue}
                              onChange={(e) => setEditingOverride({ ...override, overrideValue: e.target.value })}
                              className="w-32"
                            />
                          ) : (
                            <span className="font-semibold">{override.overrideValue}</span>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">{override.category}</TableCell>
                        <TableCell>
                          <Switch
                            checked={override.isActive}
                            onCheckedChange={(checked) =>
                              updateOverrideMutation.mutate({
                                id: override.id,
                                data: { isActive: checked },
                              })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {editingOverride?.id === override.id ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                updateOverrideMutation.mutate({
                                  id: override.id,
                                  data: { overrideValue: editingOverride.overrideValue },
                                });
                              }}
                              data-testid={`button-save-${override.id}`}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingOverride(override)}
                              data-testid={`button-edit-${override.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteOverrideMutation.mutate(override.id)}
                            disabled={deleteOverrideMutation.isPending}
                            data-testid={`button-delete-${override.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Custom Charts</CardTitle>
                  <CardDescription>
                    Add custom pie charts, bar charts, or line charts to any page
                  </CardDescription>
                </div>
                <Dialog open={isChartDialogOpen} onOpenChange={setIsChartDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-chart">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Chart
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Custom Chart</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateChart} className="space-y-4">
                      <div>
                        <Label htmlFor="title">Chart Title</Label>
                        <Input
                          id="title"
                          name="title"
                          placeholder="e.g., Monthly Revenue"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input
                          id="description"
                          name="description"
                          placeholder="Brief description of the chart"
                        />
                      </div>
                      <div>
                        <Label htmlFor="page">Page</Label>
                        <Select name="page" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select page" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dashboard">Dashboard</SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="analytics">Analytics</SelectItem>
                            <SelectItem value="pending_approvals">Pending Approvals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="chartType">Chart Type</Label>
                        <Select name="chartType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pie">Pie Chart</SelectItem>
                            <SelectItem value="bar">Bar Chart</SelectItem>
                            <SelectItem value="line">Line Chart</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="chartData">Chart Data (JSON)</Label>
                        <Textarea
                          id="chartData"
                          name="chartData"
                          placeholder='[{"name": "Category A", "value": 100}, {"name": "Category B", "value": 200}]'
                          className="font-mono text-sm"
                          rows={8}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter chart data as JSON array. For pie charts: {`[{name: "Label", value: 100}]`}
                        </p>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={createChartMutation.isPending}>
                          Create Chart
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {charts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No custom charts configured</p>
                  <p className="text-sm mt-2">Create a chart to add custom visualizations to your pages</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {charts.map((chart) => (
                    <Card key={chart.id} data-testid={`card-chart-${chart.id}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {chart.chartType === 'pie' && <PieChart className="h-5 w-5" />}
                            {chart.chartType === 'bar' && <BarChart className="h-5 w-5" />}
                            {chart.chartType === 'line' && <LineChart className="h-5 w-5" />}
                            <div>
                              <CardTitle className="text-lg">{chart.title}</CardTitle>
                              <CardDescription>
                                {chart.description || `${chart.chartType} chart on ${chart.page} page`}
                              </CardDescription>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteChartMutation.mutate(chart.id)}
                            disabled={deleteChartMutation.isPending}
                            data-testid={`button-delete-chart-${chart.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Page:</span>
                            <p className="font-medium capitalize">{chart.page}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <p className="font-medium capitalize">{chart.chartType}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <p className="font-medium">{chart.isActive ? 'Active' : 'Inactive'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Download, CheckCircle, AlertTriangle } from "lucide-react";
import type { Vehicle, SearchResults } from "@shared/schema";

interface SearchResultsProps {
  searchParams: { make?: string; model?: string; year?: number; deviceType?: string; portType?: string };
}

export default function SearchResults({ searchParams }: SearchResultsProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("make");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const limit = 10;

  // Reset page when search params change
  useEffect(() => {
    setPage(1);
  }, [searchParams.make, searchParams.model, searchParams.year, searchParams.deviceType, searchParams.portType]);

  const { data: searchResults, isLoading } = useQuery<SearchResults>({
    queryKey: ["/api/vehicles/search", searchParams, page, limit, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchParams.make) params.append("make", searchParams.make);
      if (searchParams.model) params.append("model", searchParams.model);
      if (searchParams.year) params.append("year", searchParams.year.toString());
      if (searchParams.deviceType) params.append("deviceType", searchParams.deviceType);
      if (searchParams.portType) params.append("portType", searchParams.portType);
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      
      const response = await fetch(`/api/vehicles/search?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch search results");
      return response.json();
    },
    enabled: !!(searchParams.make || searchParams.model || searchParams.year || searchParams.deviceType || searchParams.portType),
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (searchParams.make) params.append("make", searchParams.make);
    if (searchParams.model) params.append("model", searchParams.model);
    if (searchParams.year) params.append("year", searchParams.year.toString());
    if (searchParams.deviceType) params.append("deviceType", searchParams.deviceType);
    if (searchParams.portType) params.append("portType", searchParams.portType);
    
    window.open(`/api/vehicles/export?${params.toString()}`, "_blank");
  };

  const getDeviceTypeColor = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "obd-ii scanner":
        return "bg-primary/10 text-primary";
      case "fleet tracker":
        return "bg-secondary/10 text-secondary";
      case "gps tracker":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCompatibilityIcon = (compatible: boolean) => {
    return compatible ? (
      <div className="flex items-center space-x-1">
        <CheckCircle className="text-green-500 h-4 w-4" />
        <span className="text-sm text-foreground">Compatible</span>
      </div>
    ) : (
      <div className="flex items-center space-x-1">
        <AlertTriangle className="text-yellow-500 h-4 w-4" />
        <span className="text-sm text-foreground">Partial</span>
      </div>
    );
  };

  if (!searchParams.make && !searchParams.model && !searchParams.year && !searchParams.deviceType && !searchParams.portType) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">
            Select search criteria above to view results
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="mb-12">
      <Card>
        <CardHeader className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Search Results</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground" data-testid="text-results-count">
                {isLoading ? "Loading..." : `${searchResults?.total || 0} vehicles found`}
              </span>
              <Button variant="ghost" size="sm" onClick={handleExport} data-testid="button-export">
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              Searching vehicles...
            </div>
          ) : !searchResults?.vehicles.length ? (
            <div className="p-12 text-center text-muted-foreground">
              No vehicles found matching your criteria
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="p-4">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("make")}
                          className="flex items-center space-x-2 font-medium text-foreground"
                          data-testid="sort-make"
                        >
                          <span>Make</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="p-4">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("model")}
                          className="flex items-center space-x-2 font-medium text-foreground"
                          data-testid="sort-model"
                        >
                          <span>Model</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="p-4">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("year")}
                          className="flex items-center space-x-2 font-medium text-foreground"
                          data-testid="sort-year"
                        >
                          <span>Year</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="p-4 font-medium text-foreground">Device Type</TableHead>
                      <TableHead className="p-4 font-medium text-foreground">Port Type</TableHead>
                      <TableHead className="p-4 font-medium text-foreground">Compatibility</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.vehicles.map((vehicle: Vehicle) => (
                      <TableRow
                        key={vehicle.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                        data-testid={`row-vehicle-${vehicle.id}`}
                      >
                        <TableCell className="p-4 font-medium text-foreground" data-testid={`cell-make-${vehicle.id}`}>
                          {vehicle.make}
                        </TableCell>
                        <TableCell className="p-4 text-foreground" data-testid={`cell-model-${vehicle.id}`}>
                          {vehicle.model}
                        </TableCell>
                        <TableCell className="p-4 text-foreground" data-testid={`cell-year-${vehicle.id}`}>
                          {vehicle.year}
                        </TableCell>
                        <TableCell className="p-4" data-testid={`cell-device-${vehicle.id}`}>
                          <Badge className={getDeviceTypeColor(vehicle.deviceType)}>
                            {vehicle.deviceType}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-4" data-testid={`cell-port-${vehicle.id}`}>
                          <Badge variant="secondary">
                            {vehicle.portType}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-4" data-testid={`cell-compatibility-${vehicle.id}`}>
                          {getCompatibilityIcon(true)} {/* Assuming all are compatible for now */}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="p-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                    Showing{" "}
                    <span className="font-medium text-foreground">
                      {((page - 1) * limit) + 1}-{Math.min(page * limit, searchResults.total)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">{searchResults.total}</span>{" "}
                    results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    {Array.from(
                      { length: Math.min(3, Math.ceil(searchResults.total / limit)) },
                      (_, i) => page - 1 + i
                    )
                      .filter(p => p > 0 && p <= Math.ceil(searchResults.total / limit))
                      .map(p => (
                        <Button
                          key={p}
                          variant={p === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(p)}
                          data-testid={`button-page-${p}`}
                        >
                          {p}
                        </Button>
                      ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(searchResults.total / limit)}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

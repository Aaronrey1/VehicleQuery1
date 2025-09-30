import VehicleSearch from "@/components/vehicle-search";
import SearchResults from "@/components/search-results";
import DataImport from "@/components/data-import";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import { Car, Upload, BarChart3, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [activeSection, setActiveSection] = useState("search");
  const [searchParams, setSearchParams] = useState<{ make?: string; model?: string; year?: number }>({});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Car className="text-primary text-2xl" />
              <h1 className="text-xl font-semibold text-foreground">VehicleDB Pro</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => setActiveSection("search")}
                className={`transition-colors ${
                  activeSection === "search" ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
                data-testid="nav-search"
              >
                Search
              </button>
              <button
                onClick={() => setActiveSection("manage")}
                className={`transition-colors ${
                  activeSection === "manage" ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
                data-testid="nav-manage"
              >
                Manage Data
              </button>
              <button
                onClick={() => setActiveSection("analytics")}
                className={`transition-colors ${
                  activeSection === "analytics" ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
                data-testid="nav-analytics"
              >
                Analytics
              </button>
              <Button
                onClick={() => setActiveSection("manage")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-import"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </nav>
            <Button variant="ghost" className="md:hidden" data-testid="button-menu">
              <Menu className="text-xl" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        {activeSection === "search" && (
          <>
            <VehicleSearch onSearch={setSearchParams} />
            <SearchResults searchParams={searchParams} />
          </>
        )}

        {/* Data Management Section */}
        {activeSection === "manage" && <DataImport />}

        {/* Analytics Section */}
        {activeSection === "analytics" && <AnalyticsDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Car className="text-primary text-xl" />
              <span className="text-foreground font-medium">VehicleDB Pro</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 VehicleDB Pro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

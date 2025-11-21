import VehicleSearch from "@/components/vehicle-search";
import SearchResults from "@/components/search-results";
import DataImport from "@/components/data-import";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import SearchAnalytics from "@/components/search-analytics";
import BulkSearch from "@/components/bulk-search";
import AdminPanel from "@/components/admin-panel";
import Geometris from "@/components/geometris";
import AISearch from "@/components/ai-search";
import Billing from "@/components/billing";
import VinDecoder from "@/components/vin-decoder";
import { PendingApprovals } from "@/components/pending-approvals";
import ApiKeysManagement from "@/components/api-keys";
import ApiCallAnalytics from "@/components/api-call-analytics";
import { SiteConfiguration } from "@/components/site-configuration";
import { Car, Upload, BarChart3, Menu, List, Settings, Lock, LogOut, Cable, Sparkles, DollarSign, ClipboardCheck, Hash, LineChart, Key, BookOpen, Activity, Cog, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [activeSection, setActiveSection] = useState("ai");
  const [adminSubTab, setAdminSubTab] = useState("manage");
  const [searchParams, setSearchParams] = useState<{ make?: string; model?: string; year?: number; deviceType?: string; portType?: string }>({});
  const { isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  // Site Configuration visibility toggle (hidden by default, toggle with Ctrl+Shift+C)
  const [showSiteConfig, setShowSiteConfig] = useState(() => {
    const stored = localStorage.getItem('showSiteConfig');
    return stored === 'true';
  });

  const handleProtectedSection = (section: string) => {
    if (section === "admin") {
      if (!isAuthenticated) {
        setLocation("/login");
        return;
      }
    }
    setActiveSection(section);
  };

  // Toggle Site Config visibility and persist to localStorage
  const toggleSiteConfig = () => {
    setShowSiteConfig(prev => {
      const newValue = !prev;
      localStorage.setItem('showSiteConfig', String(newValue));
      return newValue;
    });
  };

  // Keyboard shortcut: Ctrl+Shift+C to toggle Site Config
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        toggleSiteConfig();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Car className="text-primary text-2xl" />
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-foreground">VehicleDB Pro</h1>
                <p className="text-xs text-muted-foreground">Powered by Alex Perez</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => setActiveSection("ai")}
                className={`transition-colors flex items-center gap-1 ${
                  activeSection === "ai" ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
                data-testid="nav-ai"
              >
                <Sparkles className="h-3 w-3" />
                AI Search
              </button>
              <button
                onClick={() => setActiveSection("bulk")}
                className={`transition-colors ${
                  activeSection === "bulk" ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
                data-testid="nav-bulk"
              >
                Bulk Search
              </button>
              <button
                onClick={() => setActiveSection("geometris")}
                className={`transition-colors ${
                  activeSection === "geometris" ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
                data-testid="nav-geometris"
              >
                Geometris
              </button>
              <button
                onClick={() => setActiveSection("vin")}
                className={`transition-colors flex items-center gap-1 ${
                  activeSection === "vin" ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
                data-testid="nav-vin"
              >
                <Hash className="h-3 w-3" />
                VIN Decoder
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
              <button
                onClick={() => handleProtectedSection("admin")}
                className={`transition-colors flex items-center gap-1 ${
                  activeSection === "admin" ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
                data-testid="nav-admin"
              >
                <Settings className="h-3 w-3" />
                Admin
                {!isAuthenticated && <Lock className="h-3 w-3" />}
              </button>
              <Link href="/api-docs">
                <button
                  className="transition-colors flex items-center gap-1 text-muted-foreground hover:text-primary"
                  data-testid="nav-api-docs"
                >
                  <BookOpen className="h-3 w-3" />
                  API Docs
                </button>
              </Link>
              {isAuthenticated ? (
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  data-testid="button-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <Button
                  onClick={() => setLocation("/login")}
                  variant="outline"
                  size="sm"
                  data-testid="button-login"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Login
                </Button>
              )}
            </nav>
            <Button variant="ghost" className="md:hidden" data-testid="button-menu">
              <Menu className="text-xl" />
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Sub-Navigation */}
      {activeSection === "admin" && (
        <div className="bg-muted/30 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-6 h-12">
              <button
                onClick={() => setAdminSubTab("manage")}
                className={`transition-colors text-sm ${
                  adminSubTab === "manage" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="nav-manage"
              >
                <Upload className="h-3 w-3 inline mr-1" />
                Manage Data
              </button>
              <button
                onClick={() => setAdminSubTab("billing")}
                className={`transition-colors text-sm ${
                  adminSubTab === "billing" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="nav-billing"
              >
                <DollarSign className="h-3 w-3 inline mr-1" />
                Billing
              </button>
              <button
                onClick={() => setAdminSubTab("pending")}
                className={`transition-colors text-sm ${
                  adminSubTab === "pending" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="nav-pending"
              >
                <ClipboardCheck className="h-3 w-3 inline mr-1" />
                Pending
              </button>
              <button
                onClick={() => setAdminSubTab("analytics")}
                className={`transition-colors text-sm ${
                  adminSubTab === "analytics" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="nav-analytics"
              >
                <LineChart className="h-3 w-3 inline mr-1" />
                Analytics
              </button>
              <button
                onClick={() => setAdminSubTab("api-keys")}
                className={`transition-colors text-sm ${
                  adminSubTab === "api-keys" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="nav-api-keys"
              >
                <Key className="h-3 w-3 inline mr-1" />
                API Keys
              </button>
              <button
                onClick={() => setAdminSubTab("api-calls")}
                className={`transition-colors text-sm ${
                  adminSubTab === "api-calls" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="nav-api-calls"
              >
                <Activity className="h-3 w-3 inline mr-1" />
                API Calls
              </button>
              {showSiteConfig && (
                <button
                  onClick={() => setAdminSubTab("config")}
                  className={`transition-colors text-sm ${
                    adminSubTab === "config" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="nav-site-config"
                >
                  <Cog className="h-3 w-3 inline mr-1" />
                  Site Config
                </button>
              )}
              <button
                onClick={() => setAdminSubTab("admin")}
                className={`transition-colors text-sm ${
                  adminSubTab === "admin" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="nav-admin-panel"
              >
                <Settings className="h-3 w-3 inline mr-1" />
                Admin Panel
              </button>
              <button
                onClick={toggleSiteConfig}
                className="transition-colors text-sm text-muted-foreground hover:text-foreground ml-2"
                data-testid="button-toggle-site-config"
                title={showSiteConfig ? "Hide Site Config (Ctrl+Shift+C)" : "Show Site Config (Ctrl+Shift+C)"}
              >
                {showSiteConfig ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bulk Search Section */}
        {activeSection === "bulk" && <BulkSearch />}

        {/* AI Search Section */}
        {activeSection === "ai" && <AISearch />}

        {/* Geometris Section */}
        {activeSection === "geometris" && <Geometris />}

        {/* VIN Decoder Section */}
        {activeSection === "vin" && <VinDecoder />}

        {/* Analytics Section */}
        {activeSection === "analytics" && <AnalyticsDashboard />}

        {/* Admin Section with Sub-tabs */}
        {activeSection === "admin" && (
          <>
            {adminSubTab === "manage" && <DataImport />}
            {adminSubTab === "billing" && <Billing />}
            {adminSubTab === "pending" && <PendingApprovals />}
            {adminSubTab === "analytics" && <SearchAnalytics />}
            {adminSubTab === "api-keys" && <ApiKeysManagement />}
            {adminSubTab === "api-calls" && <ApiCallAnalytics />}
            {adminSubTab === "config" && <SiteConfiguration />}
            {adminSubTab === "admin" && <AdminPanel />}
          </>
        )}
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

# VehicleDB Pro

## Overview
VehicleDB Pro is a comprehensive, full-stack vehicle database management system for searching, managing, and analyzing vehicle compatibility data. It provides intelligent search capabilities, including a multi-tiered AI Search feature, alongside robust data management tools. The system supports data import, analytics, a specialized Geometris system for harness type searches, and a powerful Site Configuration system allowing admins to manually override displayed metrics and create custom charts. The project aims to streamline vehicle data workflows and enhance data accuracy through an admin approval process for AI predictions, ultimately offering a robust solution for vehicle data management with significant market potential.

## Recent Changes (November 21, 2025)
- **Site Configuration Visibility:** Site Config tab is now hidden by default and can be toggled via keyboard shortcut (Ctrl+Shift+C) or eye icon button in admin navigation. Preference persists in localStorage.
- **Billing Updates:** Removed "Exact Match" tier from Search Tier Breakdown display. Display now focuses on Database Searches (pattern matching), Google API, and Gemini AI tiers.
- **Pending Approvals Cleanup:** Removed analytics pie charts and source editing functionality. Pending Approvals now focuses solely on approve/reject/delete workflow.
- **Confidence Scoring Documentation:** Updated AI Search confidence levels to reflect current system: 100% (Exact Match), 80-95% (DB ±5yr), 60-79% (DB ±10yr), 20-59% (Gemini AI).

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18+, TypeScript, and Vite. It utilizes Radix UI primitives and Shadcn/ui components styled with Tailwind CSS, employing a neutral color scheme and CSS variables for theming. State management uses TanStack Query for server state. Key components include AISearch (featuring a 3-tiered prediction system with confidence scoring, smart validation, and optional email notifications), BulkSearch, VinDecoder (with NHTSA integration and AI predictions), Geometris for harness search, DataImport, SearchAnalytics (in Admin section, with geolocation, filtering, and export), ApiCallAnalytics, AnalyticsDashboard (real-time stats), Billing, SiteConfiguration (for data overrides and custom charts), and an AdminPanel. Display layer uses Title Case, while data in the database remains uppercase.

**Site Configuration System:**
The application features a comprehensive data override and custom chart system accessible through the Admin > Site Config tab (hidden by default, toggle with Ctrl+Shift+C or eye icon). The `useDataOverrides()` hook enables dynamic value replacement throughout the UI - admins can override any displayed metric (e.g., dashboard.totalSearches, billing.totalCost) using the Site Configuration interface. All display components (AnalyticsDashboard, Billing, etc.) integrate this hook to check for active overrides before rendering values. This allows complete control over displayed numbers for demos, testing, or presentation purposes without modifying actual data.

### Backend Architecture
The backend is an Express.js server developed with TypeScript and an ESM module system, providing a RESTful API under `/api`. It uses custom middleware for logging and a storage layer abstraction via `IStorage`. All search inputs are normalized to uppercase and support manufacturer aliases. Special characters are normalized for flexible matching in all search operations. Database search uses Drizzle's `sql` template for raw SQL execution with automatic parameterization to ensure reliable `LIKE` matching and SQL injection protection.

**API Key Authentication:**
All public API endpoints require API key authentication via the `X-API-Key` header for external integrations. API keys are managed through the Admin panel, using industry-standard security practices: bcrypt-hashed secrets stored in the database, with only a public prefix visible in the admin UI.

**Key API Endpoints:**
- **API Key Management:** CRUD operations for secure API keys (admin-only).
- **Vehicle Management:** CRUD, search (including bulk and `ALL MODELS` fallback), statistics, import.
- **Harness Management (Geometris):** Search and authenticated CRUD/import for harnesses.
- **AI Prediction:** `/api/ai/predict` (requires API key) implements a 3-tier system: (1) exact database match, (2) database pattern matching within ±5 years, (3) Gemini AI. All AI predictions require admin approval and are logged.
- **VIN Decoding:** `/api/vin/decode` (requires API key) uses the NHTSA API, then runs AI predictions via the 3-tier system. Supports single and bulk decoding, with VIN validation. Predictions require admin approval and are logged.
- **Search Analytics:** `/api/analytics/search` provides aggregated search data (AI Search, Bulk Search, VIN Decoder, Geometris) by type and country, with export options. Searches are logged with IP-based geolocation and API key tracking.
- **API Call Analytics:** `/api/analytics/api-calls` provides detailed API key usage analytics (total calls, calls by endpoint/key, recent logs) with filtering and export.
- **Dashboard Analytics:** `/api/analytics/dashboard` provides real-time analytics for total searches, most searched make, total vehicles, and top searched vehicles.
- **Billing:** `/api/billing/stats` for AI Search usage and cost analytics (Gemini AI costs approx. $0.01/request). The `/api/billing/pie-charts` endpoint provides Search Tier Breakdown showing distribution of searches across database pattern matching, Google API, and Gemini AI tiers.
- **Pending Approvals:** Endpoints for approving, rejecting, and deleting pending predictions, with automated email notifications for approved predictions. Simple approval workflow focused on reviewing Google API and Gemini AI predictions before adding to the main database.

### Data Storage
PostgreSQL is used as the database, accessed via the Neon serverless driver. Drizzle ORM provides type-safe operations, with schema defined in `shared/schema.ts` and Zod for runtime validation.

**Database Schema includes:**
- `vehicles`: Vehicle data (make, model, year, deviceType, portType).
- `harnesses`: Harness data with year ranges.
- `ai_search_logs`: Records AI Search predictions, source, confidence, cost.
- `search_logs`: Tracks special search operations (AI, Bulk, VIN, Geometris) with geolocation, query details, results, API key, and endpoint. Includes `exactMatch` boolean.
- `pending_vehicles`: Stores AI predictions awaiting admin approval, with user contact info for notifications.
- `api_keys`: Stores secure (bcrypt-hashed) API keys for external integrations, with usage tracking.
- `users`: For authentication.
- `data_overrides`: Stores admin-configured overrides for any displayed metric. Each override has a unique metric_key (e.g., 'dashboard.totalSearches'), display_name, override_value, category, and is_active flag. Enables dynamic control of displayed numbers site-wide.
- `custom_charts`: Stores admin-created custom charts with configurable data. Supports pie, bar, and line chart types with JSON data format. Charts can be assigned to specific pages (dashboard, billing, analytics, pending_approvals) with positioning and active status control.

## External Dependencies
- **Database Driver & ORM:** `@neondatabase/serverless`, `drizzle-orm`
- **Web Framework:** `express`
- **Frontend Framework:** `react`, `react-dom`, `@tanstack/react-query`, `wouter`
- **File Processing:** `multer`, `csv-parser`
- **Geolocation:** `geoip-lite`
- **Email Service:** `resend` (for sending email notifications with professional templates)
- **UI & Styling:** `@radix-ui/*`, `class-variance-authority`, `tailwindcss`, `cmdk`, `date-fns`, `clsx`, `tailwind-merge`
- **Form Management & Validation:** `react-hook-form`, `@hookform/resolvers`, `zod`
- **Unique ID Generation:** `nanoid`